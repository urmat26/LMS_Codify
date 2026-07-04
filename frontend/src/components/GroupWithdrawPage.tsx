'use client';

import { useState, useEffect, useCallback } from 'react';
import { Student, MerchItem } from '@/types';
import { api } from '@/lib/api';
import { StudentTable } from './StudentTable';
import { WithdrawModal } from './WithdrawModal';
import { Toast, ToastData } from './Toast';

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
  const [undoInfo, setUndoInfo] = useState<{ transactionId: string; studentId: string; timeoutId: number } | null>(null);

  const fetchData = useCallback(async (page?: number, search?: string, limit?: number) => {
    try {
      setIsRefreshing(true);
      const currentPage = page ?? 1;
      const currentLimit = limit ?? 50;
      const [groupResponse, catalogResponse] = await Promise.all([
        api.getGroupStudents(groupId, search, currentPage, currentLimit),
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
  }, [groupId]);

  useEffect(() => {
    fetchData(1);
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
          onClick: () => handleUndo(transactionId),
        },
      });
    },
    [undoInfo]
  );

  const handleUndo = useCallback(async (transactionId: string) => {
    try {
      await api.cancelTransaction(transactionId);
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
    fetchData(1, search);
  }, [fetchData]);

  const handlePageChange = useCallback((page: number) => {
    fetchData(page, searchQuery);
  }, [fetchData, searchQuery]);

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
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          pagination={pagination}
          onPageChange={handlePageChange}
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
    </>
  );
}
