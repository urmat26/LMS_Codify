'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuditLogEntry, PaginationInfo } from '@/types';
import { api } from '@/lib/api';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Sidebar } from '@/components/Sidebar';
import { Toast, ToastData } from '@/components/Toast';

const ACTION_LABELS: Record<string, string> = {
  withdraw: 'Списание',
  cancel: 'Отмена',
  deposit: 'Начисление',
  purchase: 'Покупка',
  collect: 'Получение',
  create_merch: 'Создание товара',
  update_merch: 'Обновление товара',
  archive_merch: 'Архивация товара',
  reorder_merch: 'Сортировка',
};

const ACTION_COLORS: Record<string, string> = {
  withdraw: 'text-red-600 bg-red-50',
  cancel: 'text-gray-600 bg-gray-100',
  deposit: 'text-codify-green-600 bg-codify-green-50',
  purchase: 'text-codify-purple-600 bg-codify-purple-50',
  collect: 'text-blue-600 bg-blue-50',
  create_merch: 'text-emerald-600 bg-emerald-50',
  update_merch: 'text-amber-600 bg-amber-50',
  archive_merch: 'text-red-600 bg-red-50',
  reorder_merch: 'text-gray-600 bg-gray-100',
};

export default function AuditPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('codify_token');
    const userData = localStorage.getItem('codify_user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const u = JSON.parse(userData);
    if (u.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setUser(u);
  }, [router]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getAuditLogs({
        page,
        limit: 50,
        action: actionFilter || undefined,
        dateFrom: dateFrom || undefined,
      });
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки';
      setToast({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  }, [page, actionFilter, dateFrom]);

  useEffect(() => {
    if (!mounted) return;
    fetchLogs();
  }, [mounted, fetchLogs]);

  const handleLogout = () => {
    localStorage.removeItem('codify_token');
    localStorage.removeItem('codify_user');
    router.push('/login');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!mounted || !user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 sm:gap-2.5">
                <Sidebar isAdmin={isAdmin} />
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-codify-purple-600 to-codify-purple-800 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">C</span>
                </div>
                <span className="text-base font-semibold text-gray-900">Кодифай</span>
              </div>
              <span className="text-gray-200 text-sm">/</span>
              <Breadcrumbs items={[
                { label: 'Выдача мерча', href: '/dashboard' },
                { label: 'Аудит' },
              ]} />
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-codify-purple-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-codify-purple-700">
                    {user.fullName.charAt(0)}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-700 leading-tight">{user.fullName}</p>
                  <p className="text-xs text-gray-400 leading-tight">Администратор</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Журнал аудита</h1>
          <p className="mt-1 text-sm text-gray-500">Все действия сотрудников и студентов в системе</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="input-field w-auto"
          >
            <option value="">Все действия</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="input-field w-auto"
            placeholder="С даты"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card p-4 animate-pulse flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-100 rounded w-32" />
                <div className="h-4 bg-gray-100 rounded w-48" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            <p className="text-gray-400">Записей аудита не найдено</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((entry) => (
              <div key={entry.id} className="card p-4 flex items-center gap-4">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0 ${ACTION_COLORS[entry.action] || 'text-gray-600 bg-gray-100'}`}>
                  {ACTION_LABELS[entry.action] || entry.action}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {entry.user?.fullName ?? 'Неизвестно'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {entry.resourceType} · {entry.resourceId.slice(0, 8)}...
                    {entry.metadata && (() => {
                      try {
                        const m = JSON.parse(entry.metadata);
                        return m.body?.comment ? ` · «${m.body.comment}»` : '';
                      } catch { return ''; }
                    })()}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">{formatDate(entry.createdAt)}</p>
                  {entry.ip && <p className="text-[10px] text-gray-400 mt-0.5">{entry.ip}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500">
              {pagination.total} записей · страница {pagination.page} из {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="btn-secondary text-sm disabled:opacity-40"
              >
                ← Назад
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= (pagination.totalPages)}
                className="btn-secondary text-sm disabled:opacity-40"
              >
                Вперёд →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
