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

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [groupResponse, catalogResponse] = await Promise.all([
        api.getGroupStudents(groupId),
        api.getCatalog(),
      ]);

      setStudents(groupResponse.data.students);
      setGroupName(groupResponse.data.group.name);
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
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (groupName && onGroupNameChange) {
      onGroupNameChange(groupName);
    }
  }, [groupName, onGroupNameChange]);

  const handleWithdrawSuccess = useCallback(
    (studentId: string, newBalance: number) => {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? { ...s, coinBalance: newBalance, receivedMerchToday: true }
            : s
        )
      );
    },
    []
  );

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
            onClick={fetchData}
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
        {/* Refresh button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={fetchData}
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
