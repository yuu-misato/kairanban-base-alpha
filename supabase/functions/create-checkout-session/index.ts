import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.14.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'POST' } })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('Not authenticated')
        }

        const { priceId, mode = 'subscription', returnUrl } = await req.json()

        if (!priceId || !returnUrl) {
            throw new Error('Missing priceId or returnUrl')
        }

        // 1. Get or create customer using Admin client (Service Role)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: customerData } = await supabaseAdmin
            .from('stripe_customers')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single()

        let customerId = customerData?.stripe_customer_id

        if (!customerId) {
            console.log('Creating new Stripe customer for user:', user.id)
            // Create new customer in Stripe
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    supabaseUUID: user.id
                }
            })
            customerId = customer.id

            // Save to DB
            const { error: insertError } = await supabaseAdmin
                .from('stripe_customers')
                .insert({ user_id: user.id, stripe_customer_id: customerId })

            if (insertError) {
                console.error('Failed to insert stripe customer:', insertError)
                throw insertError
            }
        }

        // 2. Create Checkout Session
        console.log('Creating checkout session for customer:', customerId)
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: mode, // 'subscription' or 'payment'
            success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${returnUrl}?canceled=true`,
        })

        return new Response(
            JSON.stringify({ url: session.url }),
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
