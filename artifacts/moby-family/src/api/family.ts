import { mockFamily, mockChild, mockPiggybank, mockTasks, mockTransactions, mockAnalytics } from '../mocks/family';
import { FAMILY_ID, PARENT_USER_ID } from '../config/userIds';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://yelisei-project.onrender.com').replace(/\/$/, '');
const ACTIVE_FAMILY_ID = import.meta.env.VITE_FAMILY_ID || FAMILY_ID;
const dataSources: Record<string, 'api' | 'mock'> = {};
const canonicalPath = (path: string) => path.replace('/api/v1/children/', '/api/v1/parent/children/');
export const getDataSource = (path: string): 'api' | 'mock' => {
  const normalized = canonicalPath(path);
  return dataSources[path] ?? dataSources[normalized] ?? 'mock';
};

export type Currency = 'BYN' | 'RUB' | 'USD' | 'EUR';
export type FamilyChild = {
  id: string; name: string; birth_date: string; age: number; avatar_url: string | null;
  balance_summary?: { amount: number | string; currency: Currency };
  family_id: string;
};
export type FamilyParent = { id: string; name: string; birth_date?: string; age?: number; role: 'MOTHER' | 'FATHER' | 'GUARDIAN'; avatar_url: string | null; family_id: string };
export type FamilyResponse = { family_id: string; parents: FamilyParent[]; children: FamilyChild[] };
export type ChildResponse = {
  child_info: { id: string; name: string; birth_date: string; age: number; avatar_url: string | null };
  balance_block: { amount: number | string; currency: Currency; card_id: string; card_bank: string; card_type: string; card_mask: string } | null;
  money_categories: { limit: { limit_amount: number | string; frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'; spent_in_current_period: number | string; currency: Currency } | null; piggy_bank: { amount: number | string; currency: Currency } };
  most_recent_current_goal: { id: string | null; title: string; current_amount: number | string; target_amount: number | string; currency: Currency } | null;
  pocket_money_settings: { is_auto_transfer_enabled: boolean; transfer_amount: number | string; currency: Currency; recurrence: { frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'; day_of_week: number | null; time: string }; next_transfer_date: string | null; card_spend_limit_daily: number | string | null } | null;
  pending_tasks: unknown[];
  transactions_history: { period_start: string; period_end: string; items: unknown[] };
};
export type PiggybankResponse = { total_saved_amount: number | string; currency: Currency; goals: { goal_id: string; title: string; description: string | null; currency: Currency; current_amount: number | string; target_amount: number | string; status: 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED'; created_at: string }[] };
export type TaskStatus = 'IN_PROGRESS' | 'WAITING_REVIEW' | 'REJECTED_NEED_FIX' | 'COMPLETED' | 'CANCELLED';
export type FamilyTask = { task_id: string; status: TaskStatus; title: string; description: string; reward_amount: number | string; penalty_amount: number | string; currency: Currency; rejection_comment: string | null; proof_photo_url: string | null; proof_submitted_at: string | null; created_at: string; deadline: string | null; created_by: { parent_id: string; name: string; avatar_url: string | null }; payout_source_card: { card_id: string; card_mask: string } | null };
export type TasksResponse = { tasks: FamilyTask[] };
export type TransactionsResponse = { requested_period: { date_from: string; date_to: string }; summary: { total_income: number | string; total_outcome: number | string; currency: Currency }; items: { transaction_id: string; title: string; timestamp: string; direction: 'INCOME' | 'OUTCOME'; amount: number | string; currency: Currency; category_code: string; related_entity: { type: 'TASK' | 'GOAL' | 'SYSTEM' | 'NONE'; id: string | null } }[] };
export type AnalyticsResponse = { total_spent: number | string; currency: Currency; date_from: string; date_to: string; categories: { category_code: string; category_title: string; total_amount: number | string; percentage: number | string }[] };

function parentHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Actor-User-Id': import.meta.env.VITE_PARENT_USER_ID || PARENT_USER_ID, ...extra };
}
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(url, { ...init, headers });
  const bodyText = await response.text();
  let body: unknown = null;
  if (bodyText) { try { body = JSON.parse(bodyText); } catch { body = bodyText; } }
  if (!response.ok) {
    const detail = typeof body === 'object' && body !== null ? JSON.stringify(body) : String(body ?? '');
    throw new Error(`${init.method ?? 'GET'} ${path}: HTTP ${response.status}${detail ? ` — ${detail.slice(0, 240)}` : ''}`);
  }
  return body as T;
}
async function get<T>(path: string, fallback: T): Promise<T> {
  try {
    const data = await request<T>(path);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(`GET ${path}: invalid JSON response`);
    dataSources[path] = 'api';
    return data;
  } catch (error) {
    dataSources[path] = 'mock';
    console.error(`API GET failed for ${API_BASE_URL}${path}`, error);
    return fallback;
  }
}
export const getFamily = () => get<FamilyResponse>(`/api/v1/family/my?family_id=${encodeURIComponent(ACTIVE_FAMILY_ID)}`, mockFamily);
const parentChildPath = (id: string) => `/api/v1/parent/children/${encodeURIComponent(id)}`;
export const getChild = (id: string) => get<ChildResponse>(parentChildPath(id), mockChild);
export const getChildPiggybank = (id: string) => get<PiggybankResponse>(`${parentChildPath(id)}/piggybank`, mockPiggybank);
export const getChildTasks = (id: string) => get<TasksResponse>(`${parentChildPath(id)}/tasks`, mockTasks);
export const getChildTransactions = (id: string, from: string, to: string) => get<TransactionsResponse>(`${parentChildPath(id)}/transactions?date_from=${encodeURIComponent(from)}&date_to=${encodeURIComponent(to)}`, mockTransactions);
export const getChildAnalytics = (id: string, from: string, to: string) => get<AnalyticsResponse>(`${parentChildPath(id)}/analytics?date_from=${encodeURIComponent(from)}&date_to=${encodeURIComponent(to)}`, mockAnalytics);

export type TaskCreateInput = { title: string; description: string; reward_amount?: number | string; penalty_amount?: number | string; currency: Currency; payout_source_card_id?: string; deadline?: string };
export const createFamily = (currency: Currency = 'BYN') => request<FamilyResponse>('/api/v1/families', { method: 'POST', headers: parentHeaders(), body: JSON.stringify({ currency }) });
export const createChild = (familyId: string, input: { name: string; birth_date: string; avatar_url?: string | null }) =>
  request<FamilyChild>(`/api/v1/families/${encodeURIComponent(familyId)}/children`, { method: 'POST', headers: parentHeaders(), body: JSON.stringify(input) });
export const createParent = (familyId: string, input: { name: string; birth_date: string; avatar_url?: string | null; parent_role: FamilyParent['role'] }) =>
  request<FamilyParent>(`/api/v1/families/${encodeURIComponent(familyId)}/parents`, { method: 'POST', headers: parentHeaders(), body: JSON.stringify(input) });
export const createTask = (childId: string, input: TaskCreateInput) =>
  request<FamilyTask>(`${parentChildPath(childId)}/tasks`, { method: 'POST', headers: parentHeaders(), body: JSON.stringify({ ...input, ...(input.reward_amount == null ? {} : { reward_amount: money(input.reward_amount) }), ...(input.penalty_amount == null ? {} : { penalty_amount: money(input.penalty_amount) }) }) });
export const updateTask = (taskId: string, input: Partial<TaskCreateInput>) =>
  request<{ task: FamilyTask }>(`/api/v1/tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH', headers: parentHeaders(), body: JSON.stringify({ ...input, ...(input.reward_amount == null ? {} : { reward_amount: money(input.reward_amount) }), ...(input.penalty_amount == null ? {} : { penalty_amount: money(input.penalty_amount) }) }) });
export const approveTask = (taskId: string, idempotencyKey?: string) =>
  request<{ task: FamilyTask; transaction?: unknown }>(`/api/v1/tasks/${encodeURIComponent(taskId)}/approve`, { method: 'POST', headers: parentHeaders(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) });
export const rejectTask = (taskId: string, rejection_comment: string) =>
  request<{ task: FamilyTask; transaction?: unknown }>(`/api/v1/tasks/${encodeURIComponent(taskId)}/reject`, { method: 'POST', headers: parentHeaders(), body: JSON.stringify({ rejection_comment }) });
export const cancelTask = (taskId: string, idempotencyKey?: string) =>
  request<{ task: FamilyTask; transaction?: unknown }>(`/api/v1/tasks/${encodeURIComponent(taskId)}/cancel`, { method: 'POST', headers: parentHeaders(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) });
export const submitTask = (taskId: string, input: { proof_photo_url?: string; comment?: string }, actorId: string) =>
  request<{ task: FamilyTask; transaction?: unknown }>(`/api/v1/tasks/${encodeURIComponent(taskId)}/submit`, { method: 'POST', headers: { 'X-Actor-User-Id': actorId, 'Content-Type': 'application/json' }, body: JSON.stringify(input) });


// Parent write API — paths and payloads follow API_CONTRACTS.md.
// Decimal values are serialized as strings to avoid floating-point money errors.
const jsonPost = <T,>(path: string, body?: unknown, extraHeaders: Record<string, string> = {}) =>
  request<T>(path, { method: 'POST', headers: { ...parentHeaders(extraHeaders), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
const jsonPatch = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', headers: parentHeaders(), body: JSON.stringify(body) });
const jsonPut = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: 'PUT', headers: parentHeaders(), body: JSON.stringify(body) });
const noBodyPost = <T,>(path: string, extraHeaders: Record<string, string> = {}) => jsonPost<T>(path, undefined, extraHeaders);
const money = (amount: number | string) => {
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) throw new Error('Сумма должна быть неотрицательным числом');
  return n.toFixed(2);
};
const idPath = (id: string) => encodeURIComponent(id);

export type CreateGoalInput = { title: string; description?: string | null; target_amount: number | string; currency: Currency };
export type CreateMoneyLimitInput = { limit_amount: number | string; frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'; currency: Currency; valid_from?: string; valid_to?: string | null };
export type PocketMoneySettingsInput = { is_auto_transfer_enabled: boolean; transfer_amount: number | string; currency: Currency; frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'; day_of_week: number | null; transfer_time: string; next_transfer_date?: string | null; card_spend_limit_daily?: number | string | null };
export type CreateChildCardInput = { bank_name: string; product_name: string; card_mask: string; currency: Currency; initial_balance?: number | string };
export type CardTransferInput = { destination_card_id: string; amount: number | string; currency: Currency; title: string; counterparty_name?: string | null };
export type TopUpCardInput = { amount: number | string; currency: Currency; title?: string; counterparty_name?: string | null };

export const createChildCard = (childId: string, input: CreateChildCardInput) =>
  jsonPost<unknown>(`/api/v1/parent/children/${idPath(childId)}/cards`, { ...input, initial_balance: money(input.initial_balance ?? '0.00') });
export const createCardTransfer = (cardId: string, input: CardTransferInput, idempotencyKey?: string) =>
  jsonPost<unknown>(`/api/v1/cards/${idPath(cardId)}/transfers`, { ...input, amount: money(input.amount) }, idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {});
export const topUpCard = (cardId: string, input: TopUpCardInput, idempotencyKey?: string) =>
  jsonPost<unknown>(`/api/v1/cards/${idPath(cardId)}/top-ups`, { ...input, amount: money(input.amount) }, idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {});
export const createGoal = (childId: string, input: CreateGoalInput) =>
  jsonPost<unknown>(`/api/v1/parent/children/${idPath(childId)}/goals`, { ...input, target_amount: money(input.target_amount) });
export const contributeToGoal = (goalId: string, input: { amount: number | string; card_id: string; title?: string }, idempotencyKey?: string) =>
  jsonPost<unknown>(`/api/v1/goals/${idPath(goalId)}/contributions`, { ...input, amount: money(input.amount) }, idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {});
export const withdrawFromGoal = (goalId: string, input: { amount: number | string; card_id: string; title?: string }, idempotencyKey?: string) =>
  jsonPost<unknown>(`/api/v1/goals/${idPath(goalId)}/withdrawals`, { ...input, amount: money(input.amount) }, idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {});
export const completeGoal = (goalId: string) => noBodyPost<unknown>(`/api/v1/goals/${idPath(goalId)}/complete`);
export const archiveGoal = (goalId: string) => noBodyPost<unknown>(`/api/v1/goals/${idPath(goalId)}/archive`);
export const createMoneyLimit = (childId: string, input: CreateMoneyLimitInput) =>
  jsonPost<unknown>(`/api/v1/parent/children/${idPath(childId)}/money-limits`, { ...input, limit_amount: money(input.limit_amount) });
export const createPocketMoneySettings = (childId: string, input: PocketMoneySettingsInput) =>
  jsonPost<unknown>(`/api/v1/parent/children/${idPath(childId)}/pocket-money-settings`, {
    ...input,
    transfer_amount: money(input.transfer_amount),
    card_spend_limit_daily: input.card_spend_limit_daily == null ? null : money(input.card_spend_limit_daily),
  });
export const enablePocketMoney = (childId: string) => noBodyPost<unknown>(`/api/v1/parent/children/${idPath(childId)}/pocket-money-settings/enable`);
export const disablePocketMoney = (childId: string) => noBodyPost<unknown>(`/api/v1/parent/children/${idPath(childId)}/pocket-money-settings/disable`);
export const transferPocketMoneyNow = (childId: string, input: { amount?: number | string; source_card_id: string; title?: string }, idempotencyKey?: string) =>
  jsonPost<unknown>(`/api/v1/parent/children/${idPath(childId)}/pocket-money-settings/transfer-now`, { ...input, ...(input.amount == null ? {} : { amount: money(input.amount) }) }, idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {});
export const createPocketMoneyTransfer = (childId: string, input: { source_card_id: string; amount: number | string; currency: Currency; title?: string }, idempotencyKey?: string) =>
  jsonPost<unknown>(`/api/v1/parent/children/${idPath(childId)}/pocket-money-transfers`, { ...input, amount: money(input.amount) }, idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {});
export const createCardPurchase = (childId: string, input: { card_id: string; amount: number | string; currency: Currency; category_code: 'SCHOOL_CAFE' | 'BOOKSTORE' | 'ENTERTAINMENT' | 'TRANSPORT' | 'OTHER'; title: string; counterparty_name?: string | null }, idempotencyKey?: string) =>
  jsonPost<unknown>(`/api/v1/parent/children/${idPath(childId)}/purchases`, { ...input, amount: money(input.amount) }, idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {});

// PATCH/PUT/DELETE contracts used by parent management screens.
export const updateUser = (userId: string, input: { name?: string; birth_date?: string; avatar_url?: string | null }) =>
  jsonPatch<unknown>(`/api/v1/users/${idPath(userId)}`, input);
export const updateCard = (cardId: string, input: { bank_name?: string; product_name?: string; card_mask?: string; status?: string; is_primary?: boolean }) =>
  jsonPatch<unknown>(`/api/v1/cards/${idPath(cardId)}`, input);
export const updateGoal = (goalId: string, input: { title?: string; description?: string | null; target_amount?: number | string }) =>
  jsonPatch<unknown>(`/api/v1/goals/${idPath(goalId)}`, { ...input, ...(input.target_amount == null ? {} : { target_amount: money(input.target_amount) }) });
export const updateMoneyLimit = (limitId: string, input: { limit_amount?: number | string; frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY'; valid_from?: string; valid_to?: string | null; is_active?: boolean }) =>
  jsonPatch<unknown>(`/api/v1/money-limits/${idPath(limitId)}`, { ...input, ...(input.limit_amount == null ? {} : { limit_amount: money(input.limit_amount) }) });
export const patchPocketMoneySettings = (childId: string, input: Partial<PocketMoneySettingsInput>) =>
  jsonPatch<unknown>(`/api/v1/parent/children/${idPath(childId)}/pocket-money-settings`, {
    ...input,
    ...(input.transfer_amount == null ? {} : { transfer_amount: money(input.transfer_amount) }),
    ...(input.card_spend_limit_daily == null ? {} : { card_spend_limit_daily: money(input.card_spend_limit_daily) }),
  });
export const replacePocketMoneySettings = (childId: string, input: PocketMoneySettingsInput) =>
  jsonPut<unknown>(`/api/v1/parent/children/${idPath(childId)}/pocket-money-settings`, {
    ...input, transfer_amount: money(input.transfer_amount),
    card_spend_limit_daily: input.card_spend_limit_daily == null ? null : money(input.card_spend_limit_daily),
  });
export const deactivateCard = (cardId: string) =>
  request<unknown>(`/api/v1/cards/${idPath(cardId)}`, { method: 'DELETE', headers: parentHeaders() });
