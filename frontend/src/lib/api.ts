import { ApiResponse, Student, MerchItem, MerchSize, Transaction, Group, WithdrawPayload, PaginationInfo, TodayStats, CartItem, Purchase, AuditLogEntry } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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
    request<{ token: string; user: { id: string; email: string; fullName: string; role: string; student?: { id: string; coinBalance: number; groupId: string } } }>(
      '/auth/login',
      { method: 'POST', body: { email, password } }
    ),

  register: (data: { email: string; password: string; fullName: string; groupId: string }) =>
    request<{ token: string; user: { id: string; email: string; fullName: string; role: string; student: { id: string; coinBalance: number; groupId: string } } }>(
      '/auth/register',
      { method: 'POST', body: data }
    ),

  getMe: () =>
    request<{ id: string; email: string; fullName: string; role: string; student?: { id: string; coinBalance: number; groupId: string } }>(
      '/auth/me',
      { token: getToken() }
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
  exportGroupCSV: async (groupId: string): Promise<Blob> => {
    const token = getToken();
    const response = await fetch(`${API_BASE}/groups/${groupId}/export-csv`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const json = await response.json().catch(() => null);
      throw new Error(json?.error?.message || 'Ошибка экспорта CSV');
    }
    return response.blob();
  },

  // Stats
  getTodayStats: () =>
    request<TodayStats>('/stats/today', { token: getToken() }),

  // Merch catalog
  getCatalog: (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category && category !== 'Все') params.set('category', category);
    if (search) params.set('search', search);
    const qs = params.toString();
    return request<MerchItem[]>(`/merch/catalog${qs ? `?${qs}` : ''}`, { token: getToken() });
  },

  getAllMerchItems: () =>
    request<MerchItem[]>('/merch/items', { token: getToken() }),

  createMerchItem: (data: { name: string; description?: string; price: number; category?: string; stock?: number; imageUrl?: string; sortOrder?: number }) =>
    request<MerchItem>('/merch/items', { method: 'POST', body: data, token: getToken() }),

  updateMerchItem: (itemId: string, data: Partial<{ name: string; description: string; price: number; category: string; stock: number; imageUrl: string; sortOrder: number; isActive: boolean }>) =>
    request<MerchItem>(`/merch/items/${itemId}`, { method: 'PUT', body: data, token: getToken() }),

  archiveMerchItem: (itemId: string) =>
    request<MerchItem>(`/merch/items/${itemId}`, { method: 'DELETE', token: getToken() }),

  reorderMerchItems: (items: Array<{ id: string; sortOrder: number }>) =>
    request<MerchItem[]>('/merch/reorder', { method: 'PUT', body: { items }, token: getToken() }),

  // Withdrawal
  withdraw: (studentId: string, payload: WithdrawPayload) =>
    request<{
      transactionIds: string[];
      firstTransactionId: string;
      previousBalance: number;
      newBalance: number;
      itemName: string | null;
      message: string;
    }>(`/students/${studentId}/withdraw`, {
      method: 'POST',
      body: payload,
      token: getToken(),
    }),

  cancelTransaction: (transactionId: string) =>
    request<{
      transaction: Transaction;
      previousBalance: number;
      newBalance: number;
      message: string;
    }>(`/transactions/${transactionId}/cancel`, {
      method: 'POST',
      token: getToken(),
    }),

  // Deposit (admin only)
  deposit: (studentId: string, data: { amount: number; reason: string }) =>
    request<{ newBalance: number; message: string }>(`/students/${studentId}/deposit`, {
      method: 'POST',
      body: data,
      token: getToken(),
    }),

  // Student shop
  getShopCatalog: (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category && category !== 'Все') params.set('category', category);
    if (search) params.set('search', search);
    const qs = params.toString();
    return request<MerchItem[]>(`/merch/catalog${qs ? `?${qs}` : ''}`, { token: getToken() });
  },

  purchase: (items: Array<{ merchItemId: string; quantity: number; size?: string }>) =>
    request<{ purchases: Purchase[]; newBalance: number; message: string }>('/merch/purchase', {
      method: 'POST',
      body: { items },
      token: getToken(),
    }),

  getMyPurchases: () =>
    request<Purchase[]>('/purchases', { token: getToken() }),

  collectPurchase: (purchaseId: string) =>
    request<Purchase>('/purchases/' + purchaseId + '/collect', {
      method: 'PUT',
      token: getToken(),
    }),

  getAllPurchases: () =>
    request<Purchase[]>('/admin/purchases', { token: getToken() }),

  getStaffGroupAssignments: () =>
    request<Array<{ user: { id: string; fullName: string; email: string; role: string }; groups: Array<{ id: string; name: string; course: number }> }>>('/admin/staff-groups', { token: getToken() }),

  assignStaffGroups: (userId: string, groupIds: string[]) =>
    request<void>('/admin/staff-groups', { method: 'POST', body: { userId, groupIds }, token: getToken() }),

  getAuditLogs: (params?: { page?: number; limit?: number; action?: string; userId?: string; dateFrom?: string; dateTo?: string }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.action) searchParams.set('action', params.action);
      if (params.userId) searchParams.set('userId', params.userId);
      if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    }
    const qs = searchParams.toString();
    return request<{ logs: AuditLogEntry[]; pagination: PaginationInfo }>(
      `/admin/audit${qs ? `?${qs}` : ''}`,
      { token: getToken() }
    );
  },
};
