import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateItem {
    table: 'usage_limits' | 'usage_addons';
    id_column: string;
    id_value: string;
    stripe_price_id: string;
}

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        // Get authorization header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: '認証が必要です' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Create client with service role key to bypass RLS during updates
        // But verify user via getUser()
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // Extract JWT token
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: '認証に失敗しました' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if user is admin
        const { data: roleData, error: roleError } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle();

        if (roleError || !roleData) {
            return new Response(
                JSON.stringify({ error: '管理者権限が必要です' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Parse Body
        const { updates } = await req.json() as { updates: UpdateItem[] };

        if (!updates || !Array.isArray(updates)) {
            return new Response(
                JSON.stringify({ error: 'Invalid request body' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Perform Updates
        for (const item of updates) {
            // Validation (Security)
            if (!['usage_limits', 'usage_addons'].includes(item.table)) {
                continue;
            }

            const { error: updateError } = await supabaseClient
                .from(item.table)
                .update({ stripe_price_id: item.stripe_price_id })
                .eq(item.id_column, item.id_value);

            if (updateError) {
                console.error(`Error updating ${item.table} ID ${item.id_value}:`, updateError);
                throw updateError;
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: '設定を更新しました'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Update error:', error);
        return new Response(
            JSON.stringify({ error: '設定更新に失敗しました' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
