import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: '認証が必要です' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'ユーザー認証に失敗しました' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing plan upgrade for user: ${user.id}`);

    // Parse request body
    const { planType, planAmount } = await req.json();

    if (!planType || planType !== 'unlimited') {
      return new Response(
        JSON.stringify({ error: '無効なプランタイプです' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role key for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Security Check: Verify we are in Demo Mode
    try {
      const { data: setting } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('key', 'payment_demo_mode')
        .single();

      const isDemoMode = setting?.value === 'true';

      if (!isDemoMode) {
        console.error('Attempted to direct upgrade in non-demo mode');
        return new Response(
          JSON.stringify({ error: '不正なリクエストです。正規の決済フローをご利用ください。' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (err) {
      console.error('Error checking site settings:', err);
      return new Response(
        JSON.stringify({ error: 'システムエラーが発生しました' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has unlimited plan
    const { data: existingPlan, error: planError } = await supabaseAdmin
      .from('user_plans')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (planError && planError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing plan:', planError);
      return new Response(
        JSON.stringify({ error: 'プランの確認に失敗しました' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingPlan?.plan_type === 'unlimited') {
      return new Response(
        JSON.stringify({ error: 'すでに無制限プランをご利用中です' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate expiry date (1 month from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Upsert the user plan
    const { data: newPlan, error: upsertError } = await supabaseAdmin
      .from('user_plans')
      .upsert({
        user_id: user.id,
        plan_type: 'unlimited',
        granted_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        notes: 'ユーザーによるセルフアップグレード',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting plan:', upsertError);
      return new Response(
        JSON.stringify({ error: 'プランの更新に失敗しました' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully upgraded user ${user.id} to unlimited plan`);

    // ===== アフィリエイトコンバージョン処理 =====
    // このユーザーがアフィリエイト経由で登録していた場合、コンバージョンを記録
    try {
      // アフィリエイト紹介レコードを検索
      const { data: referral, error: referralError } = await supabaseAdmin
        .from('affiliate_referrals')
        .select('*, affiliates!inner(id, commission_rate, status)')
        .eq('referred_user_id', user.id)
        .eq('status', 'registered')
        .single();

      if (referral && !referralError) {
        // アフィリエイターが承認済みの場合のみ処理
        const affiliate = referral.affiliates as { id: string; commission_rate: number; status: string };
        if (affiliate?.status === 'approved') {
          const commissionRate = affiliate.commission_rate || 10;
          const amount = planAmount || 0;
          const commissionAmount = Math.floor(amount * (commissionRate / 100));

          // コンバージョンを記録
          const { error: updateError } = await supabaseAdmin
            .from('affiliate_referrals')
            .update({
              status: 'converted',
              converted_at: new Date().toISOString(),
              commission_amount: commissionAmount,
              plan_amount: amount,
            })
            .eq('id', referral.id);

          if (updateError) {
            console.error('Error updating affiliate referral:', updateError);
          } else {
            console.log(`Affiliate conversion recorded: user=${user.id}, affiliate=${affiliate.id}, commission=${commissionAmount}`);
          }
        }
      }
    } catch (affError) {
      // アフィリエイト処理のエラーはプラン更新を妨げない
      console.error('Affiliate processing error (non-blocking):', affError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        plan: newPlan,
        message: '無制限プランにアップグレードしました'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: '予期せぬエラーが発生しました' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
