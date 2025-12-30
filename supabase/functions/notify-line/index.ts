import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PostRecord {
    id: string
    community_id: string
    author_id: string
    content: string
    image_urls: string[] | null
    created_at: string
}

interface WebhookPayload {
    type: 'INSERT' | 'UPDATE' | 'DELETE'
    table: string
    record: PostRecord
    schema: string
    old_record: null | PostRecord
}

Deno.serve(async (req) => {
    const payload: WebhookPayload = await req.json()

    // Only handle new posts
    if (payload.type !== 'INSERT') {
        return new Response('Not an INSERT event', { status: 200 })
    }

    const post = payload.record

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Get users in the same community who have a LINE ID
    const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('line_user_id')
        .eq('community_id', post.community_id)
        .neq('id', post.author_id) // Don't notify the author
        .not('line_user_id', 'is', null)

    if (userError) {
        console.error('Error fetching users:', userError)
        return new Response('Error fetching users', { status: 500 })
    }

    if (!users || users.length === 0) {
        console.log('No users to notify')
        return new Response('No users to notify', { status: 200 })
    }

    const lineUserIds = users.map(u => u.line_user_id!)
    const lineChannelAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')!

    // 2. Construct LINE Message
    const message = {
        to: lineUserIds,
        messages: [
            {
                type: 'text',
                text: `【新しい回覧板】\n\n${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}\n\n確認はこちら: https://kairanban-base.vercel.app/timeline`
            }
        ]
    }

    // 3. Send Multicast Message
    // LINE Multicast API supports up to 500 users per request. 
    // For MVP, we assume < 500. For prod, we need chunking.
    try {
        const resp = await fetch('https://api.line.me/v2/bot/message/multicast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${lineChannelAccessToken}`
            },
            body: JSON.stringify(message)
        })

        if (!resp.ok) {
            const errorText = await resp.text()
            console.error('LINE API Error:', errorText)
            return new Response(`LINE API Error: ${errorText}`, { status: 500 })
        }

        return new Response('Notification sent successfully', { status: 200 })

    } catch (err) {
        console.error('Fetch error:', err)
        return new Response('Fetch error', { status: 500 })
    }
})
