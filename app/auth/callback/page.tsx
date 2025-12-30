'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/services/supabaseService';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

const CallbackContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { checkSession } = useAuth();
    const [status, setStatus] = useState('ログイン処理中...');
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [lineProfile, setLineProfile] = useState<any>(null);

    const processedRef = React.useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            if (processedRef.current) return;
            processedRef.current = true;

            const code = searchParams.get('code');
            const state = searchParams.get('state');

            if (!code || !state) {
                setError('不正なアクセスです (コードまたはステートが不足しています)');
                return;
            }

            try {
                const redirectUri = window.location.origin + '/auth/callback';
                logger.log('Processing callback...', { code, redirectUri });
                setStatus('サーバーと通信中...');

                const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/line-login`;

                const response = await fetch(functionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify({
                        action: 'callback',
                        code,
                        redirect_uri: redirectUri
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`サーバーエラー (${response.status}): ${errorText}`);
                }

                setStatus('最終確認中...');
                const data = await response.json();

                if (data?.error) throw new Error(data.error);

                if (data?.token_hash) {
                    setStatus('ログインの仕上げをしています...');
                    const { data: authData, error: otpError } = await supabase.auth.verifyOtp({
                        token_hash: data.token_hash,
                        type: 'magiclink'
                    });

                    if (otpError) throw otpError;

                    setStatus('ようこそ！');

                    try {
                        if (authData?.session) {
                            const { error: sessionError } = await supabase.auth.setSession(authData.session);
                            if (sessionError) console.error('Set session error:', sessionError);
                            // Do not await checkSession here to avoid hanging. 
                            // useAuth's onAuthStateChange listener will pick up the new session.
                        }
                    } catch (e) {
                        console.error('Session handling error:', e);
                    }

                    // Ensure navigation happens
                    logger.log('Navigating to dashboard...');
                    router.replace('/dashboard');
                    // Fallback if router fails
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1000);
                } else if (data?.status === 'new_user') {
                    setStatus('new_user');
                    setLineProfile(data.line_profile);
                } else {
                    throw new Error('予期せぬレスポンス形式です');
                }
            } catch (err: any) {
                console.error('Login Callback Error:', err);
                setError(err.message || 'ログインに失敗しました');
            }
        };

        handleCallback();
    }, [searchParams, router, checkSession]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !lineProfile) return;

        setStatus('登録処理中...');
        try {
            const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/line-login`;

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    action: 'register',
                    profile_data: {
                        email,
                        line_user_id: lineProfile.line_user_id,
                        display_name: lineProfile.display_name,
                        picture_url: lineProfile.picture_url,
                        nickname: lineProfile.display_name,
                        area: '未設定'
                    }
                })
            });

            if (!response.ok) {
                const txt = await response.text();
                throw new Error(`登録エラー: ${txt}`);
            }
            const data = await response.json();

            if (data?.error) throw new Error(data.error);

            if (data?.token_hash) {
                const { data: authData, error: otpError } = await supabase.auth.verifyOtp({
                    token_hash: data.token_hash,
                    type: 'magiclink'
                });
                if (otpError) throw otpError;

                if (authData?.session) {
                    await supabase.auth.setSession(authData.session);
                    await checkSession(authData.session);
                } else {
                    await checkSession();
                }

                router.replace('/dashboard');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                throw new Error('登録に失敗しました: セッションがありません');
            }

        } catch (err: any) {
            setError(err.message);
            setStatus('new_user');
        }
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="p-8 text-center bg-white rounded-2xl shadow-xl">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Login Failed</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button onClick={() => router.push('/')} className="px-4 py-2 bg-indigo-600 text-white rounded">Back to Top</button>
                </div>
            </div>
        );
    }

    if (status === 'new_user' && lineProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
                    <div className="text-center mb-8">
                        <img src={lineProfile.picture_url} alt="Profile" className="w-24 h-24 rounded-full mx-auto mb-6" />
                        <h2 className="text-2xl font-bold">Welcome, {lineProfile.display_name}</h2>
                        <p className="text-slate-500">Please enter your email to complete registration.</p>
                    </div>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded" placeholder="Email" />
                        <button type="submit" className="w-full bg-green-600 text-white py-3 rounded font-bold">Register</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-indigo-50">
            <div className="text-center">
                <div className="text-xl font-bold text-indigo-700 animate-pulse">{status}</div>
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
