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
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the authorization header to verify the requesting user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: '認証が必要です' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify admin status
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the current user
    const { data: { user: adminUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !adminUser) {
      console.error('Failed to get admin user:', authError);
      return new Response(
        JSON.stringify({ error: '認証に失敗しました' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the requesting user is an admin using service role
    const { data: adminRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .eq('role', 'admin');

    if (roleError || !adminRoles || adminRoles.length === 0) {
      console.error('User is not an admin:', adminUser.id);
      return new Response(
        JSON.stringify({ error: '管理者権限が必要です' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { targetUserId, reason } = await req.json();

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: '削除対象のユーザーIDが必要です' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-deletion
    if (targetUserId === adminUser.id) {
      return new Response(
        JSON.stringify({ error: '自分自身を削除することはできません' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${adminUser.id} deleting user ${targetUserId}`);

    // Get the target user's email for logging
    const { data: targetUserData } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    const targetEmail = targetUserData?.user?.email || 'unknown';

    // Delete related data (using service role to bypass RLS)
    const tables = [
      'project_applications',
      'favorites',
      'follows',
      'messages',
      'notifications',
      'reviews',
      'work_requests',
      'contractor_listings',
      'projects',
      'line_notification_settings',
      'line_accounts',
      'user_roles',
      'client_profiles',
      'contractor_profiles',
    ];

    for (const table of tables) {
      let query;
      
      if (table === 'messages') {
        // Messages can be sender or receiver
        await supabaseAdmin.from(table).delete().eq('sender_id', targetUserId);
        await supabaseAdmin.from(table).delete().eq('receiver_id', targetUserId);
        continue;
      } else if (table === 'follows') {
        // Follows can be follower or following
        await supabaseAdmin.from(table).delete().eq('follower_id', targetUserId);
        await supabaseAdmin.from(table).delete().eq('following_id', targetUserId);
        continue;
      } else if (table === 'reviews') {
        // Reviews can be reviewer or target
        await supabaseAdmin.from(table).delete().eq('reviewer_id', targetUserId);
        await supabaseAdmin.from(table).delete().eq('target_id', targetUserId);
        continue;
      } else if (table === 'work_requests') {
        await supabaseAdmin.from(table).delete().eq('requester_id', targetUserId);
        await supabaseAdmin.from(table).delete().eq('target_id', targetUserId);
        continue;
      } else if (table === 'projects') {
        query = supabaseAdmin.from(table).delete().eq('client_id', targetUserId);
      } else if (table === 'contractor_listings') {
        query = supabaseAdmin.from(table).delete().eq('contractor_id', targetUserId);
      } else if (table === 'project_applications') {
        query = supabaseAdmin.from(table).delete().eq('contractor_id', targetUserId);
      } else if (table === 'client_profiles' || table === 'contractor_profiles') {
        query = supabaseAdmin.from(table).delete().eq('id', targetUserId);
      } else {
        query = supabaseAdmin.from(table).delete().eq('user_id', targetUserId);
      }

      if (query) {
        const { error } = await query;
        if (error) {
          console.error(`Error deleting from ${table}:`, error);
        } else {
          console.log(`Deleted from ${table} for user ${targetUserId}`);
        }
      }
    }

    // Log the deletion in withdrawal_logs
    const { error: logError } = await supabaseAdmin
      .from('withdrawal_logs')
      .insert({
        user_id: targetUserId,
        user_email: targetEmail,
        reason: `管理者による削除: ${reason || '理由なし'}`,
        comment: `削除実行者: ${adminUser.email}`,
      });

    if (logError) {
      console.error('Error logging withdrawal:', logError);
    }

    // Delete the user from auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    
    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError);
      return new Response(
        JSON.stringify({ error: 'ユーザーの削除に失敗しました', details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully deleted user ${targetUserId} by admin ${adminUser.id}`);

    return new Response(
      JSON.stringify({ success: true, message: 'ユーザーを削除しました' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: '予期しないエラーが発生しました', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
