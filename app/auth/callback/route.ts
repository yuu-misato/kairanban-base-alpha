
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    console.log('[Auth Callback API] Hit');
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const state = requestUrl.searchParams.get('state');

    // Determine correct origin (handle proxy/Amplify)
    const protocol = request.headers.get('x-forwarded-proto') || requestUrl.protocol.replace(':', '');
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || requestUrl.host;
    const origin = `${protocol}://${host}`;

    // If no code, maybe an error or direct access -> redirect home
    if (!code) {
        console.error('[Auth Callback API] No code provided. Redirecting to home.');
        return NextResponse.redirect(`${origin}/`);
    }

    try {
        // Prepare payload for Edge Function
        // Using the same URL that LINE called us on as redirect_uri
        const redirect_uri = `${origin}/auth/callback`;
        const dashboard_url = `${origin}/dashboard`;
        const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/line-login`;

        console.log('[Auth Callback API] Calling Edge Function:', edgeFunctionUrl);

        // We use POST here to send data securely
        // Note: Edge Function handles both GET and POST, but we tailored it to accept JSON POST
        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // If needed, we can add Authorization header for security, usually Anon Key
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                code,
                state,
                redirect_uri,
                dashboard_url,
                action: 'callback' // Explicitly state action for Edge Function
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Edge Function failed: ${response.status} ${errorText}`);
        }

        const data = await response.json();

        if (data.action_link) {
            console.log('[Auth Callback API] Received action_link. Redirecting...');
            // Redirect to Supabase Verify URL -> Then to Dashboard
            return NextResponse.redirect(data.action_link);
        } else {
            throw new Error('No action_link returned from Edge Function');
        }

    } catch (error) {
        console.error('[Auth Callback API] Error during authentication:', error);
        // On error, redirect to login with error message or home
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        // Encode error to be URL safe
        const encodedError = encodeURIComponent(errorMessage);
        return NextResponse.redirect(`${origin}/?error=auth_failed&details=${encodedError}`);
    }
}
