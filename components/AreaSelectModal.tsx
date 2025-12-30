import React, { useState, useEffect } from 'react';
import { MUNICIPALITIES_BY_PREFECTURE } from '../constants';

interface AreaSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (area: string) => void;
}

const AreaSelectModal: React.FC<AreaSelectModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [prefecture, setPrefecture] = useState('埼玉県');
    const [municipality, setMunicipality] = useState('');

    const municipalities = MUNICIPALITIES_BY_PREFECTURE[prefecture] || [];

    useEffect(() => {
        if (municipalities.length > 0) setMunicipality(municipalities[0]);
        else setMunicipality('');
    }, [prefecture, municipalities]);

    if (!isOpen) return null;

    const handleAdd = () => {
        if (!municipality) return;
        // Saitama areas are stored as just the municipality name in legacy data (e.g. "さいたま市大宮区").
        // Other prefectures should probably include the prefecture name to be unique (e.g. "東京都世田谷区").
        // But for consistency with RegistrationModal logic (which we haven't strictly defined yet but likely follows this):
        const finalArea = prefecture === '埼玉県' ? municipality : `${prefecture}${municipality}`;
        onAdd(finalArea);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
                <h3 className="text-xl font-black text-slate-800 text-center">エリアを追加</h3>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400">都道府県</label>
                    <select
                        className="w-full p-3 rounded-xl bg-slate-50 font-bold border-2 border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        value={prefecture}
                        onChange={(e) => setPrefecture(e.target.value)}
                    >
                        {Object.keys(MUNICIPALITIES_BY_PREFECTURE).map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400">市区町村</label>
                    <select
                        className="w-full p-3 rounded-xl bg-slate-50 font-bold border-2 border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        value={municipality}
                        onChange={(e) => setMunicipality(e.target.value)}
                    >
                        {municipalities.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-3 mt-4">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-500 hover:bg-slate-200">キャンセル</button>
                    <button onClick={handleAdd} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors">
                        追加する
                    </button>
                </div>
            </div>
        </div>
    );
};
export default AreaSelectModal;
