import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyAdminsRequest {
  type: string;
  title: string;
  body: string;
  url?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lineChannelAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');

    if (!lineChannelAccessToken) {
      console.error('LINE_CHANNEL_ACCESS_TOKEN is not set');
      return new Response(
        JSON.stringify({ success: false, reason: 'LINE not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, title, body, url }: NotifyAdminsRequest = await req.json();

    console.log('Notifying admins:', { type, title, body, url });

    // Get all admin user IDs
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (rolesError) {
      console.error('Error fetching admin roles:', rolesError);
      throw rolesError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log('No admins found');
      return new Response(
        JSON.stringify({ success: true, notified: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminUserIds = adminRoles.map(r => r.user_id);
    console.log(`Found ${adminUserIds.length} admins`);

    // Get LINE accounts for admins
    const { data: lineAccounts, error: lineError } = await supabase
      .from('line_accounts')
      .select('user_id, line_user_id')
      .in('user_id', adminUserIds)
      .eq('is_notification_enabled', true);

    if (lineError) {
      console.error('Error fetching line accounts:', lineError);
      throw lineError;
    }

    if (!lineAccounts || lineAccounts.length === 0) {
      console.log('No admins with LINE connected');
      // Still save notifications even if no LINE
      for (const adminId of adminUserIds) {
        await supabase.from('notifications').insert({
          user_id: adminId,
          type: type,
          title: title,
          content: body,
          link: url || null,
          is_read: false,
        });
      }
      return new Response(
        JSON.stringify({ success: true, notified: 0, savedNotifications: adminUserIds.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${lineAccounts.length} admins with LINE connected`);

    let notifiedCount = 0;

    for (const account of lineAccounts) {
      try {
        // Build LINE message
        const messages: any[] = [
          {
            type: 'text',
            text: `🔔 ${title}\n\n${body}`,
          },
        ];

        // Add URL button if provided
        if (url) {
          messages.push({
            type: 'template',
            altText: '詳細を確認',
            template: {
              type: 'buttons',
              text: '管理画面で確認してください',
              actions: [
                {
                  type: 'uri',
                  label: '詳細を見る',
                  uri: url,
                },
              ],
            },
          });
        }

        // Send LINE push message
        const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lineChannelAccessToken}`,
          },
          body: JSON.stringify({
            to: account.line_user_id,
            messages: messages,
          }),
        });

        if (lineResponse.ok) {
          notifiedCount++;
          console.log(`Notified admin ${account.user_id} via LINE`);
        } else {
          const errorText = await lineResponse.text();
          console.error(`Failed to notify admin ${account.user_id}:`, errorText);
        }

        // Save notification to database
        await supabase.from('notifications').insert({
          user_id: account.user_id,
          type: type,
          title: title,
          content: body,
          link: url || null,
          is_read: false,
        });
      } catch (err) {
        console.error(`Error notifying admin ${account.user_id}:`, err);
      }
    }

    // Save notifications for admins without LINE
    const adminsWithLine = new Set(lineAccounts.map(a => a.user_id));
    for (const adminId of adminUserIds) {
      if (!adminsWithLine.has(adminId)) {
        await supabase.from('notifications').insert({
          user_id: adminId,
          type: type,
          title: title,
          content: body,
          link: url || null,
          is_read: false,
        });
      }
    }

    console.log(`Successfully notified ${notifiedCount} admins via LINE`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: notifiedCount,
        totalAdmins: adminUserIds.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in notify-admins:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
