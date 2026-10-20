
import { CreditCard, Wallet, Gift, ChevronRight, Plus } from 'lucide-react';

export default function ProductsScreen({ setActiveTab }) {
  return (
    <div className="p-4 space-y-3 pb-4">
      <h2 className="text-lg font-bold text-slate-900 mb-2">Продукты</h2>
      
      <div className="bg-white rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden">
        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 active:scale-98 transition-transform">
          <div className="flex items-center space-x-3">
            <CreditCard className="text-[#007BFF]" size={22} />
            <div>
              <div className="font-bold text-sm">Карты и счета</div>
              <div className="text-xs text-slate-400">Ваши карты и счета</div>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </div>

        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 active:scale-98 transition-transform">
          <div className="flex items-center space-x-3">
            <Wallet className="text-[#007BFF]" size={22} />
            <div>
              <div className="font-bold text-sm">Кредиты</div>
              <div className="text-xs text-slate-400">Ваши кредитные продукты</div>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </div>

        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 active:scale-98 transition-transform">
          <div className="flex items-center space-x-3">
            <Gift className="text-[#007BFF]" size={22} />
            <div>
              <div className="font-bold text-sm">Вклады</div>
              <div className="text-xs text-slate-400">Ваши сбережения и вклады</div>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between cursor-pointer active:scale-98 transition-transform">
        <div>
          <div className="font-bold text-sm">Заявки на продукты</div>
          <div className="text-xs text-slate-400">Заявки на кредиты и продукты банка</div>
        </div>
        <ChevronRight size={18} className="text-slate-400" />
      </div>

      <button 
        onClick={() => setActiveTab('addCardPage')} 
        className="w-full bg-[#007BFF] text-white py-3.5 rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
      >
        <Plus size={18} /> Оформить
      </button>
    </div>
  );
}