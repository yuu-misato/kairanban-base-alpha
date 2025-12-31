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
        // 1. Handle Code (Forward to Edge Function)
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (code) {
            setStatus('認証サーバーへ転送しています...');
            const callbackUrl = `${window.location.origin}/auth/callback`;
            const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/line-login`;

            const targetUrl = new URL(edgeFunctionUrl);
            targetUrl.searchParams.set('code', code);
            if (state) targetUrl.searchParams.set('state', state);
            targetUrl.searchParams.set('redirect_uri', callbackUrl);

            console.log('Forwarding to Edge Function:', targetUrl.toString());
            window.location.replace(targetUrl.toString());
            return;
        }

        // 2. Handle Session (Return from Edge Function/Supabase)
        setStatus('セッションを確認中...');

        // Listener for Auth State Change (Reliable for Magic Links/Hash params)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("[AuthCallback] Auth Event:", event);
            if (event === 'SIGNED_IN' || session) {
                setStatus('ログイン成功！ダッシュボードへ移動します...');
                // Short delay to ensure local storage persists
                setTimeout(() => router.replace('/dashboard'), 100);
            }
        });

        // Initial check in case state is already settled
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                console.log("[AuthCallback] Session found immediately");
                router.replace('/dashboard');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
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
