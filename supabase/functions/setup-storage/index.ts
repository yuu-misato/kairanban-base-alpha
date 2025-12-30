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
        // Database connection
        const dbUrl = Deno.env.get('SUPABASE_DB_URL');
        if (!dbUrl) {
            throw new Error('SUPABASE_DB_URL not set');
        }

        const client = new Client(dbUrl);
        await client.connect();

        try {
            await client.queryArray(`
        -- Add attachments column
        ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::JSONB;

        -- Create storage bucket
        INSERT INTO storage.buckets (id, name, public) 
        VALUES ('message-attachments', 'message-attachments', true)
        ON CONFLICT (id) DO NOTHING;

        -- Drop existing policies
        DROP POLICY IF EXISTS "Authenticated users can upload message attachments" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated users can view message attachments" ON storage.objects;
        `);

            // Split policies creation to avoid transaction issues if any (though single queryArray should be fine)
            await client.queryArray(`
        -- Create policies
        CREATE POLICY "Authenticated users can upload message attachments"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

        CREATE POLICY "Authenticated users can view message attachments"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');
        `);

        } finally {
            await client.end();
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Storage setup completed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
