'use client';

import { useState, useMemo } from 'react';
import { Student } from '@/types';
import { TransactionHistory } from './TransactionHistory';

interface StudentTableProps {
  students: Student[];
  groupName: string;
  onWithdraw: (student: Student) => void;
}

export function StudentTable({
  students,
  groupName,
  onWithdraw,
}: StudentTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase();
    return students.filter((student) =>
      student.fullName.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  const stats = useMemo(() => {
    const total = students.length;
    const received = students.filter((s) => s.receivedMerchToday).length;
    const totalCoins = students.reduce((sum, s) => sum + s.coinBalance, 0);
    return { total, received, totalCoins };
  }, [students]);

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-gray-900">{stats.total}</span>
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
                  {stats.total - stats.received}
                </span>
              </span>
            </div>
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
      <div className="relative max-w-md">
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по ФИО студента..."
          className="input-field pl-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  ФИО Студента
                </th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Баланс CodeCoin
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
              {filteredStudents.length === 0 ? (
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
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className={`hover:bg-gray-50/80 transition-colors ${
                      student.receivedMerchToday ? 'bg-codify-green-50/30' : ''
                    }`}
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
                        className={`text-sm font-bold tabular-nums ${
                          student.coinBalance >= 1000
                            ? 'text-codify-green-600'
                            : student.coinBalance >= 500
                            ? 'text-amber-600'
                            : 'text-red-500'
                        }`}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          Показано: {filteredStudents.length} из {students.length}
        </span>
        {!searchQuery && (
          <span>
            {filteredStudents.length === students.length
              ? 'Все студенты группы'
              : `${filteredStudents.length} отфильтровано`}
          </span>
        )}
      </div>

      {/* Transaction History Modal */}
      {historyStudent && (
        <TransactionHistory
          studentId={historyStudent.id}
          studentName={historyStudent.fullName}
          isOpen={!!historyStudent}
          onClose={() => setHistoryStudent(null)}
        />
      )}
    </div>
  );
}
