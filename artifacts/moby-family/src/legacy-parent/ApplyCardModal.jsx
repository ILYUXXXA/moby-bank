export default function ApplyCardModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-2xl p-6 pt-8 shadow-2xl z-10 text-center transform transition-all">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-50 text-blue-600 text-xl mb-4">
          💳
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-2">
          Сервис временно недоступен
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed mb-6 px-2">
          Оформление новых карт временно приостановлено из-за технических работ. Пожалуйста, попробуйте позже.
        </p>
        <button 
          onClick={onClose} 
          className="w-full bg-[#007BFF] text-white text-sm font-bold py-3 rounded-xl active:scale-[0.98] transition-all hover:bg-blue-600 shadow-md shadow-blue-500/10"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}