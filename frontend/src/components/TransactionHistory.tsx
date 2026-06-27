'use client';

import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/types';
import { api } from '@/lib/api';

interface TransactionHistoryProps {
  studentId: string;
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionHistory({
  studentId,
  studentName,
  isOpen,
  onClose,
}: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getStudentTransactions(studentId);
      setTransactions(res.data.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить историю');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    } else {
      setTransactions([]);
    }
  }, [isOpen, fetchHistory]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeLabel = (type: string) =>
    type === 'merch' ? 'Товар мерча' : 'Произвольное списание';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] pb-8 px-4 sm:px-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-lg mx-auto z-10 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">История списаний</h2>
            <p className="text-sm text-gray-500 mt-0.5">{studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-6 w-6 text-codify-purple-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <button
                onClick={fetchHistory}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-codify-blue-600 text-white hover:bg-codify-blue-700 transition-all"
              >
                Попробовать снова
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-400">История списаний пуста</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className={`rounded-xl border p-4 transition-colors ${
                  tx.isReversed
                    ? 'bg-red-50 border-red-100'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {tx.type === 'merch' && tx.merchItem
                          ? tx.merchItem.name
                          : typeLabel(tx.type)}
                      </span>
                      {tx.isReversed && (
                        <span className="text-xs font-medium text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
                          Отменено
                        </span>
                      )}
                    </div>
                    {tx.comment && (
                      <p className="text-xs text-gray-500 mt-1">{tx.comment}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>
                        {new Date(tx.createdAt).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {tx.staff && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                          {tx.staff.fullName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold tabular-nums ${
                      tx.isReversed ? 'text-red-400' : 'text-red-500'
                    }`}>
                      −{tx.amount.toLocaleString()}
                    </p>
                    {tx.quantity > 1 && (
                      <p className="text-xs text-gray-400">×{tx.quantity}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with total */}
        {!loading && transactions.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Всего операций</span>
              <span className="font-semibold text-gray-900">{transactions.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
