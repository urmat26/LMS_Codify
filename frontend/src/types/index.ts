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
  description: string | null;
  price: number;
  category: string | null;
  stock: number;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sizes: MerchSize[];
}

export interface MerchSize {
  id: string;
  merchItemId: string;
  size: string;
  quantity: number;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; fullName: string } | null;
}

export interface Purchase {
  id: string;
  studentId: string;
  merchItemId: string;
  size: string | null;
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'collected' | 'cancelled';
  createdAt: string;
  collectedAt: string | null;
  merchItem: { id: string; name: string; price: number; imageUrl: string | null } | null;
  student?: { id: string; fullName: string };
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
  cancelReason: string | null;
  createdAt: string;
  staff?: { id: string; fullName: string };
  merchItem?: { id: string; name: string; price: number };
}

export interface CartItem {
  merchItemId: string;
  quantity: number;
}

export type WithdrawPayload =
  | { type: 'merch'; items: CartItem[]; comment?: string }
  | { type: 'manual'; amount: number; comment?: string };

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

export interface SearchStudentResult {
  id: string;
  fullName: string;
  coinBalance: number;
  groupId: string;
  groupName: string;
  course: number;
  receivedMerchToday: boolean;
}

export interface TodayStats {
  studentsServedToday: number;
  coinsSpentToday: number;
  totalTransactions: number;
}
