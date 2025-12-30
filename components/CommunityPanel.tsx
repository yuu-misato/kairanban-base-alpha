import React, { useState } from 'react';
import { Community, User } from '../types';

interface CommunityPanelProps {
    user: User;
    myCommunities: Community[];
    onCreateCommunity: (name: string, description: string, isSecret: boolean) => void;
    onJoinCommunity: (inviteCode: string) => void;
    onSelectCommunity: (community: Community) => void;
}

const CommunityPanel: React.FC<CommunityPanelProps> = ({ user, myCommunities, onCreateCommunity, onJoinCommunity, onSelectCommunity }) => {
    const [isJoining, setIsJoining] = useState(false);
    const [inviteInput, setInviteInput] = useState('');

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ヒーローセクション */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 text-white shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                        <span className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-xl">🤝</span>
                        コミュニティ
                    </h2>
                    <p className="text-indigo-100 font-bold opacity-90">
                        地域ごとの小さなコミュニティを作って、<br />LINEでスムーズに情報を届けましょう。
                    </p>
                </div>
            </div>

            {/* アクションボタン */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => onCreateCommunity('', '', false)} // Parent handles opening modal
                    className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center gap-3 hover:bg-slate-50 transition-all group"
                >
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        <i className="fas fa-plus"></i>
                    </div>
                    <span className="font-black text-slate-700">新しく作る</span>
                </button>
                <button
                    onClick={() => setIsJoining(true)}
                    className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center gap-3 hover:bg-slate-50 transition-all group"
                >
                    <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        <i className="fas fa-sign-in-alt"></i>
                    </div>
                    <span className="font-black text-slate-700">参加する</span>
                </button>
            </div>

            {/* 参加フォーム Modal */}
            {isJoining && (
                <div className="bg-white border-2 border-indigo-100 rounded-[2rem] p-6 shadow-xl animate-in zoom-in-95">
                    <h3 className="font-black text-lg mb-4 text-slate-800">招待コードで参加</h3>
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="招待コードを入力"
                            className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold outline-none border border-slate-200 focus:border-indigo-500 transition-colors text-center text-xl tracking-widest uppercase"
                            value={inviteInput}
                            onChange={e => setInviteInput(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <button onClick={() => { setIsJoining(false); setInviteInput(''); }} className="flex-1 py-4 font-bold text-slate-400 bg-slate-50 rounded-2xl">キャンセル</button>
                            <button
                                onClick={() => {
                                    if (inviteInput) {
                                        onJoinCommunity(inviteInput);
                                        setIsJoining(false);
                                        setInviteInput('');
                                    }
                                }}
                                className="flex-1 py-4 font-black text-white bg-purple-600 rounded-2xl shadow-lg shadow-purple-200 hover:bg-purple-700 transition-colors"
                            >
                                参加する
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* リスト */}
            <div className="space-y-4">
                <h3 className="font-black text-slate-400 text-sm px-4">参加中のコミュニティ</h3>
                {myCommunities.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-bold bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                        まだ参加していません
                    </div>
                ) : (
                    myCommunities.map(c => (
                        <div key={c.id} onClick={() => onSelectCommunity(c)} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all active:scale-[0.98]">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-200">
                                    {c.name[0]}
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                        {c.name}
                                        {c.role && c.role !== 'member' && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded text-white ${c.role === 'admin' ? 'bg-rose-500' : 'bg-indigo-500'}`}>
                                                {c.role === 'admin' ? '管理者' : '副管理者'}
                                            </span>
                                        )}
                                    </h4>
                                    <p className="text-xs font-bold text-slate-400">{c.membersCount}人のメンバー</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const text = `${c.name}に招待されています！\n回覧板BASEで地域コミュニティに参加しよう。\n\n▼参加はこちら\nhttps://kairanban-base.com?invite_community=${c.id}&ref=${user.id}`;
                                        const url = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
                                        window.open(url, '_blank');
                                    }}
                                    className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                                    title="LINEで招待"
                                >
                                    <i className="fab fa-line text-lg"></i>
                                </button>
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                    <i className="fas fa-chevron-right"></i>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 招待セクション */}
            <div className="mt-8 bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100 relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="font-black text-xl text-amber-800 mb-2 flex items-center gap-2">
                        <i className="fas fa-search-location"></i>
                        自治会・商店会が見つからない？
                    </h3>
                    <p className="text-amber-700/80 font-bold text-sm mb-6 leading-relaxed">
                        あなたの所属する団体がまだ回覧板BASEを使っていない場合は、ぜひ紹介してください！<br />
                        紹介した団体が登録すると、あなたに<span className="text-rose-500 font-black text-lg mx-1">500pt</span>プレゼント！
                    </p>

                    <button
                        onClick={() => {
                            const text = `回覧板BASEを使って、私たちの地域活動をもっとスマートにしませんか？\nデジタル回覧板で連絡がスムーズになります！\n\n▼詳細はこちらから（私の紹介コード: ${user.id.substring(0, 8)}）\nhttps://kairanban-base.com? ref=${user.id}`;
                            const url = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
                            window.open(url, '_blank');
                        }}
                        className="w-full py-4 bg-[#06C755] text-white font-black rounded-2xl shadow-lg shadow-emerald-200 hover:bg-[#05b34c] transition-all flex items-center justify-center gap-2 active:scale-95 mb-3"
                    >
                        <i className="fab fa-line text-2xl"></i>
                        LINEで招待する
                    </button>
                    {typeof navigator !== 'undefined' && navigator.share && (
                        <button
                            onClick={() => {
                                navigator.share({
                                    title: '回覧板BASE',
                                    text: `回覧板BASEを使って、私たちの地域活動をもっとスマートにしませんか？\n私の紹介コード: ${user.id.substring(0, 8)}`,
                                    url: `https://kairanban-base.com?ref=${user.id}`
                                }).catch(console.error);
                            }}
                            className="w-full py-4 bg-slate-800 text-white font-black rounded-2xl shadow-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <i className="fas fa-share-alt"></i>
                            その他の方法で紹介
                        </button>
                    )}
                    <p className="text-[10px] text-amber-600/60 font-bold text-center mt-3">
                        ※紹介コード経由で団体登録が完了するとポイントが付与されます
                    </p>
                </div>
                <div className="absolute -bottom-10 -right-10 text-9xl text-amber-500/10">
                    <i className="fas fa-bullhorn transform -rotate-12"></i>
                </div>
            </div>
        </div>
    );
};
export default CommunityPanel;
