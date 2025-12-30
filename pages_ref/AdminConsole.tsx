import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAdminData } from '../hooks/useAdminData';
import { Button } from '../components/ui/Button';

const AdminConsole: React.FC = () => {
    const { user } = useAuth();
    const { isLoading, users, missions, communities, fetchData } = useAdminData();
    const [activeTab, setActiveTab] = useState<'users' | 'missions' | 'communities'>('users');

    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab, fetchData]);

    // Simple RLS check on UI side (Backend must also enforce RLS)
    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-6">
                <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6">
                    <i className="fas fa-lock text-3xl text-rose-500"></i>
                </div>
                <h1 className="text-2xl font-black text-slate-800">Access Denied</h1>
                <p className="text-slate-500 mt-2">このエリアへのアクセス権限がありません。</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col fixed h-full z-10 shadow-2xl">
                <h1 className="text-xl font-black mb-12 tracking-tighter flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg shadow-lg shadow-emerald-500/20"></div>
                    ADMIN
                </h1>

                <nav className="space-y-2 flex-1">
                    {[
                        { id: 'users', label: 'Users', icon: 'fas fa-users' },
                        { id: 'missions', label: 'Missions', icon: 'fas fa-hand-holding-heart' },
                        { id: 'communities', label: 'Communities', icon: 'fas fa-city' },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === item.id
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <i className={`${item.icon} w-5 text-center`}></i>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="pt-6 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-slate-700 bg-cover bg-center" style={{ backgroundImage: `url(${user.avatar})` }}></div>
                        <div className="text-xs">
                            <p className="font-bold text-slate-300">{user.nickname}</p>
                            <p className="text-slate-500">Administrator</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-10">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 capitalize tracking-tight">{activeTab}</h2>
                        <p className="text-slate-400 font-medium">Manage your platform resources</p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => fetchData(activeTab)} icon="fas fa-sync-alt" isLoading={isLoading}>
                        Refresh
                    </Button>
                </header>

                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                    {isLoading ? (
                        <div className="h-[500px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <i className="fas fa-circle-notch fa-spin text-4xl text-emerald-500/20"></i>
                                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Loading Data...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        {activeTab === 'users' && ['User', 'Role', 'Area', 'Score', 'Plan'].map(h => <th key={h} className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}
                                        {activeTab === 'missions' && ['Title', 'Area', 'Points', 'Date'].map(h => <th key={h} className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}
                                        {activeTab === 'communities' && ['Name', 'Region'].map(h => <th key={h} className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {activeTab === 'users' && users.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5 flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full bg-cover bg-center border-2 border-white shadow-sm" style={{ backgroundImage: `url(${u.avatar})` }}></div>
                                                <span className="font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">{u.nickname}</span>
                                            </td>
                                            <td className="px-8 py-5"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>{u.role}</span></td>
                                            <td className="px-8 py-5 text-sm font-medium text-slate-500">{u.selectedAreas.join(', ')}</td>
                                            <td className="px-8 py-5 font-mono font-bold text-slate-700">{u.score.toLocaleString()}</td>
                                            <td className="px-8 py-5"><span className="text-xs font-bold text-slate-400">{u.plan_type || 'Free'}</span></td>
                                        </tr>
                                    ))}
                                    {activeTab === 'missions' && missions.map(m => (
                                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5 font-bold text-slate-700">{m.title}</td>
                                            <td className="px-8 py-5 text-sm text-slate-500">{m.area}</td>
                                            <td className="px-8 py-5 font-mono text-emerald-600 font-bold">+{m.points}</td>
                                            <td className="px-8 py-5 text-xs text-slate-400 font-medium">{new Date(m.date).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {activeTab === 'communities' && communities.map(c => (
                                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5 font-bold text-slate-700">{c.name}</td>
                                            <td className="px-8 py-5 text-sm text-slate-500">{c.region}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Empty State for Table */}
                            {((activeTab === 'users' && users.length === 0) ||
                                (activeTab === 'missions' && missions.length === 0) ||
                                (activeTab === 'communities' && communities.length === 0)) && (
                                    <div className="py-20 text-center">
                                        <p className="text-slate-300 font-bold">No data found</p>
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default AdminConsole;
