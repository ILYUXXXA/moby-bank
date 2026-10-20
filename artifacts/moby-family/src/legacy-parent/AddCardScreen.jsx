import { useState, useContext } from 'react';
import { ArrowLeft, Radio, Camera } from 'lucide-react';
import { UserContext } from '../context/UserContext';

export default function AddCardScreen({ onBack }) {
  const { setUserData } = useContext(UserContext);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardName, setNewCardName] = useState('');
  const [newCardColor, setNewCardColor] = useState('bg-emerald-900');

  const handleAddCardSubmit = (e) => {
    e.preventDefault();
    if (!newCardNumber) return;
    const cardObj = {
      id: Date.now().toString(),
      name: newCardName || 'Новая карта',
      number: '5*' + newCardNumber.slice(-4),
      balance: 0.00,
      currency: 'BYN',
      type: 'Mastercard',
      color: newCardColor
    };
    setUserData(prev => ({
      ...prev,
      cards: [...prev.cards, cardObj]
    }));
    onBack();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex items-center gap-3 pt-2 mb-2">
        <button onClick={onBack} className="p-1 active:scale-95 transition-transform">
          <ArrowLeft size={22} className="text-[#007BFF]" />
        </button>
        <h2 className="text-lg font-bold text-slate-900">Добавление карты</h2>
      </div>

      <form onSubmit={handleAddCardSubmit} className="space-y-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Номер карты</span>
            <div className="flex gap-3 text-[#007BFF]">
              <span className="flex items-center gap-1 cursor-pointer active:scale-95"><Radio size={14}/> NFC</span>
              <span className="flex items-center gap-1 cursor-pointer active:scale-95"><Camera size={14}/></span>
            </div>
          </div>
          <input 
            type="text" 
            placeholder="XXXX XXXX XXXX XXXX" 
            value={newCardNumber}
            onChange={(e) => setNewCardNumber(e.target.value)}
            className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm outline-none tracking-widest text-center" 
            required
          />
        </div>

        <div>
          <label className="text-xs text-slate-600 font-bold mb-1.5 block">Название карты</label>
          <input 
            type="text" 
            placeholder="Имя карты" 
            value={newCardName}
            onChange={(e) => setNewCardName(e.target.value)}
            className="w-full bg-white p-3.5 rounded-2xl border border-slate-200 text-sm outline-none shadow-sm" 
          />
        </div>

        <div>
          <label className="text-xs text-slate-600 font-bold mb-2 block">Цвет карты</label>
          <div className="grid grid-cols-3 gap-3">
            {['bg-emerald-900', 'bg-blue-950', 'bg-purple-900'].map((color) => (
              <div 
                key={color}
                onClick={() => setNewCardColor(color)}
                className={`h-16 rounded-xl ${color} cursor-pointer flex items-center justify-center text-white border-2 active:scale-95 transition-transform ${newCardColor === color ? 'border-[#007BFF]' : 'border-transparent'}`}
              >
                {newCardColor === color && '✓'}
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="w-full bg-slate-300 text-slate-600 py-3.5 rounded-2xl font-bold text-sm mt-6 active:scale-95 transition-transform">
          Сохранить
        </button>
      </form>
    </div>
  );
}