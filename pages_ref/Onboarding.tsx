import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { createProfile } from '../services/supabaseService';
import { Button } from '../components/ui/Button';

const Onboarding: React.FC = () => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [nickname, setNickname] = useState(user?.nickname || '');
    const [selectedAreas, setSelectedAreas] = useState<string[]>(['三郷市']);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Restore pre-registration data from LP
        const pending = localStorage.getItem('pendingRegistration');
        if (pending) {
            try {
                const { nickname: pendingNick, areas } = JSON.parse(pending);
                if (pendingNick && !nickname) setNickname(pendingNick);
                if (areas && Array.isArray(areas) && areas.length > 0) setSelectedAreas(areas);

                // Clear it so it doesn't persist forever? 
                // Maybe keep it until success.
            } catch (e) {
                console.error('Failed to parse pending registration', e);
            }
        }
    }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

    const handleComplete = async () => {
        if (!user || !nickname) return;
        setIsSubmitting(true);

        try {
            // Minimal initial profile
            const updatedUser = {
                ...user,
                nickname,
                selectedAreas,
                isVerified: true
            };

            console.log('Attempting to create profile for:', user.id);
            const { error } = await createProfile(updatedUser);

            if (error) {
                throw error;
            }

            console.log('Profile created, redirecting...');
            setUser(updatedUser);
            // Add a slight delay for the user to verify the "completion"
            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 500);
        } catch (error: any) {
            console.error('Onboarding Error:', error);
            alert(`設定の保存に失敗しました。\n${error.message || 'ネットワーク接続を確認してください。'}`);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-700 font-sans">
            <div className="max-w-sm w-full space-y-10">
                <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[2rem] mx-auto shadow-2xl shadow-emerald-200 flex items-center justify-center mb-8 transform hover:scale-105 transition-transform duration-500">
                        <i className="fas fa-leaf text-4xl text-white"></i>
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Hello.</h1>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        回覧板BASEへようこそ。<br />
                        あなたのニックネームを教えてください。
                    </p>
                </div>

                {selectedAreas.length > 0 && (
                    <div className="text-center mb-4">
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            {selectedAreas[0]}{selectedAreas.length > 1 ? ` 他${selectedAreas.length - 1}件` : ''}
                        </span>
                    </div>
                )}

                <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 transition-all focus-within:ring-4 focus-within:ring-emerald-100 focus-within:border-emerald-500">
                    <input
                        type="text"
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                        className="w-full bg-transparent border-0 rounded-xl px-6 py-4 font-bold text-lg text-slate-800 focus:ring-0 placeholder:text-slate-300 text-center"
                        placeholder="ニックネームを入力"
                        autoFocus
                    />
                </div>

                <div className="pt-4">
                    <Button
                        onClick={handleComplete}
                        disabled={!nickname || isSubmitting}
                        className="w-full shadow-2xl shadow-emerald-200/50 py-4 text-lg rounded-2xl"
                        size="lg"
                        isLoading={isSubmitting}
                    >
                        はじめる
                    </Button>
                    <p className="text-center text-xs text-slate-300 font-bold mt-6 tracking-widest uppercase">
                        Simple & Secure
                    </p>
                </div>
            </div>
        </div>
    );
}
export default Onboarding;
