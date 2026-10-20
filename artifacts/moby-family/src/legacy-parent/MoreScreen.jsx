import { 
  Settings, User, FileText, Bell, Globe, Award, CreditCard, MapPin, ChevronRight 
} from 'lucide-react';

export default function MoreScreen({ setActiveTab }) {
  const menuItems = [
    { icon: Settings, label: 'Настройки', action: () => setActiveTab('settingsPage') },
    { icon: User, label: 'Персональные данные' },
    { icon: FileText, label: 'Документы' },
    { icon: Bell, label: 'Уведомления', badge: '20' },
    { icon: Globe, label: 'Курсы валют' },
    { icon: Award, label: 'Манички. Вход в программу приятностей' },
    { icon: CreditCard, label: 'Обменник Moby' },
    { icon: MapPin, label: 'Банк на карте' },
  ];

  return (
    <div className="p-4 space-y-2 pb-4">
      <h2 className="text-lg font-bold text-slate-900 mb-3">Ещё</h2>
      <div className="bg-white rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div 
              key={index} 
              onClick={item.action} 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 active:scale-98 transition-transform"
            >
              <div className="flex items-center space-x-3">
                <Icon className="text-[#007BFF]" size={20} />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
                <ChevronRight size={18} className="text-slate-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}