import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LIFF_ID = Deno.env.get('LIFF_ID') || '2008600703-aNmdY4Nq';

interface NotifyRequest {
  projectId: string;
  projectTitle: string;
  serviceAreas: string[];
  constructionType: string;
}

// Check if areas overlap
function areasOverlap(projectAreas: string[], contractorAreas: string[]): boolean {
  // If contractor has "全国" (nationwide), they match everything
  if (contractorAreas.includes('全国')) return true;
  
  for (const projectArea of projectAreas) {
    const projectPrefecture = projectArea.split(':')[0];
    
    for (const contractorArea of contractorAreas) {
      const contractorPrefecture = contractorArea.split(':')[0];
      
      // Same prefecture - partial match
      if (projectPrefecture === contractorPrefecture) {
        return true;
      }
    }
  }
  
  return false;
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, projectTitle, serviceAreas, constructionType }: NotifyRequest = await req.json();
    
    console.log('Notify matching contractors:', { projectId, serviceAreas });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all contractors with their service areas
    const { data: contractors, error: contractorsError } = await supabase
      .from('contractor_profiles')
      .select('id, company_name, service_areas');

    if (contractorsError) {
      console.error('Error fetching contractors:', contractorsError);
      throw contractorsError;
    }

    // Filter contractors whose service areas overlap with project areas
    const matchingContractorIds = contractors
      .filter(c => c.service_areas && areasOverlap(serviceAreas, c.service_areas))
      .map(c => c.id);

    console.log(`Found ${matchingContractorIds.length} matching contractors`);

    if (matchingContractorIds.length === 0) {
      return new Response(JSON.stringify({ success: true, notified: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get LINE accounts for matching contractors with notification enabled
    const { data: lineAccounts, error: lineError } = await supabase
      .from('line_accounts')
      .select('user_id, line_user_id, is_notification_enabled')
      .in('user_id', matchingContractorIds)
      .eq('is_notification_enabled', true);

    if (lineError) {
      console.error('Error fetching LINE accounts:', lineError);
      throw lineError;
    }

    // Get notification settings for these users
    const userIds = lineAccounts?.map(a => a.user_id) || [];
    const { data: settings } = await supabase
      .from('line_notification_settings')
      .select('user_id, new_project_in_area')
      .in('user_id', userIds);

    const settingsMap = new Map(settings?.map(s => [s.user_id, s]) || []);

    // Build notification message
    const areaLabels = serviceAreas.slice(0, 3).map(a => a.split(':')[0]).join('、');
    const messages = [
      {
        type: 'text',
        text: `📍 あなたの対応エリアに新着案件！\n\n【${projectTitle}】\n工種: ${constructionType}\nエリア: ${areaLabels}${serviceAreas.length > 3 ? ' 他' : ''}\n\n詳細を確認して応募しましょう！`,
      },
      {
        type: 'template',
        altText: '案件詳細を確認',
        template: {
          type: 'buttons',
          text: '案件の詳細を確認するにはボタンをタップ',
          actions: [
            {
              type: 'uri',
              label: '案件を見る',
              uri: `https://liff.line.me/${LIFF_ID}/projects/${projectId}`,
            },
          ],
        },
      },
    ];

    let notifiedCount = 0;

    // Send notifications
    for (const account of (lineAccounts || [])) {
      const userSettings = settingsMap.get(account.user_id);
      // Default to true if no settings exist
      if (userSettings && userSettings.new_project_in_area === false) {
        console.log(`Skipping user ${account.user_id} - notification disabled`);
        continue;
      }

      try {
        await pushMessage(account.line_user_id, messages);
        notifiedCount++;
        console.log(`Notified user ${account.user_id}`);
      } catch (error) {
        console.error(`Failed to notify user ${account.user_id}:`, error);
      }
    }

    console.log(`Successfully notified ${notifiedCount} contractors`);
    return new Response(JSON.stringify({ success: true, notified: notifiedCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Notify matching contractors error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
