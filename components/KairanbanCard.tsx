import React, { useState } from 'react';
import { Kairanban } from '../types';
import { Household, HouseholdMember } from '../services/householdService';
import { markKairanbanRead } from '../services/kairanbanService';

interface KairanbanCardProps {
    kairanban: Kairanban;
    currentUser: { id: string, nickname: string };
    households: Household[];
    myReads: { household_member_id?: string | null, user_id?: string }[];
    onReadUpdate: () => void;
}

const KairanbanCard: React.FC<KairanbanCardProps> = ({ kairanban, currentUser, households, myReads, onReadUpdate }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isReadModalOpen, setIsReadModalOpen] = useState(false);
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());

    // Calculate who has read
    // Map memberId -> Boolean
    const readMap = new Set<string>(); // IDs of members who read (or 'SELF')
    myReads.forEach(r => {
        if (r.household_member_id) readMap.add(r.household_member_id);
        else if (r.user_id === currentUser.id) readMap.add('SELF');
    });

    // Flatten all members for selection
    const allMembers: { id: string, name: string, isSelf: boolean }[] = [];
    // Add Self
    allMembers.push({ id: 'SELF', name: `${currentUser.nickname} (自分)`, isSelf: true });

    // Add Dependents
    households.forEach(h => {
        (h.members || []).forEach(m => {
            if (m.user_id === currentUser.id) return; // Skip self if linked (handled by SELF)
            allMembers.push({ id: m.id, name: `${m.nickname} (代理)`, isSelf: false });
        });
    });

    const handleOpenReadModal = () => {
        // Pre-select already read members
        const initialSet = new Set<string>();
        if (readMap.has('SELF')) initialSet.add('SELF');

        households.forEach(h => {
            (h.members || []).forEach(m => {
                if (readMap.has(m.id)) initialSet.add(m.id);
            });
        });
        setSelectedMemberIds(initialSet);
        setIsReadModalOpen(true);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirmRead = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        const memberIdsToMark: string[] = [];
        let markSelf = false;

        selectedMemberIds.forEach(id => {
            if (id === 'SELF') markSelf = true;
            else memberIdsToMark.push(id);
        });

        // We call the service. 
        // Note: The service currently takes `memberIds`. If empty and we want to mark self, we pass empty?
        // Wait, my service logic: "If memberIds empty, mark user_id".
        // But if we want to mark dependents AND self?
        // The service needs to handle mixed.
        // Let's call twice or update service.
        // Calling twice is easier for now.

        const promises = [];

        // 1. Mark Self if needed (and not already read? Service handles upsert/ignore)
        if (markSelf) {
            promises.push(markKairanbanRead(kairanban.id, currentUser.id, []));
        }

        // 2. Mark Members
        if (memberIdsToMark.length > 0) {
            promises.push(markKairanbanRead(kairanban.id, currentUser.id, memberIdsToMark));
        }

        await Promise.all(promises);
        setIsReadModalOpen(false);
        setIsSubmitting(false);
        onReadUpdate();
    };

    const isFullyRead = allMembers.every(m => readMap.has(m.id));
    const isPartiallyRead = allMembers.some(m => readMap.has(m.id));

    return (
        <div className={`bg-white p-3 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm md:border ${isPartiallyRead ? 'border-emerald-100' : 'border-slate-100/50'} transition-all mb-3 md:mb-6`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h4 className={`font-black text-lg ${isPartiallyRead ? 'text-slate-600' : 'text-slate-800'}`}>
                        {kairanban.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1">
                        <span className="bg-slate-100 px-2 py-1 rounded">{new Date(kairanban.createdAt).toLocaleDateString()}</span>
                        <span>{kairanban.author}</span>
                    </div>
                </div>

                {/* Read Status Badge */}
                {isFullyRead ? (
                    <div className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-xs font-black whitespace-nowrap">
                        <i className="fas fa-check-double mr-1"></i>既読
                    </div>
                ) : isPartiallyRead ? (
                    <button onClick={handleOpenReadModal} className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-black whitespace-nowrap border border-emerald-200">
                        <i className="fas fa-check mr-1"></i>一部既読
                    </button>
                ) : (
                    <button onClick={handleOpenReadModal} className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-xs font-black whitespace-nowrap hover:bg-emerald-500 hover:text-white transition-colors">
                        未読
                    </button>
                )}
            </div>

            <p className="text-slate-600 font-medium mb-4 whitespace-pre-wrap leading-relaxed">{kairanban.content}</p>

            {/* Read Members (Compact) */}
            <div className="flex items-center justify-between mb-3 pt-2">
                <div className="flex -space-x-2">
                    {allMembers.slice(0, 5).map(m => (
                        <div key={m.id} className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black ${readMap.has(m.id) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`} title={m.name}>
                            {m.isSelf ? 'Me' : m.name[0]}
                        </div>
                    ))}
                    {allMembers.length > 5 && (
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">
                            +{allMembers.length - 5}
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end">
                <button onClick={handleOpenReadModal} className="text-xs font-bold text-indigo-500 hover:text-indigo-700">
                    <i className="fas fa-users-cog mr-1"></i>
                    家族の既読管理
                </button>
            </div>

            {/* Read Management Modal */}
            {isReadModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="text-center mb-6">
                            <h3 className="font-black text-lg text-slate-800">既読確認</h3>
                            <p className="text-sm text-slate-400 font-bold">誰がこの回覧板を読みましたか？</p>
                        </div>

                        <div className="space-y-3 mb-6">
                            {allMembers.map(m => {
                                const isSelected = selectedMemberIds.has(m.id);
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => {
                                            const newSet = new Set(selectedMemberIds);
                                            if (newSet.has(m.id)) newSet.delete(m.id);
                                            else newSet.add(m.id);
                                            setSelectedMemberIds(newSet);
                                        }}
                                        className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${isSelected
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 ring-2 ring-emerald-500 ring-offset-2'
                                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${isSelected ? 'bg-white/20' : 'bg-slate-200'}`}>
                                                {m.isSelf ? <i className="fas fa-user"></i> : <i className="fas fa-user-friends"></i>}
                                            </div>
                                            <span className="font-black">{m.name}</span>
                                        </div>
                                        {isSelected && <i className="fas fa-check-circle text-xl"></i>}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setIsReadModalOpen(false)} className="flex-1 py-3 text-slate-400 font-bold hover:bg-slate-50 rounded-xl">閉じる</button>
                            <button
                                onClick={handleConfirmRead}
                                disabled={isSubmitting}
                                className={`flex-1 py-3 bg-slate-800 text-white rounded-xl font-black transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-900'}`}
                            >
                                {isSubmitting ? <span className="flex items-center justify-center gap-2"><i className="fas fa-spinner fa-spin"></i> 保存中...</span> : '保存する'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KairanbanCard;
