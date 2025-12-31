'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/services/supabaseService';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

const CallbackContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState('サーバーへ転送中...');
    const [error, setError] = useState<string | null>(null);

    // We no longer need to check session manually or fetch from Edge Function here.
    // We simply redirect the browser to the Edge Function.

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state');

            // If query params contain 'code', it's a callback from LINE
            if (code) {
                setStatus('認証サーバーへ転送しています...');
                // The redirect_uri passed to LINE token exchange MUST match the original callback URL exactly.
                const callbackUrl = `${window.location.origin}/auth/callback`;
                const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/line-login`;

                // Construct Redirect URL with params for the Edge Function (GET request)
                const targetUrl = new URL(edgeFunctionUrl);
                targetUrl.searchParams.set('code', code);
                if (state) targetUrl.searchParams.set('state', state);
                targetUrl.searchParams.set('redirect_uri', callbackUrl);

                console.log('Forwarding to Edge Function:', targetUrl.toString());
                window.location.replace(targetUrl.toString());
                return;
            }

            // If we land here WITHOUT code, check if we have a session hash (from Supabase Verify redirect)
            // supabase-js handles hash parsing automatically via onAuthStateChange.
            // So we just wait or redirect to dashboard if user is already present as a fail-safe.
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.replace('/dashboard');
            } else {
                // No code, no session -> Home
                // But wait, allow a moment for onAuthStateChange to fire?
                // No, getSession is enough.
                // router.replace('/');
            }
        };

        handleCallback();
    }, [searchParams, router]);

    // Simplified Render: purely a redirect step
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="p-8 text-center bg-white rounded-2xl shadow-xl">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Login Redirect Failed</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button onClick={() => router.push('/')} className="px-4 py-2 bg-indigo-600 text-white rounded">Back to Top</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-indigo-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-xl font-bold text-indigo-700 animate-pulse">{status}</div>
                <p className="text-sm text-slate-500 mt-2">Security check in progress...</p>
            </div>
        </div>
    );
};

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CallbackContent />
        </Suspense>
    );
}
