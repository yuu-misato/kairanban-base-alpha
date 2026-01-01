import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Hardcoded for diagnostic isolation - This ensures connectivity test is independent of app configuration
const DIAG_URL = 'https://kypnapwqarggnamgeeza.supabase.co';
const DIAG_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5cG5hcHdxYXJnZ25hbWdlZXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMTUyNjQsImV4cCI6MjA4MjU5MTI2NH0.MrFwusYFroZoXcy-9BnkKbqeKRJEMPOlcmlSte_OXDc';

const SystemDiagnostics: React.FC = () => {
    const [results, setResults] = useState<any>({});
    const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
    const [isOpen, setIsOpen] = useState(false);

    const runDiagnostics = async () => {
        setStatus('running');
        const res: any = {};

        // 1. Environment Variables Check (Simulated)
        res.env = {
            url: 'Check below',
            anonKey: 'Check below',
            urlValue: DIAG_URL,
            keyValue: '***' + DIAG_KEY.slice(-6)
        };

        // 2. Database Connection Check (Isolated Client)
        // This client has NO persistent auth, no auto-refresh, no auto-detect. Pure HTTP client.
        try {
            console.log('--- DIAGNOSTIC: Creating Isolated Client ---');
            const isolatedSupabase = createClient(DIAG_URL, DIAG_KEY, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            });

            console.log('--- DIAGNOSTIC: Sending Request ---');
            const start = performance.now();

            // Timeout safety for diagnostic request
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Diagnostic Request Timed Out (5000ms)')), 5000)
            );

            // Fetch generic public data or just check connection
            const dbPromise = isolatedSupabase
                .from('profiles')
                .select('id')
                .limit(1);

            const result: any = await Promise.race([dbPromise, timeoutPromise]);
            const { data, error } = result;
            const end = performance.now();

            console.log('--- DIAGNOSTIC RESULT ---', result);

            if (error) {
                res.dbRead = { ok: false, error: JSON.stringify(error) || 'Unknown Error (Empty Object)' };
            } else {
                res.dbRead = { ok: true, dataLength: data?.length, duration: (end - start).toFixed(0) + 'ms' };
            }
        } catch (e: any) {
            console.error('--- DIAGNOSTIC EXCEPTION ---', e);
            res.dbRead = {
                ok: false,
                error: (e instanceof Error ? e.message : JSON.stringify(e)) || 'Exception caught'
            };
        }

        setResults(res);
        setStatus('done');
    };

    useEffect(() => {
        runDiagnostics();
    }, []);

    if (!isOpen) return <button onClick={() => setIsOpen(true)} className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded text-xs opacity-50 hover:opacity-100 z-50">Debug</button>;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">🛠 システム接続診断 (Isolated Mode)</h2>
                    <div className="space-x-2">
                        <button onClick={runDiagnostics} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">再テスト</button>
                        <button onClick={() => setIsOpen(false)} className="px-3 py-1 text-slate-500 hover:text-slate-700">閉じる</button>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* DB Connection Result */}
                    <div className={`p-4 rounded border ${results.dbRead?.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-lg">データベース接続試験</span>
                            {status === 'running' && <span className="animate-spin">⏳</span>}
                            {status === 'done' && (results.dbRead?.ok ? <span className="text-green-600 font-bold">✅ OK - 成功！</span> : <span className="text-red-600 font-bold">❌ Error - 失敗</span>)}
                        </div>

                        {!results.dbRead ? (
                            <p className="text-slate-500">テスト中...</p>
                        ) : results.dbRead.ok ? (
                            <p className="text-green-700">
                                接続成功 (応答時間: {results.dbRead.duration})<br />
                                <span className="text-xs">データ取得も正常にできています。Supabaseとの通信は正常です。</span>
                            </p>
                        ) : (
                            <div>
                                <p className="text-red-700 font-bold break-all">{results.dbRead.error}</p>
                                <p className="text-xs text-red-500 mt-2">
                                    ↑このエラーが原因の全てです。<br />
                                    もし "Failed to fetch" なら、SupabaseのURL設定(CORS)を見直してください。
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-slate-400 mt-4 border-t pt-4">
                        Mode: Isolated Client (No Global Auth) | Target: {DIAG_URL}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemDiagnostics;
