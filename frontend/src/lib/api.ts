import { ApiResponse, Student, MerchItem, Transaction, Group, WithdrawPayload, PaginationInfo, TodayStats } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T>(
  endpoint: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    token?: string;
  } = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new Error(json.error?.message || 'Произошла ошибка');
  }

  return json;
}

function getToken(): string | undefined {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('codify_token') || undefined;
  }
  return undefined;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; email: string; fullName: string; role: string } }>(
      '/auth/login',
      { method: 'POST', body: { email, password } }
    ),

  // Students & Groups
  getGroups: () =>
    request<Group[]>('/groups', { token: getToken() }),

  getGroupStudents: (groupId: string, search?: string, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    const qs = params.toString();
    return request<{ group: Group; students: Student[]; pagination: PaginationInfo }>(
      `/groups/${groupId}/students${qs ? `?${qs}` : ''}`,
      { token: getToken() }
    );
  },

  getStudentTransactions: (studentId: string) =>
    request<{ student: { id: string; fullName: string; coinBalance: number }; transactions: Transaction[] }>(
      `/students/${studentId}/transactions`,
      { token: getToken() }
    ),

  // CSV Export
  getExportCSVUrl: (groupId: string): string => {
    const token = getToken();
    return `${API_BASE}/groups/${groupId}/export-csv?token=${token}`;
  },

  // Stats
  getTodayStats: () =>
    request<TodayStats>('/stats/today', { token: getToken() }),

  // Merch catalog
  getCatalog: () =>
    request<MerchItem[]>('/merch/catalog', { token: getToken() }),

  getAllMerchItems: () =>
    request<MerchItem[]>('/merch/items', { token: getToken() }),

  createMerchItem: (data: { name: string; price: number; imageUrl?: string; sortOrder?: number }) =>
    request<MerchItem>('/merch/items', { method: 'POST', body: data, token: getToken() }),

  updateMerchItem: (itemId: string, data: Partial<{ name: string; price: number; imageUrl: string; sortOrder: number; isActive: boolean }>) =>
    request<MerchItem>(`/merch/items/${itemId}`, { method: 'PUT', body: data, token: getToken() }),

  archiveMerchItem: (itemId: string) =>
    request<MerchItem>(`/merch/items/${itemId}`, { method: 'DELETE', token: getToken() }),

  reorderMerchItems: (items: Array<{ id: string; sortOrder: number }>) =>
    request<MerchItem[]>('/merch/reorder', { method: 'PUT', body: { items }, token: getToken() }),

  // Withdrawal
  withdraw: (studentId: string, payload: WithdrawPayload) =>
    request<{
      transaction: Transaction;
      previousBalance: number;
      newBalance: number;
      itemName: string | null;
      message: string;
    }>(`/students/${studentId}/withdraw`, {
      method: 'POST',
      body: payload,
      token: getToken(),
    }),

  reverseTransaction: (transactionId: string) =>
    request<{
      transaction: Transaction;
      previousBalance: number;
      newBalance: number;
      message: string;
    }>(`/transactions/${transactionId}/reverse`, {
      method: 'POST',
      token: getToken(),
    }),
};
