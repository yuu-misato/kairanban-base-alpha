
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Verify requester is admin (optional but recommended even for this internal API)
        // For now, we rely on the client knowing to call this, and maybe check the user's role from the auth header
        const authHeader = req.headers.get('Authorization')
        if (authHeader) {
            const userClient = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_ANON_KEY') ?? '',
                { global: { headers: { Authorization: authHeader } } }
            )
            const { data: { user } } = await userClient.auth.getUser()
            if (!user) throw new Error('Unauthorized')

            // Check if user is admin in profiles
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'admin') {
                return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
        } else {
            // If no auth header, maybe deny? Or allow for dev? safely deny.
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const url = new URL(req.url)
        const type = url.searchParams.get('type') // 'users' | 'missions' | 'communities'

        let result;
        if (type === 'users') {
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            result = data
        } else if (type === 'missions') {
            // Assuming volunteer_missions table
            const { data, error } = await supabaseClient
                .from('volunteer_missions')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error // If table doesn't exist, it will throw, handle gracefully?
            result = data
        } else if (type === 'communities') {
            const { data, error } = await supabaseClient
                .from('communities')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            result = data
        } else if (type === 'points') {
            const { data, error } = await supabaseClient
                .from('action_point_history')
                .select('*, profiles(nickname, id)')
                .order('created_at', { ascending: false })
            if (error) throw error
            result = data
        } else {
            return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
