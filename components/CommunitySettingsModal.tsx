import React, { useState, useEffect } from 'react';
import { Community, User, CommunityMember } from '../types';
import { getCommunityMembers, updateMemberRole, transferCommunityOwnership } from '../services/supabaseService';

interface CommunitySettingsModalProps {
    community: Community;
    currentUser: User;
    isOpen: boolean;
    onClose: () => void;
    onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const CommunitySettingsModal: React.FC<CommunitySettingsModalProps> = ({ community, currentUser, isOpen, onClose, onAddToast }) => {
    const [members, setMembers] = useState<CommunityMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchMembers = async () => {
        setIsLoading(true);
        const { data, error } = await getCommunityMembers(community.id);
        if (error) {
            onAddToast('メンバーの取得に失敗しました', 'error');
        } else if (data) {
            setMembers(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (isOpen && community.id) {
            fetchMembers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, community.id]);

    const handleRoleChange = async (memberUserId: string, newRole: string) => {
        if (newRole === 'admin') {
            if (!window.confirm('管理者権限を委譲しますか？\nあなたは管理者ではなくなります（権限が移動します）。')) {
                return;
            }
            const { error } = await transferCommunityOwnership(community.id, memberUserId);
            if (error) {
                onAddToast('権限の委譲に失敗しました', 'error');
                console.error(error);
            } else {
                onAddToast('権限を委譲しました', 'success');
                fetchMembers(); // Reload to reflect changes
            }
        } else {
            const { error } = await updateMemberRole(community.id, memberUserId, newRole);
            if (error) {
                onAddToast('権限の更新に失敗しました', 'error');
                console.error(error);
            } else {
                onAddToast('権限を更新しました', 'success');
                // Optimistic update
                setMembers(prev => prev.map(m => m.userId === memberUserId ? { ...m, role: newRole as any } : m));
            }
        }
    };

    if (!isOpen) return null;

    // Check if current user is admin/owner
    // Assuming 'admin' role in member list OR ownerId check
    const isOwner = community.ownerId === currentUser.id;
    const myMemberData = members.find(m => m.userId === currentUser.id);
    const isAdmin = isOwner || myMemberData?.role === 'admin';

    // We can also allow sub_admin to do limited things? Request says "Community created by person... can transfer".
    // Usually only Admin can transfer Admin. Sub-admin might manage Members.
    // For simplicity, let's limit Settings mostly to Admins for now, or allow Sub-Admin to see list but not change roles?
    // Let's allow simple viewing for everyone, editing for Admins.

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h3 className="font-black text-2xl text-slate-800">コミュニティ設定</h3>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                    {/* Basic Info */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">コミュニティ名</label>
                        <div className="text-xl font-black text-slate-800">{community.name}</div>
                        <div className="text-sm text-slate-500 font-bold">{community.description}</div>
                        <div className="flex gap-2 mt-2">
                            <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-500">ID: {community.id}</span>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">招待コード: {community.inviteCode}</span>
                            {community.isSecret && <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold"><i className="fas fa-lock mr-1"></i>非公開</span>}
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-4"></div>

                    {/* Members List */}
                    <div>
                        <h4 className="font-black text-lg text-slate-700 mb-4 flex items-center gap-2">
                            <i className="fas fa-users text-indigo-500"></i> メンバー管理
                        </h4>

                        {isLoading ? (
                            <div className="text-center py-8 text-slate-400 font-bold">読み込み中...</div>
                        ) : (
                            <div className="space-y-3">
                                {members.map(member => (
                                    <div key={member.userId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <img src={member.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + member.userId} className="w-10 h-10 rounded-full bg-white shadow-sm" alt="avatar" />
                                            <div>
                                                <div className="font-bold text-slate-800 flex items-center gap-2">
                                                    {member.nickname || 'Unknown'}
                                                    {member.userId === currentUser.id && <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-500">あなた</span>}
                                                </div>
                                                <div className="text-xs text-slate-400 font-bold">参加: {new Date(member.joinedAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>

                                        {/* Permission Controls */}
                                        {/* Only Admin can change roles. Admin can't change their own role here directly (must transfer). */}
                                        {isAdmin && member.userId !== currentUser.id ? (
                                            <select
                                                className="bg-white border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 focus:outline-none focus:border-indigo-500"
                                                value={member.role}
                                                onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                                            >
                                                <option value="member">メンバー</option>
                                                <option value="sub_admin">副管理者</option>
                                                <option value="admin">管理者（委譲）</option>
                                            </select>
                                        ) : (
                                            <span className={`px-3 py-1 rounded-lg text-xs font-black ${member.role === 'admin' ? 'bg-rose-100 text-rose-600' :
                                                member.role === 'sub_admin' ? 'bg-indigo-100 text-indigo-600' :
                                                    'bg-slate-200 text-slate-500'
                                                }`}>
                                                {member.role === 'admin' ? '管理者' : member.role === 'sub_admin' ? '副管理者' : 'メンバー'}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunitySettingsModal;
