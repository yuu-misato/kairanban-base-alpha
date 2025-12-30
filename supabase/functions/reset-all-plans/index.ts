import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ error: '認証が必要です' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify they are admin
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Extract JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.log('User auth error:', userError);
      return new Response(
        JSON.stringify({ error: '認証に失敗しました' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.log('User is not admin');
      return new Response(
        JSON.stringify({ error: '管理者権限が必要です' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin verified, proceeding with reset...');

    // Delete all user plans (except admin's own if needed)
    const { error: deletePlansError } = await supabaseClient
      .from('user_plans')
      .delete()
      .neq('plan_type', 'placeholder'); // This deletes all rows

    if (deletePlansError) {
      console.error('Error deleting user_plans:', deletePlansError);
      throw deletePlansError;
    }

    console.log('User plans deleted');

    // Delete all addon purchases
    const { error: deleteAddonsError } = await supabaseClient
      .from('user_addon_purchases')
      .delete()
      .neq('addon_type', 'placeholder'); // This deletes all rows

    if (deleteAddonsError) {
      console.error('Error deleting user_addon_purchases:', deleteAddonsError);
      throw deleteAddonsError;
    }

    console.log('Addon purchases deleted');

    // Update last_plan_reset timestamp
    const { error: updateSettingsError } = await supabaseClient
      .from('site_settings')
      .update({ value: new Date().toISOString() })
      .eq('key', 'last_plan_reset');

    if (updateSettingsError) {
      console.error('Error updating last_plan_reset:', updateSettingsError);
      throw updateSettingsError;
    }

    console.log('Reset completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '全ユーザーのプランをリセットしました',
        reset_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Reset error:', error);
    return new Response(
      JSON.stringify({ error: 'リセットに失敗しました' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
