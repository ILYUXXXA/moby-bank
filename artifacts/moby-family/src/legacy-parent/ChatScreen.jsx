import { useState } from 'react';
import { Globe, Paperclip, Smile, Send } from 'lucide-react';

export default function ChatScreen() {
  const [chatMessage, setChatMessage] = useState('');
  const [chatList, setChatList] = useState([
    { id: 1, text: "Здравствуйте! Чем мы можем помочь?", sender: "support" }
  ]);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    setChatList(prev => [...prev, { text: chatMessage, sender: 'user' }]);
    setChatMessage('');
  };

  return (
    <div className="p-4 flex flex-col h-full justify-between pb-4">
      <div className="flex-1 overflow-y-auto mb-3 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Чат</h2>
          <Globe size={20} className="text-slate-500 cursor-pointer active:scale-95" />
        </div>

        {chatList.map((msg, idx) => (
          <div 
            key={idx} 
            className={`p-3 rounded-2xl text-xs max-w-[80%] ${msg.sender === 'user' ? 'bg-[#007BFF] text-white ml-auto' : 'bg-white shadow-sm text-slate-900'}`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="flex items-center bg-white p-2 rounded-2xl shadow-md border border-slate-200 gap-2">
        <Paperclip size={20} className="text-slate-400 cursor-pointer active:scale-95" />
        <input 
          type="text" 
          placeholder="Новое сообщение" 
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 text-xs outline-none bg-transparent"
        />
        <Smile size={20} className="text-slate-400 cursor-pointer active:scale-95" />
        <button 
          onClick={handleSendMessage} 
          className="w-8 h-8 bg-[#007BFF] text-white rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}