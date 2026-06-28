import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import TransactionDialog from '../components/TransactionDialog';

const Toast = ({ message, onClose }) => (
  <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-slide-up">
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="ml-2 text-green-200 hover:text-white">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

const ShopPage = () => {
  const { products, selected, clearSelection, purchase } = useShop();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Все');

  const isStudent = user?.role === 'student';
  const categories = ['Все', ...new Set(products.map(p => p.category))];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'Все' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const selectedItems = products.filter(p => selected.includes(p.id));
  const total = selectedItems.reduce((s, p) => s + p.price, 0);

  const handleConfirm = () => {
    purchase(selected);
    setDialogOpen(false);
    setToast('🎉 Покупка успешна! Заберите товары на ресепшен.');
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-heading mb-1">
            {isStudent ? '🛍️ Магазин Codify' : '📦 Каталог товаров'}
          </h1>
          <p className="text-gray-500">
            {isStudent
              ? 'Выбирайте товары и покупайте за CodeCoins'
              : 'Просмотр каталога товаров'}
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск товаров..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg">Ничего не найдено</p>
          </div>
        )}
      </div>

      {/* Cart Toolbar (student only) */}
      {isStudent && selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-white border-t border-blue-100 shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-gray-900">
                {selected.length} {selected.length === 1 ? 'товар' : selected.length < 5 ? 'товара' : 'товаров'} выбрано
              </p>
              <p className="text-blue-600 font-semibold">{total} ₸</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearSelection}
                className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all text-sm"
              >
                Очистить
              </button>
              <button
                onClick={() => setDialogOpen(true)}
                className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 text-sm active:scale-95"
              >
                Купить →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Dialog */}
      <TransactionDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirm}
        selectedItems={selectedItems}
      />

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ShopPage;
