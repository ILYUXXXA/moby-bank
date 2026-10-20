import { mockFamily, mockChild, mockPiggybank, mockTasks, mockTransactions, mockAnalytics } from '../mocks/family';

// Production API origin documented in Swagger. Override with VITE_API_BASE_URL for local/staging.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://yelisei-project.onrender.com').replace(/\/$/, '');
const dataSources: Record<string, 'api' | 'mock'> = {};
export const getDataSource = (path: string): 'api' | 'mock' => dataSources[path] ?? 'mock';

export type FamilyChild = {
  id: string; name: string; birth_date: string; age: number; avatar_url: string | null;
  balance_summary: { amount: number; currency: 'BYN' | 'RUB' | 'USD' | 'EUR' };
  family_id: string;
};
export type FamilyResponse = {
  family_id: string;
  parents: { id: string; name: string; role: 'MOTHER' | 'FATHER' | 'GUARDIAN'; avatar_url: string | null; family_id: string }[];
  children: FamilyChild[];
};
export type ChildResponse = {
  child_info: { id: string; name: string; birth_date: string; age: number; avatar_url: string | null };
  balance_block: { amount: number; currency: 'BYN' | 'RUB' | 'USD' | 'EUR'; card_id: string; card_bank: string; card_type: string; card_mask: string };
  money_categories: { limit: { limit_amount: number; frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'; spent_in_current_period: number; currency: 'BYN' | 'RUB' | 'USD' | 'EUR' }; piggy_bank: { amount: number; currency: 'BYN' | 'RUB' | 'USD' | 'EUR' } };
  most_recent_current_goal: { id: string | null; title: string; current_amount: number; target_amount: number; currency: 'BYN' | 'RUB' | 'USD' | 'EUR' } | null;
  pocket_money_settings: { is_auto_transfer_enabled: boolean; transfer_amount: number; currency: 'BYN' | 'RUB' | 'USD' | 'EUR'; recurrence: { frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'; day_of_week: number | null; time: string }; next_transfer_date: string; card_spend_limit_daily: number };
  pending_tasks: unknown[];
  transactions_history: { period_start: string; period_end: string; items: unknown[] };
};
export type PiggybankResponse = { total_saved_amount: number; currency: 'BYN' | 'RUB' | 'USD' | 'EUR'; goals: { goal_id: string; title: string; description: string | null; currency: 'BYN' | 'RUB' | 'USD' | 'EUR'; current_amount: number; target_amount: number; status: 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED'; created_at: string }[] };
export type TasksResponse = { tasks: { task_id: string; status: 'IN_PROGRESS' | 'WAITING_REVIEW' | 'REJECTED_NEED_FIX' | 'COMPLETED'; title: string; description: string; reward_amount: number; penalty_amount: number; currency: 'BYN' | 'RUB' | 'USD' | 'EUR'; rejection_comment: string | null; proof_photo_url: string | null; proof_submitted_at: string | null; created_at: string; deadline: string | null; created_by: { parent_id: string; name: string; avatar_url: string | null }; payout_source_card: { card_id: string; card_mask: string } }[] };
export type TransactionsResponse = { requested_period: { date_from: string; date_to: string }; summary: { total_income: number; total_outcome: number; currency: 'BYN' | 'RUB' | 'USD' | 'EUR' }; items: { transaction_id: string; title: string; timestamp: string; direction: 'INCOME' | 'OUTCOME'; amount: number; currency: 'BYN' | 'RUB' | 'USD' | 'EUR'; category_code: string; related_entity: { type: 'TASK' | 'GOAL' | 'SYSTEM' | 'NONE'; id: string | null } }[] };
export type AnalyticsResponse = { total_spent: number; currency: 'BYN' | 'RUB' | 'USD' | 'EUR'; period_start: string; period_end: string; categories: { category_code: string; category_title: string; total_amount: number; percentage: number }[] };

async function get<T>(path: string, fallback: T): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`GET ${url}: HTTP ${response.status}${detail ? ` — ${detail.slice(0, 180)}` : ''}`);
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('json')) {
      const detail = await response.text().catch(() => '');
      throw new Error(`GET ${url}: expected JSON, received ${contentType || 'unknown content type'}${detail ? ` — ${detail.slice(0, 120)}` : ''}`);
    }
    const data: unknown = await response.json();
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error(`GET ${url}: response JSON must be an object`);
    }
    dataSources[path] = 'api';
    return data as T;
  } catch (error) {
    dataSources[path] = 'mock';
    console.warn(`API request failed; showing mock fallback for ${url}`, error);
    return fallback;
  }
}
export const getFamily = () => get<FamilyResponse>('/api/family/my', mockFamily);
export const getChild = (childId: string) => get<ChildResponse>(`/api/children/${encodeURIComponent(childId)}`, mockChild);
export const getChildPiggybank = (childId: string) => get<PiggybankResponse>(`/api/children/${encodeURIComponent(childId)}/piggybank`, mockPiggybank);
export const getChildTasks = (childId: string) => get<TasksResponse>(`/api/children/${encodeURIComponent(childId)}/tasks`, mockTasks);
export const getChildTransactions = (childId: string, from: string, to: string) => get<TransactionsResponse>(`/api/children/${encodeURIComponent(childId)}/transactions?date_from=${encodeURIComponent(from)}&date_to=${encodeURIComponent(to)}`, mockTransactions);
export const getChildAnalytics = (from: string, to: string) => get<AnalyticsResponse>(`/api/child/analytics?date_from=${encodeURIComponent(from)}&date_to=${encodeURIComponent(to)}`, mockAnalytics);
