import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';

const PurchasesPage = () => {
  const { purchases, collectByIndex } = useShop();
  const [toast, setToast] = useState(null);

  const handleCollect = (index) => {
    collectByIndex(index);
    setToast('✅ Товар отмечен как полученный на ресепшен!');
    setTimeout(() => setToast(null), 3000);
  };

  const pending = purchases.filter(p => !p.collected);
  const collected = purchases.filter(p => p.collected);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-heading mb-1">📦 Мои покупки</h1>
          <p className="text-gray-500">Управляйте вашими заказами и получайте их на ресепшен</p>
        </div>

        {purchases.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">У вас пока нет покупок</p>
            <p className="text-gray-300 text-sm mt-1">Перейдите в магазин и выберите товары</p>
          </div>
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-400 rounded-full inline-block"></span>
              Ожидают получения ({pending.length})
            </h2>
            <div className="space-y-3">
              {purchases.map((p, i) => !p.collected && (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      <p className="text-sm text-gray-500">{p.price} ₸ · {new Date(p.purchasedAt).toLocaleDateString('ru-RU')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-orange-50 text-orange-600 px-3 py-1 rounded-full font-medium border border-orange-100">
                      Ожидание
                    </span>
                    <button
                      onClick={() => handleCollect(i)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-200 active:scale-95 whitespace-nowrap"
                    >
                      📍 Забрать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collected */}
        {collected.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
              Получено ({collected.length})
            </h2>
            <div className="space-y-3">
              {purchases.map((p, i) => p.collected && (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between gap-4 opacity-70">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      <p className="text-sm text-gray-500">{p.price} ₸ · {new Date(p.purchasedAt).toLocaleDateString('ru-RU')}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full font-medium border border-green-100">
                    ✓ Получено
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3">
          <span className="font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
};

export default PurchasesPage;
