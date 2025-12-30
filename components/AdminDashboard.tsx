import React, { useState, useEffect } from 'react';
import { User, VolunteerMission } from '@/types';
import { updateUserRole, giveUserPoints, createMission, deleteCommunity, updateCommunity, createProfile, sendLineBroadcast, getAdminData } from '@/services/supabaseService';
import { getActionPointSettings, updateActionPointSetting } from '@/services/pointService';

interface AdminDashboardProps {
    currentUser: User;
    onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onAddToast }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'missions' | 'communities' | 'notifications' | 'points' | 'settings'>('users');
    const [actionSettings, setActionSettings] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [missions, setMissions] = useState<VolunteerMission[]>([]);
    const [communities, setCommunities] = useState<any[]>([]);
    const [pointHistory, setPointHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // User Editing
    const [editingUserPoints, setEditingUserPoints] = useState<any | null>(null);
    const [editingUserInfo, setEditingUserInfo] = useState<any | null>(null);
    const [pointsInput, setPointsInput] = useState<number>(100);

    // Mission Creation
    const [isCreatingMission, setIsCreatingMission] = useState(false);
    const [newMission, setNewMission] = useState({ title: '', description: '', points: 50, area: 'さいたま市大宮区', date: '', maxParticipants: 5 });

    // Community Editing
    const [editingCommunity, setEditingCommunity] = useState<any | null>(null);

    // Notifications
    const [notificationMsg, setNotificationMsg] = useState('');
    const [targetRole, setTargetRole] = useState('all');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'users') {
                const { data } = await getAdminData('users');
                if (data) setUsers(data);
            } else if (activeTab === 'missions') {
                const { data } = await getAdminData('missions');
                if (data) setMissions(data.map((m: any) => ({
                    id: m.id,
                    title: m.title,
                    description: m.description,
                    points: m.points,
                    area: m.area,
                    date: m.date,
                    currentParticipants: m.current_participants || 0,
                    maxParticipants: m.max_participants || 10
                })));
            } else if (activeTab === 'communities') {
                const { data } = await getAdminData('communities');
                if (data) setCommunities(data);
            } else if (activeTab === 'points') {
                const { data } = await getAdminData('points');
                // Ensure data types are handled safely
                if (data) setPointHistory(data);
            } else if (activeTab === 'settings') {
                const { data } = await getActionPointSettings();
                if (data) setActionSettings(data);
            }
        } catch {
            onAddToast('データの取得に失敗しました', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // --- User Actions ---
    const handleRoleUpdate = async (userId: string, newRole: string) => {
        const { error } = await updateUserRole(userId, newRole);
        if (!error) {
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            onAddToast('ユーザー権限を更新しました', 'success');
        } else {
            onAddToast('更新に失敗しました', 'error');
        }
    };

    const handleGivePoints = async (userId: string) => {
        const { error } = await giveUserPoints(userId, pointsInput);
        if (!error) {
            setUsers(users.map(u => u.id === userId ? { ...u, score: (u.score || 0) + pointsInput } : u));
            onAddToast(`${pointsInput}ポイントを付与しました`, 'success');
            setEditingUserPoints(null);
        } else {
            onAddToast('ポイント付与に失敗しました', 'error');
        }
    };

    const handleUpdateUserInfo = async () => {
        if (!editingUserInfo) return;
        const { error } = await createProfile({
            ...editingUserInfo,
            avatar_url: editingUserInfo.avatar || editingUserInfo.avatar_url // ensure field mapping
        });
        if (!error) {
            setUsers(users.map(u => u.id === editingUserInfo.id ? editingUserInfo : u));
            onAddToast('ユーザー情報を更新しました', 'success');
            setEditingUserInfo(null);
        } else {
            onAddToast('更新に失敗しました', 'error');
        }
    };

    // --- Mission Actions ---
    const handleCreateMission = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data, error } = await createMission(newMission);
        if (!error && data) {
            onAddToast('ミッションを作成しました', 'success');
            setIsCreatingMission(false);
            setNewMission({ title: '', description: '', points: 50, area: 'さいたま市大宮区', date: '', maxParticipants: 5 });
            loadData();
        } else {
            onAddToast('作成に失敗しました', 'error');
        }
    };

    // --- Community Actions ---
    const handleDeleteCommunity = async (id: string) => {
        if (!window.confirm('本当に削除しますか？')) return;
        const { error } = await deleteCommunity(id);
        if (!error) {
            setCommunities(communities.filter(c => c.id !== id));
            onAddToast('コミュニティを削除しました', 'success');
        } else {
            onAddToast('削除に失敗しました', 'error');
        }
    };

    const handleUpdateCommunity = async () => {
        if (!editingCommunity) return;
        const { error } = await updateCommunity(editingCommunity.id, editingCommunity);
        if (!error) {
            setCommunities(communities.map(c => c.id === editingCommunity.id ? editingCommunity : c));
            onAddToast('コミュニティ情報を更新しました', 'success');
            setEditingCommunity(null);
        } else {
            onAddToast('更新に失敗しました', 'error');
        }
    };

    // --- Notification Actions ---
    const handleSendBroadcast = async () => {
        if (!notificationMsg) return;
        if (!window.confirm(`宛先: ${targetRole === 'all' ? '全員' : targetRole === 'admin' ? '管理者のみ' : targetRole}\nこの内容でLINEを一斉送信しますか？`)) return;

        setIsSending(true);
        const { error } = await sendLineBroadcast(notificationMsg, targetRole);
        if (!error) {
            onAddToast('LINE通知を送信しました', 'success');
            setNotificationMsg('');
        } else {
            console.error(error);
            onAddToast('送信に失敗しました', 'error');
        }
        setIsSending(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                            <i className="fas fa-shield-alt text-2xl text-emerald-400"></i>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight">管理コンソール</h2>
                    </div>
                    <p className="text-slate-400 font-bold ml-16">
                        システム全体の管理・監視を行います。
                    </p>
                </div>
            </div>

            {/* Navigation tabs */}
            <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                {(['users', 'missions', 'communities', 'points', 'notifications'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 px-6 rounded-xl font-black text-sm transition-all whitespace-nowrap ${activeTab === tab
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                    >
                        {tab === 'users' && <i className="fas fa-users mr-2"></i>}
                        {tab === 'missions' && <i className="fas fa-flag mr-2"></i>}
                        {tab === 'communities' && <i className="fas fa-building mr-2"></i>}
                        {tab === 'points' && <i className="fas fa-coins mr-2"></i>}
                        {tab === 'notifications' && <i className="fab fa-line mr-2"></i>}
                        {tab === 'users' && 'ユーザー'}
                        {tab === 'missions' && 'ミッション'}
                        {tab === 'communities' && 'コミュニティ'}
                        {tab === 'points' && 'ポイント履歴'}
                        {tab === 'notifications' && 'お知らせ配信'}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="flex justify-center py-20"><i className="fas fa-circle-notch fa-spin text-4xl text-slate-300"></i></div>
            ) : (
                <div className="min-h-[400px]">
                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">ユーザー</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">権限</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">スコア</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <img src={u.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest'} className="w-10 h-10 rounded-full bg-slate-100" alt={u.nickname} />
                                                    <div>
                                                        <p className="font-bold text-slate-800">{u.nickname}</p>
                                                        <p className="text-xs text-slate-400 font-mono">{u.id.substring(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <select
                                                    value={u.role || 'resident'}
                                                    onChange={(e) => handleRoleUpdate(u.id, e.target.value)}
                                                    className="bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all cursor-pointer"
                                                >
                                                    <option value="resident">住民</option>
                                                    <option value="business">事業者</option>
                                                    <option value="chokai_leader">町会長</option>
                                                    <option value="admin">管理者</option>
                                                </select>
                                            </td>
                                            <td className="p-6 font-mono font-bold text-emerald-600">
                                                {u.score?.toLocaleString()} pts
                                            </td>
                                            <td className="p-6 text-right space-x-2">
                                                <button
                                                    onClick={() => setEditingUserInfo(u)}
                                                    className="bg-slate-50 text-slate-500 px-4 py-2 rounded-xl text-xs font-black hover:bg-slate-100 transition-colors"
                                                >
                                                    <i className="fas fa-edit mr-1"></i> 編集
                                                </button>
                                                <button
                                                    onClick={() => setEditingUserPoints(u)}
                                                    className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-emerald-100 transition-colors"
                                                >
                                                    <i className="fas fa-gift mr-1"></i> ギフト
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* MISSIONS TAB */}
                    {activeTab === 'missions' && (
                        <div className="space-y-6">
                            <button
                                onClick={() => setIsCreatingMission(true)}
                                className="w-full py-4 bg-dashed border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 font-bold hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-plus"></i> 新しいミッションを作成
                            </button>

                            {isCreatingMission && (
                                <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-emerald-100 animate-in zoom-in-95">
                                    <h3 className="font-black text-lg mb-4">ミッション作成</h3>
                                    <form onSubmit={handleCreateMission} className="space-y-4">
                                        <input className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none outline-none focus:ring-2 ring-emerald-200" placeholder="タイトル" value={newMission.title} onChange={e => setNewMission({ ...newMission, title: e.target.value })} required />
                                        <textarea className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none outline-none focus:ring-2 ring-emerald-200 h-24" placeholder="詳細" value={newMission.description} onChange={e => setNewMission({ ...newMission, description: e.target.value })} required />
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="number" className="p-4 bg-slate-50 rounded-xl font-bold border-none outline-none" placeholder="ポイント" value={newMission.points} onChange={e => setNewMission({ ...newMission, points: parseInt(e.target.value) })} required />
                                            <input className="p-4 bg-slate-50 rounded-xl font-bold border-none outline-none" placeholder="対象エリア" value={newMission.area} onChange={e => setNewMission({ ...newMission, area: e.target.value })} required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="datetime-local" className="p-4 bg-slate-50 rounded-xl font-bold border-none outline-none " placeholder="日時 (例: 12/31 10:00)" value={newMission.date} onChange={e => setNewMission({ ...newMission, date: e.target.value })} required />
                                            <input type="number" className="p-4 bg-slate-50 rounded-xl font-bold border-none outline-none" placeholder="最大人数" value={newMission.maxParticipants} onChange={e => setNewMission({ ...newMission, maxParticipants: parseInt(e.target.value) })} required />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button type="button" onClick={() => setIsCreatingMission(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-100">キャンセル</button>
                                            <button type="submit" className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-600">作成</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="grid gap-4">
                                {missions.map(m => (
                                    <div key={m.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Mission</span>
                                                <h4 className="font-bold text-slate-800">{m.title}</h4>
                                            </div>
                                            <p className="text-xs text-slate-500 font-bold">{m.points} pts • {m.area}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-slate-800">{m.currentParticipants}<span className="text-sm text-slate-400 font-bold">/{m.maxParticipants}</span></p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">参加者</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* COMMUNITIES TAB */}
                    {activeTab === 'communities' && (
                        <div className="grid gap-4">
                            {communities.map(c => (
                                <div key={c.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-2xl">
                                        {c.image_url ? <img src={c.image_url} className="w-full h-full object-cover rounded-2xl" alt={c.name} /> : <i className="fas fa-users"></i>}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800 text-lg">{c.name}</h4>
                                        <p className="text-sm text-slate-500">{c.description}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold">ID: {c.id.substring(0, 8)}</span>
                                            {c.is_secret && <span className="text-[10px] bg-slate-800 text-white px-2 py-1 rounded font-bold"><i className="fas fa-lock mr-1"></i>Secret</span>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setEditingCommunity(c)}
                                        className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                    >
                                        <i className="fas fa-pen"></i>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCommunity(c.id)}
                                        className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-colors"
                                    >
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* POINTS TAB */}
                    {activeTab === 'points' && (
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-black text-lg text-slate-800">ポイント履歴</h3>
                                <span className="text-xs font-bold text-slate-400">直近の履歴を表示</span>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">日時</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">ユーザー</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">アクション</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">ポイント</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pointHistory.map((h: any) => (
                                        <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-6 text-xs font-bold text-slate-500">
                                                {new Date(h.created_at).toLocaleString('ja-JP')}
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-xs">
                                                        <i className="fas fa-user"></i>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-xs">{h.profiles?.nickname || 'Unknown'}</p>
                                                        <p className="text-[10px] text-slate-400">{h.user_id?.substring(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-xs font-bold text-slate-600">
                                                <span className={`px-2 py-1 rounded ${h.points_granted > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {h.action_key || 'Action'}
                                                </span>
                                            </td>
                                            <td className={`p-6 text-right font-mono font-bold ${h.points_granted > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {h.points_granted > 0 ? '+' : ''}{h.points_granted}
                                            </td>
                                        </tr>
                                    ))}
                                    {pointHistory.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-10 text-center text-slate-400 font-bold">
                                                履歴がありません
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-[#06C755] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#06C755]/20">
                                        <i className="fab fa-line text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800">LINE一斉配信</h3>
                                        <p className="text-xs text-slate-400 font-bold">ユーザーのLINEに直接お知らせを配信します。</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">配信対象</label>
                                        <div className="flex gap-4">
                                            {(['all', 'admin', 'chokai_leader', 'resident'] as const).map(role => (
                                                <label key={role} className={`flex-1 cursor-pointer border-2 rounded-xl p-4 flex items-center justify-center gap-2 transition-all ${targetRole === role ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                                                    <input type="radio" name="targetRole" className="hidden" checked={targetRole === role} onChange={() => setTargetRole(role)} />
                                                    <span className="font-bold capitalize">
                                                        {role === 'all' ? '全員' : role === 'admin' ? '管理者' : role === 'chokai_leader' ? '町会長' : '住民'}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">メッセージ内容</label>
                                        <textarea
                                            value={notificationMsg}
                                            onChange={e => setNotificationMsg(e.target.value)}
                                            className="w-full p-6 bg-slate-50 rounded-2xl outline-none font-medium min-h-[150px] focus:ring-2 focus:ring-indigo-100 transition-all"
                                            placeholder="ここにメッセージを入力..."
                                        ></textarea>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSendBroadcast}
                                            disabled={!notificationMsg || isSending}
                                            className="bg-[#06C755] text-white px-8 py-4 rounded-xl font-black text-sm hover:bg-[#05b64d] transition-all shadow-xl shadow-[#06C755]/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                                            一斉送信
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex items-start gap-3">
                                <i className="fas fa-exclamation-triangle text-amber-500 mt-1"></i>
                                <div>
                                    <h4 className="font-bold text-amber-800 text-sm">送信前の注意</h4>
                                    <p className="text-xs text-amber-600 mt-1 leading-relaxed">
                                        メッセージは即座に送信されます。「全員」を選択すると、LINE連携している全ユーザーに届きます。
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS TAB CONTENT */}
                    {activeTab === 'settings' && (
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-black text-lg text-slate-800">ポイント付与設定</h3>
                                <span className="text-xs font-bold text-slate-400">アクションごとのポイント数を管理</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-left text-xs bg-slate-50">
                                            <th className="p-4 font-black text-slate-400 uppercase tracking-widest">アクション名</th>
                                            <th className="p-4 font-black text-slate-400 uppercase tracking-widest">説明</th>
                                            <th className="p-4 font-black text-slate-400 uppercase tracking-widest">ポイント</th>
                                            <th className="p-4 font-black text-slate-400 uppercase tracking-widest">状態</th>
                                            <th className="p-4 font-black text-slate-400 uppercase tracking-widest">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {actionSettings.map(setting => (
                                            <tr key={setting.id} className="text-sm hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-bold text-slate-700">{setting.action_name}</td>
                                                <td className="p-4 text-xs text-slate-500">{setting.description}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="number"
                                                            className="w-20 px-3 py-2 bg-slate-100 rounded-lg font-bold border-none outline-none focus:ring-2 ring-indigo-200 text-right"
                                                            value={setting.points_amount}
                                                            onChange={(e) => {
                                                                const newVal = parseInt(e.target.value);
                                                                setActionSettings(prev => prev.map(s => s.id === setting.id ? { ...s, points_amount: newVal } : s));
                                                            }}
                                                        />
                                                        <span className="text-xs font-bold text-slate-400">pts</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={() => {
                                                            const newVal = !setting.is_active;
                                                            // Optimistic update
                                                            setActionSettings(prev => prev.map(s => s.id === setting.id ? { ...s, is_active: newVal } : s));
                                                            updateActionPointSetting(setting.id, { is_active: newVal });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${setting.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
                                                    >
                                                        {setting.is_active ? '有効' : '無効'}
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={async () => {
                                                            const { error } = await updateActionPointSetting(setting.id, { points_amount: setting.points_amount });
                                                            if (!error) onAddToast('保存しました', 'success');
                                                            else onAddToast('保存に失敗しました', 'error');
                                                        }}
                                                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition-shadow shadow-md shadow-indigo-200"
                                                    >
                                                        保存
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {actionSettings.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-12 text-center text-slate-400 font-bold">
                                                    設定項目がありません<br />
                                                    <span className="text-xs font-normal opacity-70">(データベースに初期データが必要です)</span>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                    }

                    {/* MODALS */}

                    {/* Gift Points Modal */}
                    {
                        editingUserPoints && (
                            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                                <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95">
                                    <div className="text-center mb-6">
                                        <img src={editingUserPoints.avatar_url} className="w-20 h-20 rounded-full mx-auto mb-4 bg-slate-100" alt={editingUserPoints.nickname} />
                                        <h3 className="font-black text-xl text-slate-800">{editingUserPoints.nickname}</h3>
                                        <p className="text-slate-400 font-bold text-sm">ポイントを付与</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-emerald-50 rounded-2xl p-4 flex items-center justify-center">
                                            <span className="text-3xl font-black text-emerald-600 mr-2">+{pointsInput}</span>
                                            <span className="text-emerald-400 font-bold text-sm">pts</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="10"
                                            max="1000"
                                            step="10"
                                            value={pointsInput}
                                            onChange={e => setPointsInput(parseInt(e.target.value))}
                                            className="w-full accent-emerald-500"
                                        />
                                        <div className="flex justify-between text-xs font-bold text-slate-400 px-2">
                                            <span>10</span>
                                            <span>500</span>
                                            <span>1000</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-8">
                                        <button onClick={() => setEditingUserPoints(null)} className="flex-1 py-4 font-bold text-slate-400 bg-slate-50 rounded-2xl hover:bg-slate-100">キャンセル</button>
                                        <button onClick={() => handleGivePoints(editingUserPoints.id)} className="flex-1 py-4 font-black text-white bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-600">贈る</button>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* Edit User Info Modal */}
                    {
                        editingUserInfo && (
                            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                                <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95">
                                    <h3 className="font-black text-xl text-slate-800 mb-6">ユーザー情報編集</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase">ニックネーム</label>
                                            <input
                                                className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none outline-none"
                                                value={editingUserInfo.nickname}
                                                onChange={e => setEditingUserInfo({ ...editingUserInfo, nickname: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase">画像URL</label>
                                            <input
                                                className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none outline-none"
                                                value={editingUserInfo.avatar_url}
                                                onChange={e => setEditingUserInfo({ ...editingUserInfo, avatar_url: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-8">
                                        <button onClick={() => setEditingUserInfo(null)} className="flex-1 py-4 font-bold text-slate-400 bg-slate-50 rounded-2xl hover:bg-slate-100">キャンセル</button>
                                        <button onClick={handleUpdateUserInfo} className="flex-1 py-4 font-black text-white bg-indigo-600 rounded-2xl shadow-lg hover:bg-indigo-700">保存</button>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* Edit Community Modal */}
                    {
                        editingCommunity && (
                            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                                <div className="bg-white w-full max-w-lg rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95">
                                    <h3 className="font-black text-xl text-slate-800 mb-6">コミュニティ編集</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase">名前</label>
                                            <input
                                                className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none outline-none"
                                                value={editingCommunity.name}
                                                onChange={e => setEditingCommunity({ ...editingCommunity, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase">詳細</label>
                                            <textarea
                                                className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none outline-none h-24"
                                                value={editingCommunity.description}
                                                onChange={e => setEditingCommunity({ ...editingCommunity, description: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase">画像URL</label>
                                            <input
                                                className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none outline-none"
                                                value={editingCommunity.image_url}
                                                onChange={e => setEditingCommunity({ ...editingCommunity, image_url: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-600">非公開（シークレット）</span>
                                            <input
                                                type="checkbox"
                                                checked={editingCommunity.is_secret}
                                                onChange={e => setEditingCommunity({ ...editingCommunity, is_secret: e.target.checked })}
                                                className="w-5 h-5 accent-indigo-600"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-8">
                                        <button onClick={() => setEditingCommunity(null)} className="flex-1 py-4 font-bold text-slate-400 bg-slate-50 rounded-2xl hover:bg-slate-100">キャンセル</button>
                                        <button onClick={handleUpdateCommunity} className="flex-1 py-4 font-black text-white bg-indigo-600 rounded-2xl shadow-lg hover:bg-indigo-700">更新</button>
                                    </div>
                                </div>
                            </div>
                        )}
                </div>
            );
};

            export default AdminDashboard;
