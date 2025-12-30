
import React, { useState } from 'react';
import { Coupon, User } from '../types';
import { SAITAMA_MUNICIPALITIES } from '../constants';

interface BusinessPanelProps {
  user: User;
  onRegisterCoupon: (coupon: Coupon) => void;
  myCoupons: Coupon[];
}

const BusinessPanel: React.FC<BusinessPanelProps> = ({ user, onRegisterCoupon, myCoupons }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    title: '',
    discount: '',
    requiredScore: 100,
    area: user.selectedAreas[0] || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const coupon: Coupon = {
      id: Date.now().toString(),
      shopName: user.shopName || user.nickname,
      title: newCoupon.title,
      discount: newCoupon.discount,
      requiredScore: newCoupon.requiredScore,
      area: newCoupon.area,
      imageUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
      isUsed: false
    };
    onRegisterCoupon(coupon);
    setIsRegistering(false);
    setNewCoupon({ title: '', discount: '', requiredScore: 100, area: user.selectedAreas[0] || '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <i className="fas fa-store text-9xl -rotate-12"></i>
        </div>
        <div className="relative z-10">
          <h3 className="text-2xl font-black mb-2">{user.shopName || 'マイ・ショップ'} 管理パネル</h3>
          <p className="text-slate-400 text-sm mb-6 font-medium">地域の住民にクーポンを配信して、お店を盛り上げましょう。</p>
          <button 
            onClick={() => setIsRegistering(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> 新しいクーポンを発行
          </button>
        </div>
      </div>

      {isRegistering && (
        <div className="bg-white border-2 border-emerald-500 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800">クーポンの新規登録</h3>
            <button onClick={() => setIsRegistering(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><i className="fas fa-times"></i></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">クーポン名</label>
                <input 
                  type="text" 
                  placeholder="例：お会計から500円OFF" 
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                  value={newCoupon.title}
                  onChange={e => setNewCoupon({...newCoupon, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">割引表示（強調）</label>
                <input 
                  type="text" 
                  placeholder="例：500円 OFF / 1杯無料" 
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-black text-rose-500"
                  value={newCoupon.discount}
                  onChange={e => setNewCoupon({...newCoupon, discount: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">必要スコア</label>
                <input 
                  type="number" 
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
                  value={newCoupon.requiredScore}
                  onChange={e => setNewCoupon({...newCoupon, requiredScore: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">配信エリア（ターゲット）</label>
                <select 
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold border-none"
                  value={newCoupon.area}
                  onChange={e => setNewCoupon({...newCoupon, area: e.target.value})}
                  required
                >
                  {SAITAMA_MUNICIPALITIES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-emerald-600 transition-all">
              クーポンを登録して配信を開始する
            </button>
          </form>
        </div>
      )}

      <div className="space-y-6">
        <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <i className="fas fa-history text-slate-400"></i> 発行済みのクーポン
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myCoupons.length > 0 ? myCoupons.map(cp => (
            <div key={cp.id} className="bg-white border border-slate-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
              <img src={cp.imageUrl} className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1">
                <h5 className="font-black text-slate-800 text-sm leading-tight">{cp.title}</h5>
                <p className="text-[10px] font-bold text-slate-400 mt-1">{cp.area} 限定配信</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-rose-500">{cp.discount}</span>
              </div>
            </div>
          )) : (
            <div className="col-span-2 text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold italic">
              まだ発行したクーポンはありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessPanel;
