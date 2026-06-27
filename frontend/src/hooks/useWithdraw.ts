import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { WithdrawPayload } from '@/types';

interface WithdrawResult {
  message: string;
  newBalance: number;
  itemName: string | null;
}

interface UseWithdrawReturn {
  withdraw: (studentId: string, payload: WithdrawPayload) => Promise<WithdrawResult>;
  reverse: (transactionId: string) => Promise<WithdrawResult>;
  isProcessing: boolean;
  error: string | null;
  lastResult: WithdrawResult | null;
  clearError: () => void;
  clearResult: () => void;
}

export function useWithdraw(): UseWithdrawReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    message: string;
    newBalance: number;
    itemName: string | null;
  } | null>(null);

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
      const response = await api.reverseTransaction(transactionId);
      const result: WithdrawResult = {
        message: response.data.message,
        newBalance: response.data.newBalance,
        itemName: null,
      };
      setLastResult(result);
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
