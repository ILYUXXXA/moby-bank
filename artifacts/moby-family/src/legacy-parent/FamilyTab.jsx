import { useState, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { Plus, CheckCircle2, Award, Send, Sparkles } from 'lucide-react';

export default function FamilyTab() {
  const { userData, setUserData } = useContext(UserContext);
  const [selectedChild, setSelectedChild] = useState('c1');
  const [transferAmount, setTransferAmount] = useState('');
  

  const [quests, setQuests] = useState([
    { id: 1, title: 'Прочитать 20 страниц', reward: 5, status: 'in_progress' },
    { id: 2, title: 'Убрать в своей комнате', reward: 10, status: 'completed' },
  ]);
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [newQuestReward, setNewQuestReward] = useState('');

  
  const handleQuickTransfer = () => {
    if (!transferAmount || isNaN(transferAmount)) return;
    const amount = parseFloat(transferAmount);
    
    setUserData(prev => ({
      ...prev,
      cards: prev.cards.map((card, idx) => 
        idx === 0 ? { ...card, balance: Math.max(0, card.balance - amount) } : card
      ),
      familyData: {
        ...prev.familyData,
        children: prev.familyData.children.map(child => 
          child.id === selectedChild ? { ...child, balance: child.balance + amount } : child
        )
      }
    }));
    setTransferAmount('');
    alert(`Переведено ${amount} BYN ребенку!`);
  };

  const handleAddQuest = (e) => {
    e.preventDefault();
    if (!newQuestTitle || !newQuestReward) return;
    setQuests([...quests, {
      id: Date.now(),
      title: newQuestTitle,
      reward: parseFloat(newQuestReward),
      status: 'in_progress'
    }]);
    setNewQuestTitle('');
    setNewQuestReward('');
  };

  const currentChild = userData.familyData?.children?.find(c => c.id === selectedChild) || {
    name: 'Ишак',
    balance: 45.00,
    limit: 20.00
  };

  return (
    <div className="p-4 space-y-4 pb-6">
      {}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Moby Kids <Sparkles size={18} className="text-amber-500" />
          </h2>
          <p className="text-xs text-slate-500">Интерактивный семейный банк</p>
        </div>
        <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-bold">
          {userData.role === 'PARENT' ? 'Родитель' : 'Ребёнок'}
        </span>
      </div>

      {}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-[#007BFF] text-white p-4 rounded-3xl shadow-md relative overflow-hidden">
        <div className="text-xs font-semibold text-indigo-200 mb-3 uppercase tracking-wider">Семейная сеть</div>

        <div className="flex flex-col items-center space-y-3 relative z-10">
          {}
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-900 font-bold flex items-center justify-center text-xs">
              ВЫ
            </div>
            <div>
              <div className="text-xs font-bold">{userData.name}</div>
              <div className="text-[10px] text-indigo-200">Главный аккаунт</div>
            </div>
          </div>

          {}
          <div className="flex items-center gap-1 text-indigo-300">
            <div className="w-0.5 h-4 bg-indigo-400/50"></div>
          </div>

          {}
          <div className="flex gap-3 justify-center w-full">
            {userData.familyData?.children?.map(child => (
              <div 
                key={child.id}
                onClick={() => setSelectedChild(child.id)}
                className={`flex-1 bg-white/10 backdrop-blur-md p-3 rounded-2xl border transition-all cursor-pointer active:scale-95 ${selectedChild === child.id ? 'border-amber-400 bg-white/20 shadow-lg' : 'border-white/10 opacity-70'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold">{child.name}</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                </div>
                <div className="text-sm font-extrabold text-amber-300">{child.balance.toFixed(2)} BYN</div>
                <div className="text-[9px] text-indigo-200 mt-1">Лимит: {child.limit} BYN/день</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {}
      <div className="bg-white p-4 rounded-2xl shadow-sm space-y-3">
        <div className="text-xs font-bold text-slate-700">Перевести карманные деньги ({currentChild.name})</div>
        <div className="flex gap-2">
          <input 
            type="number" 
            placeholder="Сумма BYN" 
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm outline-none" 
          />
          <button 
            onClick={handleQuickTransfer}
            className="bg-[#007BFF] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
          >
            <Send size={14} /> Отправить
          </button>
        </div>
      </div>

      {}
      <div className="bg-white p-4 rounded-2xl shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Award size={16} className="text-amber-500" /> Семейные квесты
          </div>
          <span className="text-[10px] text-slate-400">Награды за задачи</span>
        </div>

        <div className="space-y-2">
          {quests.map(q => (
            <div key={q.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
              <div>
                <div className="font-semibold text-slate-800">{q.title}</div>
                <div className="text-amber-600 font-bold mt-0.5">+{q.reward} BYN</div>
              </div>
              {q.status === 'completed' ? (
                <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                  <CheckCircle2 size={14} /> Выполнено
                </span>
              ) : (
                <button 
                  onClick={() => setQuests(quests.map(item => item.id === q.id ? { ...item, status: 'completed' } : item))}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-bold active:scale-95"
                >
                  Подтвердить
                </button>
              )}
            </div>
          ))}
        </div>

        {}
        <form onSubmit={handleAddQuest} className="pt-2 flex gap-2 border-t border-slate-100">
          <input 
            type="text" 
            placeholder="Задание (напр: Вымыть посуду)" 
            value={newQuestTitle}
            onChange={(e) => setNewQuestTitle(e.target.value)}
            className="flex-1 bg-slate-50 p-2 rounded-lg text-xs outline-none border border-slate-200"
          />
          <input 
            type="number" 
            placeholder="BYN" 
            value={newQuestReward}
            onChange={(e) => setNewQuestReward(e.target.value)}
            className="w-16 bg-slate-50 p-2 rounded-lg text-xs outline-none border border-slate-200 text-center"
          />
          <button type="submit" className="bg-emerald-600 text-white p-2 rounded-lg active:scale-95">
            <Plus size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}