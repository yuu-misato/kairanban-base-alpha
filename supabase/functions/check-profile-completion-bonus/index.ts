import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BONUS_POINTS = 500;
const EXPIRY_MONTHS = 6;

interface ProfileField {
    key: string;
    weight: number;
    check?: (value: any) => boolean;
    corporateOnly?: boolean;
}

const CONTRACTOR_FIELDS: ProfileField[] = [
    { key: 'avatar_url', weight: 8 },
    { key: 'company_description', weight: 12 },
    { key: 'phone', weight: 5 },
    { key: 'mobile_phone', weight: 5 },
    { key: 'representative', weight: 5 },
    { key: 'service_areas', weight: 12, check: (v: any) => Array.isArray(v) && v.length > 0 },
    { key: 'certifications', weight: 8, check: (v: any) => Array.isArray(v) && v.length > 0 },
    { key: 'equipment', weight: 8, check: (v: any) => Array.isArray(v) && v.length > 0 },
    { key: 'postal_code', weight: 5, check: (v: any) => v && v.length >= 7 },
    { key: 'address', weight: 7, check: (v: any) => v && v.length > 0 },
    { key: 'founded_year', weight: 3, corporateOnly: true },
    { key: 'employee_count', weight: 3, corporateOnly: true },
    { key: 'capital', weight: 3, corporateOnly: true },
    { key: 'website_url', weight: 4 },
    { key: 'vehicles', weight: 4, check: (v: any) => Array.isArray(v) && v.length > 0 },
    { key: 'payment_cycle', weight: 4 },
    { key: 'has_construction_permit', weight: 4, check: (v: any) => v === true || v === false },
];

const CLIENT_FIELDS: ProfileField[] = [
    { key: 'avatar_url', weight: 12 },
    { key: 'company_description', weight: 20 },
    { key: 'phone', weight: 12 },
    { key: 'representative', weight: 12 },
    { key: 'postal_code', weight: 10, check: (v: any) => v && v.length >= 7 },
    { key: 'address', weight: 12, check: (v: any) => v && v.length > 0 },
    { key: 'website_url', weight: 10 },
    { key: 'mobile_phone', weight: 12 },
];

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const {
            data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
            throw new Error('User not found');
        }

        // Get Service Role Client for db updates
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Get user roles
        const { data: roles } = await supabaseAdmin
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

        const isContractor = roles?.some((r: any) => r.role === 'contractor');
        const table = isContractor ? 'contractor_profiles' : 'client_profiles';

        // Get profile
        const { data: profile } = await supabaseAdmin
            .from(table)
            .select('*')
            .eq('id', user.id)
            .single();

        if (!profile) {
            throw new Error('Profile not found');
        }

        const isIndividual = profile.is_individual === true;
        const baseFields = isContractor ? CONTRACTOR_FIELDS : CLIENT_FIELDS;

        // Filter fields
        const fields = baseFields.filter(field => {
            if (field.corporateOnly && isIndividual) return false;
            return true;
        });

        // Calculate completion
        const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0);
        const normalizedFields = fields.map(f => ({
            ...f,
            normalizedWeight: (f.weight / totalWeight) * 100
        }));

        let completedWeight = 0;

        normalizedFields.forEach(field => {
            const value = profile[field.key];
            const isComplete = field.check
                ? field.check(value)
                : value !== null && value !== '' && value !== undefined;

            if (isComplete) {
                completedWeight += field.normalizedWeight;
            }
        });

        const completionPercent = Math.round(completedWeight);

        if (completionPercent < 100) {
            return new Response(
                JSON.stringify({ success: true, message: `Profile incomplete (${completionPercent}%)`, awarded: false }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if duplicate bonus
        const { data: existingBonus } = await supabaseAdmin
            .from('user_point_transactions')
            .select('id')
            .eq('user_id', user.id)
            .eq('transaction_type', 'bonus')
            .eq('description', 'プロフィール完成ボーナス') // Adjust description to match uniqueness requirement if needed
            .single();

        if (existingBonus) {
            return new Response(
                JSON.stringify({ success: true, message: 'Bonus already awarded', awarded: false }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Grant Points Logic
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + EXPIRY_MONTHS);

        // Get or create user_points
        const { data: userPoints } = await supabaseAdmin
            .from('user_points')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        let newBalance = BONUS_POINTS;
        let totalEarned = BONUS_POINTS;
        let totalUsed = 0;

        if (userPoints) {
            newBalance = (userPoints.balance || 0) + BONUS_POINTS;
            totalEarned = (userPoints.total_earned || 0) + BONUS_POINTS;
            totalUsed = userPoints.total_used || 0;

            await supabaseAdmin
                .from('user_points')
                .update({
                    balance: newBalance,
                    total_earned: totalEarned,
                    updated_at: now.toISOString(),
                })
                .eq('user_id', user.id);
        } else {
            await supabaseAdmin
                .from('user_points')
                .insert({
                    user_id: user.id,
                    balance: newBalance,
                    total_earned: totalEarned,
                    total_used: totalUsed
                });
        }

        // Insert Transaction
        await supabaseAdmin
            .from('user_point_transactions')
            .insert({
                user_id: user.id,
                amount: BONUS_POINTS,
                balance_after: newBalance,
                transaction_type: 'bonus',
                description: 'プロフィール完成ボーナス',
                expires_at: expiresAt.toISOString(),
                remaining_amount: BONUS_POINTS,
            });

        // Notify user
        await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: user.id,
                title: 'プロフィール完成ボーナス！',
                content: `プロフィール入力ありがとうございます。${BONUS_POINTS}ptをプレゼントしました！🎉`,
                type: 'system',
                is_read: false,
            });

        // Try to send LINE notification if enabled (fire and forget)
        try {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/line-push-notification`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    type: 'announcement', // or specific type if added
                    title: '🎉 ポイント獲得',
                    body: `プロフィール完成ボーナスとして ${BONUS_POINTS}pt を獲得しました！`,
                    url: `${req.headers.get('origin') || ''}/dashboard`, // simple url
                })
            });
        } catch (e) {
            console.error('Failed to trigger line notification', e);
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Bonus awarded', awarded: true, points: BONUS_POINTS }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
