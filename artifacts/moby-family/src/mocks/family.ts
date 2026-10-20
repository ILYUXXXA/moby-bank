import type { FamilyResponse, ChildResponse, PiggybankResponse, TasksResponse, TransactionsResponse, AnalyticsResponse } from '../api/family';
import { PARENT_USER_ID, CHILD_USER_ID, FAMILY_ID } from '../config/userIds';

export const mockFamily: FamilyResponse = {
  family_id: FAMILY_ID,
  parents: [
    { id: PARENT_USER_ID, name: 'Мама', role: 'MOTHER', avatar_url: null, family_id: FAMILY_ID },
    { id: '11111111-1111-4111-8111-111111111102', name: 'Папа', role: 'FATHER', avatar_url: null, family_id: FAMILY_ID },
  ],
  children: [
    { id: CHILD_USER_ID, name: 'Никита', birth_date: '2014-04-12', age: 12, avatar_url: null, balance_summary: { amount: 85.6, currency: 'BYN' }, family_id: FAMILY_ID },
    { id: '11111111-1111-4111-8111-111111111122', name: 'Даша', birth_date: '2018-06-20', age: 8, avatar_url: null, balance_summary: { amount: 42.3, currency: 'BYN' }, family_id: FAMILY_ID },
  ],
};
export const mockChild: ChildResponse = {
  child_info: { id: CHILD_USER_ID, name: 'Никита', birth_date: '2014-04-12', age: 12, avatar_url: null },
  balance_block: { amount: 85.6, currency: 'BYN', card_id: 'mock-card-1', card_bank: 'MTBank', card_type: 'Halva', card_mask: '4821' },
  money_categories: { limit: { limit_amount: 20, frequency: 'WEEKLY', spent_in_current_period: 8.1, currency: 'BYN' }, piggy_bank: { amount: 100, currency: 'BYN' } },
  most_recent_current_goal: { id: 'mock-goal-1', title: 'Велосипед', current_amount: 120, target_amount: 250, currency: 'BYN' },
  pocket_money_settings: { is_auto_transfer_enabled: true, transfer_amount: 20, currency: 'BYN', recurrence: { frequency: 'WEEKLY', day_of_week: 1, time: '09:00:00' }, next_transfer_date: '2026-10-26', card_spend_limit_daily: 15 },
  pending_tasks: [], transactions_history: { period_start: '2026-10-01', period_end: '2026-10-20', items: [] },
};
export const mockPiggybank: PiggybankResponse = { total_saved_amount: 100, currency: 'BYN', goals: [{ goal_id: 'mock-goal-1', title: 'Велосипед', description: 'На новый велосипед', currency: 'BYN', current_amount: 120, target_amount: 250, status: 'IN_PROGRESS', created_at: '2026-08-10' }] };
export const mockTasks: TasksResponse = { tasks: [{ task_id: 'mock-task-1', status: 'IN_PROGRESS', title: 'Навести порядок на столе', description: 'Убрать вещи и игрушки на место', reward_amount: 10, penalty_amount: 0, currency: 'BYN', rejection_comment: null, proof_photo_url: null, proof_submitted_at: null, created_at: '2026-10-18T10:00:00Z', deadline: '2026-10-20T19:00:00Z', created_by: { parent_id: PARENT_USER_ID, name: 'Мама', avatar_url: null }, payout_source_card: { card_id: 'mock-parent-card', card_mask: '8821' } }] };
export const mockTransactions: TransactionsResponse = { requested_period: { date_from: '2026-10-01', date_to: '2026-10-20' }, summary: { total_income: 20, total_outcome: 8.1, currency: 'BYN' }, items: [{ transaction_id: 'mock-transaction-1', title: 'Школьная столовая', timestamp: '2026-10-19T11:20:00Z', direction: 'OUTCOME', amount: 4.2, currency: 'BYN', category_code: 'SCHOOL_CAFE', related_entity: { type: 'NONE', id: null } }] };
export const mockAnalytics: AnalyticsResponse = { total_spent: 8.1, currency: 'BYN', categories: [{ category_code: 'SCHOOL_CAFE', category_title: 'Школьная столовая', total_amount: 4.2, percentage: 51.85 }, { category_code: 'ENTERTAINMENT', category_title: 'Развлечения', total_amount: 3.9, percentage: 48.15 }] };
