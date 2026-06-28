import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { WithdrawPayload } from '@/types';

interface WithdrawResult {
  message: string;
  newBalance: number;
  itemName: string | null;
  transactionId: string;
}

interface UseWithdrawReturn {
  withdraw: (studentId: string, payload: WithdrawPayload) => Promise<WithdrawResult>;
  reverse: (transactionId: string) => Promise<{ message: string; newBalance: number }>;
  isProcessing: boolean;
  error: string | null;
  lastResult: WithdrawResult | null;
  clearError: () => void;
  clearResult: () => void;
}

export function useWithdraw(): UseWithdrawReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<WithdrawResult | null>(null);

  const withdraw = useCallback(async (studentId: string, payload: WithdrawPayload) => {
    setIsProcessing(true);
    setError(null);
    setLastResult(null);

    try {
      const response = await api.withdraw(studentId, payload);
      const result: WithdrawResult = {
        message: response.data.message,
        newBalance: response.data.newBalance,
        itemName: response.data.itemName,
        transactionId: response.data.firstTransactionId,
      };
      setLastResult(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Произошла ошибка при списании';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reverse = useCallback(async (transactionId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await api.cancelTransaction(transactionId);
      const result = {
        message: response.data.message,
        newBalance: response.data.newBalance,
      };
      setLastResult(null);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Произошла ошибка при отмене';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearResult = useCallback(() => setLastResult(null), []);

  return {
    withdraw,
    reverse,
    isProcessing,
    error,
    lastResult,
    clearError,
    clearResult,
  };
}
