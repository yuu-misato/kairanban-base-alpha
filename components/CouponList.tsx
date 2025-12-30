
import React from 'react';
import { Coupon } from '../types';

interface CouponListProps {
  coupons: Coupon[];
  currentScore: number;
  selectedAreas: string[];
}

const CouponList: React.FC<CouponListProps> = ({ coupons, currentScore, selectedAreas }) => {
  const filteredCoupons = coupons.filter(c => selectedAreas.length === 0 || selectedAreas.includes(c.area));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
          {selectedAreas.length > 0 ? `${selectedAreas.join(', ')} 向けのクーポン` : '全エリアのクーポン'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {filteredCoupons.length > 0 ? filteredCoupons.map((coupon) => {
          const isLocked = currentScore < coupon.requiredScore;
          
          return (
            <div 
              key={coupon.id} 
              className={`group relative bg-white rounded-3xl overflow-hidden border-2 transition-all duration-300 ${
                isLocked 
                  ? 'border-slate-100 opacity-75 grayscale' 
                  : 'border-emerald-100 shadow-xl shadow-emerald-50 hover:-translate-y-1'
              }`}
            >
              <div className="flex h-32">
                <div className="w-1/3 overflow-hidden relative">
                  <img src={coupon.imageUrl} alt={coupon.shopName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-lg text-[8px] font-black text-slate-800 shadow-sm">
                    {coupon.area}
                  </div>
                </div>
                <div className="w-2/3 p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">{coupon.shopName}</h4>
                    <h3 className="font-black text-slate-800 leading-tight line-clamp-2">{coupon.title}</h3>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-xl font-black text-rose-500">{coupon.discount}</span>
                  </div>
                </div>
              </div>

              {isLocked ? (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-6 text-center">
                  <i className="fas fa-lock text-2xl mb-2"></i>
                  <p className="text-sm font-bold">ロック解除まであと</p>
                  <p className="text-2xl font-black">{coupon.requiredScore - currentScore}<span className="text-xs ml-1">pts</span></p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <i className="fas fa-check-circle"></i>
                    <span className="text-[10px] font-bold">利用可能</span>
                  </div>
                  <button className="bg-emerald-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all">
                    クーポンを使う
                  </button>
                </div>
              )}
            </div>
          );
        }) : (
          <div className="col-span-2 text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
             <p className="text-slate-400 font-bold italic">選択エリアにクーポンはありません</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponList;
