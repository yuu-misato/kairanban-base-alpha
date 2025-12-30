
import React, { useState, useEffect } from 'react';
import { supabase, getProfile } from '@/services/supabaseService';

const DebugPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [localData, setLocalData] = useState<any>(null);
    const [dbData, setDbData] = useState<any>(null);
    const [dbError, setDbError] = useState<string>('');
    const [authSession, setAuthSession] = useState<any>(null);

    const checkStatus = async () => {
        // 1. LocalStorage
        const userId = localStorage.getItem('saitama_user_id');
        const profile = localStorage.getItem('saitama_user_profile');
        setLocalData({
            id: userId,
            profile: profile ? JSON.parse(profile) : 'Not Found',
            nickname: localStorage.getItem('saitama_user_nickname')
        });

        // 2. Supabase Session
        const { data: { session } } = await supabase.auth.getSession();
        setAuthSession(session ? { user_id: session.user.id, email: session.user.email } : 'No Session');

        // 3. DB Profile
        if (userId) {
            const { data, error } = await getProfile(userId);
            if (data) setDbData(data);
            else setDbData('Not found in DB');

            if (error) setDbError(JSON.stringify(error));
            else setDbError('');
        }
    };

    useEffect(() => {
        if (isOpen) checkStatus();
    }, [isOpen]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 left-4 z-[9999] bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-50 hover:opacity-100"
            >
                Debug
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 left-4 z-[9999] w-80 max-h-[80vh] overflow-auto bg-black/90 text-green-400 p-4 rounded-lg text-xs font-mono border border-green-500 shadow-2xl">
            <div className="flex justify-between items-center mb-2 border-b border-green-700 pb-1">
                <span className="font-bold">System Diagnostics</span>
                <button onClick={() => setIsOpen(false)} className="text-white hover:text-red-400">Close</button>
            </div>

            <div className="mb-4">
                <h4 className="text-white font-bold mb-1">[1] LocalStorage (Browser)</h4>
                <pre>{JSON.stringify(localData, null, 2)}</pre>
            </div>

            <div className="mb-4">
                <h4 className="text-white font-bold mb-1">[2] Supabase Session (Auth)</h4>
                <pre>{JSON.stringify(authSession, null, 2)}</pre>
            </div>

            <div className="mb-4">
                <h4 className="text-white font-bold mb-1">[3] Database Profile (Server)</h4>
                {dbData === 'Not found in DB' ? (
                    <div className="text-red-400 font-bold">⚠️ NOT SAVED IN DB</div>
                ) : (
                    <pre>{JSON.stringify(dbData, null, 2)}</pre>
                )}
                {dbError && <div className="text-red-500 mt-1">Error: {dbError}</div>}
            </div>

            <button
                onClick={checkStatus}
                className="w-full bg-green-900/50 hover:bg-green-800 text-white py-1 rounded border border-green-700"
            >
                Refresh Data
            </button>
        </div>
    );
};

export default DebugPanel;
