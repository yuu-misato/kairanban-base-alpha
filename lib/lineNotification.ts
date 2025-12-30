import { supabase } from '@/integrations/supabase/client';

// LIFF ID for generating LIFF URLs
const LIFF_ID = '2008600703-aNmdY4Nq';

// Generate LIFF URL for LINE notifications
export const getLiffUrl = (path: string): string => {
  return `https://liff.line.me/${LIFF_ID}${path}`;
};

export type LineNotificationType =
  | 'message' 
  | 'application' 
  | 'project_update' 
  | 'announcement'
  | 'work_request'
  | 'application_accepted'
  | 'application_rejected'
  | 'follower'
  | 'review'
  | 'new_project_in_area'
  | 'ashibakai_rejection'
  | 'ashibakai_approval';

interface SendLineNotificationParams {
  userId: string;
  type: LineNotificationType;
  title: string;
  body: string;
  url?: string;
  context?: Record<string, string>; // For template variable replacement
}

export const sendLineNotification = async ({
  userId,
  type,
  title,
  body,
  url,
  context,
}: SendLineNotificationParams): Promise<{ success: boolean; reason?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('line-push-notification', {
      body: { userId, type, title, body, url, context },
    });

    if (error) {
      console.error('LINE notification error:', error);
      return { success: false, reason: 'invocation_error' };
    }

    return data;
  } catch (error) {
    console.error('LINE notification error:', error);
    return { success: false, reason: 'unknown_error' };
  }
};

// Helper to get company name for a user
export const getCompanyName = async (userId: string): Promise<string> => {
  // Try contractor profile first
  const { data: contractor } = await supabase
    .from('contractor_profiles')
    .select('company_name')
    .eq('id', userId)
    .single();
  
  if (contractor?.company_name) {
    return contractor.company_name;
  }

  // Try client profile
  const { data: client } = await supabase
    .from('client_profiles')
    .select('company_name')
    .eq('id', userId)
    .single();
  
  return client?.company_name || '会員';
};
