export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'care';
}

export interface Group {
  id: string;
  name: string;
  course: number;
  studentCount: number;
}

export interface Student {
  id: string;
  fullName: string;
  email: string | null;
  coinBalance: number;
  receivedMerchToday: boolean;
  todayTransactions: Transaction[];
}

export interface MerchItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  studentId: string;
  staffId: string;
  type: 'merch' | 'manual';
  merchItemId: string | null;
  quantity: number;
  amount: number;
  comment: string | null;
  isReversed: boolean;
  reversedAt: string | null;
  reversedBy: string | null;
  createdAt: string;
  staff?: { id: string; fullName: string };
  merchItem?: { id: string; name: string; price: number };
}

export interface WithdrawPayload {
  type: 'merch' | 'manual';
  merchItemId?: string;
  quantity?: number;
  amount?: number;
  comment?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TodayStats {
  studentsServedToday: number;
  coinsSpentToday: number;
  totalTransactions: number;
}
