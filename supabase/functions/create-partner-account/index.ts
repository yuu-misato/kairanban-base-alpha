import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { email, password, company_name, contact_name, phone, website_url, description } = await req.json();

        if (!email || !password || !company_name) {
            return new Response(
                JSON.stringify({ error: '必須項目（メールアドレス、パスワード、会社名）が不足しています' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 1. Create Auth User
        const { data: userData, error: userError } = await supabaseClient.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                role: 'partner',
                company_name: company_name
            }
        });

        if (userError) {
            console.error('Error creating user:', userError);
            return new Response(
                JSON.stringify({ error: userError.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const userId = userData.user.id;

        // 2. Create Partner Profile
        const { error: profileError } = await supabaseClient
            .from('partners')
            .insert({
                id: userId,
                company_name,
                contact_name,
                email,
                phone,
                website_url,
                description,
                is_active: true
            });

        if (profileError) {
            console.error('Error creating partner profile:', profileError);
            // Clean up auth user if profile creation fails
            await supabaseClient.auth.admin.deleteUser(userId);

            return new Response(
                JSON.stringify({ error: 'パートナープロフィールの作成に失敗しました: ' + profileError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, user: userData.user }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Unexpected error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
