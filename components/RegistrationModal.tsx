
import React, { useState, useEffect } from 'react';
import { PREFECTURES, MUNICIPALITIES_BY_PREFECTURE } from '@/constants';

interface RegistrationModalProps {
    initialNickname: string;
    onRegister: (nickname: string, areas: string[]) => void;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ initialNickname, onRegister }) => {
    const [nickname, setNickname] = useState(initialNickname);
    const [prefecture, setPrefecture] = useState('埼玉県');
    const [municipality, setMunicipality] = useState('');

    // Get list based on selected prefecture
    const municipalities = MUNICIPALITIES_BY_PREFECTURE[prefecture] || [];

    // Reset default municipality when prefecture changes
    useEffect(() => {
        if (municipalities.length > 0) {
            setMunicipality(municipalities[0]);
        } else {
            setMunicipality(''); // Clear municipality if no options for the selected prefecture
        }
    }, [prefecture]);

    const handleRegister = () => {
        if (!nickname) return;

        let finalArea = municipality;
        if (prefecture !== '埼玉県') {
            finalArea = `${prefecture}${municipality}`;
        }

        onRegister(nickname, [finalArea]);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center text-3xl mb-4">
                        <i className="fas fa-map-marked-alt"></i>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">プロフィール設定</h2>
                    <p className="text-sm font-bold text-slate-400">お住まいの地域を教えてください</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-black text-slate-500 mb-2 ml-2">ニックネーム</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={e => setNickname(e.target.value)}
                            className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-2 border-slate-100 focus:border-emerald-500 outline-none transition-colors"
                            placeholder="表示名を入力"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-black text-slate-500 mb-2 ml-2">都道府県</label>
                        <div className="relative">
                            <select
                                value={prefecture}
                                onChange={e => setPrefecture(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-2 border-slate-100 focus:border-emerald-500 outline-none transition-colors appearance-none cursor-pointer"
                            >
                                {PREFECTURES.map(pref => (
                                    <option key={pref} value={pref}>{pref}</option>
                                ))}
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <i className="fas fa-chevron-down"></i>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-black text-slate-500 mb-2 ml-2">市区町村</label>
                        <div className="relative">
                            <select
                                value={municipality}
                                onChange={e => setMunicipality(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-2 border-slate-100 focus:border-emerald-500 outline-none transition-colors appearance-none cursor-pointer"
                            >
                                {municipalities.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <i className="fas fa-chevron-down"></i>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleRegister}
                        disabled={!nickname || !municipality}
                        className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        登録してはじめる
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegistrationModal;
