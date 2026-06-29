'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MerchItem, MerchSize } from '@/types';
import { api } from '@/lib/api';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Sidebar } from '@/components/Sidebar';
import { Toast, ToastData } from '@/components/Toast';

type CartItem = {
  merchItemId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
};

export default function ShopPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string; student?: { id: string; coinBalance: number } } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<MerchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Все');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [sizeModalItem, setSizeModalItem] = useState<MerchItem | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [sizeQuantity, setSizeQuantity] = useState(1);

  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category).filter(Boolean));
    return ['Все', ...Array.from(cats)] as string[];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = category === 'Все' || item.category === category;
      const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, category, search]);

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
    loadCatalog();
  }, [mounted]);

  const loadCatalog = async () => {
    setIsLoading(true);
    try {
      const response = await api.getCatalog();
      setItems(response.data.filter((i: MerchItem) => i.isActive));
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

  const addToCart = (item: MerchItem, size?: string, quantity: number = 1) => {
    if (item.stock !== undefined && item.stock <= 0) {
      setToast({ type: 'error', message: 'Товара нет в наличии' });
      return;
    }
    if (item.sizes && item.sizes.length > 0 && !size) {
      setSizeModalItem(item);
      setSelectedSize('');
      setSizeQuantity(1);
      setShowSizeModal(true);
      return;
    }
    setCart((prev) => {
      const key = size ? `${item.id}-${size}` : item.id;
      const existing = prev.find((ci) => ci.merchItemId === item.id && ci.size === size);
      if (existing) {
        return prev.map((ci) =>
          ci.merchItemId === item.id && ci.size === size
            ? { ...ci, quantity: ci.quantity + quantity }
            : ci
        );
      }
      return [...prev, { merchItemId: item.id, name: item.name, price: item.price, quantity, size }];
    });
    setToast({ type: 'success', message: `«${item.name}»${size ? ` (${size})` : ''} добавлен в корзину` });
  };

  const removeFromCart = (merchItemId: string, size?: string) => {
    setCart((prev) =>
      prev
        .map((ci) =>
          ci.merchItemId === merchItemId && ci.size === size
            ? { ...ci, quantity: ci.quantity - 1 }
            : ci
        )
        .filter((ci) => ci.quantity > 0)
    );
  };

  const cartTotal = useMemo(() => cart.reduce((sum, ci) => sum + ci.price * ci.quantity, 0), [cart]);

  const handlePurchase = async () => {
    if (cart.length === 0) return;
    setIsPurchasing(true);
    try {
      const payload = cart.map((ci) => ({
        merchItemId: ci.merchItemId,
        quantity: ci.quantity,
        size: ci.size,
      }));
      const response = await api.purchase(payload);
      setCart([]);
      setToast({ type: 'success', message: response.data.message });
      // Refresh user to get new balance
      const meResponse = await api.getMe();
      localStorage.setItem('codify_user', JSON.stringify(meResponse.data));
      setUser(meResponse.data as any);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка покупки';
      setToast({ type: 'error', message });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!mounted || !user) return null;

  const isStudent = user.role === 'student';

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
              <Breadcrumbs items={[{ label: 'Магазин' }]} />
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Магазин наград</h1>
            <p className="mt-1 text-sm text-gray-500">Выберите товары и купите их за CodeCoin</p>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-codify-purple-500 focus:border-codify-purple-500"
              placeholder="Поиск товаров..."
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
                  category === cat
                    ? 'bg-codify-purple-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="w-full aspect-square bg-gray-200 rounded-xl mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <p className="text-gray-400">Товары не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const cartItem = cart.find((ci) => ci.merchItemId === item.id && !ci.size);
              const inCartQty = cartItem?.quantity ?? 0;
              const outOfStock = item.stock !== undefined && item.stock <= 0;
              return (
                <div
                  key={item.id}
                  className={`card p-4 flex flex-col ${outOfStock ? 'opacity-50' : ''}`}
                >
                  <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-codify-purple-50 to-codify-purple-100 flex items-center justify-center mb-3 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-10 h-10 text-codify-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 leading-tight">{item.name}</h3>
                    {item.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-codify-purple-600">
                        {item.price.toLocaleString()} Coins
                      </span>
                      {item.stock !== undefined && (
                        <span className={`text-xs ${item.stock > 0 ? 'text-gray-400' : 'text-red-400'}`}>
                          {item.stock > 0 ? `${item.stock} шт.` : 'Нет'}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    disabled={outOfStock}
                    className={`mt-3 w-full py-2 text-sm font-medium rounded-xl transition-all active:scale-[0.97] ${
                      inCartQty > 0
                        ? 'bg-codify-green-100 text-codify-green-700'
                        : outOfStock
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {inCartQty > 0 ? `В корзине (${inCartQty})` : outOfStock ? 'Нет в наличии' : 'В корзину'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Size selection modal */}
        {showSizeModal && sizeModalItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          >
            <div className="absolute inset-0" onClick={() => setShowSizeModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-sm mx-auto z-10 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Выберите размер</h3>
              <p className="text-sm text-gray-500 mb-4">{sizeModalItem.name}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {sizeModalItem.sizes.map((s: MerchSize) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSize(s.size)}
                    disabled={s.quantity <= 0}
                    className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
                      selectedSize === s.size
                        ? 'border-codify-purple-600 bg-codify-purple-50 text-codify-purple-700'
                        : s.quantity <= 0
                        ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {s.size}
                    {s.quantity <= 0 && ' — нет'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm text-gray-600">Количество:</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSizeQuantity(Math.max(1, sizeQuantity - 1))}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-medium tabular-nums">{sizeQuantity}</span>
                  <button
                    onClick={() => setSizeQuantity(sizeQuantity + 1)}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSizeModal(false)}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    if (selectedSize) {
                      addToCart(sizeModalItem, selectedSize, sizeQuantity);
                      setShowSizeModal(false);
                    }
                  }}
                  disabled={!selectedSize}
                  className="flex-1 px-5 py-2.5 text-sm font-medium rounded-xl bg-codify-blue-600 text-white hover:bg-codify-blue-700 transition-all disabled:bg-gray-200 disabled:text-gray-400"
                >
                  Добавить {sizeQuantity > 1 ? `(${sizeQuantity})` : ''}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Cart bottom bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {cart.map((ci) => (
                  <span key={`${ci.merchItemId}-${ci.size ?? ''}`} className="text-gray-600 inline-flex items-center gap-1">
                    {ci.name}{ci.size ? ` (${ci.size})` : ''} x{ci.quantity}
                    <button
                      onClick={() => removeFromCart(ci.merchItemId, ci.size)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 ml-4 flex-shrink-0">
              <span className="text-base font-bold text-codify-purple-600 tabular-nums">
                {cartTotal.toLocaleString()} Coins
              </span>
              <button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="px-6 py-2.5 text-sm font-medium rounded-xl bg-codify-green-600 text-white hover:bg-codify-green-700 transition-all active:scale-[0.97] disabled:bg-gray-200 disabled:text-gray-400"
              >
                {isPurchasing ? 'Покупка...' : 'Купить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
