
import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface LayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  score?: number;
  selectedAreas?: string[];
  userRole?: 'resident' | 'business' | 'admin' | 'chokai_leader' | string;
  onClickProfile?: () => void;
  onLogout?: () => void;
  userNickname?: string;
  userAvatar?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab = '',
  setActiveTab = () => { },
  score = 0,
  selectedAreas = [],
  userRole = 'resident',
  onClickProfile = () => { },
  onLogout = () => { },
  userNickname = '',
  userAvatar = ''
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { id: 'chokai', icon: 'fas fa-clipboard-list', label: '回覧板・活動' },
    { id: 'community', icon: 'fas fa-users', label: 'コミュニティ' },
    // { id: 'feed', icon: 'fas fa-stream', label: 'タイムライン' },
    { id: 'coupons', icon: 'fas fa-ticket-alt', label: '地域クーポン' },
    ...(userRole === 'business' ? [{ id: 'business', icon: 'fas fa-store', label: '事業者管理' }] : []),
    ...(userRole === 'admin' ? [{ id: 'admin', icon: 'fas fa-shield-alt', label: '管理コンソール' }] : []),
    { id: 'profile', icon: 'fas fa-cog', label: '設定' },
  ];

  const level = Math.floor(score / 100) + 1;
  const progress = (score % 100);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed h-full bg-white border-r border-slate-200 z-50 shadow-xl shadow-slate-200/50">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 font-black text-2xl text-slate-800 tracking-tighter cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <span className="italic">S</span>
            </div>
            回覧板BASE
          </div>
        </div>

        {/* Profile Button */}
        <div className="px-6 mb-6">
          <button
            onClick={onClickProfile}
            className="w-full bg-slate-50 hover:bg-slate-100 p-4 rounded-2xl flex items-center gap-3 transition-all border border-slate-100 group text-left"
          >
            {userAvatar ? (
              <img src={userAvatar} className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:scale-110 transition-transform" alt="avatar" />
            ) : (
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform overflow-hidden">
                <i className="fas fa-user"></i>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-500 mb-0.5">ログイン中</p>
              <p className="font-black text-slate-800 truncate text-sm">{userNickname || 'ユーザー設定'}</p>
            </div>
            <i className="fas fa-chevron-right text-slate-300 text-xs"></i>
          </button>
        </div>

        {/* Score Widget */}
        <div className="mx-6 mb-6 p-5 bg-slate-900 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Local Contrib</p>
                <h3 className="text-3xl font-black">{score}<span className="text-xs ml-1 opacity-60">pts</span></h3>
              </div>
              <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg">
                Lv.{level}
              </div>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isDashboard = pathname === '/dashboard';
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isDashboard) {
                    setActiveTab(item.id);
                  } else {
                    router.push(`/dashboard?tab=${item.id}`);
                  }
                }}
                className={`w-full flex items-center gap-4 px-8 py-4 transition-all ${activeTab === item.id
                  ? 'bg-emerald-50/50 text-emerald-700 border-r-4 border-emerald-600 font-black'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <i className={`fas ${item.icon} w-5 text-lg ${activeTab === item.id ? 'text-emerald-600' : 'text-slate-400'}`}></i>
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}

          <div className="mt-8 px-8">
            <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wide">Help & Legal</p>
            <button onClick={() => { pathname === '/dashboard' ? setActiveTab('support') : router.push('/dashboard?tab=support') }} className="w-full flex items-center gap-3 py-2 text-slate-500 hover:text-indigo-600 transition-colors">
              <i className="fas fa-headset w-5 text-sm"></i>
              <span className="text-xs font-bold">お問い合わせ</span>
            </button>
            <button onClick={() => { pathname === '/dashboard' ? setActiveTab('terms') : router.push('/dashboard?tab=terms') }} className="w-full flex items-center gap-3 py-2 text-slate-500 hover:text-indigo-600 transition-colors">
              <i className="fas fa-file-contract w-5 text-sm"></i>
              <span className="text-xs font-bold">利用規約</span>
            </button>
          </div>
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button
            onClick={onLogout}
            className="w-full py-4 bg-slate-100 text-slate-500 hover:text-rose-500 font-bold rounded-2xl hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
          >
            <i className="fas fa-sign-out-alt"></i>
            ログアウト
          </button>
        </div>
      </aside>

      {/* Main Content */}
      {/* Main Content with Safe Area Padding */}
      <main className="flex-1 md:ml-72 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">
              {activeTab === 'profile' ? '設定' : (menuItems.find(i => i.id === activeTab)?.label || 'ホーム')}
            </h2>
            <div className="flex gap-1 mt-0.5">
              {selectedAreas.slice(0, 1).map(area => (
                <span key={area} className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">{area}中心</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-2 border border-slate-200">
              <i className="fas fa-coins text-amber-500 text-xs shadow-sm"></i>
              <span className="text-xs font-black text-slate-700">{score}</span>
            </div>
            <button
              onClick={() => setActiveTab('profile')}
              className="md:hidden w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors shadow-sm active:scale-95"
            >
              <i className="fas fa-cog text-sm"></i>
            </button>
          </div>
        </header>
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - World Class UI */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-3xl border-t border-slate-200/60 pb-[env(safe-area-inset-bottom)] z-50 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-stretch h-[3.5rem] px-2 overflow-x-auto no-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center min-w-[4.5rem] transition-all relative group active:scale-95 ${activeTab === item.id ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {activeTab === item.id && (
                <div className="absolute top-0 w-8 h-1 bg-emerald-500 rounded-b-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all animate-in fade-in zoom-in duration-300"></div>
              )}
              <div className={`text-lg transition-transform duration-300 ${activeTab === item.id ? '-translate-y-1 scale-110 drop-shadow-sm' : ''}`}>
                <i className={`fas ${item.icon}`}></i>
              </div>
              <span className={`text-[9px] font-black tracking-tight transition-opacity duration-300 ${activeTab === item.id ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
