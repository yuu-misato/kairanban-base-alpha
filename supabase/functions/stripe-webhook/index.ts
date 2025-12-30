import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.14.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
    const signature = req.headers.get('Stripe-Signature')

    try {
        const body = await req.text()
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

        if (!webhookSecret) {
            throw new Error('Missing STRIPE_WEBHOOK_SECRET')
        }

        let event
        try {
            event = await stripe.webhooks.constructEventAsync(
                body,
                signature!,
                webhookSecret,
                undefined,
                cryptoProvider
            )
        } catch (err) {
            console.error(`Webhook signature verification failed.`, err.message)
            return new Response(err.message, { status: 400 })
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log('Received event:', event.type)

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;

                // Determine User ID
                let userId = session.client_reference_id || session.metadata?.supabaseUUID;

                if (!userId && session.customer) {
                    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
                    const { data: customerData } = await supabaseAdmin
                        .from('stripe_customers')
                        .select('user_id')
                        .eq('stripe_customer_id', stripeCustomerId)
                        .single();
                    userId = customerData?.user_id;
                }

                if (!userId) {
                    console.error('User not found for session:', session.id);
                    break;
                }

                // Handle Add-on Payment
                if (session.mode === 'payment') {
                    console.log('Processing payment session for user:', userId);
                    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
                    const priceId = lineItems.data[0]?.price?.id;

                    if (priceId) {
                        const { data: addon } = await supabaseAdmin
                            .from('usage_addons')
                            .select('*')
                            .eq('stripe_price_id', priceId)
                            .single();

                        if (addon) {
                            const { error: insertError } = await supabaseAdmin
                                .from('user_addon_purchases')
                                .insert({
                                    user_id: userId,
                                    addon_id: addon.id,
                                    addon_type: addon.addon_type,
                                    quantity: addon.quantity,
                                    remaining: addon.quantity,
                                    purchased_at: new Date().toISOString()
                                });

                            if (insertError) {
                                console.error('Failed to grant addon:', insertError);
                            } else {
                                console.log(`Granted addon ${addon.name} to user ${userId}`);
                            }
                        } else {
                            console.log('No matching addon found for price:', priceId);
                        }
                    }
                }
                break;
            }

            case 'customer.subscription.updated':
            case 'customer.subscription.created': {
                const subscription = event.data.object
                const priceId = subscription.items.data[0].price.id;
                const status = subscription.status;
                const stripeCustomerId = typeof subscription.customer === 'string'
                    ? subscription.customer
                    : subscription.customer.id

                const { data: customerData } = await supabaseAdmin
                    .from('stripe_customers')
                    .select('user_id')
                    .eq('stripe_customer_id', stripeCustomerId)
                    .single()

                if (!customerData?.user_id) {
                    console.error('Customer not found for subscription:', subscription.id)
                    break
                }
                const userId = customerData.user_id;

                // Sync Subscription Status
                await supabaseAdmin.from('user_subscriptions').upsert({
                    stripe_subscription_id: subscription.id,
                    user_id: userId,
                    status: status,
                    price_id: priceId,
                    cancel_at_period_end: subscription.cancel_at_period_end,
                    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'stripe_subscription_id' });

                // Sync User Plan
                if (status === 'active' || status === 'trialing') {
                    const { data: limit } = await supabaseAdmin
                        .from('usage_limits')
                        .select('plan_type')
                        .eq('stripe_price_id', priceId)
                        .single();

                    if (limit) {
                        const expiresAt = new Date(subscription.current_period_end * 1000);

                        await supabaseAdmin.from('user_plans').upsert({
                            user_id: userId,
                            plan_type: limit.plan_type,
                            expires_at: expiresAt.toISOString(),
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id' });
                        console.log(`Updated plan for user ${userId} to ${limit.plan_type}`);
                    }
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const stripeCustomerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

                const { data: customerData } = await supabaseAdmin
                    .from('stripe_customers')
                    .select('user_id')
                    .eq('stripe_customer_id', stripeCustomerId)
                    .single()

                if (customerData?.user_id) {
                    await supabaseAdmin.from('user_subscriptions').update({
                        status: 'canceled',
                        updated_at: new Date().toISOString()
                    }).eq('stripe_subscription_id', subscription.id);

                    // Downgrade plan to normal
                    await supabaseAdmin.from('user_plans').update({
                        plan_type: 'normal',
                        expires_at: null,
                        updated_at: new Date().toISOString()
                    }).eq('user_id', customerData.user_id);
                    console.log(`Downgraded user ${customerData.user_id} plan to normal due to subscription cancellation`);
                }
                break;
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (err) {
        console.error(err)
        return new Response(err.message, { status: 400 })
    }
})
