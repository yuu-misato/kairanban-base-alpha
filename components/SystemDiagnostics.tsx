
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SystemDiagnostics: React.FC = () => {
    const [results, setResults] = useState<any>({});
    const [status, setStatus] = useState<'running' | 'done'>('running');
    const [isOpen, setIsOpen] = useState(true);

    const runDiagnostics = async () => {
        setStatus('running');
        const res: any = {};

        // 1. Environment Variables Check
        res.env = {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING',
            urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL,
            key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MISSING',
            keyLen: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        };

        // 2. Auth Session Check
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            res.auth = {
                ok: !error,
                user: session?.user ? 'LOGGED_IN' : 'NO_USER',
                userId: session?.user?.id,
                error: error?.message
            };
        } catch (e: any) {
            res.auth = { ok: false, error: e.message };
        }

        // 3. Database Connection & Read Check (Profiles)
        try {
            // Just try to read one profile to check connection
            const { data, error, status } = await supabase
                .from('profiles' as any)
                .select('id')
                .limit(1);

            res.dbRead = {
                ok: !error,
                status,
                error: error?.message,
                dataLength: data?.length
            };
        } catch (e: any) {
            console.error('Diagnostic DB Error:', e);
            // エラーオブジェクトを丸ごと文字列化して保存
            res.dbRead = { ok: false, error: JSON.stringify(e, Object.getOwnPropertyNames(e)) };
        }

        setResults(res);
        setStatus('done');
    };

    useEffect(() => {
        runDiagnostics();
    }, []);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg z-[9999] font-bold text-xs"
            >
                システム診断を表示
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl p-6 font-mono text-sm">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">🛠 システム接続診断レポート</h2>
                    <div className="flex gap-2">
                        <button onClick={runDiagnostics} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">再テスト</button>
                        <button onClick={() => setIsOpen(false)} className="px-3 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200">閉じる</button>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Environment Variables */}
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h3 className="font-bold mb-2 flex items-center gap-2">
                            1. 環境変数 (Amplify設定)
                            {results.env?.url === 'OK' && results.env?.key === 'OK'
                                ? <span className="text-green-600">✅ OK</span>
                                : <span className="text-red-600">❌ NG</span>}
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-slate-500">NEXT_PUBLIC_SUPABASE_URL:</div>
                            <div className={results.env?.url === 'OK' ? "text-green-700 font-bold break-all" : "text-red-600 font-bold"}>
                                {results.env?.urlValue || '未設定 (undefined)'}
                            </div>
                            <div className="text-slate-500">NEXT_PUBLIC_SUPABASE_ANON_KEY:</div>
                            <div className={results.env?.key === 'OK' ? "text-green-700 font-bold" : "text-red-600 font-bold"}>
                                {results.env?.key === 'OK' ? `設定済み (長さ: ${results.env.keyLen})` : '未設定 (undefined)'}
                            </div>
                        </div>
                        {results.env?.url !== 'OK' && (
                            <p className="mt-2 text-red-600 text-xs bg-red-50 p-2 rounded">
                                ⚠️ 環境変数が読み込めていません。Amplifyのビルド設定を確認してください。
                            </p>
                        )}
                    </div>

                    {/* Authentication */}
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h3 className="font-bold mb-2 flex items-center gap-2">
                            2. 認証セッション (Auth)
                            {results.auth?.ok
                                ? <span className="text-green-600">✅ OK ({results.auth.user})</span>
                                : <span className="text-red-600">❌ Error</span>}
                        </h3>
                        <div className="text-xs">
                            {results.auth?.error ? (
                                <p className="text-red-600 font-bold">Error: {results.auth.error}</p>
                            ) : (
                                <p className="text-slate-600">User ID: {results.auth?.userId || 'None'}</p>
                            )}
                        </div>
                    </div>

                    {/* Database Connection */}
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h3 className="font-bold mb-2 flex items-center gap-2">
                            3. データベース接続 (DB Connection)
                            {results.dbRead?.ok
                                ? <span className="text-green-600">✅ OK</span>
                                : <span className="text-red-600">❌ Error</span>}
                        </h3>
                        <div className="text-xs space-y-1">
                            {results.dbRead?.ok ? (
                                <>
                                    <p className="text-green-700">接続成功 (Status: {results.dbRead.status})</p>
                                    <p className="text-slate-600">取得データ数: {results.dbRead.dataLength}</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-red-600 font-bold mb-1">接続失敗: {results.dbRead?.error || 'Unknown Error'}</p>
                                    <p className="text-xs text-slate-400 break-all">{JSON.stringify(results.dbRead)}</p>
                                    <p className="text-slate-500">
                                        考えられる原因:<br />
                                        ・環境変数のURLが間違っている<br />
                                        ・Supabaseプロジェクトが停止(Paused)している<br />
                                        ・RLSポリシーによりブロックされている
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
                    この画面はデバッグ用です。問題が解決したら削除されます。
                </div>
            </div>
        </div>
    );
};

export default SystemDiagnostics;
