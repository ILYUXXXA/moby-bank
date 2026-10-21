import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { getFamily, getChild, getChildPiggybank, getChildTasks, getChildTransactions, getChildAnalytics, getChildDashboard, getChildPiggybankAsChild, getChildTasksAsChild, getChildTransactionsAsChild, getChildAnalyticsAsChild, getDataSource, getUserCards, createChild, createParent, createTask, approveTask, rejectTask, createGoal, createCardTransfer, contributeToGoal, submitTask } from './api/family';
import type { FamilyResponse, ChildResponse, PiggybankResponse, TasksResponse, TransactionsResponse, AnalyticsResponse } from './api/family';
import { PARENT_USER_ID, CHILD_USER_ID } from './config/userIds';
import {
  ArrowLeft, ArrowUpRight, Award, Bell, Bike, Check, ChevronDown, ChevronRight,
  CircleHelp, CreditCard, Gamepad2, Home, MoreHorizontal, Pencil, Plus, ShieldCheck,
  Signal, SlidersHorizontal, Sparkles, Wifi, X, UserRound, UsersRound, Wallet, BusFront,
  Utensils, History, FileText, Settings, PiggyBank, CalendarDays, ChevronLeft, BarChart3, Headphones, ShoppingBasket, Landmark, LockKeyhole, type LucideIcon,
} from 'lucide-react';

type Role = 'picker' | 'parent' | 'child';
type ChildRecord = { id: string; name: string; age: number; balance: number; limit: number };
// OpenAPI returns monetary decimals as strings in some responses; normalize before numeric UI operations.
function toAmount(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(String(value ?? '').trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}
type Goal = { id: string | number; title: string; saved: number; target: number; glyph: 'headphones'|'bike'|'game'|'book'|'gift' };
type ModalKind = 'goal'|'topup'|'task'|'proof'|'member'|'edit'|'generic';
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
  // Native status indicators are provided by the device/browser, not by the app UI.
  return null;
}
function Brand({ dark = false }: { dark?: boolean }) { return <div className={`brand ${dark ? 'dark' : ''}`} data-testid="text-brand">moby<em>family</em></div>; }
function BottomNav({ active, onSelect, mode = 'child' }: { active: string; onSelect: (key: string) => void; mode?: 'child'|'parent' }) {
  const items: { key: string; label: string; icon: LucideIcon }[] = mode === 'child'
    ? [{key:'home',label:'Главная',icon:Home},{key:'savings',label:'Копилка',icon:PiggyBank},{key:'tasks',label:'Задания',icon:FileText},{key:'map',label:'Карта',icon:SlidersHorizontal},{key:'profile',label:'Профиль',icon:UserRound}]
    : [{key:'home',label:'Главная',icon:Home},{key:'products',label:'Продукты',icon:CreditCard},{key:'family',label:'Семья',icon:UsersRound},{key:'chat',label:'Чат',icon:CircleHelp},{key:'more',label:'Ещё',icon:MoreHorizontal}];
  return <><nav className="bottom-nav" aria-label="Основная навигация">{items.map(item=><button key={item.key} className={`nav-item ${active===item.key?'active':''}`} data-testid={`nav-${item.key}`} onClick={()=>onSelect(item.key)}><span className="nav-icon"><item.icon size={21} strokeWidth={active===item.key?2.2:1.8}/></span><span>{item.label}</span></button>)}</nav><div className="home-indicator"><i/></div></>;
}
function GoldenNut({ size = 25 }: { size?: number }) {
  return <svg className="golden-nut" width={size} height={size} viewBox="0 0 27 27" role="img" aria-label="золотой орех">
    <defs>
      <linearGradient id="golden-nut-shell" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFF0BB" />
        <stop offset="45%" stopColor="#E9BF62" />
        <stop offset="100%" stopColor="#BE8833" />
      </linearGradient>
      <linearGradient id="golden-nut-groove" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#966D29" stopOpacity=".35" />
        <stop offset="48%" stopColor="#966D29" stopOpacity=".95" />
        <stop offset="100%" stopColor="#966D29" stopOpacity=".4" />
      </linearGradient>
    </defs>
    <path d="M13.6 2.2C10.9.1 7.7 1.2 6.6 3.6 3.7 2.7 1.6 5.2 2.1 8.1.1 10.1.8 13.1 2.9 14.8 1.5 17.4 3 20.1 5.6 20.7 6.4 23.8 9.5 25.1 12.1 23.7 14.1 26.1 17.4 25.3 18.4 22.8 21.6 22.9 23.5 20.1 22.5 17.6 25 15.6 24.8 12.6 22.7 10.9 24.1 8 22.6 5.4 20 5.1 19.2 2.2 16.2 1 13.6 2.2Z" fill="url(#golden-nut-shell)" stroke="#966D29" strokeWidth=".8" strokeLinejoin="round"/>
    <path d="M13.5 2.6C10.9 4.8 11.3 7.5 13 9.4 10.7 11.3 10.8 14.3 13.1 16.1 11.5 18.1 12 21.6 14.1 24" fill="none" stroke="url(#golden-nut-groove)" strokeWidth="1.1" strokeLinecap="round"/>
    <path d="M7 4.1C8.7 5.4 9.3 7.3 8.7 9.1M4 12.1c2.2.1 3.6 1.4 3.7 3.5m12.2-8.1c-1.8 1.1-2.5 2.9-1.8 4.8m2.1 3.1c-2.2.1-3.4 1.6-3.3 3.7" fill="none" stroke="#966D29" strokeOpacity=".55" strokeWidth=".7" strokeLinecap="round"/>
  </svg>;
}
function GoalCard({ goal, onClick }: { goal: Goal; onClick: () => void }) {
  const pct = Math.min(100, Math.round(goal.saved / goal.target * 100));
  return <button className="goal-card" onClick={onClick} data-testid={`goal-${goal.id}`}><div className="goal-name">{goal.title}<ChevronRight size={16} color="#2169ff"/></div><div className="goal-meta"><span>{goal.saved} из {goal.target} BYN</span><b style={{color:'#416bff'}}>{pct}%</b></div><div className="progress"><i style={{width:`${pct}%`}}/></div><div className="goal-left">Осталось {goal.target-goal.saved} BYN</div></button>;
}

function App() {
  const [role, setRole] = useState<Role>('picker');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [parentTab, setParentTab] = useState('family');
  const [childTab, setChildTab] = useState('home');
  const [lessonTab, setLessonTab] = useState<'video'|'tasks'>('video');
  const [lessonLevel, setLessonLevel] = useState(1);
  const [highestUnlockedLesson, setHighestUnlockedLesson] = useState(1);
  const [completedLessons, setCompletedLessons] = useState<Record<number, boolean>>({});
  const learningLevels = [
    {title:'Нужно или хочется?',eyebrow:'ПЕРВЫЕ ШАГИ',intro:'Научись отличать то, что необходимо, от того, что просто хочется.',lesson:'Сначала подумай о необходимом, а потом решай, на что копить.'},
    {title:'Моя копилка',eyebrow:'СБЕРЕЖЕНИЯ',intro:'Разберись, как откладывать деньги на свои цели.',lesson:'Даже небольшая сумма растёт, если откладывать регулярно. Выбери цель и реши, сколько можешь сохранить.'},
    {title:'План покупок',eyebrow:'УМНЫЕ ПОКУПКИ',intro:'Сравни варианты и составь план покупки.',lesson:'Перед покупкой сравни цены, проверь качество и подумай, действительно ли вещь тебе нужна.'},
    {title:'Банк рядом',eyebrow:'БАНК И КАРТА',intro:'Узнай, зачем нужны банк и банковская карта.',lesson:'Банк помогает хранить деньги и проводить платежи. Никому не сообщай PIN-код и коды подтверждения.'},
    {title:'Умный выбор',eyebrow:'СРАВНИВАЙ',intro:'Учись принимать решения и выбирать лучшее предложение.',lesson:'Сравнивай цену, качество и пользу. Самый дешёвый вариант не всегда самый выгодный.'},
    {title:'Копим на мечту',eyebrow:'ЦЕЛИ',intro:'Разбей большую мечту на маленькие шаги.',lesson:'Определи стоимость мечты, срок и сумму, которую будешь откладывать каждую неделю.'},
    {title:'Бережём деньги',eyebrow:'БЕЗОПАСНОСТЬ',intro:'Узнай, как защищать деньги и замечать подозрительные просьбы.',lesson:'Не передавай карту другим людям, не сообщай пароли и обсуждай подозрительные сообщения со взрослым.'}
  ];
  const [lessonAnswers, setLessonAnswers] = useState<Record<number,string>>({});
  const [lessonChecked, setLessonChecked] = useState(false);
  const [selected, setSelected] = useState(CHILD_USER_ID);
  const [confirmed, setConfirmed] = useState(false);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [familyResponse, setFamilyResponse] = useState<FamilyResponse | null>(null);
  const [familyParents, setFamilyParents] = useState<FamilyResponse['parents']>([]);
  const [apiPayloads, setApiPayloads] = useState<{
    child: ChildResponse | null;
    piggybank: PiggybankResponse | null;
    tasks: TasksResponse | null;
    transactions: TransactionsResponse | null;
    analytics: AnalyticsResponse | null;
  }>({ child: null, piggybank: null, tasks: null, transactions: null, analytics: null });
  const [apiSources, setApiSources] = useState<Record<string, 'api' | 'mock' | 'error'>>({});
  const [goals, setGoals] = useState<Goal[]>([]);
  const [balance, setBalance] = useState(15.4);
  const [savings, setSavings] = useState(100);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState('');
  const [unread, setUnread] = useState<number[]>([1, 2]);
  const [autoTransfer, setAutoTransfer] = useState(true);
  const [frequency, setFrequency] = useState('Еженедельно');
  const [pocket, setPocket] = useState('20,00');
  const [taskDone, setTaskDone] = useState(false);
  const [taskToReject, setTaskToReject] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('Никита');
  const [parentMessages, setParentMessages] = useState(['Доброе утро! Не забудь взять карту в школу.']);
  const [messageDraft, setMessageDraft] = useState('');
  const [formError, setFormError] = useState('');
  const currentChild = children.find(child => child.id === selected) ?? children[0];
  const activeGoals = goals.length;
  const historyRef = useRef<HTMLElement | null>(null);
  const [historyFrom, setHistoryFrom] = useState('2026-10-12');
  const [historyTo, setHistoryTo] = useState('2026-10-20');
  const [analyticsRange, setAnalyticsRange] = useState<'week'|'month'|'year'>('week');
  const [taskStatusFilter, setTaskStatusFilter] = useState('ALL');
  const [analyticsFrom, setAnalyticsFrom] = useState('2026-10-14');
  const [analyticsTo, setAnalyticsTo] = useState('2026-10-20');
  const [childCards, setChildCards] = useState<Record<string, ChildResponse>>({});
  const [taskToSubmit, setTaskToSubmit] = useState<string | null>(null);
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2300); };
  const switchRole = (next: 'parent'|'child') => {
    // Demo role selector, not authentication. Keep the selected real child UUID across roles.
    const childId = children.some(child => child.id === selected) ? selected : CHILD_USER_ID;
    setCurrentUserId(next === 'parent' ? PARENT_USER_ID : childId);
    if (next === 'child') setSelected(childId);
    setRole(next);
    setParentTab('family');
    setChildTab('home');
  };
  const navigateChild = (key: string) => {
    setChildTab(key);
    if (key === 'notifications') setUnread([]);
  };
  const navigateParent = (key: string) => { setParentTab(key); };
  const openModal = (kind: ModalKind, title: string, description?: string) => { setFormError(''); setModal({kind, title, description}); };
  const readNotification = (id: number) => setUnread(ids => ids.filter(item => item !== id));

  const submitModal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (modal?.kind === 'goal') {
      const title = String(data.get('name') || '').trim();
      const target = Number(data.get('target'));
      if (!title || !target || target < 1) { setFormError('Укажи название и сумму цели.'); return; }
      if (role === 'parent') {
        if (!currentChild?.id) { setFormError('Сначала выбери ребёнка.'); return; }
        try {
          const created = await createGoal(currentChild.id, { title, target_amount: target.toFixed(2), currency: apiPayloads.child?.balance_block?.currency ?? 'BYN' }) as any;
          const goal = created?.goal ?? created;
          const goalId = goal?.goal_id ?? goal?.id;
          if (!goalId) throw new Error('API не вернул ID созданной цели');
          const mappedGoal = { id: goalId, title: goal.title ?? title, saved: toAmount(goal.current_amount), target: toAmount(goal.target_amount ?? target), glyph: 'gift' as const };
          setGoals(items => [...items, mappedGoal]);
          const refreshed = await getChildPiggybank(currentChild.id);
          setApiPayloads(current => ({ ...current, piggybank: refreshed }));
          showToast('Цель создана через API');
        } catch (error) { setFormError(error instanceof Error ? error.message : 'Не удалось создать цель'); return; }
      } else {
        setGoals(items => [...items, { id: Date.now(), title, target, saved: 0, glyph: 'gift' }]);
        showToast('Цель добавлена в демо-копилку');
      }
    } else if (modal?.kind === 'topup') {
      const amount = Number(data.get('amount'));
      if (!Number.isFinite(amount) || amount <= 0) { setFormError('Введи сумму больше нуля.'); return; }
      if (role === 'parent') {
        const childCardId = apiPayloads.child?.balance_block?.card_id;
        const goalTitle = modal.title.startsWith('Пополнить: ') ? modal.title.replace('Пополнить: ', '') : '';
        const apiGoal = (apiPayloads.piggybank?.goals ?? []).filter(Boolean).find(goal => goal.title === goalTitle);
        if (goalTitle && apiGoal && childCardId) {
          try {
            await contributeToGoal(apiGoal.goal_id, { amount: amount.toFixed(2), source_card_id: childCardId, title: `Пополнение цели: ${goalTitle}` }, crypto.randomUUID());
            const refreshed = await getChildPiggybank(selected);
            setApiPayloads(current => ({ ...current, piggybank: refreshed }));
            setGoals((refreshed.goals ?? []).filter(Boolean).map(goal => ({ id: goal.goal_id, title: goal.title, saved: toAmount(goal.current_amount), target: Math.max(1, toAmount(goal.target_amount)), glyph: 'gift' as const })));
            showToast('Цель пополнена через API');
          } catch (error) { setFormError(error instanceof Error ? error.message : 'Не удалось пополнить цель'); return; }
        } else if (modal.title.toLowerCase().includes('карту') && childCardId) {
          const parentCardId = (import.meta.env.VITE_PARENT_CARD_ID as string | undefined)?.trim() || apiPayloads.tasks?.tasks?.find(task => task?.payout_source_card?.card_id)?.payout_source_card?.card_id;
          if (!parentCardId) { setFormError('Не удалось определить родительскую карту из данных API. Проверь настройку payout_source_card или задай VITE_PARENT_CARD_ID в окружении.'); return; }
          try {
            await createCardTransfer(parentCardId, { destination_card_id: childCardId, amount: amount.toFixed(2), currency: apiPayloads.child?.balance_block?.currency ?? 'BYN', title: `Пополнение карты ${currentChild?.name ?? ''}`.trim() }, crypto.randomUUID());
            const refreshed = await getChild(selected);
            setApiPayloads(current => ({ ...current, child: refreshed }));
            const refreshedFamily = await getFamily();
            setFamilyResponse(refreshedFamily);
            setChildren((refreshedFamily.children ?? []).filter(Boolean).map(child => ({ id: child.id, name: child.name, age: child.age, balance: toAmount(child?.balance_summary?.amount), limit: 20 })));
            showToast('Перевод с родительской карты выполнен');
          } catch (error) { setFormError(error instanceof Error ? error.message : 'Не удалось перевести деньги'); return; }
        } else {
          setFormError('У выбранного ребёнка нет доступной карты или цели в данных API.');
          return;
        }
      } else {
        setFormError('Пополнение карты выполняет родитель: это перевод между картами, а не создание денег на счёте.');
        return;
      }
    } else if (modal?.kind === 'proof' && taskToSubmit && currentUserId) {
      const comment = String(data.get('comment') || '').trim();
      const proofPhotoUrl = String(data.get('proof_photo_url') || '').trim();
      try {
        await submitTask(taskToSubmit, { ...(comment ? { comment } : {}), ...(proofPhotoUrl ? { proof_photo_url: proofPhotoUrl } : {}) }, currentUserId);
        const refreshed = await getChildTasksAsChild(currentUserId);
        setApiPayloads(current => ({ ...current, tasks: refreshed }));
        setTaskToSubmit(null);
        showToast('Задание отправлено родителю на проверку');
      } catch (error) { setFormError(error instanceof Error ? error.message : 'Не удалось отправить задание'); return; }
    } else if (modal?.kind === 'task') {
      const title = String(data.get('name') || '').trim();
      const description = String(data.get('description') || '').trim();
      const reward = Number(data.get('reward') || 0);
      const penalty = Number(data.get('penalty') || 0);
      const deadlineValue = String(data.get('deadline') || '').trim();
      if (!title) { setFormError('Добавь название задания.'); return; }
      if (!currentChild?.id) { setFormError('Сначала выбери ребёнка.'); return; }
      try {
        let payoutCardId = String(import.meta.env.VITE_PARENT_CARD_ID || '').trim();
        if ((reward > 0 || penalty > 0) && !payoutCardId) {
          try {
            const cardResult = await getUserCards(PARENT_USER_ID);
            payoutCardId = cardResult.cards.find(card => card.status === 'ACTIVE' && card.is_primary)?.card_id
              || cardResult.cards.find(card => card.status === 'ACTIVE')?.card_id
              || '';
          } catch (cardError) {
            setFormError(cardError instanceof Error ? `Не удалось загрузить карту родителя: ${cardError.message}` : 'Не удалось загрузить карту родителя.');
            return;
          }
        }
        if ((reward > 0 || penalty > 0) && !payoutCardId) { setFormError('У родителя нет активной карты. Сначала добавь карту в банковском API.'); return; }
        const result = await createTask(currentChild.id, { title, description, reward_amount: reward.toFixed(2), penalty_amount: penalty.toFixed(2), currency: apiPayloads.child?.balance_block?.currency ?? 'BYN', ...(payoutCardId ? { payout_source_card_id: payoutCardId } : {}), ...(deadlineValue ? { deadline: new Date(deadlineValue).toISOString() } : {}) });
        const createdTask = (result as any).task ?? result;
        setApiPayloads(current => ({ ...current, tasks: { tasks: [createdTask, ...(current.tasks?.tasks ?? []).filter(task => task.task_id !== createdTask.task_id)] } }));
        showToast('Задание создано через API');
      } catch (error) { setFormError(error instanceof Error ? error.message : 'Не удалось создать задание'); return; }
    } else if (modal?.kind === 'member') {
      const name = String(data.get('name') || '').trim();
      const age = Number(data.get('age'));
      const birthDateInput = String(data.get('birth_date') || '').trim();
      if (!name || !age) { setFormError('Заполни имя и возраст.'); return; }
      if (!familyResponse?.family_id) { setFormError('Не удалось определить семью из API. Обнови вкладку «Семья» и попробуй снова.'); return; }
      const birthDate = birthDateInput || `${new Date().getFullYear() - age}-01-01`;
      const memberRole = String(data.get('member_role') || 'CHILD');
      try {
        if (memberRole === 'PARENT') {
          const parentRole = String(data.get('parent_role') || 'GUARDIAN') as 'MOTHER' | 'FATHER' | 'GUARDIAN';
          const created = await createParent(familyResponse.family_id, { name, birth_date: birthDate, parent_role: parentRole });
          const parent = (created as any).parent ?? created;
          if (!parent?.id) throw new Error('API создал запись родителя, но не вернул id');
          setFamilyParents(items => [...items.filter(item => item.id !== parent.id), parent]);
          setFamilyResponse(current => current ? { ...current, parents: [...current.parents.filter(item => item.id !== parent.id), parent] } : current);
          showToast(`${parent.name ?? name} добавлен(а) в семью`);
        } else {
          const created = await createChild(familyResponse.family_id, { name, birth_date: birthDate });
          const child = (created as any).child_info ?? (created as any).child ?? created;
          if (!child?.id) throw new Error('API создал запись, но не вернул id ребёнка');
          const mapped = { id: child.id, name: child.name ?? name, age: Number(child.age ?? age), balance: toAmount(child.balance_summary?.amount), limit: 15 };
          setChildren(items => [...items, mapped]);
          setSelected(mapped.id);
          setFamilyResponse(current => current ? { ...current, children: [...current.children, child] } : current);
          showToast(`${mapped.name} добавлен(а) в семью`);
        }
      } catch (error) { setFormError(error instanceof Error ? error.message : 'Не удалось добавить участника семьи'); return; }
    } else if (modal?.title === 'Отправить на доработку' && taskToReject) {
      const comment = String(data.get('rejection_comment') || '').trim();
      if (!comment) { setFormError('Добавь комментарий для ребёнка.'); return; }
      try { await rejectTask(taskToReject, comment); const refreshed = await getChildTasks(selected); setApiPayloads(current => ({ ...current, tasks: refreshed })); setTaskToReject(null); showToast('Задание отправлено на доработку'); }
      catch (error) { setFormError(error instanceof Error ? error.message : 'Не удалось отклонить задание'); return; }
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

  // In child demo mode, fetch the selected seeded child's profile using its real UUID.
  useEffect(() => {
    if (role !== 'child' || !currentUserId) return;
    let cancelled = false;
    Promise.all([getChildDashboard(currentUserId), getChildPiggybankAsChild(currentUserId), getChildTasksAsChild(currentUserId), getChildAnalyticsAsChild(currentUserId, analyticsFrom, analyticsTo)]).then(([data, piggybank, tasks, analytics]) => {
      const dashboardTransactions = ((data as any)?.recent_transactions ?? []).filter(Boolean);
      const transactions: TransactionsResponse = { requested_period: { date_from: historyFrom, date_to: historyTo }, summary: { total_income: '0.00', total_outcome: '0.00', currency: 'BYN' }, items: dashboardTransactions.map((item: any) => ({ transaction_id: item.transaction_id, title: item.title, timestamp: item.timestamp, direction: item.direction, amount: item.amount, currency: item.currency, category_code: item.category_code, related_entity: { type: 'NONE', id: null } })) };
      if (cancelled) return;
      setProfileName(data?.child_info?.name ?? 'Ребёнок');
      setBalance(toAmount((data?.balance_block as any)?.active_balance ?? data?.balance_block?.amount));
      setSavings(toAmount(data?.money_categories?.piggy_bank?.amount ?? piggybank?.total_saved_amount));
      if (data?.child_info?.id) setSelected(data.child_info.id);
      const mappedGoals = (piggybank?.goals ?? []).filter(Boolean).map(goal => ({ id: goal.goal_id, title: goal.title, saved: toAmount(goal.current_amount), target: Math.max(1, toAmount(goal.target_amount)), glyph: /науш|headphone/i.test(goal.title) ? 'headphones' as const : /велосип|bike/i.test(goal.title) ? 'bike' as const : /игр|game|пристав/i.test(goal.title) ? 'game' as const : /книг|конструкт|book/i.test(goal.title) ? 'book' as const : 'gift' as const }));
      setGoals(mappedGoals);
      setApiPayloads({ child: data, piggybank, tasks, transactions, analytics });
      setApiSources(current => ({ ...current, child: getDataSource(`/api/v1/child/${encodeURIComponent(currentUserId)}/dashboard`), piggybank: getDataSource(`/api/v1/child/${encodeURIComponent(currentUserId)}/piggybank`), tasks: getDataSource(`/api/v1/child/${encodeURIComponent(currentUserId)}/tasks`), transactions: getDataSource(`/api/v1/child/${encodeURIComponent(currentUserId)}/transactions?date_from=${encodeURIComponent(historyFrom)}&date_to=${encodeURIComponent(historyTo)}`), analytics: getDataSource(`/api/v1/child/${encodeURIComponent(currentUserId)}/analytics?date_from=${encodeURIComponent(analyticsFrom)}&date_to=${encodeURIComponent(analyticsTo)}`) }));
    }).catch(error => { if (!cancelled) showToast(error instanceof Error ? error.message : 'Не удалось загрузить данные ребёнка'); });
    return () => { cancelled = true; };
  }, [role, currentUserId, historyFrom, historyTo, analyticsFrom, analyticsTo]);

  // Load family when the parent opens the Family tab. API functions use mock data only on request failure.
  useEffect(() => {
    if (!['parent', 'picker'].includes(role) || (role === 'parent' && parentTab !== 'family')) return;
    let cancelled = false;
    getFamily().then(data => {
      if (cancelled) return;
      setFamilyResponse(data);
      setFamilyParents(data.parents ?? []);
      const mapped = (data.children ?? []).filter(Boolean).map(child => ({
        id: child.id,
        name: child.name,
        age: child.age,
        balance: toAmount(child?.balance_summary?.amount),
        limit: 20,
      }));
      setChildren(mapped);
      setSelected(current => mapped.some(child => child.id === current) ? current : (mapped[0]?.id ?? CHILD_USER_ID)); 
      setApiSources(current => ({ ...current, family: getDataSource(`/api/v1/family/my?family_id=${encodeURIComponent(data.family_id)}`) }));
    }).catch(error => { if (!cancelled) showToast(error instanceof Error ? error.message : 'Не удалось загрузить семью'); });
    return () => { cancelled = true; };
  }, [role, parentTab]);

  // Populate card details for the Cards tab from the same child-profile GET endpoint.
  useEffect(() => {
    if (role !== 'parent' || parentTab !== 'products' || children.length === 0) return;
    let cancelled = false;
    Promise.all(children.map(async child => [child.id, await getChild(child.id)] as const)).then(entries => {
      if (cancelled) return;
      setChildCards(Object.fromEntries(entries));
    }).catch(error => { if (!cancelled) showToast(error instanceof Error ? error.message : 'Не удалось загрузить карты'); });
    return () => { cancelled = true; };
  }, [role, parentTab, children.map(child => child.id).join('|')]);

  // Load all read-only child endpoints when a parent opens the selected child's profile.
  useEffect(() => {
    if (role !== 'parent' || !['details','goals','analytics'].includes(parentTab) || !selected) return;
    let cancelled = false;
    const from = historyFrom;
    const to = historyTo;
    const transactionFrom = parentTab === 'analytics' ? analyticsFrom : from;
    const transactionTo = parentTab === 'analytics' ? analyticsTo : to;
    Promise.all([
      getChild(selected),
      getChildPiggybank(selected),
      getChildTasks(selected),
      getChildTransactions(selected, transactionFrom, transactionTo),
      getChildAnalytics(selected, analyticsFrom, analyticsTo),
    ]).then(([child, piggybank, tasks, transactions, analytics]) => {
      if (cancelled) return;
      setApiPayloads({ child, piggybank, tasks, transactions, analytics });
      const mappedGoals = (piggybank?.goals ?? []).map(goal => ({
        id: goal.goal_id, title: goal.title, saved: toAmount(goal.current_amount), target: Math.max(1, toAmount(goal.target_amount)),
        glyph: /науш|headphone/i.test(goal.title) ? 'headphones' as const : /велосип|bike/i.test(goal.title) ? 'bike' as const : /игр|game|пристав/i.test(goal.title) ? 'game' as const : /книг|конструкт|book/i.test(goal.title) ? 'book' as const : 'gift' as const,
      }));
      setGoals(mappedGoals);
      setAutoTransfer(Boolean(child?.pocket_money_settings?.is_auto_transfer_enabled));
      setPocket(toAmount(child?.pocket_money_settings?.transfer_amount).toFixed(2).replace('.', ','));
      setFrequency(({ DAILY: 'Ежедневно', WEEKLY: 'Еженедельно', MONTHLY: 'Ежемесячно' } as const)[child?.pocket_money_settings?.recurrence?.frequency ?? 'WEEKLY']);
      setApiSources(current => ({
        ...current,
        child: getDataSource(`/api/v1/children/${encodeURIComponent(selected)}`),
        piggybank: getDataSource(`/api/v1/children/${encodeURIComponent(selected)}/piggybank`),
        tasks: getDataSource(`/api/v1/children/${encodeURIComponent(selected)}/tasks`),
        transactions: getDataSource(`/api/v1/children/${encodeURIComponent(selected)}/transactions?date_from=${encodeURIComponent(transactionFrom)}&date_to=${encodeURIComponent(transactionTo)}`),
        analytics: getDataSource(`/api/v1/children/${encodeURIComponent(selected)}/analytics?date_from=${encodeURIComponent(analyticsFrom)}&date_to=${encodeURIComponent(analyticsTo)}`),
      }));
      setChildren(current => current.map(item => item.id === selected ? {
        ...item,
        name: child.child_info.name,
        age: child.child_info.age,
        balance: toAmount(child?.balance_block?.amount),
      } : item));
    }).catch(error => { if (!cancelled) showToast(error instanceof Error ? error.message : 'Не удалось загрузить данные ребёнка'); });
    return () => { cancelled = true; };
  }, [role, parentTab, selected, historyFrom, historyTo, analyticsFrom, analyticsTo]);
  const sortedNotifications = useMemo(() => [
    {id:1,title:'Задание выполнено',copy:'Ты отлично справился с заданием «Навести порядок на столе». Награда уже на карте.',time:'Сегодня, 10:24',icon:Award},
    {id:2,title:'Накопления растут',copy:'В копилку добавлено 15 BYN. До цели «Наушники» осталось совсем немного.',time:'Сегодня, 09:10',icon:PiggyBank},
    {id:3,title:'Карманные деньги',copy:'Папа пополнил карту на 20 BYN. Хорошего дня!',time:'Вчера, 18:42',icon:Wallet},
    {id:4,title:'Новая цель',copy:'Цель «Скейтборд» ждёт тебя в копилке. Каждый шаг приближает к мечте.',time:'12 октября',icon:Sparkles},
  ], []);

  const rolePicker = <div className="app-stage"><div className="role-picker"><div className="role-brand">moby<em style={{fontSize:14,fontStyle:'italic',marginLeft:4}}>family</em></div><h1>Деньги —<br/>семейное дело.</h1><p>Выбери режим демо-приложения. Можно переключаться между родителем и ребёнком в любой момент.</p><button className="role-card" data-testid="role-parent" onClick={()=>switchRole('parent')}><span className="role-icon"><UsersRound size={26}/></span><span><b>Я родитель</b><small>Семья, дети и управление деньгами</small></span><ChevronRight className="role-arrow"/></button>{children.length > 0 && <div style={{margin:'14px 0 8px',textAlign:'left'}}><label htmlFor="select-child" style={{display:'block',fontSize:12,color:'#66758b',marginBottom:6}}>Режим ребёнка</label><select id="select-child" className="form-control" data-testid="select-child" value={children.some(child=>child.id===selected)?selected:(children[0]?.id ?? CHILD_USER_ID)} onChange={event=>setSelected(event.target.value)}>{children.map(child=><option key={child.id} value={child.id}>{child.name}</option>)}</select></div>}<button className="role-card" data-testid="role-child" onClick={()=>switchRole('child')}><span className="role-icon"><UserRound size={26}/></span><span><b>Я ребёнок</b><small>Главная, копилка и профиль выбранного ребёнка</small></span><ChevronRight className="role-arrow"/></button><div className="role-foot">Демо-режим · выбраны тестовые ID из базы, входа в аккаунт нет</div></div></div>;

  const childHeader = (withGreeting = true) => <><div className="brandbar"><Brand/><IconButton label="Уведомления" testId="open-notifications" onClick={()=>navigateChild('notifications')}><Bell size={21}/>{unread.length>0&&<i style={{width:7,height:7,borderRadius:50,background:'#2169ff',position:'absolute',transform:'translate(8px,-8px)',border:'1.5px solid white'}}/>}</IconButton></div>{withGreeting&&<div className="greeting"><h1>Привет, {profileName}!</h1><button className="avatar-small" data-testid="open-profile" onClick={()=>navigateChild('profile')}>{profileName[0]}</button></div>}</>;

  const childHome = <><div className="phone-content"><StatusBar/>{childHeader()}<div className="balances">
    <div className="bank-card"><div className="card-brand"><span>moby</span><Wifi size={18}/></div><div className="card-label">Активный баланс · {apiPayloads.child?.balance_block?.card_bank ?? 'moby family'}</div><div className="card-amount">{toAmount(balance).toFixed(2)} {apiPayloads.child?.balance_block?.currency ?? 'BYN'}</div><div className="card-footer"><span>•••• {apiPayloads.child?.balance_block?.card_mask ?? '4821'}</span><span className="master-dots"><i/><i/></span></div></div>
    <button className="savings-teaser" onClick={()=>navigateChild('savings')} data-testid="open-savings"><div className="teaser-head">Пассивный баланс<ChevronRight size={16} color="#2169ff"/></div><div className="teaser-amount">{toAmount(savings).toFixed(2)} {apiPayloads.piggybank?.currency ?? apiPayloads.child?.money_categories?.piggy_bank?.currency ?? 'BYN'}</div><div className="treasure-art"><img className="treasure-img" src="/treasure-chest.png" alt="Сундук с накоплениями"/></div><div className="teaser-link"><span>В копилку</span><ArrowUpRight size={16}/></div></button>
  </div>
  <section className="section"><div className="section-title"><h2>Твои цели</h2><button className="text-action" data-testid="link-goals" onClick={()=>navigateChild('savings')}>Копилка <ChevronRight size={14} style={{verticalAlign:'middle'}}/></button></div><div className="goal-strip">{goals.map(goal=><GoalCard key={goal.id} goal={goal} onClick={()=>navigateChild('savings')}/>)}</div><div style={{display:'flex',justifyContent:'center',gap:4,marginTop:9}}><i style={{width:14,height:4,borderRadius:5,background:'#2169ff'}}/><i style={{width:4,height:4,borderRadius:5,background:'#d8e2f3'}}/><i style={{width:4,height:4,borderRadius:5,background:'#d8e2f3'}}/></div></section>
  <section className="section"><div className="section-title"><h2>Задания от родителей</h2><button className="text-action" data-testid="show-all-tasks" onClick={()=>showToast(`Заданий: ${apiPayloads.tasks?.tasks?.length ?? 0}`)}>Все <ChevronRight size={14} style={{verticalAlign:'middle'}}/></button></div><div className="task-strip">{(apiPayloads.tasks?.tasks ?? []).slice(0,3).map(task=><button className="task-card" key={task.task_id} data-testid={`task-${task.task_id}`} onClick={()=>{if(['IN_PROGRESS','REJECTED_NEED_FIX'].includes(task.status)){setTaskToSubmit(task.task_id);openModal('proof',`Отправить на проверку: ${task.title}`);}else{showToast(`Статус задания: ${({IN_PROGRESS:'В процессе',WAITING_REVIEW:'Ожидает проверки',REJECTED_NEED_FIX:'Нужно исправить',COMPLETED:'Выполнено',CANCELLED:'Отменено'} as const)[task.status]}`);}}}><div className="task-reward"><span>+{toAmount(task.reward_amount).toFixed(2).replace('.', ',')} {task.currency}</span><Award size={18}/></div><div className="task-copy">{task.title}</div><div className="task-progress">{({IN_PROGRESS:'В процессе',WAITING_REVIEW:'Ожидает проверки',REJECTED_NEED_FIX:'Нужно исправить',COMPLETED:'Выполнено',CANCELLED:'Отменено'} as const)[task.status]}</div></button>)}{!(apiPayloads.tasks?.tasks?.length)&&<div className="empty-note">Новых заданий нет</div>}</div></section>
  <section className="section"><div className="section-title"><h2>Твои последние операции</h2><button className="text-action" data-testid="all-transactions" onClick={()=>{setRole('parent');setSelected(currentUserId ?? CHILD_USER_ID);setParentTab('details');}}>Все <ChevronRight size={14} style={{verticalAlign:'middle'}}/></button></div><div className="transactions">{(apiPayloads.transactions?.items ?? []).slice(0,3).map((item,index)=><div className="transaction" key={item.transaction_id} data-testid={`transaction-${index}`}><span className="transaction-icon"><History size={19}/></span><span className="transaction-copy"><b>{item.title}</b><small>{new Date(item.timestamp).toLocaleDateString('ru-RU')} · {item.category_code}</small></span><span className="transaction-amount">{item.direction==='INCOME'?'+':'−'}{toAmount(item.amount).toFixed(2).replace('.', ',')} {item.currency}</span></div>)}{!(apiPayloads.transactions?.items?.length)&&<div className="empty-note">Операций пока нет</div>}</div></section></div><BottomNav active="home" onSelect={navigateChild}/></>;

  const childSavings = <><div className="phone-content"><StatusBar/><div className="brandbar"><Brand dark/></div><div className="page-head"><h1>Копилка</h1></div><div className="savings-hero"><div className="big-treasure"><img className="treasure-large" src="/treasure-chest.png" alt="Сундук с накоплениями"/></div><div className="balance-label">Пассивный баланс</div><div className="balance-big">{savings.toFixed(2)} BYN</div><button className="primary-btn" data-testid="create-goal" onClick={()=>openModal('goal','Создать цель')}><Plus size={19}/>Создать цель</button></div><section className="savings-list"><div className="section-title"><h2>Твои цели</h2><span className="active-pill">{activeGoals} активных</span></div>{goals.map(goal=>{const pct=Math.round(goal.saved/goal.target*100);return <div className="saving-goal" key={goal.id} data-testid={`savings-goal-${goal.id}`} onClick={()=>openModal('topup',`Пополнить: ${goal.title}`)}><div className="saving-goal-title">{goal.title}<ChevronRight size={15} color="#416bff"/></div><div className="saving-goal-meta"><span>{goal.saved} из {goal.target} BYN</span><b style={{color:'#416bff'}}>{pct}%</b></div><div className="progress"><i style={{width:`${pct}%`}}/></div><div className="saving-goal-foot">Осталось {goal.target-goal.saved} BYN</div></div>})}</section></div><BottomNav active="savings" onSelect={navigateChild}/></>;

  const childProfile = <><div className="phone-content"><StatusBar/><div className="brandbar"><Brand dark/></div><div className="page-head"><h1>Профиль</h1></div><div className="profile-content"><div className="profile-intro"><div className="profile-avatar"><UserRound size={58} strokeWidth={1.5}/></div><h2>{profileName}</h2><p>Твой профиль в Moby Family</p><button className="avatar-action" data-testid="change-avatar" onClick={()=>showToast('Аватар Никиты обновлён')}><Pencil size={16}/>Сменить аватар</button></div><section className="profile-block"><h2>О тебе</h2><div className="profile-info"><div className="profile-info-row"><span>Имя</span><button data-testid="edit-profile-name" onClick={()=>openModal('edit','Изменить имя')} style={{border:0,background:'none',fontWeight:700,color:'#304b70'}}>{profileName}</button></div><div className="profile-info-row"><span>Возраст</span><b>12 лет</b></div></div></section><section className="profile-block"><h2>Настройки</h2><div className="settings-list"><button className="setting-row" data-testid="setting-notifications" onClick={()=>navigateChild('notifications')}><span className="setting-icon"><Bell size={20}/></span><span className="setting-text"><b>Уведомления</b><small>О заданиях и накоплениях</small></span><ChevronRight className="setting-chevron"/></button><button className="setting-row" data-testid="setting-security" onClick={()=>openModal('generic','Безопасность','Код входа в приложение')}><span className="setting-icon"><ShieldCheck size={20}/></span><span className="setting-text"><b>Безопасность</b><small>Код входа в приложение</small></span><ChevronRight className="setting-chevron"/></button><button className="setting-row" data-testid="setting-help" onClick={()=>openModal('generic','Помощь','Ответы на твои вопросы')}><span className="setting-icon"><CircleHelp size={20}/></span><span className="setting-text"><b>Помощь</b><small>Ответы на твои вопросы</small></span><ChevronRight className="setting-chevron"/></button></div></section><button className="logout-btn" data-testid="switch-role-profile" onClick={()=>setRole('picker')}>Выйти из профиля</button></div></div><BottomNav active="profile" onSelect={navigateChild}/></>;

  const notificationsPage = <><div className="phone-content"><StatusBar/><div className="brandbar"><button className="back-role" aria-label="Назад" data-testid="back-from-notifications" onClick={()=>navigateChild('home')}><ArrowLeft size={19}/></button><Brand/><span style={{width:34}}/></div><div className="page-head" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h1 style={{fontSize:26}}>Уведомления</h1>{unread.length>0&&<button className="text-action" data-testid="mark-all-read" onClick={()=>setUnread([])}>Прочитать всё</button>}</div><div className="notifications-list"><h3 style={{fontSize:13,color:'#8a99ae',margin:'7px 2px'}}>Недавние</h3>{sortedNotifications.map(item=><div className={`notification-card ${unread.includes(item.id)?'unread':''}`} key={item.id} data-testid={`notification-${item.id}`} role="button" tabIndex={0} onClick={()=>readNotification(item.id)} onKeyDown={event=>{if(event.key==='Enter')readNotification(item.id)}}><span className="notification-icon"><item.icon size={19}/></span><span className="notification-copy"><b>{item.title}</b><p>{item.copy}</p><small>{item.time}</small></span>{unread.includes(item.id)&&<i className="notif-dot"/>}</div>)}</div></div><BottomNav active="profile" onSelect={navigateChild}/></>;

  const openLesson = (level: number) => {
    setLessonLevel(level);
    setLessonTab('video');
    setLessonChecked(false);
    setLessonAnswers({});
    navigateChild('lesson');
  };
  const learningMap = <><div className="phone-content learning-screen"><StatusBar/><div className="brandbar"><Brand dark/><span className="nut-balance"><GoldenNut size={22}/> 120</span></div><h1 className="learning-title">Стань мастером<br/>своих финансов!</h1><p className="learning-subtitle">Узнавай новое, открывай пути<br/>и собирай золотые орехи.</p><div className="map-eyebrow">ТВОЙ ПУТЬ К ФИНАНСОВОЙ СВОБОДЕ</div><div className="learning-map">
    <div className="map-side-icon map-side-pig" aria-hidden="true"><PiggyBank size={30} strokeWidth={1.7}/></div>
    <div className="map-side-icon map-side-bank" aria-hidden="true"><Landmark size={30} strokeWidth={1.7}/></div>
    <button className="map-node map-start" onClick={()=>openLesson(1)}><small>ТВОЙ ПЕРВЫЙ УРОК</small><b>1</b><strong>Нужно или хочется?</strong><span className="map-node-state">Доступно сейчас <ChevronRight size={13}/></span></button>
    <div className="map-connector map-down" aria-hidden="true"><svg viewBox="0 0 40 34"><path d="M20 1 V25 M12 18 L20 26 L28 18"/></svg></div>
    <button className={`map-node map-level-two ${highestUnlockedLesson >= 2 ? 'map-available' : 'map-locked'}`} disabled={highestUnlockedLesson < 2} onClick={()=>openLesson(2)} aria-label="Урок 2: Моя копилка"><b>2</b><strong>Моя копилка</strong>{completedLessons[2] ? <span className="map-node-state map-node-complete">Пройден <Check size={12}/></span> : highestUnlockedLesson < 2 ? <LockKeyhole className="map-lock" size={16}/> : <span className="map-node-state">Открыт <ChevronRight size={12}/></span>}</button>
    <svg className="map-connector map-branch-two" viewBox="0 -12 400 58" preserveAspectRatio="none" aria-hidden="true"><path d="M200 -12 V-2 C200 19 105 19 100 38 M200 -2 C200 19 295 19 300 38 M92 30 L100 38 L108 30 M292 30 L300 38 L308 30"/></svg>
    <div className="map-pair">
      <button className={`map-node ${highestUnlockedLesson >= 3 ? 'map-available' : 'map-locked'}`} disabled={highestUnlockedLesson < 3} onClick={()=>openLesson(3)} aria-label="Урок 3: План покупок"><b>3</b><strong>План покупок</strong>{completedLessons[3] ? <span className="map-node-state map-node-complete">Пройден <Check size={12}/></span> : highestUnlockedLesson < 3 ? <LockKeyhole className="map-lock" size={15}/> : <span className="map-node-state">Открыт <ChevronRight size={12}/></span>}</button>
      <button className={`map-node ${highestUnlockedLesson >= 4 ? 'map-available' : 'map-locked'}`} disabled={highestUnlockedLesson < 4} onClick={()=>openLesson(4)} aria-label="Урок 4: Банк рядом"><b>4</b><strong>Банк рядом</strong>{completedLessons[4] ? <span className="map-node-state map-node-complete">Пройден <Check size={12}/></span> : highestUnlockedLesson < 4 ? <LockKeyhole className="map-lock" size={15}/> : <span className="map-node-state">Открыт <ChevronRight size={12}/></span>}</button>
    </div>
    <svg className="map-connector map-branch-three" viewBox="0 0 400 62" preserveAspectRatio="none" aria-hidden="true"><path d="M100 0 C100 20 66 20 66 44 M100 0 C100 24 200 20 200 44 M300 0 C300 24 200 20 200 44 M300 0 C300 20 334 20 334 44 M58 36 L66 44 L74 36 M192 36 L200 44 L208 36 M326 36 L334 44 L342 36"/></svg>
    <div className="map-triple">
      <button className={`map-node ${highestUnlockedLesson >= 5 ? 'map-available' : 'map-locked'}`} disabled={highestUnlockedLesson < 5} onClick={()=>openLesson(5)} aria-label="Урок 5: Умный выбор"><b>5</b><strong>Умный выбор</strong>{completedLessons[5] ? <span className="map-node-state map-node-complete">Пройден <Check size={12}/></span> : highestUnlockedLesson < 5 ? <LockKeyhole className="map-lock" size={14}/> : <span className="map-node-state">Открыт <ChevronRight size={12}/></span>}</button>
      <button className={`map-node ${highestUnlockedLesson >= 6 ? 'map-available' : 'map-locked'}`} disabled={highestUnlockedLesson < 6} onClick={()=>openLesson(6)} aria-label="Урок 6: Копим на мечту"><b>6</b><strong>Копим на мечту</strong>{completedLessons[6] ? <span className="map-node-state map-node-complete">Пройден <Check size={12}/></span> : highestUnlockedLesson < 6 ? <LockKeyhole className="map-lock" size={14}/> : <span className="map-node-state">Открыт <ChevronRight size={12}/></span>}</button>
      <button className={`map-node ${highestUnlockedLesson >= 7 ? 'map-available' : 'map-locked'}`} disabled={highestUnlockedLesson < 7} onClick={()=>openLesson(7)} aria-label="Урок 7: Бережём деньги"><b>7</b><strong>Бережём деньги</strong>{completedLessons[7] ? <span className="map-node-state map-node-complete">Пройден <Check size={12}/></span> : highestUnlockedLesson < 7 ? <LockKeyhole className="map-lock" size={14}/> : <span className="map-node-state">Открыт <ChevronRight size={12}/></span>}</button>
    </div>
    <p className="map-unlock-note"><LockKeyhole size={14}/> Проходи уроки по порядку, чтобы открыть новые темы</p>
  </div><section className="start-lesson-card"><div className="start-lesson-heading"><div><h2>Начнём с простого?</h2><p>Урок 1 · видео и 3 задания</p></div><b className="reward"><GoldenNut size={25}/> +20</b></div><button className="primary-btn" onClick={()=>openLesson(1)}>Начать урок 1 <ChevronRight size={17}/></button></section></div><BottomNav active="map" onSelect={navigateChild}/></>;
  const childLearningTasks = <><div className="phone-content learning-screen"><StatusBar/><div className="brandbar"><Brand dark/><span className="nut-balance"><GoldenNut size={25}/> 120</span></div><h1 className="learning-title">Мои задания</h1><p className="learning-subtitle">Выполняй задания, отправляй на проверку и получай награды.</p><div className="child-tasks-list">{(apiPayloads.tasks?.tasks ?? []).map(task=>{const meta=({IN_PROGRESS:{label:'В процессе',color:'#5964f5',background:'#eef0ff'},WAITING_REVIEW:{label:'На проверке',color:'#b7791f',background:'#fff5dc'},REJECTED_NEED_FIX:{label:'Нужно исправить',color:'#c96848',background:'#fff0e9'},COMPLETED:{label:'Выполнено',color:'#329779',background:'#eaf7f1'},CANCELLED:{label:'Отменено',color:'#8291aa',background:'#eef1f7'}} as const)[task.status] ?? {label:task.status,color:'#8291aa',background:'#eef1f7'};const deadline=task.deadline?new Date(task.deadline):null;const actionable=['IN_PROGRESS','REJECTED_NEED_FIX'].includes(task.status);return <article className="task-detail-card child-task-detail" key={task.task_id} data-testid={`child-task-${task.task_id}`}><div className="task-card-meta"><span className="task-status-pill" style={{color:meta.color,background:meta.background}}><i style={{background:meta.color}}/>{meta.label}</span><time>{deadline?deadline.toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'Без срока'}</time></div><h3>{task.title}</h3><p>{task.description || 'Небольшой шаг к большой цели.'}</p><div className="task-card-footer"><b>+{toAmount(task.reward_amount).toFixed(2).replace('.', ',')} {task.currency}</b></div>{task.status==='REJECTED_NEED_FIX'&&<p className="child-task-feedback">Родитель попросил исправить задание и отправить его повторно.</p>}{actionable&&<button className="primary-btn child-task-submit" data-testid={`submit-child-task-${task.task_id}`} onClick={()=>{setTaskToSubmit(task.task_id);openModal('proof',`Отправить на проверку: ${task.title}`);}}>Отправить на проверку <ChevronRight size={16}/></button>}</article>})}{!(apiPayloads.tasks?.tasks?.length)&&<div className="tasks-empty"><Award size={30}/><b>Заданий пока нет</b><span>Когда родитель добавит задание, оно появится здесь.</span></div>}</div><button className="secondary-btn child-tasks-back" onClick={()=>navigateChild('map')}><ArrowLeft size={16}/> Вернуться к карте уровней</button></div><BottomNav active="tasks" onSelect={navigateChild}/></>;
  const childLesson = <><div className="phone-content lesson-screen"><StatusBar/><div className="lesson-top"><button className="back-pill" onClick={()=>navigateChild('map')}><ArrowLeft size={20}/></button><div><small>УРОК {lessonLevel} · {learningLevels[lessonLevel-1].eyebrow}</small><h1>{learningLevels[lessonLevel-1].title}</h1></div><span className="nut-balance"><GoldenNut size={25}/> 120</span></div><div className="lesson-tabs"><button className={lessonTab==='video'?'selected':''} onClick={()=>setLessonTab('video')}>Видео</button><button className={lessonTab==='tasks'?'selected':''} onClick={()=>setLessonTab('tasks')}>Задания</button></div>{lessonTab==='video'?<><div className="lesson-video"><button onClick={()=>showToast('Видео урока скоро появится')} aria-label="Воспроизвести видео">▶</button><span>02:30</span><footer>{learningLevels[lessonLevel-1].intro}</footer></div><h2 className="lesson-heading">{learningLevels[lessonLevel-1].title}</h2><p className="lesson-copy">{learningLevels[lessonLevel-1].intro}</p><div className="lesson-info"><b>{lessonLevel===1?'🛒 Нужды и желания':lessonLevel===2?'🐷 Регулярные сбережения':lessonLevel===3?'🛍️ План покупок':lessonLevel===4?'🏦 Безопасность в банке':lessonLevel===5?'🧠 Сравнение вариантов':lessonLevel===6?'🎯 Финансовая цель':'🔐 Защита денег'}</b><p>{learningLevels[lessonLevel-1].lesson}</p><b>Попробуй на практике</b><p>{lessonLevel===1?'Раздели покупки на необходимые и желанные.':lessonLevel===2?'Выбери сумму, которую сможешь откладывать регулярно.':lessonLevel===3?'Сравни несколько вариантов до покупки.':lessonLevel===4?'Никому не сообщай PIN-код и коды из SMS.':lessonLevel===5?'Сравни цену, качество и пользу.':lessonLevel===6?'Раздели цель на небольшие накопления.':'Попроси помощи взрослого, если сообщение кажется подозрительным.'}</p></div><button className="primary-btn lesson-cta" onClick={()=>setLessonTab('tasks')}>Перейти к заданиям</button></>:<><div className="lesson-progress"><b>{lessonChecked?'Результат урока':'Твоя очередь'}</b><span>{lessonChecked?'3 из 3 проверено':Object.keys(lessonAnswers).length+' из 3 отвечено'}</span></div><div className="quiz-card"><b>1. Что из этого — нужда?</b><p>Выбери одну покупку.</p><div className="quiz-options"><button className={lessonAnswers[1]==='bread'?'chosen':''} onClick={()=>{setLessonAnswers({...lessonAnswers,1:'bread'});setLessonChecked(false)}}>🥖 Хлеб</button><button className={lessonAnswers[1]==='rocket'?'chosen':''} onClick={()=>{setLessonAnswers({...lessonAnswers,1:'rocket'});setLessonChecked(false)}}>🚀 Ракета</button></div>{lessonChecked&&<small className={lessonAnswers[1]==='bread'?'answer-good':'answer-bad'}>{lessonAnswers[1]==='bread'?'Верно! Еда нужна каждый день.':'Подсказка: хлеб нужен каждый день.'}</small>}</div><div className="quiz-card"><b>2. Покупку игрушки можно отложить.</b><div className="quiz-options"><button className={lessonAnswers[2]==='true'?'chosen':''} onClick={()=>{setLessonAnswers({...lessonAnswers,2:'true'});setLessonChecked(false)}}>Верно</button><button className={lessonAnswers[2]==='false'?'chosen':''} onClick={()=>{setLessonAnswers({...lessonAnswers,2:'false'});setLessonChecked(false)}}>Неверно</button></div>{lessonChecked&&<small className={lessonAnswers[2]==='true'?'answer-good':'answer-bad'}>{lessonAnswers[2]==='true'?'Верно! Желание может подождать.':'Правильный ответ: верно.'}</small>}</div><div className="quiz-card"><b>3. У тебя 10 BYN. Хлеб стоит 4 BYN. Сколько останется на мечту?</b><div className="quiz-options quiz-three">{['4','6','10'].map(v=><button key={v} className={lessonAnswers[3]===v?'chosen':''} onClick={()=>{setLessonAnswers({...lessonAnswers,3:v});setLessonChecked(false)}}>{v}<small>BYN</small></button>)}</div>{lessonChecked&&<small className={lessonAnswers[3]==='6'?'answer-good':'answer-bad'}>{lessonAnswers[3]==='6'?'Верно: 10 − 4 = 6 BYN.':'Подсказка: вычти стоимость хлеба из 10 BYN.'}</small>}</div>{lessonChecked&&Object.keys(lessonAnswers).length===3&&lessonAnswers[1]==='bread'&&lessonAnswers[2]==='true'&&lessonAnswers[3]==='6'?<div className="lesson-success"><GoldenNut size={22}/> Отличный старт! Все 3 верно. <b>+20 орехов</b> (пока демо)</div>:null}<button className="primary-btn lesson-cta" onClick={()=>{if(Object.keys(lessonAnswers).length<3){showToast('Выбери ответ в каждом задании');return;}setLessonChecked(true);if(lessonAnswers[1]==='bread'&&lessonAnswers[2]==='true'&&lessonAnswers[3]==='6'){setCompletedLessons(current=>({...current,[lessonLevel]:true}));setHighestUnlockedLesson(current=>Math.max(current,Math.min(7,lessonLevel+1)));showToast(lessonLevel<7?`Урок ${lessonLevel} пройден! Урок ${lessonLevel+1} открыт.`:'Поздравляем! Ты прошёл все 7 уроков.');}}}>{lessonChecked?'Проверить ещё раз':'Проверить ответы'}</button></>}</div><BottomNav active="tasks" onSelect={navigateChild}/></>;
  const dateInputValue = (date: Date) => { const year=date.getFullYear(); const month=String(date.getMonth()+1).padStart(2,'0'); const day=String(date.getDate()).padStart(2,'0'); return `${year}-${month}-${day}`; };
  const parentFamily = <><div key="family-page-scroll" className="phone-content parent-scroll"><StatusBar/><div className="brandbar"><Brand/><IconButton label="Уведомления" testId="parent-notifications" onClick={()=>showToast('Новых уведомлений нет')}><Bell size={21}/></IconButton></div><div className="parent-head"><h1>Моя семья</h1><IconButton label="Добавить члена семьи" testId="add-family-member" onClick={()=>openModal('member','Добавить члена семьи')}><Plus size={22}/></IconButton></div><div className="tree-zone family-tree-raised"><div className="tree-line horizontal"/><div className="tree-line vertical-main"/><div className="tree-line horizontal-child"/><div className="tree-line child-left"/><div className="tree-line child-right"/><div className="parent-person mom"><span className="parent-ico"><UserRound size={28} strokeWidth={1.5}/></span><span>{familyParents.find(parent => parent.role === 'MOTHER')?.name ?? 'Мама'}</span></div><div className="parent-person dad"><span className="parent-ico"><UserRound size={28} strokeWidth={1.5}/></span><span>{familyParents.find(parent => parent.role === 'FATHER')?.name ?? familyParents.find(parent => parent.role === 'GUARDIAN')?.name ?? 'Папа'}</span></div>{children.length ? children.map((child,index)=><button key={child.id} className={`child-choice ${selected===child.id?'selected':''} ${index%2===0?'left':'right'}`} data-testid={`select-child-${child.id}`} onClick={()=>{setSelected(child.id);setConfirmed(false);}}><span className="child-avatar"><UserRound size={39} strokeWidth={1.4}/>{selected===child.id&&<i style={{position:'absolute',right:-2,bottom:-1,width:20,height:20,borderRadius:50,background:'#416bff',border:'2px solid white',color:'white',display:'grid',placeItems:'center'}}><Check size={12}/></i>}</span><strong>{child.name} <ChevronRight size={14} style={{verticalAlign:'middle'}}/></strong><small>{child.age} лет</small></button>):<div className="family-empty">В семье пока нет детей</div>}</div><div className="selection-tip"><MousePointerIcon/>Нажмите на ребёнка, чтобы открыть профиль</div><div className="parent-confirm"><button className="primary-btn" data-testid="confirm-family-selection" disabled={!currentChild} onClick={()=>{if(!currentChild)return;setConfirmed(true);setParentTab('details');showToast(`Открыт профиль: ${currentChild.name}`)}}>{confirmed?'Выбор подтверждён':'Подтвердить'}</button></div></div><BottomNav active="family" mode="parent" onSelect={navigateParent}/></>;

  const parentDetails = <><div className="phone-content parent-scroll"><div className="detail-top"><StatusBar/><div className="brandbar" style={{height:44}}><button className="back-role" aria-label="Назад к семье" data-testid="back-to-family" onClick={()=>setParentTab('family')}><ArrowLeft size={18}/></button><span style={{fontSize:14,fontWeight:600}}>Мой ребёнок</span><button className="back-role" aria-label="Настройки" data-testid="child-settings" onClick={()=>openModal('generic','Настройки профиля','Управление параметрами карты и ребёнка')}><SlidersHorizontal size={17}/></button></div><div className="child-detail-head"><div className="detail-avatar"><UserRound size={29}/></div><div><div className="detail-name">{currentChild?.name}</div><div className="detail-sub">{currentChild?.age} лет · В вашей семье</div></div></div><div className="detail-balance"><div className="detail-label"><span>Баланс карты</span><button className="text-action" data-testid="parent-history" onClick={()=>historyRef.current?.scrollIntoView({behavior:'smooth',block:'start'})}><History size={12} style={{verticalAlign:'middle'}}/> История</button></div><div className="detail-amount">{toAmount(apiPayloads.child?.balance_block?.amount ?? currentChild?.balance).toFixed(2).replace('.', ',')} <span style={{fontSize:12,fontWeight:500}}>{apiPayloads.child?.balance_block?.currency ?? 'BYN'}</span></div><div style={{fontSize:10,color:'#7e8da5',marginBottom:8}}>{apiPayloads.child?.balance_block?.card_type ?? 'Детская карта'} · {apiPayloads.child?.balance_block?.card_bank ?? 'Банк не указан'} · •••• {apiPayloads.child?.balance_block?.card_mask ?? '—'}</div><div className="detail-actions"><button className="detail-action" data-testid="parent-topup" onClick={()=>openModal('topup',`Пополнить карту ${currentChild?.name}`)}><Plus size={14}/>Пополнить</button><button className="detail-action light" data-testid="parent-statement" onClick={()=>showToast('Выписка подготовлена')}><FileText size={14}/>Выписка</button></div></div></div>
  <section className="detail-section"><h3>Деньги по категориям</h3><div className="detail-box">{[{label:'Лимит на день',value:toAmount(apiPayloads.child?.money_categories?.limit?.limit_amount),icon:Wallet},{label:'В запасе',value:toAmount(apiPayloads.piggybank?.total_saved_amount ?? apiPayloads.child?.money_categories?.piggy_bank?.amount),icon:PiggyBank}].map((item,index)=><div className="money-row" key={item.label}><item.icon size={15} color="#416bff"/><span>{item.label}</span><span className="amount">{item.value.toFixed(2).replace('.', ',')} BYN</span><button className="round-plus" data-testid={`add-money-${index}`} onClick={()=>openModal('topup',`Пополнить: ${item.label}`)}><Plus size={16}/></button></div>)}</div></section>
  <section className="detail-section"><div className="section-title" style={{marginBottom:8}}><h3 style={{margin:0}}>Цель {currentChild?.name}</h3><button className="text-action" data-testid="parent-all-goals" onClick={()=>setParentTab('goals')}>Все цели <ChevronRight size={13}/></button></div>{(apiPayloads.piggybank?.goals ?? []).slice().sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,1).map(goal=>{const saved=toAmount(goal.current_amount),target=Math.max(1,toAmount(goal.target_amount)),pct=Math.min(100,Math.round(saved/target*100));return <div className="parent-goal" key={goal.goal_id}><div style={{display:'flex',gap:8,alignItems:'center'}}><span className="setting-icon"><Bike size={18}/></span><div style={{flex:1}}><b style={{fontSize:12}}>{goal.title}</b><div style={{fontSize:9,color:'#929fb0'}}>{saved.toFixed(2).replace('.', ',')} из {target.toFixed(2).replace('.', ',')} {goal.currency}</div></div><b style={{fontSize:11,color:'#416bff'}}>{pct}%</b></div><div className="progress"><i style={{width:`${pct}%`}}/></div><div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'#8595aa'}}><span>Осталось {Math.max(0,target-saved).toFixed(2).replace('.', ',')} {goal.currency}</span><button className="text-action" data-testid="parent-add-goal-money" onClick={()=>openModal('topup',`Пополнить: ${goal.title}`)}>Пополнить +</button></div></div>})}{!(apiPayloads.piggybank?.goals?.length) && <div className="parent-goal">У ребёнка пока нет целей</div>}</section>
  <section className="detail-section"><h3>Карманные деньги</h3><div className="pocket-box"><div className="switch-line"><span><b style={{display:'block',fontSize:11}}>Переводить автоматически</b><small style={{color:'#8a99ad',fontSize:9}}>На карту {currentChild?.name}</small></span><button className={`switch ${autoTransfer?'on':''}`} aria-label="Автоматический перевод" data-testid="toggle-auto-transfer" onClick={()=>setAutoTransfer(!autoTransfer)}><i/></button></div><div className="switch-line"><span><small style={{fontSize:9,color:'#9aa6b7'}}>Сумма перевода</small><b style={{display:'block',fontSize:13}}>{pocket} BYN</b></span><button className="text-action" data-testid="edit-pocket-amount" onClick={()=>openModal('generic','Изменить карманные деньги','Укажи сумму регулярного перевода')}><Pencil size={13}/></button></div><div style={{fontSize:10,fontWeight:700,margin:'9px 0 6px'}}>Как часто переводить</div><div style={{display:'flex',gap:5}}>{['Ежедневно','Еженедельно','Ежемесячно'].map(item=><button key={item} data-testid={`frequency-${item}`} onClick={()=>setFrequency(item)} style={{fontSize:8,padding:'7px 8px',borderRadius:7,border:0,background:frequency===item?'#416bff':'#f3f5f9',color:frequency===item?'white':'#8d99aa',flex:1}}>{item}</button>)}</div><div style={{fontSize:9,color:'#8b98ab',marginTop:9}}>Следующий перевод: {apiPayloads.child?.pocket_money_settings?.next_transfer_date ? new Date(apiPayloads.child.pocket_money_settings.next_transfer_date+'T12:00:00').toLocaleDateString('ru-RU') : 'не указан'}</div><button className="text-action" data-testid="edit-transfer-schedule" onClick={()=>showToast('Расписание перевода сохранено')}>Изменить расписание</button><div className="switch-line"><small style={{fontSize:9,color:'#7e8fa6'}}>Лимит трат по карте: {toAmount(apiPayloads.child?.pocket_money_settings?.card_spend_limit_daily).toFixed(2).replace('.', ',')} BYN в день</small><button className="text-action" data-testid="change-transfer-date" onClick={()=>showToast('Изменение лимита требует API для записи')}>Изменить</button></div></div></section>
  <section className="detail-section"><div className="section-title"><h3>Задания от родителей</h3><button className="text-action" data-testid="all-parent-tasks" onClick={()=>setParentTab('tasks')}>Все задания <ChevronRight size={13}/></button></div><button className="primary-btn" style={{marginBottom:12}} data-testid="add-parent-task" onClick={()=>openModal('task','Добавить задание')}><Plus size={15}/>Создать задание</button>{(apiPayloads.tasks?.tasks ?? []).slice(0,2).map(task=><div className="parent-goal" key={task.task_id} style={{marginBottom:10}}><div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:11}}><b style={{color:'#304b70'}}>{task.title}</b><span style={{color:'#5363ff'}}>+{toAmount(task.reward_amount).toFixed(2).replace('.', ',')} {task.currency}</span></div><p style={{fontSize:10,color:'#8594a8',margin:'7px 0'}}>{task.description}</p><div style={{fontSize:10,color:'#8997ab',marginBottom:8}}>Статус: {({IN_PROGRESS:'В процессе',WAITING_REVIEW:'Ожидает проверки',REJECTED_NEED_FIX:'Нужно исправить',COMPLETED:'Выполнено',CANCELLED:'Отменено'} as const)[task.status]}{task.deadline ? ` · Срок: ${new Date(task.deadline).toLocaleString('ru-RU')}` : ''}</div>{task.proof_photo_url&&<a href={task.proof_photo_url} target="_blank" rel="noreferrer" style={{fontSize:11,color:'#416bff',display:'block',marginBottom:8}}>Открыть фотоотчёт</a>}{task.rejection_comment&&<div style={{fontSize:10,color:'#ba4854',marginBottom:8}}>Комментарий: {task.rejection_comment}</div>}{task.status==='WAITING_REVIEW'&&<button className="detail-action" data-testid={`approve-task-${task.task_id}`} onClick={async()=>{try{await approveTask(task.task_id);const refreshed=await getChildTasks(selected);setApiPayloads(current=>({...current,tasks:refreshed}));showToast('Задание подтверждено');}catch(error){showToast(error instanceof Error?error.message:'Не удалось подтвердить задание');}}}>Одобрить задание</button>}</div>)}{!(apiPayloads.tasks?.tasks?.length)&&<div className="parent-goal" style={{fontSize:11,color:'#8a99ad'}}>Нет заданий от родителей</div>}</section>
  <section className="detail-section" id="child-transaction-history" ref={historyRef}><h3>История операций</h3><div className="detail-box"><div className="history-quick-ranges" role="group" aria-label="Быстрый выбор периода">{[{label:'День',days:1},{label:'Неделя',days:7},{label:'Месяц',days:30},{label:'3 месяца',days:90},{label:'Год',days:365}].map(range=><button type="button" key={range.days} data-testid={`history-range-${range.days}`} className={`history-range ${historyFrom===dateInputValue(new Date(Date.now()-(range.days-1)*86400000))&&historyTo===dateInputValue(new Date())?'active':''}`} onClick={()=>{const end=new Date();const start=new Date();start.setDate(end.getDate()-(range.days-1));setHistoryFrom(dateInputValue(start));setHistoryTo(dateInputValue(end));}}>{range.label}</button>)}</div><div style={{display:'flex',gap:8,alignItems:'center',marginBottom:10,flexWrap:'wrap'}}><CalendarDays size={16} color="#416bff"/><label style={{fontSize:10}}>С <input aria-label="Дата начала истории" data-testid="history-date-from" type="date" className="form-control" style={{width:128,display:'inline-block',padding:6}} value={historyFrom} onChange={e=>{setHistoryFrom(e.target.value);if(e.target.value>historyTo)setHistoryTo(e.target.value);}}/></label><label style={{fontSize:10}}>По <input aria-label="Дата окончания истории" data-testid="history-date-to" type="date" className="form-control" style={{width:128,display:'inline-block',padding:6}} value={historyTo} min={historyFrom} onChange={e=>setHistoryTo(e.target.value)}/></label></div>{(apiPayloads.transactions?.items ?? []).map(item=><div className="money-row" key={item.transaction_id}><History size={15} color="#416bff"/><span style={{flex:1}}>{item.title}<small style={{display:'block',color:'#94a1b4',fontSize:9}}>{new Date(item.timestamp).toLocaleString('ru-RU',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</small></span><b style={{fontSize:10,color:item.direction==='INCOME'?'#416bff':'#304b70'}}>{item.direction==='INCOME'?'+':'−'}{toAmount(item.amount).toFixed(2).replace('.', ',')} {item.currency}</b></div>)}{!(apiPayloads.transactions?.items?.length) && <div className="empty-note">За выбранный период операций нет</div>}<button className="text-action" style={{width:'100%'}} data-testid="download-statement" onClick={()=>showToast('Выписка подготовлена за выбранный период')}><FileText size={13}/> Скачать выписку за период</button></div><button className="primary-btn" style={{marginTop:12}} data-testid="open-analytics" onClick={()=>setParentTab('analytics')}><BarChart3 size={16}/> Посмотреть аналитику</button></section></div><div className="home-indicator"><i/></div></>;

  const chooseAnalyticsRange = (range: 'week'|'month'|'year') => {
    setAnalyticsRange(range);
    const end = new Date();
    const start = new Date(end);
    if (range === 'week') start.setDate(end.getDate() - 6);
    else if (range === 'month') start.setMonth(end.getMonth() - 1);
    else start.setFullYear(end.getFullYear() - 1);
    setAnalyticsFrom(start.toISOString().slice(0, 10));
    setAnalyticsTo(end.toISOString().slice(0, 10));
  };
  const analyticsCategories = apiPayloads.analytics?.categories ?? [];
  const analyticsColors = ['#5363ff','#9ba7ff','#c4d6ff','#e6eaff','#7f91f8','#b6c0f4'];
  let categoryCursor = 0;
  const donutGradient = analyticsCategories.length
    ? 'conic-gradient(' + analyticsCategories.map((category,index) => { const start=categoryCursor; categoryCursor += Math.max(0,Math.min(100,toAmount(category.percentage))); return `${analyticsColors[index % analyticsColors.length]} ${start}% ${categoryCursor}%`; }).join(', ') + ')'
    : 'conic-gradient(#e6eaff 0% 100%)';
  const parentGoalsPage = <><div className="phone-content parent-scroll"><div className="brandbar"><button className="back-role" data-testid="back-from-goals" onClick={()=>setParentTab('details')}><ArrowLeft size={18}/></button><span style={{color:'#416bff',fontSize:15}}>{currentChild?.name ?? 'Ребёнок'}</span><span style={{width:34}}/></div><div className="page-head"><h1>Все цели</h1><p style={{color:'#8491a7',margin:'8px 0 0'}}>На что копит {currentChild?.name ?? 'ребёнок'}</p></div><div style={{background:'#eef0ff',borderRadius:22,padding:24,margin:'14px 20px 24px'}}><div style={{fontSize:15}}>Копилка</div><div style={{fontSize:29,fontWeight:800,margin:'6px 0'}}>{toAmount(apiPayloads.piggybank?.total_saved_amount ?? apiPayloads.child?.money_categories?.piggy_bank?.amount).toFixed(2).replace('.', ',')} {apiPayloads.piggybank?.currency ?? 'BYN'}</div><div style={{fontSize:13,color:'#8491a7'}}>В копилке {currentChild?.name ?? 'ребёнка'}</div></div><section className="savings-list"><div className="section-title"><h2>Цели {currentChild?.name}</h2><span className="active-pill">{goals.length} целей</span></div><button className="primary-btn" style={{marginBottom:12}} data-testid="parent-create-goal" onClick={()=>openModal('goal','Создать цель')}>Создать цель</button>{goals.map(goal=>{const pct=Math.min(100,Math.round(goal.saved/Math.max(1,goal.target)*100));const left=Math.max(0,goal.target-goal.saved);const GoalIcon=goal.glyph==='headphones'?Headphones:goal.glyph==='bike'?Bike:goal.glyph==='game'?Gamepad2:goal.glyph==='book'?FileText:Sparkles;return <div className="saving-goal" key={goal.id} data-testid={`all-goal-${goal.id}`} style={{padding:16,margin:'12px 0',border:0,borderRadius:20}}><div style={{display:'flex',alignItems:'center',gap:12}}><span className="setting-icon" style={{width:48,height:48}}><GoalIcon size={23}/></span><div style={{flex:1}}><div className="saving-goal-title" style={{fontSize:15}}>{goal.title}</div><div style={{fontSize:12,color:'#7f8da5',marginTop:5}}>{goal.saved.toFixed(2).replace('.', ',')} из {goal.target.toFixed(2).replace('.', ',')} BYN</div></div><b style={{color:'#5363ff'}}>{pct}%</b></div><div className="progress" style={{height:5,margin:'14px 0'}}><i style={{width:`${pct}%`}}/></div><div style={{fontSize:12,color:'#8491a7',marginBottom:12}}>Осталось <b style={{color:'#26354b'}}>{left.toFixed(2).replace('.', ',')} BYN</b></div><button className="primary-btn" data-testid={`topup-goal-${goal.id}`} onClick={()=>openModal('topup',`Пополнить: ${goal.title}`)}>Пополнить</button></div>})}{!goals.length&&<div className="empty-note">Целей пока нет или сервер не вернул данные.</div>}</section></div><div className="home-indicator"><i/></div></>;
  const dailySpending = (apiPayloads.transactions?.items ?? []).filter(item => item.direction === 'OUTCOME').reduce((acc, item) => { const day = item.timestamp.slice(0, 10); acc[day] = (acc[day] ?? 0) + toAmount(item.amount); return acc; }, {} as Record<string, number>);
  const dailySpendingEntries = Object.entries(dailySpending).sort(([a],[b])=>a.localeCompare(b)).slice(-7);
  const maxDailySpending = Math.max(1, ...dailySpendingEntries.map(([,value])=>value));
  const taskStatusMeta: Record<string, { label: string; color: string; background: string }> = {
    CREATED: { label: 'Создано', color: '#5363ff', background: '#edf0ff' },
    IN_PROGRESS: { label: 'В процессе', color: '#6464d9', background: '#f0efff' },
    WAITING_REVIEW: { label: 'На проверке', color: '#b47722', background: '#fff5e5' },
    REJECTED_NEED_FIX: { label: 'На доработку', color: '#c45a63', background: '#fff0f1' },
    COMPLETED: { label: 'Одобрено', color: '#268867', background: '#eaf7f0' },
  };
  const allTasks = apiPayloads.tasks?.tasks ?? [];
  const taskCounts = ['REJECTED_NEED_FIX','IN_PROGRESS','WAITING_REVIEW','COMPLETED'].map(status => ({ status, count: allTasks.filter(task => task.status === status).length }));
  const visibleTasks = allTasks.filter(task => taskStatusFilter === 'ALL' || task.status === taskStatusFilter);
  const parentTasksPage = <><div key="tasks-page-scroll" className="phone-content parent-scroll tasks-page"><div className="brandbar"><button className="back-role" data-testid="back-from-tasks" aria-label="Назад к профилю ребёнка" onClick={()=>setParentTab('details')}><ArrowLeft size={18}/></button><Brand/><span style={{width:34}}/></div><div className="tasks-page-head"><h1>Все задания</h1><p>Маленькие дела — большие достижения</p></div><div className="task-child-banner"><span className="task-child-avatar">{(currentChild?.name ?? 'Р').slice(0,1)}</span><b>Задания для {currentChild?.name ?? 'ребёнка'}</b><span className="task-count-total">{allTasks.length}</span></div><button className="primary-btn task-create-btn" data-testid="create-task-from-list" onClick={()=>openModal('task','Добавить задание')}><Plus size={17}/>Создать задание</button><div className="task-status-head"><b>Статус задания</b><SlidersHorizontal size={16} color="#8b9bb4"/></div><button className={`task-filter-all ${taskStatusFilter==='ALL'?'active':''}`} data-testid="task-filter-all" onClick={()=>setTaskStatusFilter('ALL')}><span>Все задания</span><b>{allTasks.length}</b></button><div className="task-filter-grid">{taskCounts.map(item=>{const meta=taskStatusMeta[item.status];return <button key={item.status} data-testid={`task-filter-${item.status}`} className={`task-filter-chip ${taskStatusFilter===item.status?'selected':''}`} onClick={()=>setTaskStatusFilter(taskStatusFilter===item.status?'ALL':item.status)}><i style={{background:meta.color}}/><span>{meta.label}</span><small>{item.count}</small></button>})}</div><div className="tasks-list-title"><h2>{taskStatusFilter==='ALL'?'Все задания':taskStatusMeta[taskStatusFilter]?.label ?? 'Все задания'}</h2><span>{visibleTasks.length} {visibleTasks.length===1?'задание':'заданий'}</span></div><div className="tasks-list">{visibleTasks.map(task=>{const meta=taskStatusMeta[task.status] ?? {label:task.status,color:'#5363ff',background:'#edf0ff'};const deadline=task.deadline?new Date(task.deadline):null;return <article className="task-detail-card" key={task.task_id} data-testid={`task-card-${task.task_id}`}><div className="task-card-meta"><span className="task-status-pill" style={{color:meta.color,background:meta.background}}><i style={{background:meta.color}}/>{meta.label}</span><time>{deadline?deadline.toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):task.status==='COMPLETED'?'Выполнено':'Без срока'}</time></div><h3>{task.title}</h3><p>{task.description || 'Небольшой шаг к большой цели.'}</p>{task.status==='IN_PROGRESS'&&<div className="task-progress-note"><span className="task-note-icon">◷</span>Выполняется ребёнком</div>}{task.proof_photo_url&&<a className="task-proof-link" href={task.proof_photo_url} target="_blank" rel="noreferrer"><img src={task.proof_photo_url} alt="Фотоотчёт по заданию"/><span>Открыть фотоотчёт <ChevronRight size={14}/></span></a>}{task.rejection_comment&&<div className="task-rejection-note">Комментарий: {task.rejection_comment}</div>}{task.status==='WAITING_REVIEW'&&<div className="task-review-actions"><button className="secondary-btn" data-testid={`return-task-${task.task_id}`} onClick={()=>{setTaskToReject(task.task_id);openModal('generic','Отправить на доработку','Укажи комментарий для ребёнка.');}}>На доработку</button><button className="primary-btn" data-testid={`approve-task-list-${task.task_id}`} onClick={async()=>{try{await approveTask(task.task_id);const refreshed=await getChildTasks(selected);setApiPayloads(current=>({...current,tasks:refreshed}));showToast('Задание подтверждено');}catch(error){showToast(error instanceof Error?error.message:'Не удалось подтвердить задание');}}}><Check size={16}/>Одобрить</button></div>}<div className="task-card-footer"><b>+{toAmount(task.reward_amount).toFixed(2).replace('.', ',')} {task.currency}</b><span><UserRound size={14}/>{currentChild?.name ?? 'Ребёнок'}</span></div></article>})}{!visibleTasks.length&&<div className="tasks-empty"><Award size={30}/><b>Заданий пока нет</b><span>Попробуйте выбрать другой статус.</span></div>}</div><p className="tasks-footnote">Одобренные задания можно убрать из списка крестиком — награда останется у ребёнка.</p></div><div className="home-indicator"><i/></div></>;
  const parentAnalyticsPage = <><div className="phone-content parent-scroll"><div className="brandbar"><button className="back-role" data-testid="back-from-analytics" onClick={()=>setParentTab('details')}><ArrowLeft size={18}/></button><Brand/><span style={{width:34}}/></div><div className="page-head"><h1>Аналитика</h1></div><div style={{padding:'8px 20px 20px'}}><div style={{display:'flex',gap:5,padding:5,borderRadius:14,background:'#f2f4ff'}}>{([{key:'week',label:'Неделя'},{key:'month',label:'Месяц'},{key:'year',label:'Год'}] as const).map(item=><button key={item.key} data-testid={`analytics-range-${item.key}`} onClick={()=>chooseAnalyticsRange(item.key)} style={{flex:1,border:0,borderRadius:10,padding:11,background:analyticsRange===item.key?'#5363ff':'transparent',color:analyticsRange===item.key?'white':'#8995ad',fontWeight:600}}>{item.label}</button>)}</div><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',margin:'18px 0',fontSize:13}}><button className="back-role" aria-label="Предыдущий период" onClick={()=>{const amount=analyticsRange==='week'?7:analyticsRange==='month'?30:365;const from=new Date(analyticsFrom);const to=new Date(analyticsTo);from.setDate(from.getDate()-amount);to.setDate(to.getDate()-amount);setAnalyticsFrom(from.toISOString().slice(0,10));setAnalyticsTo(to.toISOString().slice(0,10));}}><ChevronLeft size={18}/></button><span>{new Date(analyticsFrom+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short',year:'numeric'})} – {new Date(analyticsTo+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short',year:'numeric'})}</span><button className="back-role" aria-label="Следующий период" onClick={()=>{const amount=analyticsRange==='week'?7:analyticsRange==='month'?30:365;const from=new Date(analyticsFrom);const to=new Date(analyticsTo);from.setDate(from.getDate()+amount);to.setDate(to.getDate()+amount);setAnalyticsFrom(from.toISOString().slice(0,10));setAnalyticsTo(to.toISOString().slice(0,10));}}><ChevronRight size={18}/></button></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><div style={{background:'#f2f4ff',borderRadius:18,padding:15}}><div style={{fontSize:12,color:'#929db3'}}>↙ Поступления</div><div style={{fontSize:22,fontWeight:700,marginTop:8}}>+{toAmount(apiPayloads.transactions?.summary?.total_income).toFixed(2).replace('.', ',')}</div><small>BYN</small></div><div style={{background:'#f2f4ff',borderRadius:18,padding:15}}><div style={{fontSize:12,color:'#929db3'}}>↗ Расходы</div><div style={{fontSize:22,fontWeight:700,marginTop:8}}>−{toAmount(apiPayloads.transactions?.summary?.total_outcome ?? apiPayloads.analytics?.total_spent).toFixed(2).replace('.', ',')}</div><small>BYN</small></div></div><div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#8b97ad',margin:'16px 0 24px'}}><span>{apiPayloads.transactions?.items?.length ?? 0} операций за период</span><span style={{color:'#5363ff'}}>Разница: {(toAmount(apiPayloads.transactions?.summary?.total_income)-toAmount(apiPayloads.transactions?.summary?.total_outcome)).toFixed(2).replace('.', ',')} BYN</span></div><h2 style={{fontSize:18,margin:'0 0 14px'}}>На что тратит ребёнок</h2><div style={{background:'#f2f4ff',borderRadius:20,padding:16}}><div style={{display:'flex',alignItems:'center',gap:18}}><div style={{width:142,height:142,borderRadius:'50%',background:donutGradient,display:'grid',placeItems:'center',flexShrink:0}}><div style={{width:86,height:86,borderRadius:'50%',background:'#f2f4ff',display:'grid',placeItems:'center',textAlign:'center'}}><b style={{fontSize:17}}>{toAmount(apiPayloads.analytics?.total_spent).toFixed(2).replace('.', ',')}</b><small>BYN</small></div></div><div style={{flex:1,minWidth:0}}>{analyticsCategories.map((cat,index)=><div key={cat.category_code} style={{display:'grid',gridTemplateColumns:'8px 1fr auto',gap:6,alignItems:'center',fontSize:11,margin:'8px 0'}}><i style={{width:8,height:8,borderRadius:'50%',background:analyticsColors[index%analyticsColors.length]}}/><span>{cat.category_title}<small style={{display:'block',color:'#909bb0'}}>{toAmount(cat.total_amount).toFixed(2)} BYN</small></span><b style={{color:'#8995ad'}}>{Math.round(toAmount(cat.percentage))}%</b></div>)}</div></div><div style={{fontSize:12,color:'#8a96ac',marginTop:16}}>{analyticsCategories.length ? 'Распределение расходов по категориям за выбранный период.' : 'Нет данных по категориям за выбранный период.'}</div></div><h2 style={{fontSize:18,margin:'26px 0 12px'}}>Расходы по дням</h2><div style={{background:'#f2f4ff',borderRadius:20,padding:16,marginBottom:24}}><div style={{fontSize:24,fontWeight:700}}>{(dailySpendingEntries.reduce((sum,[,value])=>sum+value,0)/Math.max(1,dailySpendingEntries.length)).toFixed(2).replace('.', ',')} BYN <small style={{fontSize:12,fontWeight:400,color:'#8b97ad'}}>в среднем за день</small></div>{dailySpendingEntries.length ? <div style={{display:'flex',alignItems:'end',gap:8,height:130,marginTop:18,borderBottom:'1px solid #dfe5f7',paddingBottom:8}}>{dailySpendingEntries.map(([day,value])=><div key={day} style={{flex:1,height:'100%',display:'flex',flexDirection:'column',justifyContent:'end',alignItems:'center',gap:6}}><div title={`${value.toFixed(2)} BYN`} style={{width:'70%',height:`${Math.max(5,value/maxDailySpending*100)}%`,background:'#5363ff',borderRadius:'5px 5px 0 0',minHeight:4}}/><small style={{fontSize:9,color:'#8b97ad'}}>{new Date(day+'T12:00:00').getDate()}</small></div>)}</div> : <div className="empty-note">Недостаточно данных для графика расходов.</div>}</div><h2 style={{fontSize:18,margin:'26px 0 12px'}}>Последние операции</h2>{(apiPayloads.transactions?.items ?? []).slice(0,8).map(item=><div className="money-row" key={item.transaction_id} style={{height:58}}><span className="setting-icon" style={{width:38,height:38}}>{item.direction==='INCOME'?<ArrowUpRight size={18}/>:<ShoppingBasket size={18}/>}</span><span style={{flex:1}}><b style={{fontSize:12,display:'block'}}>{item.title}</b><small style={{color:'#8d99af'}}>{new Date(item.timestamp).toLocaleDateString('ru-RU')} · {item.category_code}</small></span><b style={{color:item.direction==='INCOME'?'#5363ff':'#303d54'}}>{item.direction==='INCOME'?'+':'−'}{toAmount(item.amount).toFixed(2).replace('.', ',')}<small style={{display:'block',textAlign:'right',fontWeight:400}}>BYN</small></b></div>)}{!apiPayloads.transactions?.items?.length&&<div className="empty-note">Операций за выбранный период нет.</div>}</div></div><div className="home-indicator"><i/></div></>;
  const parentHome = <div className="phone-content"><StatusBar/><div className="brandbar"><Brand/><IconButton label="Уведомления" testId="home-notifications" onClick={()=>showToast('Новых уведомлений нет')}><Bell size={21}/></IconButton></div><div className="greeting"><h1>Добро пожаловать!</h1><span className="avatar-small">М</span></div><section className="section"><h2 style={{fontSize:17,margin:'0 0 12px'}}>Общий баланс</h2><div className="bank-card" style={{height:190}}><div className="card-brand">moby family <Wifi size={17}/></div><div className="card-label">Средства семьи</div><div className="card-amount">2 450,00 BYN</div><div className="card-footer">•••• 3910 <span>VISA</span></div></div><div className="settings-list" style={{marginTop:14}}><SettingButton icon={UsersRound} title="Семейные профили" sub={`${children.length} участника`} onClick={()=>setParentTab('family')} testId="home-family-link"/><SettingButton icon={CreditCard} title="Детские карты" sub="Баланс и управление" onClick={()=>setParentTab('products')} testId="home-cards-link"/></div><div className="form-row" style={{marginTop:14}}><button className="primary-btn" data-testid="home-transfer" onClick={()=>openModal('topup','Перевести ребёнку')}>Перевести деньги</button><button className="secondary-btn" data-testid="home-add-card" onClick={()=>openModal('generic','Оформить карту','Заполни данные, чтобы оформить семейную карту')}>Новая карта</button></div></section></div>;
  const parentChat = <div className="phone-content"><StatusBar/><div className="brandbar"><Brand/><span className="active-pill">Семейный чат</span></div><div className="page-head"><h1>Чат</h1></div><section className="section"><div className="detail-box" style={{minHeight:330,display:'flex',flexDirection:'column',justifyContent:'flex-end',gap:10}}>{parentMessages.map((message,index)=><div key={index} className="notification-card" style={{maxWidth:'88%',margin:0,background:index===0?'#eaf1ff':'#f8faff'}}><span className="notification-icon"><UserRound size={18}/></span><span className="notification-copy"><b>{index===0?'Мама':'Вы'}</b><p>{message}</p><small>Сегодня</small></span></div>)}</div><form className="form-row" style={{marginTop:12}} onSubmit={event=>{event.preventDefault();if(messageDraft.trim()){setParentMessages(messages=>[...messages,messageDraft.trim()]);setMessageDraft('');showToast('Сообщение отправлено');}}}><input className="form-control" value={messageDraft} onChange={event=>setMessageDraft(event.target.value)} placeholder="Напишите сообщение" data-testid="input-chat-message"/><button type="submit" className="icon-btn" data-testid="send-chat-message" aria-label="Отправить"><ArrowUpRight size={19}/></button></form></section></div>;
  const otherParentTab = <><div className="phone-content"><StatusBar/><div className="brandbar"><Brand/><button className="back-role" data-testid="switch-role-tab" onClick={()=>setRole('picker')}><MoreHorizontal size={19}/></button></div><div className="page-head"><h1>{parentTab==='products'?'Продукты':'Ещё'}</h1></div>{parentTab==='products'?<div className="section"><h2 style={{fontSize:17,margin:'0 0 12px'}}>Детские карты</h2>{children.map(child=>{const card=childCards[child.id]?.balance_block;return <div key={child.id} style={{marginBottom:16}}><div className="bank-card" style={{height:176}}><div className="card-brand"><span>moby</span><Wifi size={18}/></div><div className="card-label">{card?.card_type ?? 'Детская карта'} · {card?.card_bank ?? 'Данные карты загружаются'}</div><div className="card-amount">{toAmount(card?.amount).toFixed(2)} {card?.currency ?? 'BYN'}</div><div className="card-footer"><span>•••• {card?.card_mask ?? '—'}</span><span>{child.name}</span></div></div><button className="secondary-btn" style={{marginTop:8,width:'100%'}} data-testid={`open-card-${child.id}`} onClick={()=>{setSelected(child.id);setParentTab('details')}}>Открыть карту {child.name}</button></div>})}<button className="primary-btn" style={{marginTop:4}} data-testid="add-card" onClick={()=>openModal('generic','Оформить карту','Заполни данные, чтобы оформить семейную карту')}>Оформить карту</button></div>:<div className="section"><div className="settings-list"><SettingButton icon={UsersRound} title="Моя семья" sub="Управление профилями детей" onClick={()=>setParentTab('family')} testId="more-family"/><SettingButton icon={Settings} title="Настройки" sub="Профиль и безопасность" onClick={()=>openModal('generic','Настройки','Измените параметры аккаунта')} testId="more-settings"/><SettingButton icon={CircleHelp} title="Помощь" sub="Ответы на частые вопросы" onClick={()=>openModal('generic','Помощь','Свяжитесь с поддержкой Moby Family')} testId="more-help"/></div><button className="primary-btn" style={{marginTop:20}} data-testid="leave-parent-mode" onClick={()=>setRole('picker')}>Сменить режим</button></div>}</div><BottomNav active={parentTab} mode="parent" onSelect={navigateParent}/></>;

  let view: ReactNode = role === 'picker' ? rolePicker : role === 'child'
    ? childTab === 'home' ? childHome : childTab === 'savings' ? childSavings : childTab === 'profile' ? childProfile : childTab === 'map' ? learningMap : childTab === 'tasks' ? childLearningTasks : childTab === 'lesson' ? childLesson : notificationsPage
    : parentTab === 'family' ? parentFamily : parentTab === 'details' ? parentDetails : parentTab === 'goals' ? parentGoalsPage : parentTab === 'tasks' ? parentTasksPage : parentTab === 'analytics' ? parentAnalyticsPage : parentTab === 'home' ? <>{parentHome}<BottomNav active="home" mode="parent" onSelect={navigateParent}/></> : parentTab === 'chat' ? <>{parentChat}<BottomNav active="chat" mode="parent" onSelect={navigateParent}/></> : otherParentTab;
  if (role !== 'picker') {
    view = <div className="app-stage"><main className={`phone ${role==='parent'?'parent':''}`}>{view}{modal&&<div className="overlay" role="presentation"><form className="dialog" onSubmit={submitModal}><div className="dialog-head"><div><h2>{modal.title}</h2>{modal.description&&<small style={{color:'#8494ad'}}>{modal.description}</small>}</div><button className="close-btn" type="button" aria-label="Закрыть" data-testid="close-modal" onClick={()=>setModal(null)}><X size={18}/></button></div>{modal.title==='Отправить на доработку'?<><label htmlFor="rejection-comment">Комментарий ребёнку</label><textarea className="form-control" id="rejection-comment" name="rejection_comment" rows={3} placeholder="Что нужно исправить?" data-testid="input-rejection-comment"/></>:modal.kind==='goal'?<><label htmlFor="goal-name">Название цели</label><input className="form-control" id="goal-name" name="name" placeholder="Например, новые наушники" data-testid="input-goal-name"/><label htmlFor="goal-target">Сколько нужно накопить</label><input className="form-control" id="goal-target" name="target" type="number" min="1" step="1" placeholder="100 BYN" data-testid="input-goal-target"/></>:modal.kind==='topup'?<><label htmlFor="amount">Сумма, BYN</label><input className="form-control" id="amount" name="amount" type="number" min="0.1" step="0.1" placeholder="Например, 10" data-testid="input-amount"/></>:modal.kind==='proof'?<><label htmlFor="proof-comment">Комментарий родителю</label><textarea className="form-control" id="proof-comment" name="comment" rows={3} placeholder="Что ты сделал?" data-testid="input-proof-comment"/><label htmlFor="proof-photo-url">Ссылка на фото (необязательно)</label><input className="form-control" id="proof-photo-url" name="proof_photo_url" type="url" placeholder="https://..." data-testid="input-proof-photo-url"/></>:modal.kind==='member'?<><label htmlFor="member-name">Имя ребёнка</label><input className="form-control" id="member-name" name="name" placeholder="Имя" data-testid="input-member-name"/><label htmlFor="member-age">Возраст</label><input className="form-control" id="member-age" name="age" type="number" min="1" max="18" placeholder="Возраст" data-testid="input-member-age"/><label htmlFor="member-birth-date">Дата рождения (необязательно)</label><input className="form-control" id="member-birth-date" name="birth_date" type="date" data-testid="input-member-birth-date"/></>:modal.kind==='task'?<><label htmlFor="task-name">Название задания</label><input className="form-control" id="task-name" name="name" placeholder="Например, убрать комнату" data-testid="input-task-name"/><label htmlFor="task-description">Описание</label><textarea className="form-control" id="task-description" name="description" rows={2} placeholder="Что нужно сделать?" data-testid="input-task-description"/><label htmlFor="task-reward">Награда, BYN</label><input className="form-control" id="task-reward" name="reward" type="number" min="0" step="0.01" defaultValue="10" placeholder="10" data-testid="input-task-reward"/><label htmlFor="task-penalty">Штраф, BYN (необязательно)</label><input className="form-control" id="task-penalty" name="penalty" type="number" min="0" step="0.01" defaultValue="0" data-testid="input-task-penalty"/><small style={{color:'#8494ad'}}>Активная карта родителя выберется автоматически.</small><label htmlFor="task-deadline">Срок (необязательно)</label><input className="form-control" id="task-deadline" name="deadline" type="datetime-local" data-testid="input-task-deadline"/></>:modal.kind==='edit'?<><label htmlFor="profile-name">Имя профиля</label><input className="form-control" id="profile-name" name="name" defaultValue={profileName} data-testid="input-profile-name"/></>:modal.title.includes('карманные')?<><label htmlFor="pocket-amount">Сумма, BYN</label><input className="form-control" id="pocket-amount" name="pocket" type="number" min="1" defaultValue="20" data-testid="input-pocket-amount"/></>:modal.title.includes('Оформить карту')?<><label htmlFor="card-name">Имя на карте</label><input className="form-control" id="card-name" name="cardname" placeholder="Имя Фамилия" data-testid="input-card-name"/><label htmlFor="card-type">Тип карты</label><select className="form-control" id="card-type" name="cardtype" data-testid="select-card-type"><option>Детская карта</option><option>Семейная карта</option></select></>:<div style={{background:'#f5f8fd',borderRadius:13,padding:14,color:'#667e99',fontSize:13}}>{modal.description||'Настройка доступна в демо-режиме. Изменения сохраняются локально.'}</div>}{formError&&<div className="form-error" data-testid="form-error">{formError}</div>}<div className="dialog-actions"><button type="button" className="secondary-btn" data-testid="cancel-modal" onClick={()=>setModal(null)}>Отмена</button><button className="primary-btn" type="submit" data-testid="submit-modal">Сохранить</button></div></form></div>}{toast&&<div className="toast" role="status" data-testid="toast-message">{toast}</div>}</main></div>;
  }
  return <>{view}</>;
}

function SettingButton({icon:Icon,title,sub,onClick,testId}:{icon:LucideIcon;title:string;sub:string;onClick:()=>void;testId:string}){
  return <button className="setting-row" data-testid={testId} onClick={onClick}><span className="setting-icon"><Icon size={19}/></span><span className="setting-text"><b>{title}</b><small>{sub}</small></span><ChevronRight className="setting-chevron"/></button>;
}
function MousePointerIcon(){return <ArrowUpRight size={15} color="#416bff"/>}

export default App;
