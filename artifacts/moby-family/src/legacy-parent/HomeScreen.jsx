import { useContext } from 'react';
import { 
  Bell, ArrowDownLeft, ArrowUpRight, Wallet, ChevronRight, CreditCard 
} from 'lucide-react';
import { UserContext } from '../context/UserContext';

export default function HomeScreen({ setActiveTab, setModalType }) {
  const { userData } = useContext(UserContext);
  const primaryCard = userData.cards[0];

  return (
    <div className="pb-4">
      <div className="bg-[#007BFF] text-white p-4 pt-6 rounded-b-[32px] shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div 
            className="flex items-center space-x-3 cursor-pointer active:scale-95 transition-transform" 
            onClick={() => setActiveTab('settingsPage')}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm relative">
              ВЫ
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                20
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-1">
                {userData.name}
              </h2>
            </div>
          </div>
          <button onClick={() => setActiveTab('settingsPage')} className="bg-white/20 p-2 rounded-full relative active:scale-95 transition-transform">
            <Bell size={18} />
          </button>
        </div>

        <div className="mt-2 bg-white/10 p-3 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between text-xs text-white/80">
            <span>{primaryCard?.name || 'Кактус BYN'}</span>
            <span>{primaryCard?.number || '5*3089'}</span>
          </div>
          <div className="text-3xl font-extrabold mt-1">
            {primaryCard?.balance ? primaryCard.balance.toFixed(2) : '0.00'} BYN
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-5 pt-3 border-t border-white/20 text-center">
          <button onClick={() => setActiveTab('topupPage')} className="flex flex-col items-center p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-transform">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center mb-1">
              <ArrowDownLeft size={22} className="text-white" />
            </div>
            <span className="text-[11px] font-medium">Пополнить</span>
          </button>

          <button onClick={() => setModalType('transfer')} className="flex flex-col items-center p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-transform">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center mb-1">
              <ArrowUpRight size={22} className="text-white" />
            </div>
            <span className="text-[11px] font-medium">Перевести</span>
          </button>

          <button onClick={() => setModalType('pay')} className="flex flex-col items-center p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-transform">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center mb-1">
              <Wallet size={22} className="text-white" />
            </div>
            <span className="text-[11px] font-medium">Оплатить</span>
          </button>

          <button onClick={() => alert("Баллы Халвы: 20 бонусов")} className="flex flex-col items-center p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-transform">
            <div className="w-11 h-11 bg-amber-400 text-slate-900 rounded-2xl flex items-center justify-center font-bold text-sm mb-1 shadow">
              20
            </div>
            <span className="text-[11px] font-medium">Баллы</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="bg-white p-3 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer active:scale-98 transition-transform">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-50 text-[#007BFF] rounded-xl flex items-center justify-center font-bold">⚙️</div>
            <div>
              <div className="font-bold text-sm">Подключение опции</div>
              <div className="text-xs text-slate-400">Кактус BYN</div>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </div>

        <div className="bg-gradient-to-r from-blue-700 to-indigo-900 text-white p-4 rounded-2xl shadow-md cursor-pointer active:scale-98 transition-transform">
          <div className="font-extrabold text-sm">ОБМЕННИК MOBY</div>
          <div className="text-xs text-slate-200 mt-1">Обмен валют по выгодному курсу</div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-cyan-700 text-white p-4 rounded-2xl shadow-md flex justify-between items-center cursor-pointer active:scale-98 transition-transform">
          <div>
            <div className="font-extrabold text-sm">ПАКЕТ УСЛУГ</div>
            <div className="text-xs text-slate-200 mt-1">Оформите МТкарту для бонусов</div>
            <button 
              onClick={() => setModalType('applyCard')}
              className="mt-3 bg-white text-[#007BFF] text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
            >
              Оформить карту &gt;
            </button>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('addCardPage')}
          className="bg-white p-5 rounded-2xl shadow-sm border-2 border-dashed border-slate-200 text-center cursor-pointer hover:border-[#007BFF] transition-all active:scale-98"
        >
          <CreditCard size={28} className="mx-auto text-[#007BFF] mb-1" />
          <span className="text-sm font-bold text-[#007BFF]">Добавить карту</span>
        </div>
      </div>
    </div>
  );
}