'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Group, TodayStats } from '@/types';
import { api } from '@/lib/api';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Sidebar } from '@/components/Sidebar';

export default function DashboardPage() {
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('codify_token');
    const userData = localStorage.getItem('codify_user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const u = JSON.parse(userData);
    if (u.role !== 'admin' && u.role !== 'care') {
      router.push('/shop');
      return;
    }
    setUser(u);
  }, [router]);

  useEffect(() => {
    Promise.all([
      api.getGroups(),
      api.getTodayStats(),
    ])
      .then(([groupsRes, statsRes]) => {
        setGroups(groupsRes.data);
        setTodayStats(statsRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('codify_token');
    localStorage.removeItem('codify_user');
    router.push('/login');
  };

  if (!mounted || !user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and breadcrumbs */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 sm:gap-2.5">
                <Sidebar isAdmin={isAdmin} />
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-codify-purple-600 to-codify-purple-800 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">C</span>
                </div>
                <span className="text-base font-semibold text-gray-900">Кодифай</span>
              </div>
              <span className="text-gray-200 text-sm">/</span>
              <Breadcrumbs items={[{ label: 'Выдача мерча' }]} />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-codify-purple-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-codify-purple-700">
                    {user.fullName.charAt(0)}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-700 leading-tight">{user.fullName}</p>
                  <p className="text-xs text-gray-400 leading-tight">
                    {isAdmin ? 'Администратор' : 'Отдел заботы'}
                  </p>
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

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Выдача мерча</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Выберите группу для списания CodeCoin или управляйте каталогом наград
          </p>
        </div>

        {/* Today stats */}
        {todayStats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="card p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-codify-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-codify-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Обслужено сегодня</p>
                  <p className="text-xl font-bold text-gray-900 tabular-nums">{todayStats.studentsServedToday}</p>
                </div>
              </div>
            </div>
            <div className="card p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Списано коинов</p>
                  <p className="text-xl font-bold text-gray-900 tabular-nums">{todayStats.coinsSpentToday.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="card p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-codify-purple-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-codify-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Операций всего</p>
                  <p className="text-xl font-bold text-gray-900 tabular-nums">{todayStats.totalTransactions}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Card grid */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Loading skeleton */}
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-200" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                      <div className="flex gap-4">
                        <div className="h-3 bg-gray-100 rounded w-24" />
                        <div className="h-3 bg-gray-100 rounded w-20" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                onClick={() => router.push(`/groups/${group.id}`)}
                className="card p-6 cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-codify-purple-500 to-codify-purple-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-semibold text-gray-900 group-hover:text-codify-purple-700 transition-colors">
                        {group.name}
                      </h2>
                      <svg className="w-5 h-5 text-gray-300 group-hover:text-codify-purple-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-400">{group.course} курс</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                        {group.studentCount} {group.studentCount === 1 ? 'студент' : group.studentCount >= 2 && group.studentCount <= 4 ? 'студента' : 'студентов'}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Списание коинов
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Merch catalog card */}
          <div
            onClick={() => (isAdmin ? router.push('/merch') : null)}
            className={`card p-6 ${isAdmin ? 'cursor-pointer group' : 'opacity-60'}`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                    Каталог наград
                  </h2>
                  {isAdmin && (
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-amber-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-gray-400">Управление справочником</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                    </svg>
                    Добавление и редактирование
                  </span>
                  <span className="flex items-center gap-1">
                    {isAdmin ? 'Полный доступ' : 'Только просмотр'}
                  </span>
                </div>
              </div>
            </div>
            {!isAdmin && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">Доступно только администраторам</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
