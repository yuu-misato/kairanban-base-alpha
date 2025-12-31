import React, { useState, useEffect } from 'react';
import { MUNICIPALITIES_BY_PREFECTURE } from '../constants';

interface AreaSelectorProps {
    selectedAreas: string[];
    onAreaToggle: (area: string) => void;
}

const AreaSelector: React.FC<AreaSelectorProps> = ({ selectedAreas, onAreaToggle }) => {
    const [prefecture, setPrefecture] = useState('埼玉県');
    const [municipality, setMunicipality] = useState('');

    const municipalities = MUNICIPALITIES_BY_PREFECTURE[prefecture] || [];

    useEffect(() => {
        if (municipalities.length > 0) setMunicipality(municipalities[0]);
        else setMunicipality('');
    }, [prefecture, municipalities]);

    const handleAdd = () => {
        if (!municipality) return;
        const area = prefecture === '埼玉県' ? municipality : `${prefecture}${municipality}`;
        // Add only if not already added
        if (!selectedAreas.includes(area)) {
            onAreaToggle(area);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">都道府県</label>
                    <select
                        className="w-full p-2 rounded-lg bg-white font-bold border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        value={prefecture}
                        onChange={(e) => setPrefecture(e.target.value)}
                    >
                        {Object.keys(MUNICIPALITIES_BY_PREFECTURE).map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">市区町村</label>
                    <div className="flex gap-2">
                        <select
                            className="flex-1 p-2 rounded-lg bg-white font-bold border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            value={municipality}
                            onChange={(e) => setMunicipality(e.target.value)}
                        >
                            {municipalities.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleAdd}
                            type="button"
                            className="px-4 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors"
                        >
                            追加
                        </button>
                    </div>
                </div>
            </div>

            {/* Selected Areas Tags */}
            <div className="flex flex-wrap gap-2">
                {selectedAreas.map(area => (
                    <div key={area} className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-bold">
                        <span>{area}</span>
                        <button
                            onClick={() => onAreaToggle(area)}
                            className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center hover:bg-emerald-300"
                        >
                            <i className="fas fa-times text-xs"></i>
                        </button>
                    </div>
                ))}
                {selectedAreas.length === 0 && (
                    <div className="text-slate-400 text-sm font-bold pl-2">地域が選択されていません</div>
                )}
            </div>
        </div>
    );
};

export default AreaSelector;
