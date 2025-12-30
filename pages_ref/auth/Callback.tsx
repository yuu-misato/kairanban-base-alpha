import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/services/supabaseService';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

const Callback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { checkSession } = useAuth();
    const [status, setStatus] = useState('ログイン処理中...');
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [lineProfile, setLineProfile] = useState<any>(null);

    const processedRef = React.useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            // Prevent double execution in React Strict Mode
            if (processedRef.current) return;
            processedRef.current = true;

            const code = searchParams.get('code');
            const state = searchParams.get('state');

            if (!code || !state) {
                setError('不正なアクセスです (コードまたはステートが不足しています)');
                return;
            }

            try {
                // Determine correct redirect URI based on current location
                // This ensures it works for both localhost:8080 and production URLs
                const redirectUri = window.location.origin + '/auth/callback';

                logger.log('Processing callback with code in Callback.tsx...', { code, redirectUri });
                setStatus('サーバーと通信中...');

                const functionUrl = 'https://snbmfqsbrttfplefhsbl.supabase.co/functions/v1/line-login';

                const response = await fetch(functionUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'callback',
                        code,
                        redirect_uri: redirectUri
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    logger.error('Function Error Body:', errorText);
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

                    logger.log('Session verified, updating auth context...');
                    setStatus('ようこそ！');

                    // Safety net: Force redirect if session check hangs
                    const timer = setTimeout(() => {
                        console.warn('Force redirecting from callback...');
                        navigate('/dashboard', { replace: true });
                    }, 2000);

                    // CRITICAL: Supabase client session update
                    if (authData?.session) {
                        try {
                            await supabase.auth.setSession(authData.session);
                            await checkSession(authData.session);
                        } catch (sessionError) {
                            console.error("Session set error:", sessionError);
                            // Fallback to simpler check
                            await checkSession();
                        }
                    } else {
                        await checkSession();
                    }

                    clearTimeout(timer);
                    navigate('/dashboard', { replace: true });
                } else if (data?.status === 'new_user') {
                    setStatus('new_user');
                    setLineProfile(data.line_profile);
                } else if (data?.status === 'registered_automatically' || data?.status === 'existing_user') {
                    // Should be handled by token_hash above, but safety check
                    throw new Error('予期せぬレスポンス形式です (token_hash missing)');
                } else {
                    throw new Error('セッション情報が取得できませんでした');
                }
            } catch (err: any) {
                console.error('Login Callback Error:', err);
                // If "Email link is invalid" happens, it might mean the first attempt succeeded but navigating failed.
                // We could try to checkSession anyway just in case.
                if (err.message && (err.message.includes('invalid') || err.message.includes('expired'))) {
                    logger.log("Token invalid/expired - checking if session already exists...");
                    const { data } = await supabase.auth.getSession();
                    if (data.session) {
                        logger.log("Session actually exists! Recovering...");
                        await checkSession(data.session);
                        navigate('/dashboard', { replace: true });
                        return;
                    }
                }

                setError(err.message || 'ログインに失敗しました');
            }
        };

        handleCallback();
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !lineProfile) return;

        setStatus('登録処理中...');
        try {
            // DIRECT DEBUGGING
            const functionUrl = 'https://kykuokxmukjvlytufjtt.supabase.co/functions/v1/line-login';

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                    // CRITICAL: Explicitly set session to ensure persistence
                    await supabase.auth.setSession(authData.session);
                    await checkSession(authData.session);
                } else {
                    await checkSession();
                }
                navigate('/dashboard', { replace: true });
            } else {
                throw new Error('登録に失敗しました: セッションがありません');
            }

        } catch (err: any) {
            setError(err.message);
            setStatus('new_user'); // Revert to form
        }
    };

    // --- RENDER ---

    const renderLoading = () => (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white flex-col">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute top-0 left-0 w-16 h-16 flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                </div>
            </div>
            <p className="text-slate-600 font-medium mt-6 animate-pulse tracking-wide">{status}</p>
        </div>
    );

    const renderError = () => (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">ログインできませんでした</h2>
                    <div className="bg-red-50 text-red-600 text-sm p-4 rounded-lg mb-8 text-left break-all font-mono">
                        {error}
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            もう一度試す
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-3 px-4 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all hover:border-slate-300"
                        >
                            トップページへ戻る
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderNewUserForm = () => (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
                <div className="text-center mb-8">
                    <img
                        src={lineProfile?.picture_url}
                        alt="Profile"
                        className="w-24 h-24 rounded-full mx-auto mb-6 border-4 border-indigo-50 shadow-sm"
                    />
                    <h2 className="text-2xl font-bold text-slate-800">はじめまして！</h2>
                    <p className="text-slate-600 mt-2 font-medium">{lineProfile?.display_name}さん</p>
                    <p className="text-slate-500 text-sm mt-2">アカウント作成のために<br />メールアドレスを入力してください</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">メールアドレス</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 bg-slate-50 focus:bg-white"
                            placeholder="name@example.com"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-[#00B900] hover:bg-[#00A000] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-md flex items-center justify-center gap-2"
                    >
                        <span>アカウントを作成してログイン</span>
                    </button>
                </form>
            </div>
        </div>
    );

    if (error) return renderError();
    if (status === 'new_user' && lineProfile) return renderNewUserForm();
    return renderLoading();
};

export default Callback;
