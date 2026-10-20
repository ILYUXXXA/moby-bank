
import { CreditCard, Smartphone } from 'lucide-react';

export default function TransferModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-[420px] rounded-t-[32px] p-6 pb-8 shadow-2xl z-10 space-y-4">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2" />

        <h3 className="text-xl font-extrabold text-slate-900 mb-4">
          Perevesti
        </h3>

        <div 
          onClick={() => { alert("Perevod po nomeru karty"); onClose(); }}
          className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-slate-100 active:scale-98 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#007BFF] shadow-sm shrink-0">
            <CreditCard size={24} />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900">Po nomeru karty i scheta</div>
            <div className="text-xs text-slate-400 mt-0.5">Perevody mezhdu kartami i schetami</div>
          </div>
        </div>

        <div 
          onClick={() => { alert("Perevod po nomeru telefona"); onClose(); }}
          className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-slate-100 active:scale-98 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#007BFF] shadow-sm shrink-0">
            <Smartphone size={24} />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900">Po nomeru telefona</div>
            <div className="text-xs text-slate-400 mt-0.5">Perevod klientam MTBanka</div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-slate-100 text-slate-800 font-bold text-sm py-3.5 rounded-2xl mt-4 active:scale-98 transition-transform hover:bg-slate-200"
        >
          Otmena
        </button>
      </div>
    </div>
  );
}