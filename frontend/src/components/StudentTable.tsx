'use client';

import { useState, useRef, useEffect } from 'react';
import { Student, PaginationInfo } from '@/types';
import { TransactionHistory } from './TransactionHistory';
import { UI_CONFIG } from '@/config/uiConfig';

interface StudentTableProps {
  students: Student[];
  groupName: string;
  onWithdraw: (student: Student) => void;
  onQuickIssue: (student: Student) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  sortBy?: string;
  sortOrder?: string;
  onSortChange?: (sortBy: string, sortOrder: string) => void;
  hideServiced?: boolean;
  onHideServicedChange?: (hide: boolean) => void;
}

const { green, amber } = UI_CONFIG.balanceThresholds;

function getBalanceColor(balance: number, isFlashing: boolean): string {
  if (isFlashing) return 'text-codify-green-500 scale-110';
  if (balance >= green) return 'text-codify-green-600';
  if (balance >= amber) return 'text-amber-600';
  return 'text-red-500';
}

export function StudentTable({
  students,
  onWithdraw,
  onQuickIssue,
  searchQuery = '',
  onSearchChange,
  pagination,
  onPageChange,
  sortBy = 'fullName',
  sortOrder = 'asc',
  onSortChange,
  hideServiced = false,
  onHideServicedChange,
}: StudentTableProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set());
  const prevBalancesRef = useRef<Record<string, number>>({});

  const hasQuickIssue = !!UI_CONFIG.defaultQuickIssueItemId;

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const newFlashingIds = new Set<string>();
    students.forEach((s) => {
      const prev = prevBalancesRef.current[s.id];
      if (prev !== undefined && prev !== s.coinBalance) {
        newFlashingIds.add(s.id);
      }
      prevBalancesRef.current[s.id] = s.coinBalance;
    });
    if (newFlashingIds.size > 0) {
      setFlashingIds(newFlashingIds);
      const timer = setTimeout(() => setFlashingIds(new Set()), 800);
      return () => clearTimeout(timer);
    }
  }, [students]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange?.(localSearch);
  };

  const handleSearchClear = () => {
    setLocalSearch('');
    onSearchChange?.('');
  };

  const handleSortToggle = (field: string) => {
    if (sortBy === field) {
      const next = sortOrder === 'asc' ? 'desc' : 'asc';
      onSortChange?.(field, next);
    } else {
      onSortChange?.(field, 'asc');
    }
  };

  const sortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return (
      <svg className={`w-3.5 h-3.5 ml-1 inline-block ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  const stats = {
    total: students.length,
    received: students.filter((s) => s.receivedMerchToday).length,
    totalCoins: students.reduce((sum, s) => sum + s.coinBalance, 0),
  };

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-gray-900">{pagination?.total ?? stats.total}</span>
              студентов
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-codify-green-500" />
              <span className="text-gray-500">
                Получили мерч:{' '}
                <span className="font-medium text-gray-900">{stats.received}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-gray-500">
                Осталось:{' '}
                <span className="font-medium text-gray-900">
                  {pagination ? (pagination.total - stats.received) : (stats.total - stats.received)}
                </span>
              </span>
            </div>
            {/* Filter toggle */}
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none ml-2">
              <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${hideServiced ? 'bg-codify-purple-600' : 'bg-gray-200'}`}>
                <input
                  type="checkbox"
                  checked={hideServiced}
                  onChange={(e) => onHideServicedChange?.(e.target.checked)}
                  className="sr-only"
                />
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${hideServiced ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
              </span>
              <span className="text-xs font-medium">Не обслужены</span>
            </label>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-500">
              Всего коинов:{' '}
              <span className="font-bold text-codify-purple-600">
                {stats.totalCoins.toLocaleString()}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-md">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Поиск по ФИО студента..."
          className="input-field pl-10"
        />
        {localSearch && (
          <button
            type="button"
            onClick={handleSearchClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </form>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th
                  className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-600 transition-colors"
                  onClick={() => handleSortToggle('fullName')}
                >
                  ФИО Студента{sortIcon('fullName')}
                </th>
                <th
                  className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-600 transition-colors"
                  onClick={() => handleSortToggle('coinBalance')}
                >
                  Баланс CodeCoin{sortIcon('coinBalance')}
                </th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Статус
                </th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-sm text-gray-400">
                        {searchQuery ? 'Студенты не найдены' : 'В группе нет студентов'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const isFlashing = flashingIds.has(student.id);
                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        student.receivedMerchToday ? 'bg-codify-green-50/30' : ''
                      } ${isFlashing ? 'animate-flash-green' : ''}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                              student.receivedMerchToday
                                ? 'bg-codify-green-100 text-codify-green-700'
                                : 'bg-codify-purple-100 text-codify-purple-700'
                            }`}
                          >
                            {student.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {student.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span
                          className={`inline-block transition-all duration-500 text-sm font-bold tabular-nums ${getBalanceColor(student.coinBalance, isFlashing)}`}
                        >
                          {student.coinBalance.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {student.receivedMerchToday ? (
                          <span className="badge-green">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Мерч получен
                          </span>
                        ) : (
                          <span className="badge-gray">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasQuickIssue && !student.receivedMerchToday && (
                            <button
                              onClick={() => onQuickIssue(student)}
                              className="px-3 py-2 text-sm font-medium rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all active:scale-[0.97]"
                              title="Быстрая выдача"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => setHistoryStudent(student)}
                            className="p-2 rounded-lg text-gray-300 hover:text-codify-purple-600 hover:bg-codify-purple-50 transition-all"
                            title="История списаний"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onWithdraw(student)}
                            disabled={student.receivedMerchToday}
                            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all active:scale-[0.97] ${
                              student.receivedMerchToday
                                ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                : 'bg-codify-blue-50 text-codify-blue-600 hover:bg-codify-blue-100'
                            }`}
                          >
                            {student.receivedMerchToday ? 'Выдано' : 'Списать коины'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-gray-400">
            Страница {pagination.page} из {pagination.totalPages} (всего {pagination.total} студентов)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Назад
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Вперёд →
            </button>
          </div>
        </div>
      )}

      {(!pagination || pagination.totalPages <= 1) && (
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            Показано: {students.length}
            {pagination ? ` из ${pagination.total}` : ''}
          </span>
        </div>
      )}

      {historyStudent && (
        <TransactionHistory
          studentId={historyStudent.id}
          studentName={historyStudent.fullName}
          isOpen={!!historyStudent}
          onClose={() => setHistoryStudent(null)}
          onWithdraw={() => {
            const student = historyStudent;
            setHistoryStudent(null);
            onWithdraw(student);
          }}
        />
      )}
    </div>
  );
}
