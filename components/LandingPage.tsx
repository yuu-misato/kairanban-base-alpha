import React, { useState } from 'react';
import Link from 'next/link';
import { SAITAMA_MUNICIPALITIES, PREFECTURES, MUNICIPALITY_COORDINATES } from '@/lib/constants'; // Import areas

interface LandingPageProps {
    onLogin: () => void;
    onPreRegister: (nickname: string, areas: string[]) => void;
    currentUser?: any;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onPreRegister, currentUser }) => {
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    // Area Selection State
    const [selectedPrefecture, setSelectedPrefecture] = useState('埼玉県');
    const [municipality, setMunicipality] = useState('');
    const [interestAreas, setInterestAreas] = useState<string[]>([]);
    const [nickname, setNickname] = useState('');
    const [isLocating, setIsLocating] = useState(false);

    const handleRegister = () => {
        if (!nickname || !municipality) return;
        // Combine Prefecture and Municipality
        const fullArea = `${selectedPrefecture}${municipality}`;
        const allAreas = Array.from(new Set([fullArea, ...interestAreas]));
        onPreRegister(nickname, allAreas);
    };

    const toggleInterestArea = (area: string) => {
        const fullArea = `${selectedPrefecture}${municipality}`;
        if (fullArea === area) return; // Ignore if it's the living area
        if (interestAreas.includes(area)) {
            setInterestAreas(interestAreas.filter(a => a !== area));
        } else {
            setInterestAreas([...interestAreas, area]);
        }
    };

    const handleFindLocation = () => {
        if (!navigator.geolocation) {
            alert('お使いのブラウザでは位置情報がサポートされていません');
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    // Use OpenStreetMap Nominatim API for Reverse Geocoding
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                    const data = await response.json();

                    if (data && data.address) {
                        const addr = data.address;
                        // Extract Prefecture
                        const pref = addr.province || addr.state; // Nominatim varies
                        if (pref) setSelectedPrefecture(pref);

                        // Extract Municipality (City, Ward, Town, Village)
                        // Prioritize: City > Ward > Town > Village
                        // Note: In Tokyo special wards, "city" might be missing, "ward" is key.
                        // In Saitama-shi, "city" is Saitama, "ward" is Omiya-ku. We want "Omiya-ku" if available, or just "Saitama-shi Omiya-ku"?
                        // The app expects "municipality" input. Currently separate from prefecture.

                        let muni = '';
                        if (addr.ward) {
                            // If it's a ward (e.g. Omiya-ku), we might want to include the city name if it's a designated city?
                            // But usually users write "Saitama-shi Omiya-ku" or just "Omiya-ku".
                            // Let's rely on what user likely expects.
                            // For Saitama city, addr.city is "Saitama", addr.ward is "Omiya-ku".
                            // If we just put "Omiya-ku", combined it becomes "Saitama-ken Omiya-ku". 
                            // Wait, usually it's "Saitama-ken Saitama-shi Omiya-ku".
                            // Let's compose it carefully.
                            if (addr.city) {
                                muni = addr.city + addr.ward;
                            } else {
                                muni = addr.ward;
                            }
                        } else if (addr.city) {
                            muni = addr.city;
                        } else if (addr.town) {
                            muni = addr.town;
                        } else if (addr.village) {
                            muni = addr.village;
                        }

                        // Clean up
                        if (muni) {
                            setMunicipality(muni);
                            // If prefecture matches, good.
                        } else {
                            alert('市区町村が特定できませんでした。手入力をお願いします。');
                        }
                    } else {
                        alert('住所が取得できませんでした');
                    }
                } catch (error) {
                    console.error('Geocoding error:', error);
                    alert('住所情報の取得に失敗しました');
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                console.error(error);
                alert('位置情報の取得に失敗しました');
                setIsLocating(false);
            }
        );
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
            {/* Registration Modal */}
            {isRegisterOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-md max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsRegisterOpen(false)}
                            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 z-10"
                        >
                            <i className="fas fa-times"></i>
                        </button>

                        <h3 className="text-2xl font-black text-center mb-2">新規登録</h3>
                        <p className="text-slate-400 text-center text-sm font-bold mb-8">あなたにぴったりの情報をお届けします</p>

                        <div className="space-y-8">
                            {/* Living Area (Prefecture + Municipality) */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-500 pl-2">
                                    <i className="fas fa-map-marker-alt text-emerald-500"></i>
                                    お住まいの地域
                                </label>
                                <div className="space-y-2">
                                    {/* Prefecture Select */}
                                    <div className="relative">
                                        <select
                                            value={selectedPrefecture}
                                            onChange={(e) => setSelectedPrefecture(e.target.value)}
                                            className="w-full bg-emerald-50 border border-emerald-100 px-5 py-4 rounded-xl font-bold outline-none appearance-none focus:ring-2 focus:ring-emerald-500/20 text-emerald-800 text-sm"
                                        >
                                            {PREFECTURES.map(pref => (
                                                <option key={pref} value={pref}>{pref}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                                            <i className="fas fa-chevron-down"></i>
                                        </div>
                                    </div>

                                    {/* Municipality Input & GPS Button */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="市区町村 (例: 三郷市)"
                                            value={municipality}
                                            onChange={(e) => setMunicipality(e.target.value)}
                                            className="flex-1 bg-emerald-50 border border-emerald-100 px-5 py-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 text-emerald-800"
                                        />
                                    </div>
                                    <button
                                        onClick={handleFindLocation}
                                        disabled={isLocating}
                                        className="w-full bg-slate-900 text-white rounded-xl py-3 flex items-center justify-center gap-2 shadow-lg hover:bg-slate-800 active:scale-95 transition-all text-sm font-bold"
                                    >
                                        {isLocating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-location-arrow"></i>}
                                        現在地から入力する
                                    </button>
                                </div>
                            </div>

                            {/* Interest Areas - Removed per user request */}

                            {/* Nickname */}
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 pl-2">ニックネーム</label>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="例: みやこん"
                                    className="w-full bg-slate-50 px-5 py-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>

                            <button
                                onClick={handleRegister}
                                disabled={!nickname || !municipality}
                                className="w-full py-5 bg-[#06C755] text-white font-black rounded-2xl shadow-xl shadow-emerald-200 hover:bg-[#05b34c] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <i className="fab fa-line text-2xl"></i>
                                LINE認証して登録完了
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-2xl tracking-tighter text-slate-900">
                        <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-base">S</span>
                        回覧板BASE
                    </div>
                    {/* PC View Login Button */}
                    {currentUser ? (
                        <Link
                            href="/dashboard"
                            className="hidden md:block bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
                        >
                            <i className="fas fa-columns mr-2"></i>
                            ダッシュボード
                        </Link>
                    ) : (
                        <button
                            onClick={onLogin}
                            className="hidden md:block bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
                        >
                            ログイン
                        </button>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-emerald-50 to-transparent -z-10 rounded-bl-[10rem] opacity-60" />
                <div className="absolute bottom-0 left-0 w-1/3 h-2/3 bg-gradient-to-tr from-indigo-50 to-transparent -z-10 rounded-tr-[10rem] opacity-60" />

                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-block mb-6 animate-in slide-in-from-bottom fade-in duration-700">
                        <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs tracking-wider border border-emerald-200">
                            NEW STARNDARD OF LOCAL COMMUNITY
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1] animate-in slide-in-from-bottom fade-in duration-700 delay-100">
                        <span className="inline-block">地域の回覧板を、</span>
                        <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">圧倒的に楽に。</span>
                    </h1>

                    <p className="text-xl text-slate-500 font-medium mb-10 max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom fade-in duration-700 delay-200">
                        <span className="inline-block">面倒なハンコのリレーも、</span><span className="inline-block">雨の日の配達も必要ありません。</span>
                        <span className="inline-block">スマホひとつで、地域のお知らせは</span><span className="inline-block">もっと自由に、もっと楽しく。</span>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom fade-in duration-700 delay-300">
                        {currentUser ? (
                            <Link
                                href="/dashboard"
                                className="w-full sm:w-auto px-10 py-5 bg-[#06C755] text-white rounded-2xl font-black text-xl shadow-xl shadow-emerald-200 hover:bg-[#05b34c] transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
                            >
                                <i className="fas fa-rocket text-2xl"></i>
                                ダッシュボードを開く
                            </Link>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsRegisterOpen(true)}
                                    className="w-full sm:w-auto px-8 py-4 bg-[#06C755] text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-200 hover:bg-[#05b34c] transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
                                >
                                    <i className="fab fa-line text-2xl"></i>
                                    LINEで新規登録
                                </button>
                                <button
                                    onClick={onLogin}
                                    className="w-full sm:w-auto px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-3 sm:ml-2"
                                >
                                    <i className="fas fa-sign-in-alt"></i>
                                    ログインはこちら
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Feature 1: Kairanban */}
            <section className="py-24 px-6 bg-slate-50 relative">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div className="order-2 md:order-1 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl blur-3xl opacity-20 transform rotate-6"></div>
                        <div className="bg-white rounded-3xl p-8 shadow-2xl relative border border-slate-100">
                            {/* Mock UI */}
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                    <i className="fas fa-bullhorn"></i>
                                </div>
                                <div>
                                    <div className="h-2 w-24 bg-slate-200 rounded mb-1"></div>
                                    <div className="h-2 w-16 bg-slate-100 rounded"></div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-4 w-3/4 bg-slate-800 rounded opacity-10"></div>
                                <div className="h-4 w-full bg-slate-800 rounded opacity-5"></div>
                                <div className="h-4 w-5/6 bg-slate-800 rounded opacity-5"></div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <div className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg">確認しました</div>
                            </div>
                        </div>
                    </div>
                    <div className="order-1 md:order-2">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-xl mb-6">
                            <i className="fas fa-magic"></i>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black mb-6">
                            <span className="inline-block">回覧板は、</span>
                            <span className="inline-block">&quot;待つ&quot;ものから&quot;届く&quot;ものへ。</span>
                        </h2>
                        <p className="text-slate-500 text-lg leading-relaxed mb-8">
                            回覧板BASEなら、地域のお知らせがLINEやアプリに直接届きます。
                            旅行中でも、仕事中でも、大切な情報を見逃すことはありません。
                            「次は誰に回すんだっけ？」という悩みからも解放されます。
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 font-bold text-slate-700">
                                <i className="fas fa-check-circle text-emerald-500"></i>
                                いつでもどこでもスマホで確認
                            </li>
                            <li className="flex items-center gap-3 font-bold text-slate-700">
                                <i className="fas fa-check-circle text-emerald-500"></i>
                                既読ボタンを押すだけで完了
                            </li>
                            <li className="flex items-center gap-3 font-bold text-slate-700">
                                <i className="fas fa-check-circle text-emerald-500"></i>
                                過去のお知らせも検索可能
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Feature 2: Points & Rewards */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-xl mb-6">
                            <i className="fas fa-coins"></i>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black mb-6">
                            <span className="inline-block">地域活動に参加して、</span>
                            <span className="inline-block">街をもっと好きになる。</span>
                        </h2>
                        <p className="text-slate-500 text-lg leading-relaxed mb-8">
                            回覧板を見る、ゴミ拾いに参加する、イベントを手伝う。
                            あなたのちょっとした地域貢献が「ポイント」として貯まります。
                            貯まったポイントは、地元の素敵なお店でクーポンとして使えます。
                        </p>
                        <div className="flex gap-4">
                            <div className="flex-1 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <div className="text-4xl font-black text-amber-500 mb-2">PTS</div>
                                <div className="font-bold text-slate-700 text-sm">
                                    <span className="inline-block">活動に応じて</span>
                                    <span className="inline-block">ポイント獲得</span>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <div className="text-4xl font-black text-rose-500 mb-2">GIFT</div>
                                <div className="font-bold text-slate-700 text-sm">
                                    <span className="inline-block">地域のお店で</span>
                                    <span className="inline-block">お得に利用</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-l from-amber-200 to-rose-200 rounded-full blur-3xl opacity-30 transform translate-x-10"></div>
                        <div className="grid grid-cols-2 gap-4 relative">
                            <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 transform translate-y-8">
                                <div className="h-32 bg-slate-100 rounded-xl mb-3"></div>
                                <div className="font-bold text-slate-800">ランチ100円OFF</div>
                                <div className="text-xs text-slate-400">カフェ・ド・サイタマ</div>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
                                <div className="h-32 bg-slate-100 rounded-xl mb-3"></div>
                                <div className="font-bold text-slate-800">特製デザート</div>
                                <div className="text-xs text-slate-400">リストランテ大宮</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-30"></div>

                    <h2 className="text-3xl md:text-5xl font-black text-white mb-8 relative z-10">
                        <span className="inline-block">あなたの街での暮らしを、</span>
                        <span className="inline-block">もっとスマートに。</span>
                    </h2>
                    <p className="text-slate-400 mb-10 text-lg relative z-10">
                        <span className="inline-block">回覧板BASEは、地域と人をつなぐ</span><span className="inline-block">新しいプラットフォームです。</span><br className="hidden md:block" />
                        <span className="inline-block">まずはLINEログインで、</span><span className="inline-block">体験してみてください。</span>
                    </p>

                    <button
                        onClick={() => setIsRegisterOpen(true)}
                        className="px-10 py-5 bg-[#06C755] text-white rounded-2xl font-black text-xl shadow-lg shadow-emerald-900/50 hover:bg-[#05b34c] hover:scale-105 transition-all relative z-10 flex items-center justify-center gap-3 mx-auto"
                    >
                        <i className="fab fa-line text-3xl"></i>
                        無料で始める
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 font-black text-xl text-slate-900">
                            <span className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white text-xs">S</span>
                            回覧板BASE
                        </div>
                        <a href="http://tria-go.com/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors">
                            運営会社：一般社団法人TRiA GO
                        </a>
                    </div>
                    <p className="text-slate-400 text-sm font-bold">
                        &copy; 2025 回覧板BASE All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
