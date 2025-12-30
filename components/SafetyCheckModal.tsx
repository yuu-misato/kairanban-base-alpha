import React, { useState } from 'react';
import { Household } from '../services/householdService';
import { sendSafetyReport } from '../services/safetyService';

interface SafetyCheckModalProps {
    currentUser: { id: string, nickname: string };
    households: Household[];
    onClose: () => void;
    onComplete: () => void;
}

type SafetyStatus = 'safe' | 'injured' | 'help_needed' | 'unknown';

const SafetyCheckModal: React.FC<SafetyCheckModalProps> = ({ currentUser, households, onClose, onComplete }) => {
    // Generate member list
    const members = [{ id: 'SELF', name: `${currentUser.nickname} (自分)`, isSelf: true }];
    households.forEach(h => {
        (h.members || []).forEach(m => {
            if (m.user_id !== currentUser.id) {
                members.push({ id: m.id, name: `${m.nickname} (代理)`, isSelf: false });
            }
        });
    });

    const [statuses, setStatuses] = useState<Record<string, SafetyStatus>>(
        members.reduce((acc, m) => ({ ...acc, [m.id]: 'safe' }), {})
    );

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const reports = Object.entries(statuses).map(([id, status]) => ({
            memberId: id,
            status: status
        }));

        await sendSafetyReport(currentUser.id, reports);
        setIsSubmitting(false);
        onComplete();
    };

    return (
        <div className="fixed inset-0 bg-red-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center text-3xl mb-4 animate-pulse">
                        <i className="fas fa-broadcast-tower"></i>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">安否確認・訓練</h2>
                    <p className="text-sm font-bold text-red-500 mt-2">
                        地震が発生しました。ご家族の状況を報告してください。
                    </p>
                </div>

                <div className="space-y-6">
                    {members.map(m => (
                        <div key={m.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <h4 className="font-black text-slate-700 mb-3 flex items-center gap-2">
                                {m.isSelf ? <i className="fas fa-user-circle"></i> : <i className="fas fa-user-friends"></i>}
                                {m.name}
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setStatuses(prev => ({ ...prev, [m.id]: 'safe' }))}
                                    className={`py-3 rounded-xl font-black transition-all ${statuses[m.id] === 'safe'
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                        : 'bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50'}`}
                                >
                                    <i className="fas fa-check-circle mr-1"></i> 無事
                                </button>
                                <button
                                    onClick={() => setStatuses(prev => ({ ...prev, [m.id]: 'help_needed' }))}
                                    className={`py-3 rounded-xl font-black transition-all ${statuses[m.id] === 'help_needed'
                                        ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                                        : 'bg-white text-red-600 border border-red-100 hover:bg-red-50'}`}
                                >
                                    <i className="fas fa-exclamation-triangle mr-1"></i> 救援
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-4 mt-8">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl"
                    >
                        閉じる
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 py-4 bg-slate-800 text-white font-black rounded-2xl shadow-xl hover:bg-slate-900 transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? '送信中...' : '全員分を報告する'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SafetyCheckModal;
