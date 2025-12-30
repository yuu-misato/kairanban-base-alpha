import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: '認証が必要です' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Client with user token to verify identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get the current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      console.error('Failed to get user:', userError)
      return new Response(
        JSON.stringify({ error: 'ユーザー情報の取得に失敗しました' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing account deletion for user:', user.id)

    // Parse request body for withdrawal reason
    let reason = null
    let comment = null
    try {
      const body = await req.json()
      reason = body.reason || null
      comment = body.comment || null
    } catch {
      // Body is optional
    }

    // Admin client for deletion operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Log the withdrawal reason
    const { error: logError } = await supabaseAdmin
      .from('withdrawal_logs')
      .insert({
        user_id: user.id,
        user_email: user.email,
        reason,
        comment
      })

    if (logError) {
      console.error('Failed to log withdrawal reason:', logError)
      // Don't fail the deletion if logging fails
    }

    // Delete user data from various tables (in order to avoid FK issues)
    // Note: Some tables might cascade delete automatically based on FK settings
    
    // Delete messages
    await supabaseAdmin.from('messages').delete().or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    
    // Delete notifications
    await supabaseAdmin.from('notifications').delete().eq('user_id', user.id)
    
    // Delete favorites
    await supabaseAdmin.from('favorites').delete().eq('user_id', user.id)
    
    // Delete follows
    await supabaseAdmin.from('follows').delete().or(`follower_id.eq.${user.id},following_id.eq.${user.id}`)
    
    // Delete reviews
    await supabaseAdmin.from('reviews').delete().or(`reviewer_id.eq.${user.id},target_id.eq.${user.id}`)
    
    // Delete work requests
    await supabaseAdmin.from('work_requests').delete().or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
    
    // Delete project applications
    await supabaseAdmin.from('project_applications').delete().eq('contractor_id', user.id)
    
    // Delete projects
    await supabaseAdmin.from('projects').delete().eq('client_id', user.id)
    
    // Delete contractor listings
    await supabaseAdmin.from('contractor_listings').delete().eq('contractor_id', user.id)
    
    // Delete LINE related data
    await supabaseAdmin.from('line_notification_settings').delete().eq('user_id', user.id)
    await supabaseAdmin.from('line_accounts').delete().eq('user_id', user.id)
    
    // Delete AI chat conversations
    await supabaseAdmin.from('ai_chat_conversations').delete().eq('user_id', user.id)
    
    // Delete profiles
    await supabaseAdmin.from('contractor_profiles').delete().eq('id', user.id)
    await supabaseAdmin.from('client_profiles').delete().eq('id', user.id)
    
    // Delete user roles
    await supabaseAdmin.from('user_roles').delete().eq('user_id', user.id)

    // Finally, delete the user from auth.users using admin API
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      console.error('Failed to delete user from auth:', deleteError)
      return new Response(
        JSON.stringify({ error: 'アカウントの削除に失敗しました' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Successfully deleted user:', user.id)

    return new Response(
      JSON.stringify({ success: true, message: 'アカウントが正常に削除されました' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: '予期せぬエラーが発生しました' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
