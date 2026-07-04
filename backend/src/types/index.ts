import { Request } from 'express';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'admin' | 'care' | 'student';
  studentId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface WithdrawBody {
  type: 'merch' | 'manual';
  merchItemId?: string;
  quantity?: number;
  amount?: number;
  comment?: string;
}

export interface ReverseBody {
  staffId: string;
}

export interface MerchItemBody {
  name: string;
  price: number;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface StudentWithStatus {
  id: string;
  fullName: string;
  email: string | null;
  coinBalance: number;
  receivedMerchToday: boolean;
}
