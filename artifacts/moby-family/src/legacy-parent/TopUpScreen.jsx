import { ArrowLeft, Radio, Camera } from 'lucide-react';

export default function TopUpScreen({ onBack }) {
  const handleTopUpSubmit = () => {
    alert("Запрос на перевод отправлен!");
    onBack();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex items-center gap-3 pt-2 mb-2">
        <button onClick={onBack} className="p-1 active:scale-95 transition-transform">
          <ArrowLeft size={22} className="text-[#007BFF]" />
        </button>
        <h2 className="text-lg font-bold text-slate-900">Пополнить</h2>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm space-y-3">
        <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
          <span>Откуда</span>
          <div className="flex gap-3 text-[#007BFF]">
            <span className="flex items-center gap-1 cursor-pointer active:scale-95"><Radio size={14}/> NFC</span>
            <span className="flex items-center gap-1 cursor-pointer active:scale-95"><Camera size={14}/></span>
          </div>
        </div>
        <input 
          type="text" 
          placeholder="XXXX XXXX XXXX XXXX" 
          className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm outline-none tracking-widest text-center" 
        />
        <div className="grid grid-cols-2 gap-3">
          <input type="text" placeholder="ММ/ГГ" className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm outline-none text-center" />
          <input type="password" placeholder="CVV" maxLength={3} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm outline-none text-center" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm space-y-2">
        <div className="text-xs text-slate-500 font-medium">Куда</div>
        <div className="flex justify-between items-center pt-1">
          <div>
            <div className="font-bold text-xs uppercase text-slate-700">КАКТУС BYN</div>
            <div className="text-2xl font-extrabold mt-1">0.00 BYN</div>
            <div className="text-[11px] text-slate-400 mt-1">5*3089 · 10/29</div>
          </div>
          <div className="w-12 h-8 bg-emerald-800 rounded-lg flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
            🌵
          </div>
        </div>
      </div>

      <div className="text-xs text-[#007BFF] font-medium cursor-pointer active:scale-95">
        Доступные страны для перевода
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm space-y-1">
        <div className="text-xs text-slate-500 font-medium">Сумма, BYN</div>
        <input type="number" placeholder="0.00" className="w-full text-lg font-bold outline-none bg-transparent" />
      </div>

      <div className="text-xs text-slate-500">Комиссия МТБанка: 0.00 BYN</div>

      <button onClick={handleTopUpSubmit} className="w-full bg-slate-300 text-slate-600 py-3.5 rounded-2xl font-bold text-sm mt-4 active:scale-95 transition-transform">
        Проведите пальцем для совершения перевода
      </button>
    </div>
  );
}