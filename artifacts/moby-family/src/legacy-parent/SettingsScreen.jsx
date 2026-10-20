import { useContext } from 'react';
import { ArrowLeft, Bell, ChevronRight } from 'lucide-react';
import { UserContext } from '../context/UserContext';

export default function SettingsScreen({ onBack }) {
  const { userData } = useContext(UserContext);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex items-center justify-between pt-2 mb-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 active:scale-95 transition-transform">
            <ArrowLeft size={22} className="text-[#007BFF]" />
          </button>
          <h2 className="text-lg font-bold text-slate-900">Настройки</h2>
        </div>
        <Bell size={20} className="text-[#007BFF] cursor-pointer active:scale-95" />
      </div>

      <div className="text-center py-4">
        <div className="w-24 h-24 bg-[#007BFF] text-white text-3xl font-bold rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
          ВЫ
        </div>
        <h3 className="text-xl font-bold text-slate-900">{userData.name}</h3>
        <p className="text-xs text-slate-500 mt-1">{userData.phone}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden text-sm font-medium">
        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 active:scale-98 transition-transform">
          <span>Переводы по номеру телефона</span>
          <ChevronRight size={18} className="text-slate-400" />
        </div>
        <div className="p-4 flex items-center justify-between">
          <span>Тёмная тема</span>
          <input type="checkbox" className="w-5 h-5 accent-[#007BFF]" />
        </div>
        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 active:scale-98 transition-transform">
          <span>Изменить смарт-код</span>
          <ChevronRight size={18} className="text-slate-400" />
        </div>
        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 active:scale-98 transition-transform">
          <span>Изменить Email</span>
          <ChevronRight size={18} className="text-slate-400" />
        </div>
        <div className="p-4 flex items-center justify-between">
          <span>Запрет скриншотов</span>
          <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#007BFF]" />
        </div>
      </div>

      <button onClick={onBack} className="text-rose-600 font-bold text-sm p-2 block mt-2 active:scale-95 transition-transform">
        Выйти
      </button>
    </div>
  );
}