'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Purchase } from '@/types';
import { api } from '@/lib/api';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Sidebar } from '@/components/Sidebar';
import { Toast, ToastData } from '@/components/Toast';

export default function PurchasesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string; student?: { id: string; coinBalance: number } } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('codify_token');
    const userData = localStorage.getItem('codify_user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const u = JSON.parse(userData);
    if (u.role !== 'student') {
      router.push('/dashboard');
      return;
    }
    setUser(u);
  }, [router]);

  useEffect(() => {
    if (!mounted) return;
    loadPurchases();
  }, [mounted]);

  const loadPurchases = async () => {
    setIsLoading(true);
    try {
      const response = await api.getMyPurchases();
      setPurchases(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки';
      setToast({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollect = async (purchaseId: string) => {
    try {
      const response = await api.collectPurchase(purchaseId);
      setPurchases((prev) =>
        prev.map((p) => (p.id === purchaseId ? response.data : p))
      );
      setToast({ type: 'success', message: 'Товар получен' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка';
      setToast({ type: 'error', message });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('codify_token');
    localStorage.removeItem('codify_user');
    router.push('/login');
  };

  if (!mounted || !user) return null;

  const isStudent = user.role === 'student';
  const pendingPurchases = purchases.filter((p) => p.status === 'pending');
  const collectedPurchases = purchases.filter((p) => p.status === 'collected');
  const cancelledPurchases = purchases.filter((p) => p.status === 'cancelled');

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 sm:gap-2.5">
                <Sidebar isAdmin={false} isStudent={isStudent} />
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-codify-purple-600 to-codify-purple-800 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">C</span>
                </div>
                <span className="text-base font-semibold text-gray-900">Кодифай</span>
              </div>
              <span className="text-gray-200 text-sm">/</span>
              <Breadcrumbs items={[{ label: 'Мои покупки' }]} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-codify-green-50 px-3 py-1.5 rounded-lg">
                <svg className="w-4 h-4 text-codify-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-codify-green-700 tabular-nums">
                  {user.student?.coinBalance?.toLocaleString() ?? 0} Coins
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-codify-purple-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-codify-purple-700">
                    {user.fullName.charAt(0)}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-700 leading-tight">{user.fullName}</p>
                  <p className="text-xs text-gray-400 leading-tight">Студент</p>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Мои покупки</h1>
          <p className="mt-1 text-sm text-gray-500">История заказов из магазина наград</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            <p className="text-gray-400 mb-4">У вас пока нет покупок</p>
            <button
              onClick={() => router.push('/shop')}
              className="px-5 py-2.5 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
            >
              Перейти в магазин
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingPurchases.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Ожидают получения ({pendingPurchases.length})
                </h2>
                <div className="space-y-2">
                  {pendingPurchases.map((purchase) => (
                    <div key={purchase.id} className="card p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {purchase.merchItem?.name ?? 'Товар'} {purchase.size ? `(${purchase.size})` : ''}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {purchase.quantity} шт. × {purchase.totalAmount.toLocaleString()} Coins
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(purchase.createdAt)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCollect(purchase.id)}
                        className="px-4 py-2 text-sm font-medium rounded-xl bg-codify-green-600 text-white hover:bg-codify-green-700 transition-all active:scale-[0.97] flex-shrink-0"
                      >
                        Забрать
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {collectedPurchases.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Полученные ({collectedPurchases.length})
                </h2>
                <div className="space-y-2">
                  {collectedPurchases.map((purchase) => (
                    <div key={purchase.id} className="card p-4 flex items-center justify-between gap-4 opacity-70">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-codify-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-codify-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {purchase.merchItem?.name ?? 'Товар'} {purchase.size ? `(${purchase.size})` : ''}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {purchase.quantity} шт. × {purchase.totalAmount.toLocaleString()} Coins
                          </p>
                          <p className="text-xs text-gray-400">
                            Получено: {purchase.collectedAt ? formatDate(purchase.collectedAt) : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cancelledPurchases.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Отменённые ({cancelledPurchases.length})
                </h2>
                <div className="space-y-2">
                  {cancelledPurchases.map((purchase) => (
                    <div key={purchase.id} className="card p-4 flex items-center gap-3 opacity-50">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500">
                          {purchase.merchItem?.name ?? 'Товар'} {purchase.size ? `(${purchase.size})` : ''}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(purchase.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
