'use client';

import { useState, useEffect, useCallback } from 'react';
import { Student, MerchItem, WithdrawPayload } from '@/types';
import { api } from '@/lib/api';
import { StudentTable } from './StudentTable';
import { WithdrawModal } from './WithdrawModal';
import { Toast, ToastData } from './Toast';
import { UI_CONFIG } from '@/config/uiConfig';

interface GroupWithdrawPageProps {
  groupId: string;
  onGroupNameChange?: (name: string) => void;
}

export function GroupWithdrawPage({ groupId, onGroupNameChange }: GroupWithdrawPageProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [groupName, setGroupName] = useState('');
  const [merchItems, setMerchItems] = useState<MerchItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('fullName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [hideServiced, setHideServiced] = useState(true);
  const [undoInfo, setUndoInfo] = useState<{ transactionId: string; studentId: string; timeoutId: number } | null>(null);
  const [cancelReasonModal, setCancelReasonModal] = useState<{ transactionId: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchData = useCallback(async (page?: number, search?: string, limit?: number, sBy?: string, sOrder?: string, hServiced?: boolean) => {
    try {
      setIsRefreshing(true);
      const currentPage = page ?? 1;
      const currentLimit = limit ?? 50;
      const [groupResponse, catalogResponse] = await Promise.all([
        api.getGroupStudents(groupId, search, currentPage, currentLimit, sBy ?? sortBy, sOrder ?? sortOrder, hServiced ?? hideServiced),
        api.getCatalog(),
      ]);

      setStudents(groupResponse.data.students);
      setGroupName(groupResponse.data.group.name);
      setPagination(groupResponse.data.pagination);
      setMerchItems(catalogResponse.data);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось загрузить данные';
      setError(message);
      setToast({ type: 'error', message });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [groupId, sortBy, sortOrder, hideServiced]);

  useEffect(() => {
    fetchData(1, searchQuery, 50, sortBy, sortOrder, hideServiced);
  }, [fetchData]);

  useEffect(() => {
    if (groupName && onGroupNameChange) {
      onGroupNameChange(groupName);
    }
  }, [groupName, onGroupNameChange]);

  const handleWithdrawSuccess = useCallback(
    (studentId: string, newBalance: number, transactionId: string) => {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? { ...s, coinBalance: newBalance, receivedMerchToday: true }
            : s
        )
      );

      if (undoInfo) {
        clearTimeout(undoInfo.timeoutId);
      }
      const timeoutId = window.setTimeout(() => {
        setUndoInfo(null);
      }, 10000);
      setUndoInfo({ transactionId, studentId, timeoutId });

      setToast({
        type: 'info',
        message: 'Коины списаны',
        duration: 10000,
        action: {
          label: 'Отменить',
          onClick: () => setCancelReasonModal({ transactionId }),
        },
      });
    },
    [undoInfo]
  );

  const handleUndoWithReason = useCallback(async () => {
    if (!cancelReasonModal || !cancelReason.trim()) return;
    try {
      await api.cancelTransaction(cancelReasonModal.transactionId, cancelReason.trim());
      setUndoInfo(null);
      setCancelReasonModal(null);
      setCancelReason('');
      setToast({ type: 'success', message: 'Списание отменено, коины возвращены' });
      fetchData(1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при отмене';
      setToast({ type: 'error', message });
    }
  }, [cancelReasonModal, cancelReason, fetchData]);

  // Fallback undo without reason (for backward compatibility / student self-cancel)
  const handleUndo = useCallback(async (transactionId: string) => {
    try {
      await api.cancelTransaction(transactionId, 'Отменено вручную');
      setUndoInfo(null);
      setToast({ type: 'success', message: 'Списание отменено, коины возвращены' });
      fetchData(1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при отмене';
      setToast({ type: 'error', message });
    }
  }, [fetchData]);

  // Cleanup undo timeout on unmount
  useEffect(() => {
    return () => {
      if (undoInfo) clearTimeout(undoInfo.timeoutId);
    };
  }, [undoInfo]);

  const handleSearch = useCallback((search: string) => {
    setSearchQuery(search);
    fetchData(1, search, 50, sortBy, sortOrder, hideServiced);
  }, [fetchData, sortBy, sortOrder, hideServiced]);

  const handleSortChange = useCallback((newSortBy: string, newSortOrder: string) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    fetchData(1, searchQuery, 50, newSortBy, newSortOrder, hideServiced);
  }, [fetchData, searchQuery, hideServiced]);

  const handleHideServicedChange = useCallback((hide: boolean) => {
    setHideServiced(hide);
    fetchData(1, searchQuery, 50, sortBy, sortOrder, hide);
  }, [fetchData, searchQuery, sortBy, sortOrder]);

  const handlePageChange = useCallback((page: number) => {
    fetchData(page, searchQuery, 50, sortBy, sortOrder, hideServiced);
  }, [fetchData, searchQuery, sortBy, sortOrder, hideServiced]);

  const handleQuickIssue = useCallback(async (student: Student) => {
    const itemId = UI_CONFIG.defaultQuickIssueItemId;
    if (!itemId) return;
    const item = merchItems.find((m) => m.id === itemId);
    if (!item) {
      setToast({ type: 'error', message: 'Товар для быстрой выдачи не найден в каталоге' });
      return;
    }
    if (student.coinBalance < item.price) {
      setToast({ type: 'error', message: `Недостаточно коинов у студента (${student.coinBalance})` });
      return;
    }
    try {
      const payload: WithdrawPayload = { type: 'merch', items: [{ merchItemId: itemId, quantity: 1 }] };
      const result = await api.withdraw(student.id, payload);
      handleWithdrawSuccess(student.id, result.data.newBalance, result.data.firstTransactionId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка быстрой выдачи';
      setToast({ type: 'error', message });
    }
  }, [merchItems, handleWithdrawSuccess]);

  const handleExportCSV = useCallback(async () => {
    try {
      const blob = await api.exportGroupCSV(groupId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Codify_${groupName.replace(/[^a-zA-Zа-яА-Я0-9_\- ]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка экспорта CSV';
      setToast({ type: 'error', message });
    }
  }, [groupId, groupName]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-indigo-600 mx-auto"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="mt-3 text-sm text-gray-500">Загрузка данных группы...</p>
        </div>
      </div>
    );
  }

  if (error && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-3">{error}</p>
          <button
            onClick={() => fetchData(1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Top bar: Export + Refresh */}
        <div className="flex items-center justify-end gap-2 mb-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-codify-purple-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Экспорт CSV
          </button>
          <button
            onClick={() => fetchData(pagination.page, searchQuery)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Обновить
          </button>
        </div>

        <StudentTable
          students={students}
          groupName={groupName}
          onWithdraw={setSelectedStudent}
          onQuickIssue={handleQuickIssue}
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          pagination={pagination}
          onPageChange={handlePageChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          hideServiced={hideServiced}
          onHideServicedChange={handleHideServicedChange}
        />
      </div>

      {/* Withdraw Modal */}
      {selectedStudent && (
        <WithdrawModal
          student={selectedStudent}
          merchItems={merchItems}
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onSuccess={handleWithdrawSuccess}
        />
      )}

      {/* Cancel reason modal */}
      {cancelReasonModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div className="absolute inset-0" onClick={() => { setCancelReasonModal(null); setCancelReason(''); }} />
          <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-sm mx-auto z-10 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Отмена списания</h3>
            <p className="text-sm text-gray-500 mb-4">Укажите причину отмены (обязательно)</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="input-field min-h-[80px] resize-none"
              placeholder="Причина отмены..."
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setCancelReasonModal(null); setCancelReason(''); }}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={handleUndoWithReason}
                disabled={!cancelReason.trim()}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  cancelReason.trim()
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                Подтвердить отмену
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
