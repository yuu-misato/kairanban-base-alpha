import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

if (!LINE_CHANNEL_ACCESS_TOKEN) {
  console.error('LINE_CHANNEL_ACCESS_TOKEN is not set');
}

// 管理者にもコピーする通知タイプ
const ADMIN_COPY_TYPES = [
  'application',
  'work_request',
  'review',
  'application_accepted',
  'application_rejected',
];

interface PushNotificationRequest {
  userId: string;
  type: 'message' | 'application' | 'project_update' | 'announcement' | 'work_request' | 'application_accepted' | 'application_rejected' | 'follower' | 'review' | 'new_project_in_area' | 'ashibakai_rejection' | 'ashibakai_approval';
  title: string;
  body: string;
  url?: string;
  context?: Record<string, string>;
}

interface NotificationTemplate {
  notification_type: string;
  name: string;
  emoji: string;
  title_template: string;
  body_template: string;
  is_enabled: boolean;
  include_url_button: boolean;
  button_label: string;
}

// Replace template variables with context values
function replaceVariables(template: string, context: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] || `{{${key}}}`);
}

async function pushMessage(lineUserId: string, messages: any[]) {
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Push error:', error);
    throw new Error(error);
  }

  return response;
}

// 管理者全員に通知をコピー送信
async function notifyAdmins(
  supabase: any,
  type: string,
  title: string,
  body: string,
  url: string | undefined,
  originalUserId: string
) {
  try {
    // 管理者ロールを持つユーザーを取得
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (rolesError || !adminRoles || adminRoles.length === 0) {
      console.log('No admins found or error:', rolesError);
      return;
    }

    // 元の送信先ユーザーが管理者の場合は除外（重複防止）
    const adminUserIds = adminRoles
      .map((r: { user_id: string }) => r.user_id)
      .filter((id: string) => id !== originalUserId);

    if (adminUserIds.length === 0) {
      console.log('No admins to notify (original user is admin)');
      return;
    }

    // 管理者のLINEアカウントを取得
    const { data: lineAccounts } = await supabase
      .from('line_accounts')
      .select('user_id, line_user_id, is_notification_enabled')
      .in('user_id', adminUserIds);

    const adminTitle = `[管理] ${title}`;
    const adminEmoji = '👁️';
    const messages = [
      {
        type: 'text',
        text: `${adminEmoji} ${adminTitle}\n\n${body}`,
      },
    ];

    if (url) {
      messages.push({
        type: 'template',
        altText: '詳細を見る',
        template: {
          type: 'buttons',
          text: '詳細を見るにはボタンをタップしてください',
          actions: [
            {
              type: 'uri',
              label: '詳細を見る',
              uri: url,
            },
          ],
        },
      } as any);
    }

    // LINE連携済みの管理者に通知を送信
    const adminsWithLine = new Set<string>();
    for (const account of lineAccounts || []) {
      if (account.is_notification_enabled) {
        try {
          await pushMessage(account.line_user_id, messages);
          adminsWithLine.add(account.user_id);
          console.log(`Admin LINE notification sent to ${account.user_id}`);
        } catch (err) {
          console.error(`Failed to send LINE to admin ${account.user_id}:`, err);
        }
      }
    }

    // 全管理者にDB通知を保存（アプリ内通知用）
    const notificationInserts = adminUserIds.map((adminId: string) => ({
      user_id: adminId,
      title: adminTitle,
      content: body,
      type: `admin_copy_${type}`,
      link: url || null,
      is_read: false,
    }));

    if (notificationInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notificationInserts);

      if (insertError) {
        console.error('Failed to insert admin notifications:', insertError);
      } else {
        console.log(`Saved ${notificationInserts.length} admin notifications to DB`);
      }
    }
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, type, title, body, url, context = {} }: PushNotificationRequest = await req.json();

    console.log('Push notification request:', { userId, type, title });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get notification template from DB
    const { data: template, error: templateError } = await supabase
      .from('line_notification_templates')
      .select('*')
      .eq('notification_type', type)
      .single();

    if (templateError) {
      console.log('Template not found, using defaults:', templateError);
    }

    // Check if template is disabled
    if (template && !template.is_enabled) {
      console.log(`Notification type ${type} is disabled in templates`);
      return new Response(JSON.stringify({ success: false, reason: 'template_disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get LINE account for user
    const { data: lineAccount, error: lineError } = await supabase
      .from('line_accounts')
      .select('line_user_id, is_notification_enabled')
      .eq('user_id', userId)
      .single();

    if (lineError || !lineAccount) {
      console.log('No LINE account found for user:', userId);
      return new Response(JSON.stringify({ success: false, reason: 'no_line_account' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!lineAccount.is_notification_enabled) {
      console.log('Notifications disabled for user:', userId);
      return new Response(JSON.stringify({ success: false, reason: 'notifications_disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check notification settings
    const { data: settings } = await supabase
      .from('line_notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Check if this notification type is enabled
    const typeSettingMap: Record<string, string> = {
      message: 'new_message',
      application: 'new_application',
      project_update: 'project_update',
      announcement: 'announcement',
      work_request: 'work_request',
      application_accepted: 'application_result',
      application_rejected: 'application_result',
      follower: 'new_follower',
      review: 'new_review',
      new_project_in_area: 'new_project_in_area',
    };

    const settingKey = typeSettingMap[type];
    if (settings && settingKey && !settings[settingKey]) {
      console.log(`Notification type ${type} disabled for user:`, userId);
      return new Response(JSON.stringify({ success: false, reason: 'type_disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build message using template or fallback to provided values
    let messageTitle = title;
    let messageBody = body;
    let selectedEmoji = '🔔';
    let includeUrlButton = true;
    let buttonLabel = '詳細を見る';

    if (template) {
      // Use template values and replace variables
      messageTitle = replaceVariables(template.title_template, { ...context, title, body });
      messageBody = replaceVariables(template.body_template, { ...context, title, body });
      selectedEmoji = template.emoji || '🔔';
      includeUrlButton = template.include_url_button;
      buttonLabel = template.button_label || '詳細を見る';
    } else {
      // Fallback emoji mapping for when no template exists
      const emoji: Record<string, string> = {
        message: '💬',
        application: '📝',
        project_update: '🔄',
        announcement: '📢',
        work_request: '📋',
        application_accepted: '✅',
        application_rejected: '😔',
        follower: '👥',
        review: '⭐',
        new_project_in_area: '📍',
        ashibakai_rejection: '📋',
        ashibakai_approval: '🎉',
      };
      selectedEmoji = emoji[type] || '🔔';
    }

    const messages: any[] = [
      {
        type: 'text',
        text: `${selectedEmoji} ${messageTitle}\n\n${messageBody}`,
      },
    ];

    // Add URL button if provided and enabled
    if (url && includeUrlButton) {
      messages.push({
        type: 'template',
        altText: buttonLabel,
        template: {
          type: 'buttons',
          text: `${buttonLabel}するにはボタンをタップしてください`,
          actions: [
            {
              type: 'uri',
              label: buttonLabel,
              uri: url,
            },
          ],
        },
      });
    }

    // Check quiet hours
    let skipPush = false;
    if (settings && settings.quiet_hours_enabled && settings.quiet_hours_start && settings.quiet_hours_end) {
      const now = new Date();
      // Calculate JST time
      // UTC time + 9 hours
      const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      const currentHour = jstNow.getUTCHours();
      const currentMinute = jstNow.getUTCMinutes();
      const currentTimeVal = currentHour * 60 + currentMinute;

      const [startHour, startMinute] = settings.quiet_hours_start.split(':').map(Number);
      const startTimeVal = startHour * 60 + startMinute;

      const [endHour, endMinute] = settings.quiet_hours_end.split(':').map(Number);
      const endTimeVal = endHour * 60 + endMinute;

      if (startTimeVal < endTimeVal) {
        // Same day range (e.g. 09:00 - 17:00)
        if (currentTimeVal >= startTimeVal && currentTimeVal < endTimeVal) {
          skipPush = true;
        }
      } else {
        // Cross midnight range (e.g. 23:00 - 07:00)
        if (currentTimeVal >= startTimeVal || currentTimeVal < endTimeVal) {
          skipPush = true;
        }
      }

      if (skipPush) {
        console.log(`Skipping push notification due to quiet hours (${settings.quiet_hours_start} - ${settings.quiet_hours_end})`);
      }
    }

    if (!skipPush) {
      await pushMessage(lineAccount.line_user_id, messages);
    }

    // Also save to notifications table for in-app notification history
    const { error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: messageTitle,
        content: messageBody,
        type: type,
        link: url || null,
        is_read: false,
      });

    if (insertError) {
      console.error('Failed to insert notification:', insertError);
      // Don't fail the request, LINE notification was already sent
    }

    // Check admin notification settings
    const { data: adminSettings } = await supabase
      .from('admin_notification_settings')
      .select('is_enabled')
      .eq('type', type)
      .single();

    // If setting exists and is enabled, OR if no setting exists fallback to false (or true depending on preference, but here let's be strict)
    // Actually, we initialized the table.
    const shouldNotifyAdmin = adminSettings?.is_enabled;

    if (shouldNotifyAdmin) {
      console.log(`Copying notification type ${type} to admins`);
      await notifyAdmins(supabase, type, messageTitle, messageBody, url, userId);
    }

    console.log('Push notification sent successfully');
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Push notification error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Return 200 even on error so frontend can display the message
    return new Response(JSON.stringify({ success: false, reason: 'api_error', error: message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
