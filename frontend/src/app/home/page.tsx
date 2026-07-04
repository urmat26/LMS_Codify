'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Transaction, Purchase } from '@/types';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { AccordionSection } from '@/components/AccordionSection';
import { Toast, ToastData } from '@/components/Toast';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string; student?: { id: string; coinBalance: number } } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [balance, setBalance] = useState(0);
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
    if (u.student?.coinBalance !== undefined) {
      setBalance(u.student.coinBalance);
    }
  }, [router]);

  useEffect(() => {
    if (!mounted || !user) return;
    loadData();
  }, [mounted, user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, txRes, purchasesRes] = await Promise.all([
        api.getMyProfile(),
        api.getMyTransactions(),
        api.getMyPurchases(),
      ]);
      if (profileRes.data.student) {
        setBalance(profileRes.data.student.coinBalance);
      }
      setTransactions(txRes.data.transactions);
      setPurchases(purchasesRes.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки';
      setToast({ type: 'error', message });
    } finally {
      setIsLoading(false);
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
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 sm:gap-2.5">
                <Sidebar isAdmin={false} isStudent={isStudent} />
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-codify-purple-600 to-codify-purple-800 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">C</span>
                </div>
                <span className="text-base font-semibold text-gray-900">Кодифай</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-codify-green-50 px-3 py-1.5 rounded-lg">
                <svg className="w-4 h-4 text-codify-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-codify-green-700 tabular-nums">
                  {balance.toLocaleString()} Coins
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

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Balance card */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 sm:p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-7 h-7 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">CodeCoins</span>
          </div>
          <div className="text-center py-4">
            <span className="text-5xl sm:text-6xl font-extrabold text-amber-400" style={{ color: '#FF9900' }}>
              {balance.toLocaleString()}
            </span>
            <p className="text-sm text-white/70 mt-2">доступно коинов</p>
          </div>
          <div className="flex justify-center mt-4">
            <button
              onClick={() => router.push('/shop')}
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-white/95 text-indigo-600 font-bold rounded-xl hover:bg-white transition-all active:scale-[0.97] shadow-md"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
              </svg>
              Перейти в магазин
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-gray-200 rounded-2xl" />
            <div className="h-32 bg-gray-200 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Transactions */}
            <AccordionSection
              title="История операций"
              icon={
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                </svg>
              }
              count={transactions.length}
              defaultOpen={transactions.length > 0}
            >
              {transactions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">История операций пуста</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-xl border-l-4 border-l-red-400 hover:bg-gray-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {tx.type === 'merch' && tx.merchItem
                              ? tx.merchItem.name
                              : 'Списание'}
                          </p>
                          <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-red-500 tabular-nums shrink-0">
                        −{tx.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </AccordionSection>

            {/* Purchases */}
            <AccordionSection
              title="Мои покупки"
              icon={
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              }
              count={purchases.length}
              defaultOpen={purchases.length > 0}
            >
              {purchases.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400 mb-3">У вас пока нет покупок</p>
                  <button
                    onClick={() => router.push('/shop')}
                    className="px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
                  >
                    Перейти в магазин
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPurchases.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Ожидают получения ({pendingPurchases.length})
                      </p>
                      <div className="space-y-2">
                        {pendingPurchases.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {p.merchItem?.name ?? 'Товар'}{p.size ? ` (${p.size})` : ''}
                              </p>
                              <p className="text-xs text-gray-400">
                                {p.quantity} шт. · {formatDate(p.createdAt)}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-amber-600 tabular-nums shrink-0">
                              {p.totalAmount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {collectedPurchases.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Полученные ({collectedPurchases.length})
                      </p>
                      <div className="space-y-2">
                        {collectedPurchases.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 opacity-70">
                            <div className="w-8 h-8 rounded-lg bg-codify-green-100 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-codify-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {p.merchItem?.name ?? 'Товар'}{p.size ? ` (${p.size})` : ''}
                              </p>
                              <p className="text-xs text-gray-400">
                                {p.quantity} шт. · {p.collectedAt ? formatDate(p.collectedAt) : ''}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-gray-400 tabular-nums shrink-0">
                              {p.totalAmount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {cancelledPurchases.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Отменённые ({cancelledPurchases.length})
                      </p>
                      <div className="space-y-2">
                        {cancelledPurchases.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 opacity-50">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-500">
                                {p.merchItem?.name ?? 'Товар'}{p.size ? ` (${p.size})` : ''}
                              </p>
                              <p className="text-xs text-gray-400">{formatDate(p.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </AccordionSection>
          </>
        )}
      </main>
    </div>
  );
}
