import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // 0. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {


        const LINE_LOGIN_CHANNEL_ID = Deno.env.get('LINE_CHANNEL_ID') ?? Deno.env.get('LINE_LOGIN_CHANNEL_ID');
        const LINE_LOGIN_CHANNEL_SECRET = Deno.env.get('LINE_CHANNEL_SECRET') ?? Deno.env.get('LINE_LOGIN_CHANNEL_SECRET');
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('VITE_SUPABASE_URL'); // Sometimes injected differently
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY');

        if (!LINE_LOGIN_CHANNEL_ID || !LINE_LOGIN_CHANNEL_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Missing config:", {
                hasId: !!LINE_LOGIN_CHANNEL_ID,
                hasSecret: !!LINE_LOGIN_CHANNEL_SECRET,
                hasUrl: !!SUPABASE_URL,
                hasKey: !!SUPABASE_SERVICE_ROLE_KEY
            });
            throw new Error('Server configuration error: Missing credentials');
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Unified Input Parsing (GET vs POST)
        let action, code, redirect_uri, line_user_id, display_name, picture_url, email, nickname;

        const reqUrl = new URL(req.url);

        if (req.method === 'GET') {
            // Handle Direct Browser Redirect
            const params = reqUrl.searchParams;
            code = params.get('code');
            // 'action' param or infer from code
            if (params.get('action')) {
                action = params.get('action');
            } else if (code) {
                action = 'callback';
                console.log("Action inferred as 'callback'. Code:", code?.substring(0, 5) + "...");
            } else {
                action = 'health'; // Default to health check/info
                console.log("Defaulting to 'health' action. Params:", [...params.keys()]);
            }

            redirect_uri = params.get('redirect_uri') || params.get('redirectUri');

            // For other params if needed
            line_user_id = params.get('line_user_id');
        } else {
            // Handle POST JSON
            let body;
            try {
                body = await req.json();
            } catch (e) {
                throw new Error('Invalid JSON body');
            }
            action = body.action;
            code = body.code;
            redirect_uri = body.redirect_uri || body.redirectUri;
            const dashboard_url = body.dashboard_url; // New parameter
            line_user_id = body.line_user_id;
            display_name = body.display_name;
            picture_url = body.picture_url;
            // Profile data might be nested
            if (body.profile_data) {
                email = body.profile_data.email;
                nickname = body.profile_data.nickname;
            }
        }

        // 1. Health Check
        if (action === 'health') {
            return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 2. Generate Auth URL
        if (action === 'get_auth_url') {
            const authState = crypto.randomUUID();
            const authUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('client_id', LINE_LOGIN_CHANNEL_ID);
            authUrl.searchParams.set('redirect_uri', redirect_uri);
            authUrl.searchParams.set('state', authState);
            authUrl.searchParams.set('scope', 'profile openid email');
            // Force bot friendship prompt
            authUrl.searchParams.set('bot_prompt', 'aggressive');

            return new Response(
                JSON.stringify({ auth_url: authUrl.toString(), state: authState }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Helper to send LINE message
        const sendWelcomeMessage = async (userId: string, displayName: string) => {
            // Skip if no channel access token (dev mode safety)
            const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
            const appUrl = Deno.env.get('APP_URL') || 'https://kairanban-base.com';

            if (!accessToken || !userId) return;

            try {
                await fetch('https://api.line.me/v2/bot/message/push', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({
                        to: userId,
                        messages: [
                            {
                                type: "flex",
                                altText: "回覧板BASEへようこそ！",
                                contents: {
                                    type: "bubble",
                                    body: {
                                        type: "box",
                                        layout: "vertical",
                                        contents: [
                                            {
                                                type: "text",
                                                text: "🎉 登録ありがとうございます！",
                                                weight: "bold",
                                                size: "md",
                                                color: "#1DB446"
                                            },
                                            {
                                                type: "text",
                                                text: `${displayName}さん、回覧板BASEへようこそ。\n地域の情報がここに届きます。`,
                                                wrap: true,
                                                size: "sm",
                                                margin: "md",
                                                color: "#666666"
                                            }
                                        ]
                                    },
                                    footer: {
                                        type: "box",
                                        layout: "vertical",
                                        contents: [
                                            {
                                                type: "button",
                                                action: {
                                                    type: "uri",
                                                    label: "アプリを開く",
                                                    uri: appUrl
                                                },
                                                style: "primary",
                                                color: "#1DB446"
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    })
                });
            } catch (e) {
                console.error("Failed to send welcome message:", e);
            }
        };

        // 3. Callback Processing
        if (action === 'callback') {
            if (!code || !redirect_uri) {
                throw new Error("Missing 'code' or 'redirect_uri' in payload");
            }

            console.log("Exchanging token...", "Code present", "URI:", redirect_uri, "ID:", LINE_LOGIN_CHANNEL_ID);

            const tokenParams = new URLSearchParams();
            tokenParams.append('grant_type', 'authorization_code');
            tokenParams.append('code', code);
            tokenParams.append('redirect_uri', redirect_uri);
            tokenParams.append('client_id', LINE_LOGIN_CHANNEL_ID);
            tokenParams.append('client_secret', LINE_LOGIN_CHANNEL_SECRET);

            const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: tokenParams,
            });

            if (!tokenResponse.ok) {
                const errText = await tokenResponse.text();
                console.error("LINE Token Error Body:", errText);
                throw new Error(`LINE Token Exchange Failed: ${tokenResponse.status} ${tokenResponse.statusText} - ${errText}`);
            }

            const tokenData = await tokenResponse.json();
            const { id_token, access_token } = tokenData;

            // Get Profile (Standard)
            const profileResponse = await fetch('https://api.line.me/v2/profile', {
                headers: { Authorization: `Bearer ${access_token}` },
            });

            if (!profileResponse.ok) {
                throw new Error('Failed to fetch LINE profile');
            }

            const lineProfile = await profileResponse.json();

            // Try to get Email from ID Token
            let userEmail: string | null = null;
            if (id_token) {
                try {
                    const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            id_token,
                            client_id: LINE_LOGIN_CHANNEL_ID
                        })
                    });

                    if (verifyResponse.ok) {
                        const params = await verifyResponse.json();
                        if (params.email) {
                            userEmail = params.email;
                            console.log("Email retrieved from LINE:", userEmail);
                        }
                    } else {
                        console.warn("ID Token verification failed, skipping email auto-fill.");
                    }
                } catch (e) {
                    console.error("Error verifying ID Token:", e);
                }
            }

            // Check existing link
            const { data: lineAccount } = await supabase
                .from('line_accounts')
                .select('user_id')
                .eq('line_user_id', lineProfile.userId)
                .maybeSingle();

            if (lineAccount) {
                const { data: user } = await supabase.auth.admin.getUserById(lineAccount.user_id);
                if (!user || !user.user) {
                    // Attempt linking fallback if we have email
                    console.error("Linked user found but Auth User missing.");
                } else {
                    const { data: link, error: linkGenError } = await supabase.auth.admin.generateLink({
                        type: 'magiclink',
                        email: user.user.email!,
                        options: { redirectTo: dashboard_url || redirect_uri }
                    });

                    if (linkGenError || !link?.properties?.action_link) {
                        throw new Error('Failed to generate auth link for existing user');
                    }

                    // Update
                    await supabase.from('line_accounts').update({
                        display_name: lineProfile.displayName,
                        picture_url: lineProfile.pictureUrl,
                        updated_at: new Date().toISOString()
                    }).eq('line_user_id', lineProfile.userId);

                    return new Response(JSON.stringify({
                        action_link: link.properties.action_link
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
            }

            // If No Link but Email Present -> Auto Register
            // FORCE AUTO REGISTRATION: If email missing, use placeholder to skip manual input
            const emailToUse = userEmail || `${lineProfile.userId}@line.login.dummy`; // Fallback to dummy email to skip UI

            if (emailToUse) {
                console.log("Proceeding with Auto-Registration/Link using:", emailToUse);

                let userId;
                const randomPassword = crypto.randomUUID();

                // Try creating user (or fail if exists)
                const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                    email: emailToUse,
                    password: randomPassword,
                    email_confirm: true,
                    user_metadata: {
                        nickname: lineProfile.displayName,
                        avatar_url: lineProfile.pictureUrl,
                        is_line_placeholder_email: !userEmail // Flag for future reference
                    }
                });

                if (authError) {
                    // Check if user exists to link
                    if (authError.message?.includes('already been registered') || authError.status === 422 || authError.code === 'email_exists') {
                        console.log("User email exists, attempting linkage for:", emailToUse);
                        const { data: userLinkData } = await supabase.auth.admin.generateLink({
                            type: 'magiclink',
                            email: emailToUse
                        });
                        if (userLinkData?.user) {
                            userId = userLinkData.user.id;
                        } else {
                            throw new Error("Could not find existing user to link.");
                        }
                    } else {
                        throw authError; // Real error
                    }
                } else {
                    userId = authData.user.id;
                    // SEND WELCOME MESSAGE IF NEW USER
                    await sendWelcomeMessage(lineProfile.userId, lineProfile.displayName);
                }

                // Create LINE Link
                const { error: insertError } = await supabase.from('line_accounts').upsert({
                    user_id: userId,
                    line_user_id: lineProfile.userId,
                    display_name: lineProfile.displayName,
                    picture_url: lineProfile.pictureUrl,
                    is_notification_enabled: true,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id, line_user_id' });

                if (insertError) throw insertError;

                // Generate Session Link
                const { data: link, error: linkGenError } = await supabase.auth.admin.generateLink({
                    type: 'magiclink',
                    email: emailToUse,
                    options: {
                        redirectTo: dashboard_url || redirect_uri
                    }
                });

                if (linkGenError || !link?.properties?.action_link) {
                    throw new Error('Failed to generate auth link');
                }

                // Redirect user to Supabase Auth Verify URL
                // This forces the browser to set cookies/session via standard flow
                console.log("Returning action link (JSON):", link.properties.action_link);
                return new Response(JSON.stringify({
                    action_link: link.properties.action_link
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // 6. Register (Manual Fallback)
        if (action === 'register') {
            const { email, line_user_id, display_name, picture_url, nickname } = profile_data;
            const randomPassword = crypto.randomUUID();

            let userId;

            // Try to create user first
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                password: randomPassword,
                email_confirm: true,
                user_metadata: { nickname, avatar_url: picture_url }
            });

            if (authError) {
                if (authError.message?.includes('already been registered') || authError.status === 422 || authError.code === 'email_exists') {
                    // User exists, allow linking
                    console.log("User email exists, attempting linkage for:", email);
                    const { data: userLinkData, error: linkError } = await supabase.auth.admin.generateLink({
                        type: 'magiclink',
                        email
                    });

                    if (linkError || !userLinkData.user) {
                        throw new Error("Could not verify existing user for linking.");
                    }
                    userId = userLinkData.user.id;

                    const { data: existingLineParams } = await supabase.from('line_accounts').select('user_id').eq('line_user_id', line_user_id).maybeSingle();
                    if (existingLineParams && existingLineParams.user_id !== userId) {
                        throw new Error('This LINE account is already linked to another user.');
                    }
                } else {
                    throw authError; // Real error
                }
            } else {
                userId = authData.user.id;
            }

            // Link LINE account
            const { error: upsertError } = await supabase.from('line_accounts').upsert({
                user_id: userId,
                line_user_id,
                display_name,
                picture_url,
                is_notification_enabled: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, line_user_id' });

            if (upsertError) throw new Error("Failed to link LINE account.");

            // Generate session link
            const { data: link } = await supabase.auth.admin.generateLink({
                type: 'magiclink',
                email
            });

            return new Response(JSON.stringify({
                token_hash: link.properties?.hashed_token,
                status: 'registered'
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Auto Restore handling
        if (action === 'auto_restore') {
            const { data: lineAccount } = await supabase.from('line_accounts').select('user_id').eq('line_user_id', line_user_id).maybeSingle();
            if (!lineAccount) {
                return new Response(JSON.stringify({ error: 'restore_failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            const { data: user } = await supabase.auth.admin.getUserById(lineAccount.user_id);
            const { data: link } = await supabase.auth.admin.generateLink({
                type: 'magiclink',
                email: user.user?.email!,
            });
            return new Response(JSON.stringify({
                token_hash: link.properties?.hashed_token,
                email: user.user?.email
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 200, headers: corsHeaders });

    } catch (error: any) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({ error: error.message || 'Unknown server error' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
