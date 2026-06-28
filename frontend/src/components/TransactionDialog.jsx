import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';

const TransactionDialog = ({ isOpen, onClose, onConfirm, selectedItems }) => {
  if (!isOpen) return null;
  const total = selectedItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-heading">Подтверждение покупки</h2>
            <p className="text-sm text-gray-500">Проверьте ваш заказ</p>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2 mb-4 max-h-52 overflow-y-auto">
          {selectedItems.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3">
              <span className="text-sm font-medium text-gray-800">{item.name}</span>
              <span className="text-sm font-bold text-blue-600">{item.price} ₸</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between bg-blue-600 rounded-xl px-4 py-3 mb-5">
          <span className="text-white font-semibold">Итого</span>
          <span className="text-white font-bold text-lg">{total} ₸</span>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-amber-700 flex gap-2">
          <span>📍</span>
          <span>После покупки заберите товары на <strong>ресепшен Codify</strong></span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 hover:shadow-lg active:scale-95"
          >
            ✅ Купить
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDialog;
