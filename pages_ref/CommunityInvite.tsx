import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, getCommunityByInviteCode, joinCommunity } from '../services/supabaseService';
import { Community, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useLineLogin } from '../hooks/useLineLogin';

const CommunityInvite: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { login } = useLineLogin();

    const [community, setCommunity] = useState<Community | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCommunity = async () => {
            if (!code) return;
            setIsLoading(true);
            const { data, error } = await getCommunityByInviteCode(code);

            if (error || !data) {
                setError('コミュニティが見つかりませんでした。招待コードが正しいかご確認ください。');
            } else {
                setCommunity({
                    id: data.id,
                    name: data.name,
                    description: data.description,
                    ownerId: data.owner_id,
                    inviteCode: data.invite_code,
                    membersCount: data.members_count || 1,
                    isSecret: data.is_secret,
                    imageUrl: data.image_url
                });
            }
            setIsLoading(false);
        };

        fetchCommunity();
    }, [code]);

    const handleJoin = async () => {
        if (!community || !code) return;

        if (user) {
            // Already logged in, just join and go to dashboard
            const { error } = await joinCommunity(community.id, user.id);
            if (!error) {
                navigate('/dashboard?community=' + community.id); // Optional: open specific community
            } else {
                navigate('/dashboard'); // Fallback
            }
        } else {
            // Not logged in
            // Save code to local storage to handle after login
            localStorage.setItem('pendingInviteCode', code);
            // Trigger login
            login('resident');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !community) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-xl text-center max-w-md w-full">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                        😢
                    </div>
                    <h1 className="text-xl font-black text-slate-800 mb-4">エラーが発生しました</h1>
                    <p className="text-slate-500 font-bold mb-8">{error || 'コミュニティが見つかりません'}</p>
                    <a href="/" className="block w-full py-4 bg-slate-800 text-white rounded-xl font-black">トップページへ</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header Image / Hero */}
            <div className="h-64 bg-gradient-to-br from-indigo-600 to-purple-700 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                {/* Abstract shapes */}
                <div className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/30 rounded-full blur-2xl"></div>

                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-black tracking-widest mb-3 border border-white/10 text-emerald-300">
                        OFFICIAL COMMUNITY
                    </span>
                    <h1 className="text-3xl font-black mb-2 shadow-sm">{community.name}</h1>
                    <div className="flex items-center gap-2 text-sm font-bold opacity-90">
                        <span className="flex items-center gap-1"><i className="fas fa-users"></i> {community.membersCount}人のメンバー</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><i className="fas fa-map-marker-alt"></i> さいたま市</span>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto -mt-6 px-4 pb-20 relative z-10 space-y-6">
                {/* Description Card */}
                <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50">
                    <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <i className="fas fa-info-circle text-indigo-500"></i>
                        コミュニティについて
                    </h2>
                    <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                        {community.description || 'このコミュニティにはまだ説明がありません。'}
                    </p>
                </div>

                {/* Blurred Content Teaser */}
                <div className="relative overflow-hidden rounded-[2rem]">
                    <div className="bg-white p-6 opacity-60 blur-[2px] select-none pointer-events-none">
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="border-b border-slate-100 pb-4">
                                    <div className="h-6 w-3/4 bg-slate-200 rounded-lg mb-2"></div>
                                    <div className="h-4 w-full bg-slate-100 rounded-lg"></div>
                                    <div className="h-4 w-1/2 bg-slate-100 rounded-lg mt-1"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-white/90 via-white/80 to-transparent p-6 text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-3xl mb-4 animate-bounce">
                            🔒
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">
                            詳細なお知らせを見るには
                        </h3>
                        <p className="text-slate-500 font-bold mb-6 text-sm">
                            コミュニティに参加して、<br />
                            最新の回覧板やイベント情報をチェックしましょう。
                        </p>

                        <button
                            onClick={handleJoin}
                            className="w-full max-w-sm py-4 bg-[#06C755] hover:bg-[#05b34c] text-white font-black rounded-2xl shadow-xl shadow-emerald-200 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
                        >
                            <i className="fab fa-line text-2xl"></i>
                            {user ? 'このコミュニティに参加する' : 'LINEでログインして参加'}
                        </button>
                        <p className="mt-4 text-[10px] text-slate-400 font-bold">
                            ※ 参加費は無料です。いつでも退会できます。
                        </p>
                    </div>
                </div>

                {/* Benefits Section */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-50 p-6 rounded-[2rem] text-center">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl">
                            <i className="fas fa-bell"></i>
                        </div>
                        <h4 className="font-black text-indigo-900 text-sm mb-1">通知が届く</h4>
                        <p className="text-[10px] text-indigo-700/70 font-bold">大事な連絡を見逃しません</p>
                    </div>
                    <div className="bg-orange-50 p-6 rounded-[2rem] text-center">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl">
                            <i className="fas fa-gift"></i>
                        </div>
                        <h4 className="font-black text-orange-900 text-sm mb-1">ポイントが貯まる</h4>
                        <p className="text-[10px] text-orange-700/70 font-bold">地域活動で特典ゲット</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityInvite;
