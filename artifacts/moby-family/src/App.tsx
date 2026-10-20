import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { getFamily, getChild, getChildPiggybank, getChildTasks, getChildTransactions, getChildAnalytics, getDataSource } from './api/family';
import type { FamilyResponse, ChildResponse, PiggybankResponse, TasksResponse, TransactionsResponse, AnalyticsResponse } from './api/family';
import {
  ArrowLeft, ArrowUpRight, Award, Bell, Bike, Check, ChevronDown, ChevronRight,
  CircleHelp, CreditCard, Gamepad2, Home, MoreHorizontal, Pencil, Plus, ShieldCheck,
  Signal, SlidersHorizontal, Sparkles, Wifi, X, UserRound, UsersRound, Wallet, BusFront,
  Utensils, History, FileText, Settings, PiggyBank, type LucideIcon,
} from 'lucide-react';

type Role = 'picker' | 'parent' | 'child';
type ChildRecord = { id: string; name: string; age: number; balance: number; limit: number };
type Goal = { id: number; title: string; saved: number; target: number; glyph: 'headphones'|'bike'|'game'|'book'|'gift' };
type ModalKind = 'goal'|'topup'|'task'|'member'|'edit'|'generic';
type ModalState = { title: string; kind: ModalKind; description?: string } | null;

const initialChildren: ChildRecord[] = [
  { id: 'nikita', name: 'Никита', age: 12, balance: 85.6, limit: 20 },
  { id: 'dasha', name: 'Даша', age: 8, balance: 42.3, limit: 15 },
];
const initialGoals: Goal[] = [
  { id: 1, title: 'Наушники', saved: 45, target: 100, glyph: 'headphones' },
  { id: 2, title: 'Скейтборд', saved: 35, target: 80, glyph: 'bike' },
  { id: 3, title: 'Велосипед', saved: 120, target: 300, glyph: 'bike' },
  { id: 4, title: 'Игровая приставка', saved: 90, target: 400, glyph: 'game' },
  { id: 5, title: 'Конструктор', saved: 72, target: 120, glyph: 'book' },
];
const startTransactions = [
  { title: 'Покупка в Roblox', detail: 'Игры · сегодня', value: '-3,00 BYN', icon: Gamepad2, tone: 'cool' },
  { title: 'Школьная столовая', detail: 'Еда · сегодня', value: '-4,20 BYN', icon: Utensils, tone: 'warm' },
  { title: 'Проезд в автобусе', detail: 'Транспорт · вчера', value: '-0,90 BYN', icon: BusFront, tone: 'cool' },
];
const IconButton = ({ children, ...props }: { children: ReactNode; onClick?: () => void; testId: string; label: string }) => (
  <button className="icon-btn" aria-label={props.label} data-testid={props.testId} onClick={props.onClick}>{children}</button>
);
function StatusBar() {
  return <div className="status"><span>9:41</span><div className="status-icons"><Signal size={14} strokeWidth={2.7}/><Wifi size={15} strokeWidth={2.5}/><span style={{ width: 20, height: 10, border: '1.5px solid currentColor', borderRadius: 3, display: 'inline-block', position: 'relative' }}><i style={{ display:'block',position:'absolute',inset:'2px 5px 2px 2px',background:'currentColor',borderRadius:1 }}/></span></div></div>;
}
function Brand({ dark = false }: { dark?: boolean }) { return <div className={`brand ${dark ? 'dark' : ''}`} data-testid="text-brand">moby<em>family</em></div>; }
function BottomNav({ active, onSelect, mode = 'child' }: { active: string; onSelect: (key: string) => void; mode?: 'child'|'parent' }) {
  const items: { key: string; label: string; icon: LucideIcon }[] = mode === 'child'
    ? [{key:'home',label:'Главная',icon:Home},{key:'savings',label:'Копилка',icon:PiggyBank},{key:'profile',label:'Профиль',icon:UserRound}]
    : [{key:'home',label:'Главная',icon:Home},{key:'products',label:'Продукты',icon:CreditCard},{key:'family',label:'Семья',icon:UsersRound},{key:'chat',label:'Чат',icon:CircleHelp},{key:'more',label:'Ещё',icon:MoreHorizontal}];
  return <><nav className="bottom-nav" aria-label="Основная навигация">{items.map(item=><button key={item.key} className={`nav-item ${active===item.key?'active':''}`} data-testid={`nav-${item.key}`} onClick={()=>onSelect(item.key)}><span className="nav-icon"><item.icon size={21} strokeWidth={active===item.key?2.2:1.8}/></span><span>{item.label}</span></button>)}</nav><div className="home-indicator"><i/></div></>;
}
function GoalCard({ goal, onClick }: { goal: Goal; onClick: () => void }) {
  const pct = Math.min(100, Math.round(goal.saved / goal.target * 100));
  return <button className="goal-card" onClick={onClick} data-testid={`goal-${goal.id}`}><div className="goal-name">{goal.title}<ChevronRight size={16} color="#2169ff"/></div><div className="goal-meta"><span>{goal.saved} из {goal.target} BYN</span><b style={{color:'#416bff'}}>{pct}%</b></div><div className="progress"><i style={{width:`${pct}%`}}/></div><div className="goal-left">Осталось {goal.target-goal.saved} BYN</div></button>;
}

function App() {
  const [role, setRole] = useState<Role>('picker');
  const [parentTab, setParentTab] = useState('family');
  const [childTab, setChildTab] = useState('home');
  const [selected, setSelected] = useState('nikita');
  const [confirmed, setConfirmed] = useState(false);
  const [children, setChildren] = useState<ChildRecord[]>(initialChildren);
  const [familyResponse, setFamilyResponse] = useState<FamilyResponse | null>(null);
  const [familyParents, setFamilyParents] = useState<FamilyResponse['parents']>([]);
  const [apiPayloads, setApiPayloads] = useState<{
    child: ChildResponse | null;
    piggybank: PiggybankResponse | null;
    tasks: TasksResponse | null;
    transactions: TransactionsResponse | null;
    analytics: AnalyticsResponse | null;
  }>({ child: null, piggybank: null, tasks: null, transactions: null, analytics: null });
  const [apiSources, setApiSources] = useState<Record<string, 'api' | 'mock'>>({});
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [balance, setBalance] = useState(15.4);
  const [savings, setSavings] = useState(100);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState('');
  const [unread, setUnread] = useState<number[]>([1, 2]);
  const [autoTransfer, setAutoTransfer] = useState(true);
  const [frequency, setFrequency] = useState('Еженедельно');
  const [pocket, setPocket] = useState('20,00');
  const [taskDone, setTaskDone] = useState(false);
  const [profileName, setProfileName] = useState('Никита');
  const [parentMessages, setParentMessages] = useState(['Доброе утро! Не забудь взять карту в школу.']);
  const [messageDraft, setMessageDraft] = useState('');
  const [formError, setFormError] = useState('');
  const currentChild = children.find(child => child.id === selected) ?? children[0];
  const activeGoals = goals.length;
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2300); };
  const switchRole = (next: 'parent'|'child') => { setRole(next); setParentTab('family'); setChildTab('home'); };
  const navigateChild = (key: string) => {
    setChildTab(key);
    if (key === 'notifications') setUnread([]);
    if (key === 'profile') setGenericPage('');
  };
  const navigateParent = (key: string) => { setParentTab(key); };
  const openModal = (kind: ModalKind, title: string, description?: string) => { setFormError(''); setModal({kind, title, description}); };
  const readNotification = (id: number) => setUnread(ids => ids.filter(item => item !== id));

  const submitModal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (modal?.kind === 'goal') {
      const title = String(data.get('name') || '').trim();
      const target = Number(data.get('target'));
      if (!title || !target || target < 1) { setFormError('Укажи название и сумму цели.'); return; }
      setGoals(items => [...items, { id: Date.now(), title, target, saved: 0, glyph: 'gift' }]);
      showToast('Цель добавлена в копилку');
    } else if (modal?.kind === 'topup') {
      const amount = Number(data.get('amount'));
      if (!amount || amount <= 0) { setFormError('Введи сумму больше нуля.'); return; }
      if (modal.title.startsWith('Пополнить: ')) {
        const goalTitle = modal.title.replace('Пополнить: ', '');
        setGoals(items => items.map(goal => goal.title === goalTitle ? { ...goal, saved: Math.min(goal.target, goal.saved + amount) } : goal));
      } else if (modal.title.includes('карту')) {
        setChildren(items => items.map(child => child.id === selected ? { ...child, balance: child.balance + amount } : child));
      } else if (modal.title.toLowerCase().includes('перевести')) setBalance(value => value + amount);
      else setSavings(value => value + amount);
      showToast(`Готово: ${amount.toFixed(2).replace('.', ',')} BYN`);
    } else if (modal?.kind === 'task') {
      const title = String(data.get('name') || '').trim();
      if (!title) { setFormError('Добавь название задания.'); return; }
      showToast('Задание добавлено для Никиты');
    } else if (modal?.kind === 'member') {
      const name = String(data.get('name') || '').trim();
      const age = Number(data.get('age'));
      if (!name || !age) { setFormError('Заполни имя и возраст.'); return; }
      const id = `member-${Date.now()}`;
      setChildren(items => [...items, {id,name,age,balance:0,limit:15}]);
      setSelected(id);
      showToast(`${name} добавлен(а) в семью`);
    } else if (modal?.kind === 'edit') {
      const name = String(data.get('name') || '').trim();
      if (!name) { setFormError('Имя не может быть пустым.'); return; }
      setProfileName(name);
      showToast('Имя профиля обновлено');
    } else if (modal?.title.includes('карманные')) {
      const amount = Number(data.get('pocket'));
      if (!amount || amount < 1) { setFormError('Укажи сумму больше нуля.'); return; }
      setPocket(amount.toFixed(2).replace('.', ','));
      showToast('Сумма перевода обновлена');
    } else {
      showToast('Настройка сохранена');
    }
    setModal(null);
  };

  useEffect(() => { document.title = 'Moby Family'; }, []);

  // Load family when the parent opens the Family tab. API functions use mock data only on request failure.
  useEffect(() => {
    if (role !== 'parent' || parentTab !== 'family') return;
    let cancelled = false;
    getFamily().then(data => {
      if (cancelled) return;
      setFamilyResponse(data);
      setFamilyParents(data.parents ?? []);
      const mapped = (data.children ?? []).map(child => ({
        id: child.id,
        name: child.name,
        age: child.age,
        balance: child.balance_summary.amount,
        limit: 20,
      }));
      setChildren(mapped);
      setSelected(current => mapped.some(child => child.id === current) ? current : (mapped[0]?.id ?? '')); 
      setApiSources(current => ({ ...current, family: getDataSource('/api/family/my') }));
    });
    return () => { cancelled = true; };
  }, [role, parentTab]);

  // Load all read-only child endpoints when a parent opens the selected child's profile.
  useEffect(() => {
    if (role !== 'parent' || parentTab !== 'details' || !selected) return;
    let cancelled = false;
    const from = '2026-10-01';
    const to = new Date().toISOString().slice(0, 10);
    Promise.all([
      getChild(selected),
      getChildPiggybank(selected),
      getChildTasks(selected),
      getChildTransactions(selected, from, to),
      getChildAnalytics(from, to),
    ]).then(([child, piggybank, tasks, transactions, analytics]) => {
      if (cancelled) return;
      setApiPayloads({ child, piggybank, tasks, transactions, analytics });
      const from = '2026-10-01';
      const to = new Date().toISOString().slice(0, 10);
      setApiSources(current => ({
        ...current,
        child: getDataSource(`/api/children/${encodeURIComponent(selected)}`),
        piggybank: getDataSource(`/api/children/${encodeURIComponent(selected)}/piggybank`),
        tasks: getDataSource(`/api/children/${encodeURIComponent(selected)}/tasks`),
        transactions: getDataSource(`/api/children/${encodeURIComponent(selected)}/transactions?date_from=${encodeURIComponent(from)}&date_to=${encodeURIComponent(to)}`),
        analytics: getDataSource(`/api/child/analytics?date_from=${encodeURIComponent(from)}&date_to=${encodeURIComponent(to)}`),
      }));
      setChildren(current => current.map(item => item.id === selected ? {
        ...item,
        name: child.child_info.name,
        age: child.child_info.age,
        balance: child.balance_block.amount,
      } : item));
    });
    return () => { cancelled = true; };
  }, [role, parentTab, selected]);
  const sortedNotifications = useMemo(() => [
    {id:1,title:'Задание выполнено',copy:'Ты отлично справился с заданием «Навести порядок на столе». Награда уже на карте.',time:'Сегодня, 10:24',icon:Award},
    {id:2,title:'Накопления растут',copy:'В копилку добавлено 15 BYN. До цели «Наушники» осталось совсем немного.',time:'Сегодня, 09:10',icon:PiggyBank},
    {id:3,title:'Карманные деньги',copy:'Папа пополнил карту на 20 BYN. Хорошего дня!',time:'Вчера, 18:42',icon:Wallet},
    {id:4,title:'Новая цель',copy:'Цель «Скейтборд» ждёт тебя в копилке. Каждый шаг приближает к мечте.',time:'12 октября',icon:Sparkles},
  ], []);

  const rolePicker = <div className="app-stage"><div className="role-picker"><div className="role-brand">moby<em style={{fontSize:14,fontStyle:'italic',marginLeft:4}}>family</em></div><h1>Деньги —<br/>семейное дело.</h1><p>Выбери режим демо-приложения. Можно переключаться между родителем и ребёнком в любой момент.</p><button className="role-card" data-testid="role-parent" onClick={()=>switchRole('parent')}><span className="role-icon"><UsersRound size={26}/></span><span><b>Я родитель</b><small>Семья, дети и управление деньгами</small></span><ChevronRight className="role-arrow"/></button><button className="role-card" data-testid="role-child" onClick={()=>switchRole('child')}><span className="role-icon"><UserRound size={26}/></span><span><b>Я ребёнок</b><small>Главная, копилка и профиль Никиты</small></span><ChevronRight className="role-arrow"/></button><div className="role-foot">Демо-режим · Все данные хранятся только на этом устройстве</div></div></div>;

  const childHeader = (withGreeting = true) => <><div className="brandbar"><Brand/><IconButton label="Уведомления" testId="open-notifications" onClick={()=>navigateChild('notifications')}><Bell size={21}/>{unread.length>0&&<i style={{width:7,height:7,borderRadius:50,background:'#2169ff',position:'absolute',transform:'translate(8px,-8px)',border:'1.5px solid white'}}/>}</IconButton></div>{withGreeting&&<div className="greeting"><h1>Привет, {profileName}!</h1><button className="avatar-small" data-testid="open-profile" onClick={()=>navigateChild('profile')}>{profileName[0]}</button></div>}</>;

  const childHome = <><div className="phone-content"><StatusBar/>{childHeader()}<div className="balances">
    <div className="bank-card"><div className="card-brand"><span>moby</span><Wifi size={18}/></div><div className="card-label">Активный баланс</div><div className="card-amount">{balance.toFixed(2)} BYN</div><div className="card-footer"><span>•••• 4821</span><span className="master-dots"><i/><i/></span></div></div>
    <button className="savings-teaser" onClick={()=>navigateChild('savings')} data-testid="open-savings"><div className="teaser-head">Пассивный баланс<ChevronRight size={16} color="#2169ff"/></div><div className="teaser-amount">{savings.toFixed(2)} BYN</div><div className="treasure-art"><img className="treasure-img" src="/treasure-chest.png" alt="Сундук с накоплениями"/></div><div className="teaser-link"><span>В копилку</span><ArrowUpRight size={16}/></div></button>
  </div>
  <section className="section"><div className="section-title"><h2>Твои цели</h2><button className="text-action" data-testid="link-goals" onClick={()=>navigateChild('savings')}>Копилка <ChevronRight size={14} style={{verticalAlign:'middle'}}/></button></div><div className="goal-strip">{goals.map(goal=><GoalCard key={goal.id} goal={goal} onClick={()=>navigateChild('savings')}/>)}</div><div style={{display:'flex',justifyContent:'center',gap:4,marginTop:9}}><i style={{width:14,height:4,borderRadius:5,background:'#2169ff'}}/><i style={{width:4,height:4,borderRadius:5,background:'#d8e2f3'}}/><i style={{width:4,height:4,borderRadius:5,background:'#d8e2f3'}}/></div></section>
  <section className="section"><div className="section-title"><h2>Задания от родителей</h2><button className="text-action" data-testid="show-all-tasks" onClick={()=>showToast('Показаны все задания')}>Все <ChevronRight size={14} style={{verticalAlign:'middle'}}/></button></div><div className="task-strip"><button className="task-card" onClick={()=>{setTaskDone(!taskDone);showToast(taskDone?'Задание снова активно':'Задание отмечено выполненным')}} data-testid="task-room"><div className="task-reward"><span>+10 BYN</span><Award size={18}/></div><div className="task-copy">{taskDone?'Задание выполнено':'Закончить неделю без троек'}</div><div className="task-progress">{taskDone?'Готово':'━━━━━　4/5 дней'}</div></button><button className="task-card purple" onClick={()=>showToast('Тест по финансовой грамотности скоро начнётся')} data-testid="task-test"><div className="task-reward"><span>+50 BYN</span><Sparkles size={18}/></div><div className="task-copy">Пройти тест по финансовой грамотности</div><div className="task-progress" style={{color:'#7955db'}}>Начать тест　↗</div></button></div></section>
  <section className="section"><div className="section-title"><h2>Твои последние операции</h2><button className="text-action" data-testid="all-transactions" onClick={()=>showToast('История операций за месяц')}>Все <ChevronRight size={14} style={{verticalAlign:'middle'}}/></button></div><div className="transactions">{startTransactions.map((item,index)=><div className="transaction" key={item.title} data-testid={`transaction-${index}`}><span className={`transaction-icon ${item.tone==='warm'?'warm':''}`}><item.icon size={19}/></span><span className="transaction-copy"><b>{item.title}</b><small>{item.detail}</small></span><span className="transaction-amount">{item.value}</span></div>)}</div></section></div><BottomNav active="home" onSelect={navigateChild}/></>;

  const childSavings = <><div className="phone-content"><StatusBar/><div className="brandbar"><Brand dark/></div><div className="page-head"><h1>Копилка</h1></div><div className="savings-hero"><div className="big-treasure"><img className="treasure-large" src="/treasure-chest.png" alt="Сундук с накоплениями"/></div><div className="balance-label">Пассивный баланс</div><div className="balance-big">{savings.toFixed(2)} BYN</div><button className="primary-btn" data-testid="create-goal" onClick={()=>openModal('goal','Создать цель')}><Plus size={19}/>Создать цель</button></div><section className="savings-list"><div className="section-title"><h2>Твои цели</h2><span className="active-pill">{activeGoals} активных</span></div>{goals.map(goal=>{const pct=Math.round(goal.saved/goal.target*100);return <div className="saving-goal" key={goal.id} data-testid={`savings-goal-${goal.id}`} onClick={()=>openModal('topup',`Пополнить: ${goal.title}`)}><div className="saving-goal-title">{goal.title}<ChevronRight size={15} color="#416bff"/></div><div className="saving-goal-meta"><span>{goal.saved} из {goal.target} BYN</span><b style={{color:'#416bff'}}>{pct}%</b></div><div className="progress"><i style={{width:`${pct}%`}}/></div><div className="saving-goal-foot">Осталось {goal.target-goal.saved} BYN</div></div>})}</section></div><BottomNav active="savings" onSelect={navigateChild}/></>;

  const childProfile = <><div className="phone-content"><StatusBar/><div className="brandbar"><Brand dark/></div><div className="page-head"><h1>Профиль</h1></div><div className="profile-content"><div className="profile-intro"><div className="profile-avatar"><UserRound size={58} strokeWidth={1.5}/></div><h2>{profileName}</h2><p>Твой профиль в Moby Family</p><button className="avatar-action" data-testid="change-avatar" onClick={()=>showToast('Аватар Никиты обновлён')}><Pencil size={16}/>Сменить аватар</button></div><section className="profile-block"><h2>О тебе</h2><div className="profile-info"><div className="profile-info-row"><span>Имя</span><button data-testid="edit-profile-name" onClick={()=>openModal('edit','Изменить имя')} style={{border:0,background:'none',fontWeight:700,color:'#304b70'}}>{profileName}</button></div><div className="profile-info-row"><span>Возраст</span><b>12 лет</b></div></div></section><section className="profile-block"><h2>Настройки</h2><div className="settings-list"><button className="setting-row" data-testid="setting-notifications" onClick={()=>navigateChild('notifications')}><span className="setting-icon"><Bell size={20}/></span><span className="setting-text"><b>Уведомления</b><small>О заданиях и накоплениях</small></span><ChevronRight className="setting-chevron"/></button><button className="setting-row" data-testid="setting-security" onClick={()=>openModal('generic','Безопасность','Код входа в приложение')}><span className="setting-icon"><ShieldCheck size={20}/></span><span className="setting-text"><b>Безопасность</b><small>Код входа в приложение</small></span><ChevronRight className="setting-chevron"/></button><button className="setting-row" data-testid="setting-help" onClick={()=>openModal('generic','Помощь','Ответы на твои вопросы')}><span className="setting-icon"><CircleHelp size={20}/></span><span className="setting-text"><b>Помощь</b><small>Ответы на твои вопросы</small></span><ChevronRight className="setting-chevron"/></button></div></section><button className="logout-btn" data-testid="switch-role-profile" onClick={()=>setRole('picker')}>Выйти из профиля</button></div></div><BottomNav active="profile" onSelect={navigateChild}/></>;

  const notificationsPage = <><div className="phone-content"><StatusBar/><div className="brandbar"><button className="back-role" aria-label="Назад" data-testid="back-from-notifications" onClick={()=>navigateChild('home')}><ArrowLeft size={19}/></button><Brand/><span style={{width:34}}/></div><div className="page-head" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h1 style={{fontSize:26}}>Уведомления</h1>{unread.length>0&&<button className="text-action" data-testid="mark-all-read" onClick={()=>setUnread([])}>Прочитать всё</button>}</div><div className="notifications-list"><h3 style={{fontSize:13,color:'#8a99ae',margin:'7px 2px'}}>Недавние</h3>{sortedNotifications.map(item=><div className={`notification-card ${unread.includes(item.id)?'unread':''}`} key={item.id} data-testid={`notification-${item.id}`} role="button" tabIndex={0} onClick={()=>readNotification(item.id)} onKeyDown={event=>{if(event.key==='Enter')readNotification(item.id)}}><span className="notification-icon"><item.icon size={19}/></span><span className="notification-copy"><b>{item.title}</b><p>{item.copy}</p><small>{item.time}</small></span>{unread.includes(item.id)&&<i className="notif-dot"/>}</div>)}</div></div><BottomNav active="profile" onSelect={navigateChild}/></>;

  const parentFamily = <><div className="phone-content parent-scroll"><StatusBar/><div className="brandbar"><Brand/><IconButton label="Уведомления" testId="parent-notifications" onClick={()=>showToast('Новых уведомлений нет')}><Bell size={21}/></IconButton></div><div className="parent-head"><h1>Моя семья</h1><IconButton label="Добавить члена семьи" testId="add-family-member" onClick={()=>openModal('member','Добавить члена семьи')}><Plus size={22}/></IconButton></div><div className="tree-zone"><div className="tree-line horizontal"/><div className="tree-line vertical-main"/><div className="tree-line horizontal-child"/><div className="tree-line child-left"/><div className="tree-line child-right"/><div className="parent-person mom"><span className="parent-ico"><UserRound size={28} strokeWidth={1.5}/></span><span>{familyParents.find(parent => parent.role === 'MOTHER')?.name ?? 'Мама'}</span></div><div className="parent-person dad"><span className="parent-ico"><UserRound size={28} strokeWidth={1.5}/></span><span>{familyParents.find(parent => parent.role === 'FATHER')?.name ?? familyParents.find(parent => parent.role === 'GUARDIAN')?.name ?? 'Папа'}</span></div>{children.length ? children.map((child,index)=><button key={child.id} className={`child-choice ${selected===child.id?'selected':''} ${index%2===0?'left':'right'}`} data-testid={`select-child-${child.id}`} onClick={()=>{setSelected(child.id);setConfirmed(false);}}><span className="child-avatar"><UserRound size={39} strokeWidth={1.4}/>{selected===child.id&&<i style={{position:'absolute',right:-2,bottom:-1,width:20,height:20,borderRadius:50,background:'#416bff',border:'2px solid white',color:'white',display:'grid',placeItems:'center'}}><Check size={12}/></i>}</span><strong>{child.name} <ChevronRight size={14} style={{verticalAlign:'middle'}}/></strong><small>{child.age} лет</small></button>):<div className="family-empty">В семье пока нет детей</div>}</div><div className="selection-tip"><MousePointerIcon/>Нажмите на ребёнка, чтобы открыть профиль</div><div className="parent-confirm"><button className="primary-btn" data-testid="confirm-family-selection" onClick={()=>{setConfirmed(true);setParentTab('details');showToast(`Открыт профиль: ${currentChild.name}`)}}>{confirmed?'Выбор подтверждён':'Подтвердить'}</button></div></div><BottomNav active="family" mode="parent" onSelect={navigateParent}/></>;

  const parentDetails = <><div className="phone-content parent-scroll"><div className="detail-top"><StatusBar/><div className="brandbar" style={{height:44}}><button className="back-role" aria-label="Назад к семье" data-testid="back-to-family" onClick={()=>setParentTab('family')}><ArrowLeft size={18}/></button><span style={{fontSize:14,fontWeight:600}}>Мой ребёнок</span><button className="back-role" aria-label="Настройки" data-testid="child-settings" onClick={()=>openModal('generic','Настройки профиля','Управление параметрами карты и ребёнка')}><SlidersHorizontal size={17}/></button></div><div className="child-detail-head"><div className="detail-avatar"><UserRound size={29}/></div><div><div className="detail-name">{currentChild?.name}</div><div className="detail-sub">{currentChild?.age} лет · В вашей семье</div></div></div><div className="detail-balance"><div className="detail-label"><span>Баланс карты</span><button className="text-action" data-testid="parent-history" onClick={()=>showToast('История операций за октябрь')}><History size={12} style={{verticalAlign:'middle'}}/> История</button></div><div className="detail-amount">{currentChild?.balance.toFixed(2).replace('.', ',')} <span style={{fontSize:12,fontWeight:500}}>BYN</span></div><div className="detail-actions"><button className="detail-action" data-testid="parent-topup" onClick={()=>openModal('topup',`Пополнить карту ${currentChild?.name}`)}><Plus size={14}/>Пополнить</button><button className="detail-action light" data-testid="parent-statement" onClick={()=>showToast('Выписка подготовлена')}><FileText size={14}/>Выписка</button></div></div></div>
  <section className="detail-section"><h3>Деньги по категориям</h3><div className="detail-box">{[{label:'Транспорт',value:'25,60 BYN',icon:BusFront},{label:'Покупки',value:'40,00 BYN',icon:Wallet}].map((item,index)=><div className="money-row" key={item.label}><item.icon size={15} color="#416bff"/><span>{item.label}</span><span className="amount">{item.value}</span><button className="round-plus" data-testid={`add-money-${index}`} onClick={()=>openModal('topup',`Пополнить: ${item.label}`)}><Plus size={16}/></button></div>)}</div></section>
  <section className="detail-section"><div className="section-title" style={{marginBottom:8}}><h3 style={{margin:0}}>Цель {currentChild?.name}</h3><button className="text-action" data-testid="parent-all-goals" onClick={()=>showToast('Показаны все цели')}>Все цели <ChevronRight size={13}/></button></div><div className="parent-goal"><div style={{display:'flex',gap:8,alignItems:'center'}}><span className="setting-icon"><Bike size={18}/></span><div style={{flex:1}}><b style={{fontSize:12}}>Новый велосипед</b><div style={{fontSize:9,color:'#929fb0'}}>120,00 из 250,00 BYN</div></div><b style={{fontSize:11,color:'#416bff'}}>48%</b></div><div className="progress"><i style={{width:'48%'}}/></div><div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'#8595aa'}}><span>Осталось 130,00 BYN</span><button className="text-action" data-testid="parent-add-goal-money" onClick={()=>openModal('topup','Пополнить цель')}>Пополнить +</button></div></div></section>
  <section className="detail-section"><h3>Карманные деньги</h3><div className="pocket-box"><div className="switch-line"><span><b style={{display:'block',fontSize:11}}>Переводить автоматически</b><small style={{color:'#8a99ad',fontSize:9}}>На карту {currentChild?.name}</small></span><button className={`switch ${autoTransfer?'on':''}`} aria-label="Автоматический перевод" data-testid="toggle-auto-transfer" onClick={()=>setAutoTransfer(!autoTransfer)}><i/></button></div><div className="switch-line"><span><small style={{fontSize:9,color:'#9aa6b7'}}>Сумма перевода</small><b style={{display:'block',fontSize:13}}>{pocket} BYN</b></span><button className="text-action" data-testid="edit-pocket-amount" onClick={()=>openModal('generic','Изменить карманные деньги','Укажи сумму регулярного перевода')}><Pencil size={13}/></button></div><div style={{fontSize:10,fontWeight:700,margin:'9px 0 6px'}}>Как часто переводить</div><div style={{display:'flex',gap:5}}>{['Ежедневно','Еженедельно','Ежемесячно'].map(item=><button key={item} data-testid={`frequency-${item}`} onClick={()=>setFrequency(item)} style={{fontSize:8,padding:'7px 8px',borderRadius:7,border:0,background:frequency===item?'#416bff':'#f3f5f9',color:frequency===item?'white':'#8d99aa',flex:1}}>{item}</button>)}</div><div style={{fontSize:9,color:'#8b98ab',marginTop:9}}>По понедельникам, в {frequency.toLowerCase()}</div><button className="text-action" data-testid="edit-transfer-schedule" onClick={()=>showToast('Расписание перевода сохранено')}>Изменить расписание</button><div className="switch-line"><small style={{fontSize:9,color:'#7e8fa6'}}>Следующий перевод: 20,00 BYN</small><button className="text-action" data-testid="change-transfer-date" onClick={()=>showToast('Дата перевода обновлена')}>Изменить</button></div></div></section>
  <section className="detail-section"><div className="section-title"><h3>Задания от родителей</h3><button className="primary-btn" style={{width:'auto',minHeight:34,fontSize:10,padding:'0 12px'}} data-testid="add-parent-task" onClick={()=>openModal('task','Добавить задание')}><Plus size={13}/>Добавить задание</button></div><div className="parent-goal"><div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#8695aa'}}><b style={{color:'#304b70'}}>Хороший порядок на столе</b><span>+10 BYN</span></div><p style={{fontSize:9,color:'#8594a8',margin:'7px 0'}}>Убери вещи и игрушки на место, протри стол и наведи порядок.</p><div className="detail-box" style={{fontSize:9,marginBottom:7}}>Нужно навести порядок к 19:00</div><button className="detail-action" data-testid="approve-task" onClick={()=>showToast('Задание подтверждено, награда отправлена')}>Одобрить и перевести 10,00 BYN</button><button className="text-action" data-testid="edit-task" onClick={()=>openModal('task','Редактировать задание')}>Изменить задание</button></div></section>
  <section className="detail-section"><h3>История операций</h3><div className="detail-box"><button className="text-action" data-testid="transaction-date-filter">12–19 октября 2026 <ChevronDown size={13}/></button>{startTransactions.map((item,index)=><div className="money-row" key={item.title}><item.icon size={15} color="#416bff"/><span style={{flex:1}}>{item.title}</span><b style={{fontSize:10}}>{index===0?'+20,00':'-4,50'} BYN</b></div>)}<button className="text-action" style={{width:'100%'}} data-testid="download-statement" onClick={()=>showToast('Выписка за период скачана')}><FileText size={13}/> Скачать выписку за период</button></div></section>
  <section className="detail-section api-response-section">
    <h3>Данные профиля из API</h3>
    <p className="api-response-note">Ответы показываются целиком: при успешном запросе — данные сервера, при ошибке — mock-данные.</p>
    {([
      ['Семья и участники', familyResponse, apiSources.family],
      ['Профиль ребёнка', apiPayloads.child, apiSources.child],
      ['Копилка и цели', apiPayloads.piggybank, apiSources.piggybank],
      ['Задания', apiPayloads.tasks, apiSources.tasks],
      ['Транзакции', apiPayloads.transactions, apiSources.transactions],
      ['Аналитика', apiPayloads.analytics, apiSources.analytics],
    ] as [string, unknown, 'api' | 'mock' | undefined][]).map(([label, payload, source]) => (
      <details className="api-response-item" key={label}>
        <summary><span>{label}</span><span className={`api-source ${source === 'api' ? 'live' : 'mock'}`}>{source === 'api' ? 'API' : 'Mock'}</span></summary>
        <pre>{JSON.stringify(payload, null, 2) ?? 'Ожидание данных'}</pre>
      </details>
    ))}
  </section></div><BottomNav active="family" mode="parent" onSelect={navigateParent}/></>;

  const parentHome = <div className="phone-content"><StatusBar/><div className="brandbar"><Brand/><IconButton label="Уведомления" testId="home-notifications" onClick={()=>showToast('Новых уведомлений нет')}><Bell size={21}/></IconButton></div><div className="greeting"><h1>Добро пожаловать!</h1><span className="avatar-small">М</span></div><section className="section"><h2 style={{fontSize:17,margin:'0 0 12px'}}>Общий баланс</h2><div className="bank-card" style={{height:190}}><div className="card-brand">moby family <Wifi size={17}/></div><div className="card-label">Средства семьи</div><div className="card-amount">2 450,00 BYN</div><div className="card-footer">•••• 3910 <span>VISA</span></div></div><div className="settings-list" style={{marginTop:14}}><SettingButton icon={UsersRound} title="Семейные профили" sub={`${children.length} участника`} onClick={()=>setParentTab('family')} testId="home-family-link"/><SettingButton icon={CreditCard} title="Детские карты" sub="Баланс и управление" onClick={()=>setParentTab('products')} testId="home-cards-link"/></div><div className="form-row" style={{marginTop:14}}><button className="primary-btn" data-testid="home-transfer" onClick={()=>openModal('topup','Перевести ребёнку')}>Перевести деньги</button><button className="secondary-btn" data-testid="home-add-card" onClick={()=>openModal('generic','Оформить карту','Заполни данные, чтобы оформить семейную карту')}>Новая карта</button></div></section></div>;
  const parentChat = <div className="phone-content"><StatusBar/><div className="brandbar"><Brand/><span className="active-pill">Семейный чат</span></div><div className="page-head"><h1>Чат</h1></div><section className="section"><div className="detail-box" style={{minHeight:330,display:'flex',flexDirection:'column',justifyContent:'flex-end',gap:10}}>{parentMessages.map((message,index)=><div key={index} className="notification-card" style={{maxWidth:'88%',margin:0,background:index===0?'#eaf1ff':'#f8faff'}}><span className="notification-icon"><UserRound size={18}/></span><span className="notification-copy"><b>{index===0?'Мама':'Вы'}</b><p>{message}</p><small>Сегодня</small></span></div>)}</div><form className="form-row" style={{marginTop:12}} onSubmit={event=>{event.preventDefault();if(messageDraft.trim()){setParentMessages(messages=>[...messages,messageDraft.trim()]);setMessageDraft('');showToast('Сообщение отправлено');}}}><input className="form-control" value={messageDraft} onChange={event=>setMessageDraft(event.target.value)} placeholder="Напишите сообщение" data-testid="input-chat-message"/><button type="submit" className="icon-btn" data-testid="send-chat-message" aria-label="Отправить"><ArrowUpRight size={19}/></button></form></section></div>;
  const otherParentTab = <><div className="phone-content"><StatusBar/><div className="brandbar"><Brand/><button className="back-role" data-testid="switch-role-tab" onClick={()=>setRole('picker')}><MoreHorizontal size={19}/></button></div><div className="page-head"><h1>{parentTab==='products'?'Продукты':'Ещё'}</h1></div>{parentTab==='products'?<div className="section"><div className="bank-card" style={{height:190}}><div className="card-brand">moby <Wifi size={17}/></div><div className="card-label">Основная карта · BYN</div><div className="card-amount">2 450,00 BYN</div><div className="card-footer">•••• 3910 <span>VISA</span></div></div><button className="primary-btn" style={{marginTop:16}} data-testid="add-card" onClick={()=>openModal('generic','Оформить карту','Заполни данные, чтобы оформить семейную карту')}>Оформить карту</button><div className="settings-list" style={{marginTop:16}}><SettingButton icon={CreditCard} title="Детская карта" sub="Никита · •••• 4821" onClick={()=>setParentTab('details')} testId="open-child-card"/><SettingButton icon={CreditCard} title="Детская карта" sub="Даша · •••• 1487" onClick={()=>{setSelected('dasha');setParentTab('details')}} testId="open-dasha-card"/></div></div>:<div className="section"><div className="settings-list"><SettingButton icon={UsersRound} title="Моя семья" sub="Управление профилями детей" onClick={()=>setParentTab('family')} testId="more-family"/><SettingButton icon={Settings} title="Настройки" sub="Профиль и безопасность" onClick={()=>openModal('generic','Настройки','Измените параметры аккаунта')} testId="more-settings"/><SettingButton icon={CircleHelp} title="Помощь" sub="Ответы на частые вопросы" onClick={()=>openModal('generic','Помощь','Свяжитесь с поддержкой Moby Family')} testId="more-help"/></div><button className="primary-btn" style={{marginTop:20}} data-testid="leave-parent-mode" onClick={()=>setRole('picker')}>Сменить режим</button></div>}</div><BottomNav active={parentTab} mode="parent" onSelect={navigateParent}/></>;

  let view: ReactNode = role === 'picker' ? rolePicker : role === 'child'
    ? childTab === 'home' ? childHome : childTab === 'savings' ? childSavings : childTab === 'profile' ? childProfile : notificationsPage
    : parentTab === 'family' ? parentFamily : parentTab === 'details' ? parentDetails : parentTab === 'home' ? <>{parentHome}<BottomNav active="home" mode="parent" onSelect={navigateParent}/></> : parentTab === 'chat' ? <>{parentChat}<BottomNav active="chat" mode="parent" onSelect={navigateParent}/></> : otherParentTab;
  if (role !== 'picker') {
    view = <div className="app-stage"><main className={`phone ${role==='parent'?'parent':''}`}>{view}{modal&&<div className="overlay" role="presentation"><form className="dialog" onSubmit={submitModal}><div className="dialog-head"><div><h2>{modal.title}</h2>{modal.description&&<small style={{color:'#8494ad'}}>{modal.description}</small>}</div><button className="close-btn" type="button" aria-label="Закрыть" data-testid="close-modal" onClick={()=>setModal(null)}><X size={18}/></button></div>{modal.kind==='goal'?<><label htmlFor="goal-name">Название цели</label><input className="form-control" id="goal-name" name="name" placeholder="Например, новые наушники" data-testid="input-goal-name"/><label htmlFor="goal-target">Сколько нужно накопить</label><input className="form-control" id="goal-target" name="target" type="number" min="1" step="1" placeholder="100 BYN" data-testid="input-goal-target"/></>:modal.kind==='topup'?<><label htmlFor="amount">Сумма, BYN</label><input className="form-control" id="amount" name="amount" type="number" min="0.1" step="0.1" placeholder="Например, 10" data-testid="input-amount"/></>:modal.kind==='member'?<><label htmlFor="member-name">Имя ребёнка</label><input className="form-control" id="member-name" name="name" placeholder="Имя" data-testid="input-member-name"/><label htmlFor="member-age">Возраст</label><input className="form-control" id="member-age" name="age" type="number" min="1" max="18" placeholder="Возраст" data-testid="input-member-age"/></>:modal.kind==='task'?<><label htmlFor="task-name">Название задания</label><input className="form-control" id="task-name" name="name" placeholder="Например, убрать комнату" data-testid="input-task-name"/><label htmlFor="task-reward">Награда, BYN</label><input className="form-control" id="task-reward" name="reward" type="number" min="1" placeholder="10" data-testid="input-task-reward"/></>:modal.kind==='edit'?<><label htmlFor="profile-name">Имя профиля</label><input className="form-control" id="profile-name" name="name" defaultValue={profileName} data-testid="input-profile-name"/></>:modal.title.includes('карманные')?<><label htmlFor="pocket-amount">Сумма, BYN</label><input className="form-control" id="pocket-amount" name="pocket" type="number" min="1" defaultValue="20" data-testid="input-pocket-amount"/></>:modal.title.includes('Оформить карту')?<><label htmlFor="card-name">Имя на карте</label><input className="form-control" id="card-name" name="cardname" placeholder="Имя Фамилия" data-testid="input-card-name"/><label htmlFor="card-type">Тип карты</label><select className="form-control" id="card-type" name="cardtype" data-testid="select-card-type"><option>Детская карта</option><option>Семейная карта</option></select></>:<div style={{background:'#f5f8fd',borderRadius:13,padding:14,color:'#667e99',fontSize:13}}>{modal.description||'Настройка доступна в демо-режиме. Изменения сохраняются локально.'}</div>}{formError&&<div className="form-error" data-testid="form-error">{formError}</div>}<div className="dialog-actions"><button type="button" className="secondary-btn" data-testid="cancel-modal" onClick={()=>setModal(null)}>Отмена</button><button className="primary-btn" type="submit" data-testid="submit-modal">Сохранить</button></div></form></div>}{toast&&<div className="toast" role="status" data-testid="toast-message">{toast}</div>}</main></div>;
  }
  return <>{view}</>;
}

function SettingButton({icon:Icon,title,sub,onClick,testId}:{icon:LucideIcon;title:string;sub:string;onClick:()=>void;testId:string}){
  return <button className="setting-row" data-testid={testId} onClick={onClick}><span className="setting-icon"><Icon size={19}/></span><span className="setting-text"><b>{title}</b><small>{sub}</small></span><ChevronRight className="setting-chevron"/></button>;
}
function MousePointerIcon(){return <ArrowUpRight size={15} color="#416bff"/>}

export default App;
