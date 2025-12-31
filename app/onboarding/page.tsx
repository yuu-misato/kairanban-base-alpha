'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AreaSelector from '@/components/AreaSelector';
import { createProfile } from '@/services/authService';

export default function OnboardingPage() {
    const { user, setUser, isLoading } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [nickname, setNickname] = useState('');
    const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/');
        } else if (user) {
            setNickname(user.nickname === '名無し' ? '' : user.nickname);
            if (user.selectedAreas && user.selectedAreas.length > 0) {
                // If already set, maybe redirect to dashboard?
                // But user might be here to change it.
                setSelectedAreas(user.selectedAreas);
            }
        }
    }, [user, isLoading, router]);


    const handleComplete = async () => {
        if (!user) return;
        setIsSubmitting(true);

        const updatedUser = {
            ...user,
            nickname: nickname || user.nickname,
            selectedAreas: selectedAreas
        };

        // UI Optimistic Update
        setUser(updatedUser);

        // Background Save
        try {
            await createProfile(updatedUser);
        } catch (e) {
            console.error(e);
        }

        router.push('/dashboard');
    };

    if (isLoading || !user) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        <i className="fas fa-user-plus"></i>
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">プロフィール設定</h1>
                    <p className="text-slate-500 font-bold text-sm mt-2">
                        {step === 1 ? 'お名前を教えてください' : 'お住まいの地域を選択してください'}
                    </p>
                </div>

                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">ニックネーム</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full bg-slate-100 border-none rounded-xl px-4 py-4 font-bold text-lg focus:ring-2 ring-emerald-400 outline-none"
                                placeholder="例: 回覧板太郎"
                            />
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            disabled={!nickname}
                            className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black shadow-lg shadow-emerald-200 disabled:opacity-50 hover:bg-emerald-600 transition-all"
                        >
                            次へ
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">地域（複数選択可）</label>
                            <AreaSelector
                                selectedAreas={selectedAreas}
                                onAreaToggle={(area) => {
                                    if (selectedAreas.includes(area)) {
                                        setSelectedAreas(selectedAreas.filter(a => a !== area));
                                    } else {
                                        setSelectedAreas([...selectedAreas, area]);
                                    }
                                }}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200"
                            >
                                戻る
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={selectedAreas.length === 0 || isSubmitting}
                                className="flex-1 py-4 bg-emerald-500 text-white rounded-xl font-black shadow-lg shadow-emerald-200 disabled:opacity-50 hover:bg-emerald-600 transition-all"
                            >
                                {isSubmitting ? '設定中...' : 'はじめる'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
