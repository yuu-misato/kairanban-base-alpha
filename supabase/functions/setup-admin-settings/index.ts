import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Client } from 'https://deno.land/x/postgres@v0.17.0/mod.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const dbUrl = Deno.env.get('SUPABASE_DB_URL');
        if (!dbUrl) throw new Error('SUPABASE_DB_URL not set');

        const client = new Client(dbUrl);
        await client.connect();

        try {
            await client.queryArray(`
        CREATE TABLE IF NOT EXISTS public.admin_notification_settings (
            type TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            is_enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        INSERT INTO public.admin_notification_settings (type, label, is_enabled) VALUES
        ('message', '個別メッセージ', false),
        ('application', '応募', true),
        ('work_request', '仕事依頼', true),
        ('review', 'レビュー', true),
        ('application_accepted', '採用', true),
        ('application_rejected', '不採用', true),
        ('project_update', '案件更新', false),
        ('new_project_in_area', '新着案件', false)
        ON CONFLICT (type) DO UPDATE SET label = EXCLUDED.label;

        ALTER TABLE public.admin_notification_settings ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Admins can view settings" ON public.admin_notification_settings;
        DROP POLICY IF EXISTS "Admins can update settings" ON public.admin_notification_settings;

        CREATE POLICY "Admins can view settings" ON public.admin_notification_settings FOR SELECT TO authenticated USING (true);
        CREATE POLICY "Admins can update settings" ON public.admin_notification_settings FOR UPDATE TO authenticated USING (true);
      `);
        } finally {
            await client.end();
        }

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
