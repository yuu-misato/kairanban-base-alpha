import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.0'

const channelAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { title, content, area, communityId, communityName, targetRole, broadcast } = await req.json()
        const displayTitle = title || 'お知らせ';

        if (!channelAccessToken) {
            throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set')
        }

        // 1. Identify User
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            console.error('Missing Authorization header')
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Create a regular client to verify user
        const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()

        if (userError || !user) {
            console.error('Auth Error:', userError)
            return new Response(JSON.stringify({ error: 'Unauthorized', details: userError }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const userId = user.id

        // 2. Setup Admin Client for System Operations
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // 3. Get User Plan and Limits
        // Default to 'normal' if no plan found
        const { data: userPlan } = await supabaseAdmin
            .from('user_plans')
            .select('plan_type')
            .eq('user_id', userId)
            .maybeSingle()

        const planType = userPlan?.plan_type || 'normal'

        // Get limits for the plan
        const { data: limits } = await supabaseAdmin
            .from('usage_limits')
            .select('message_limit')
            .eq('plan_type', planType)
            .single()

        const messageLimit = limits?.message_limit || 1000 // Fallback default to generous for admins

        // Get current usage for this month
        const now = new Date()
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` // YYYY-MM

        const { data: usageLog } = await supabaseAdmin
            .from('user_monthly_usages')
            .select('message_count')
            .eq('user_id', userId)
            .eq('year_month', yearMonth)
            .maybeSingle()

        const currentUsage = usageLog?.message_count || 0

        // 4. Fetch Target Users (LINE IDs)
        let targetLineIds: string[] = []

        if (broadcast) {
            // --- ROLE BASED BROADCAST ---
            if (targetRole === 'all') {
                // Fetch ALL connected line accounts
                const { data: accounts } = await supabaseAdmin
                    .from('line_accounts')
                    .select('line_user_id')
                    .eq('is_notification_enabled', true)

                targetLineIds = accounts?.map(a => a.line_user_id) || []
            } else {
                // Filter by Role
                const { data: profiles } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('role', targetRole)

                const userIds = profiles?.map(p => p.id) || []

                if (userIds.length > 0) {
                    const { data: accounts } = await supabaseAdmin
                        .from('line_accounts')
                        .select('line_user_id')
                        .in('user_id', userIds)
                        .eq('is_notification_enabled', true)

                    targetLineIds = accounts?.map(a => a.line_user_id) || []
                }
            }

        } else if (communityId) {
            // Community Broadcast: Get members of the community
            const { data: members } = await supabaseAdmin
                .from('community_members')
                .select('user_id')
                .eq('community_id', communityId)

            const memberIds = members?.map(m => m.user_id) || []

            if (memberIds.length > 0) {
                const { data: accounts } = await supabaseAdmin
                    .from('line_accounts')
                    .select('line_user_id')
                    .in('user_id', memberIds)
                    .eq('is_notification_enabled', true) // Only active users

                targetLineIds = accounts?.map(a => a.line_user_id) || []
            }
        } else if (area) {
            // Area Broadcast: Get users with matching area
            // 'profiles' table has 'selected_areas' array
            const { data: profiles } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .contains('selected_areas', [area]) // Array contains check

            const userIds = profiles?.map(p => p.id) || []

            if (userIds.length > 0) {
                const { data: accounts } = await supabaseAdmin
                    .from('line_accounts')
                    .select('line_user_id')
                    .in('user_id', userIds)
                    .eq('is_notification_enabled', true)

                targetLineIds = accounts?.map(a => a.line_user_id) || []
            }
        }

        // Filter out duplicates and empty IDs
        targetLineIds = [...new Set(targetLineIds)].filter(id => id);
        const targetCount = targetLineIds.length

        if (targetCount === 0) {
            return new Response(
                JSON.stringify({ success: true, message: 'No targets found', count: 0 }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 5. Check Limits
        if (planType !== 'unlimited' && (currentUsage + targetCount > messageLimit)) {
            return new Response(
                JSON.stringify({
                    error: 'Limit Exceeded',
                    message: `送信上限を超えています。残り: ${messageLimit - currentUsage}通, 送信予定: ${targetCount}通。プランのアップグレードをご検討ください。`,
                    currentUsage,
                    limit: messageLimit
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
            )
        }

        // 6. Send LINE Multicast (in chunks of 500)
        // Construct the message
        const lineMessage = {
            type: 'flex',
            altText: `【回覧板】${title}`,
            contents: {
                type: 'bubble',
                header: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: communityName ? `${communityName} からのお知らせ` : '回覧板BASE',
                            color: '#06C755',
                            weight: 'bold',
                            size: 'xs'
                        },
                        {
                            type: 'text',
                            text: title,
                            weight: 'bold',
                            size: 'xl',
                            margin: 'md',
                            wrap: true
                        }
                    ]
                },
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: content,
                            wrap: true,
                            size: 'sm',
                            color: '#555555'
                        },
                        {
                            type: 'box',
                            layout: 'vertical',
                            margin: 'lg',
                            spacing: 'sm',
                            contents: [
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    spacing: 'sm',
                                    contents: [
                                        {
                                            type: 'text',
                                            text: 'エリア',
                                            color: '#aaaaaa',
                                            size: 'xs',
                                            flex: 1
                                        },
                                        {
                                            type: 'text',
                                            text: area || 'コミュニティ',
                                            wrap: true,
                                            color: '#666666',
                                            size: 'xs',
                                            flex: 5
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                footer: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'button',
                            style: 'link',
                            height: 'sm',
                            action: {
                                type: 'uri',
                                label: '詳細を確認する',
                                uri: Deno.env.get('APP_URL') || 'https://kairanban-base.com/app'
                            }
                        }
                    ],
                    flex: 0
                }
            }
        }

        const CHUNK_SIZE = 500; // LINE API Limit
        let sentCount = 0;

        for (let i = 0; i < targetLineIds.length; i += CHUNK_SIZE) {
            const chunk = targetLineIds.slice(i, i + CHUNK_SIZE);

            const response = await fetch('https://api.line.me/v2/bot/message/multicast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${channelAccessToken}`,
                },
                body: JSON.stringify({
                    to: chunk,
                    messages: [lineMessage],
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                console.error('LINE Multicast Error:', err);
                // Continue to try other chunks, but log error
                // Should we abort? For now, continue best effort.
            } else {
                sentCount += chunk.length;
            }
        }

        // 7. Update Stats
        // Upsert to increment
        // Since upsert replaces, we need to be careful with concurrency. 
        // Ideally use RPC for atomic increment. But here, we can simple upsert with calculated value
        // because this user creates serialized requests mostly (not high concurrency per single user).
        // Or better: use the fetched currentUsage + sentCount.

        // We already have `currentUsage`. 
        const newCount = currentUsage + sentCount;

        const { error: updateError } = await supabaseAdmin
            .from('user_monthly_usages')
            .upsert({
                user_id: userId,
                year_month: yearMonth,
                message_count: newCount,
                action_count: (usageLog?.action_count || 0) + 1,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, year_month' })

        if (updateError) {
            console.error("Failed to update usage stats:", updateError);
        }

        return new Response(
            JSON.stringify({
                success: true,
                data: { sent_count: sentCount, target_count: targetCount }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
