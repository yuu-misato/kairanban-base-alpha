import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function getLineProfile(accessToken: string) {
  const response = await fetch('https://api.line.me/v2/profile', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to get LINE profile:', response.status, errorText);
    throw new Error('Failed to get LINE profile');
  }
  
  return await response.json();
}

async function pushWelcomeMessage(lineUserId: string) {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [
          {
            type: 'text',
            text: '🎉 アカウント連携が完了しました！\n\nこれで新着案件やメッセージの通知をLINEで受け取れるようになりました。\n\n通知設定はアシバッチのLINE設定画面から変更できます。',
          },
        ],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send welcome message:', response.status, errorText);
    }
    
    return response;
  } catch (error) {
    console.error('Error sending welcome message:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, lineAccessToken, userId, linkCode } = await req.json();
    
    console.log('Line link account request:', { 
      action, 
      userId, 
      hasAccessToken: !!lineAccessToken,
      linkCode: linkCode ? '***' : undefined 
    });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Link via LIFF access token
    if (action === 'link') {
      if (!lineAccessToken) {
        console.error('Missing LINE access token');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'LINEアクセストークンがありません' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!userId) {
        console.error('Missing user ID');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'ユーザーIDがありません' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get LINE profile using the access token from LIFF
      const lineProfile = await getLineProfile(lineAccessToken);
      console.log('LINE profile fetched:', { 
        userId: lineProfile.userId, 
        displayName: lineProfile.displayName 
      });

      // Check if LINE account is already linked to another user
      const { data: existingLink, error: existingLinkError } = await supabase
        .from('line_accounts')
        .select('user_id')
        .eq('line_user_id', lineProfile.userId)
        .maybeSingle();

      if (existingLinkError) {
        console.error('Error checking existing link:', existingLinkError);
      }

      if (existingLink && existingLink.user_id !== userId) {
        console.log('LINE account already linked to another user:', existingLink.user_id);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'このLINEアカウントは既に別のユーザーと連携されています' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Upsert LINE account
      const { error: upsertError } = await supabase
        .from('line_accounts')
        .upsert({
          user_id: userId,
          line_user_id: lineProfile.userId,
          display_name: lineProfile.displayName,
          picture_url: lineProfile.pictureUrl,
          status_message: lineProfile.statusMessage,
          is_notification_enabled: true,
          linked_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        throw upsertError;
      }

      console.log('LINE account linked successfully for user:', userId);

      // Create default notification settings
      const { error: notifError } = await supabase
        .from('line_notification_settings')
        .upsert({
          user_id: userId,
          new_message: true,
          new_application: true,
          project_update: true,
          announcement: true,
          work_request: true,
          application_result: true,
          new_follower: true,
          new_review: true,
        }, {
          onConflict: 'user_id',
        });

      if (notifError) {
        console.error('Notification settings upsert error:', notifError);
      }

      // Update user metadata with LINE info for re-linking capability
      const { error: metadataError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          line_user_id: lineProfile.userId,
          line_display_name: lineProfile.displayName,
          line_picture_url: lineProfile.pictureUrl,
        },
      });

      if (metadataError) {
        console.error('Failed to update user metadata:', metadataError);
      }

      // Send welcome message via LINE
      await pushWelcomeMessage(lineProfile.userId);

      return new Response(JSON.stringify({ 
        success: true, 
        profile: {
          displayName: lineProfile.displayName,
          pictureUrl: lineProfile.pictureUrl,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Link via code (from webhook)
    if (action === 'link_with_code') {
      if (!linkCode || !userId) {
        console.error('Missing linkCode or userId:', { hasLinkCode: !!linkCode, hasUserId: !!userId });
        return new Response(JSON.stringify({ 
          success: false, 
          error: '連携コードとユーザーIDが必要です' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Find valid link code
      const { data: codeData, error: codeError } = await supabase
        .from('line_link_codes')
        .select('*')
        .eq('code', linkCode)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (codeError || !codeData) {
        console.error('Code lookup error:', codeError, 'Code data:', codeData);
        return new Response(JSON.stringify({ 
          success: false, 
          error: '無効または期限切れの連携コードです' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Found valid link code for LINE user:', codeData.line_user_id);

      // Check if LINE account is already linked to another user
      const { data: existingLink } = await supabase
        .from('line_accounts')
        .select('user_id')
        .eq('line_user_id', codeData.line_user_id)
        .maybeSingle();

      if (existingLink && existingLink.user_id !== userId) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'このLINEアカウントは既に別のユーザーと連携されています' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if user already has a linked LINE account
      const { data: userExistingLink } = await supabase
        .from('line_accounts')
        .select('line_user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (userExistingLink) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: '既に別のLINEアカウントと連携されています。先に連携を解除してください。' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Mark code as used
      await supabase
        .from('line_link_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', codeData.id);

      // Create LINE account link
      const { error: insertError } = await supabase
        .from('line_accounts')
        .insert({
          user_id: userId,
          line_user_id: codeData.line_user_id,
          display_name: codeData.display_name,
          picture_url: codeData.picture_url,
          is_notification_enabled: true,
          linked_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('LINE account linked via code for user:', userId);

      // Create default notification settings
      await supabase
        .from('line_notification_settings')
        .upsert({
          user_id: userId,
          new_message: true,
          new_application: true,
          project_update: true,
          announcement: true,
          work_request: true,
          application_result: true,
          new_follower: true,
          new_review: true,
        }, {
          onConflict: 'user_id',
        });

      // Update user metadata with LINE info
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          line_user_id: codeData.line_user_id,
          line_display_name: codeData.display_name,
          line_picture_url: codeData.picture_url,
        },
      });

      // Send welcome message via LINE
      await pushWelcomeMessage(codeData.line_user_id);

      return new Response(JSON.stringify({ 
        success: true, 
        profile: {
          displayName: codeData.display_name,
          pictureUrl: codeData.picture_url,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (action === 'unlink') {
      if (!userId) {
        console.error('Missing userId for unlink');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'ユーザーIDがありません' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Unlinking LINE account for user:', userId);

      // First check if LINE account exists
      const { data: existingAccount, error: checkError } = await supabase
        .from('line_accounts')
        .select('id, line_user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing account:', checkError);
      }

      if (!existingAccount) {
        console.log('No LINE account found to unlink for user:', userId);
        return new Response(JSON.stringify({ 
          success: true, 
          message: '連携済みのLINEアカウントがありません' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Found LINE account to unlink:', existingAccount.line_user_id);

      // Remove LINE account link
      const { error: deleteError, count } = await supabase
        .from('line_accounts')
        .delete({ count: 'exact' })
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      console.log('Deleted LINE account records:', count);

      // Also remove notification settings
      const { error: notifDeleteError } = await supabase
        .from('line_notification_settings')
        .delete()
        .eq('user_id', userId);

      if (notifDeleteError) {
        console.error('Notification settings delete error:', notifDeleteError);
      }

      console.log('LINE account unlinked successfully for user:', userId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.error('Invalid action:', action);
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Line link account error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});