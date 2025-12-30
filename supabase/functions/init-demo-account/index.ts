import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function initializes the demo account
// It can be called without authentication (for initial setup only)
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Simple secret check to prevent abuse - check both body and query params
  let secret: string | null = null
  
  // Try to get secret from query params first
  const url = new URL(req.url)
  secret = url.searchParams.get('secret')
  
  // If not in query params, try body
  if (!secret && req.method === 'POST') {
    try {
      const body = await req.json()
      secret = body?.secret
    } catch {
      // Body parsing failed, continue with null secret
    }
  }
  
  if (secret !== 'init-demo-2024') {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
    )
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const demoEmail = 'test@test.com'
    const demoPassword = 'testtest'

    // Check if demo user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === demoEmail)

    let userId: string

    if (existingUser) {
      console.log('Demo user already exists, updating...')
      userId = existingUser.id
    } else {
      // Create the demo user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: demoEmail,
        password: demoPassword,
        email_confirm: true,
        user_metadata: {
          roles: ['client', 'contractor', 'admin'],
          company_name: 'テスト株式会社',
          prefecture: '東京都',
          postal_code: '150-0001',
          address: '渋谷区神宮前1-1-1'
        }
      })

      if (createError) {
        throw createError
      }

      userId = newUser.user!.id
      console.log('Demo user created:', userId)
    }

    // Ensure all roles exist
    const roles = ['client', 'contractor', 'admin']
    for (const role of roles) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: role
        }, {
          onConflict: 'user_id,role'
        })
      
      if (roleError) {
        console.error(`Error adding role ${role}:`, roleError)
      }
    }

    // Ensure client profile exists
    const { error: clientProfileError } = await supabase
      .from('client_profiles')
      .upsert({
        id: userId,
        email: demoEmail,
        company_name: 'テスト株式会社（発注者）',
        postal_code: '150-0001',
        prefecture: '東京都',
        address: '渋谷区神宮前1-1-1',
        phone: '03-1234-5678',
        representative: 'テスト太郎',
        company_description: 'デモ用の発注者アカウントです'
      }, {
        onConflict: 'id'
      })

    if (clientProfileError) {
      console.error('Error creating client profile:', clientProfileError)
    }

    // Ensure contractor profile exists
    const { error: contractorProfileError } = await supabase
      .from('contractor_profiles')
      .upsert({
        id: userId,
        email: demoEmail,
        company_name: 'テスト株式会社（受注者）',
        postal_code: '150-0001',
        prefecture: '東京都',
        address: '渋谷区神宮前1-1-1',
        phone: '03-1234-5678',
        representative: 'テスト太郎',
        company_description: 'デモ用の受注者アカウントです。足場工事を専門としています。',
        service_areas: ['東京都', '神奈川県', '埼玉県', '千葉県'],
        certifications: ['足場の組立て等作業主任者', '玉掛け技能講習'],
        has_legal_entity: true,
        has_construction_permit: true,
        has_invoice_support: true,
        has_social_insurance: true,
        has_safety_documents: true,
        employee_count: '10-29名',
        founded_year: '2010'
      }, {
        onConflict: 'id'
      })

    if (contractorProfileError) {
      console.error('Error creating contractor profile:', contractorProfileError)
    }

    // Create dummy LINE account to bypass LINE integration check
    const { error: lineAccountError } = await supabase
      .from('line_accounts')
      .upsert({
        user_id: userId,
        line_user_id: 'demo_line_user_' + userId.slice(0, 8),
        display_name: 'デモユーザー',
        is_notification_enabled: false,
        picture_url: null
      }, {
        onConflict: 'user_id'
      })

    if (lineAccountError) {
      console.error('Error creating LINE account:', lineAccountError)
    }

    // Create LINE notification settings
    const { error: notificationSettingsError } = await supabase
      .from('line_notification_settings')
      .upsert({
        user_id: userId,
        new_message: false,
        new_application: false,
        project_update: false,
        announcement: false,
        work_request: false,
        application_result: false,
        new_follower: false,
        new_review: false,
        new_project_in_area: false
      }, {
        onConflict: 'user_id'
      })

    if (notificationSettingsError) {
      console.error('Error creating notification settings:', notificationSettingsError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo account initialized successfully',
        userId: userId,
        email: demoEmail
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
