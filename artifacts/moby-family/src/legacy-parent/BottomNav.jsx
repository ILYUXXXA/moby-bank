
import { CreditCard, Users, MessageSquare, MoreHorizontal } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const hiddenTabs = ['topupPage', 'addCardPage', 'settingsPage'];
  if (hiddenTabs.includes(activeTab)) return null;

  return (
    <div className="bg-white border-t border-slate-200 px-2 py-2 pb-5 grid grid-cols-5 justify-items-center items-center text-xs text-slate-500 shrink-0 z-30 shadow-lg w-full">
      <button 
        onClick={() => setActiveTab('home')} 
        className={`flex flex-col items-center justify-center w-16 p-1 active:scale-95 transition-transform ${activeTab === 'home' ? 'text-[#007BFF] font-bold' : ''}`}
      >
        <div className="font-extrabold text-base mb-1 h-5 flex items-center justify-center">M</div>
        <span className="truncate w-full text-center">Главная</span>
      </button>

      <button 
        onClick={() => setActiveTab('products')} 
        className={`flex flex-col items-center justify-center w-16 p-1 active:scale-95 transition-transform ${activeTab === 'products' ? 'text-[#007BFF] font-bold' : ''}`}
      >
        <CreditCard size={20} className="mb-1" />
        <span className="truncate w-full text-center">Продукты</span>
      </button>

      <button 
        onClick={() => setActiveTab('family')} 
        className={`flex flex-col items-center justify-center w-16 p-1 active:scale-95 transition-transform ${activeTab === 'family' ? 'text-indigo-600 font-bold' : ''}`}
      >
        <Users size={20} className="mb-1" />
        <span className="truncate w-full text-center">Семья</span>
      </button>

      <button 
        onClick={() => setActiveTab('chat')} 
        className={`flex flex-col items-center justify-center w-16 p-1 active:scale-95 transition-transform ${activeTab === 'chat' ? 'text-[#007BFF] font-bold' : ''}`}
      >
        <MessageSquare size={20} className="mb-1" />
        <span className="truncate w-full text-center">Чат</span>
      </button>

      <button 
        onClick={() => setActiveTab('more')} 
        className={`flex flex-col items-center justify-center w-16 p-1 active:scale-95 transition-transform ${activeTab === 'more' ? 'text-[#007BFF] font-bold' : ''}`}
      >
        <MoreHorizontal size={20} className="mb-1" />
        <span className="truncate w-full text-center">Ещё</span>
      </button>
    </div>
  );
}