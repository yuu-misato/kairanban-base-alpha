import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.14.0'



const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. Auth Check
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const authHeader = req.headers.get('Authorization');

        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'ログインが必要です。' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

        if (userError || !user) {
            return new Response(JSON.stringify({ error: '認証に失敗しました。ページを更新して再度ログインしてください。' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 3. Admin Check
        const { data: roleData } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle();

        if (!roleData) {
            return new Response(JSON.stringify({ error: 'この操作を行う権限がありません（管理者のみ）。' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 3.5 Get Stripe Key
        let stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) {
            const { data: setting } = await supabaseClient
                .from('site_settings')
                .select('value')
                .eq('key', 'stripe_secret_key')
                .maybeSingle();
            stripeKey = setting?.value;
        }

        if (!stripeKey) {
            return new Response(JSON.stringify({ error: 'Stripeとの連携設定（シークレットキー）が完了していません。環境変数または管理画面の設定を確認してください。' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        // 4. Fetch Data
        const { data: plans } = await supabaseClient.from('usage_limits').select('*');
        const { data: addons } = await supabaseClient.from('usage_addons').select('*');

        const createdResults = [];

        // 5. Sync Plans
        if (plans) {
            for (const plan of plans) {
                // Freeプランや、既にID設定済みのものはスキップ
                // (ただし将来的に強制更新フラグなどあっても良い)
                if (plan.plan_type === 'free' || plan.stripe_price_id) continue;
                if (!plan.price || plan.price <= 0) continue;

                console.log(`Creating Stripe product for plan: ${plan.plan_type}`);

                const productName = `Ashibatch Plan: ${plan.plan_type === 'unlimited' ? 'Unlimited' : plan.plan_type}`;
                const product = await stripe.products.create({
                    name: productName,
                    metadata: { plan_type: plan.plan_type }
                });

                const price = await stripe.prices.create({
                    product: product.id,
                    unit_amount: Math.floor(plan.price), // Ensure integer
                    currency: 'jpy',
                    recurring: { interval: 'month' }
                });

                // DB更新
                await supabaseClient
                    .from('usage_limits')
                    .update({ stripe_price_id: price.id })
                    .eq('plan_type', plan.plan_type);

                createdResults.push({ name: productName, price_id: price.id });
            }
        }

        // 6. Sync Addons
        if (addons) {
            for (const addon of addons) {
                if (addon.stripe_price_id) continue;
                if (!addon.price || addon.price <= 0) continue;

                console.log(`Creating Stripe product for addon: ${addon.name}`);

                const productName = `Ashibatch Addon: ${addon.name}`;
                const product = await stripe.products.create({
                    name: productName,
                    metadata: { addon_id: addon.id }
                });

                const price = await stripe.prices.create({
                    product: product.id,
                    unit_amount: Math.floor(addon.price),
                    currency: 'jpy',
                    // one-time price (default)
                });

                // DB更新
                await supabaseClient
                    .from('usage_addons')
                    .update({ stripe_price_id: price.id })
                    .eq('id', addon.id);

                createdResults.push({ name: productName, price_id: price.id });
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Synced ${createdResults.length} products to Stripe.`,
                details: createdResults
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Sync error:', error);
        return new Response(
            JSON.stringify({ error: `同期処理中に予期せぬエラーが発生しました: ${error.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
