'use client';

import { useState, useEffect, useCallback } from 'react';
import { MerchItem } from '@/types';
import { api } from '@/lib/api';
import { Toast, ToastData } from './Toast';

export function MerchCatalogManager() {
  const [items, setItems] = useState<MerchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MerchItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<MerchItem | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formSortOrder, setFormSortOrder] = useState<number>(0);

  const fetchItems = useCallback(async () => {
    try {
      const response = await api.getAllMerchItems();
      setItems(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки';
      setToast({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const resetForm = () => {
    setFormName('');
    setFormPrice(0);
    setFormSortOrder(0);
    setEditingItem(null);
    setIsAdding(false);
  };

  const openEdit = (item: MerchItem) => {
    setFormName(item.name);
    setFormPrice(item.price);
    setFormSortOrder(item.sortOrder);
    setEditingItem(item);
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!formName.trim() || formPrice <= 0) {
      setToast({ type: 'error', message: 'Заполните название и укажите цену' });
      return;
    }

    try {
      if (editingItem) {
        await api.updateMerchItem(editingItem.id, {
          name: formName.trim(),
          price: formPrice,
          sortOrder: formSortOrder,
        });
        setToast({ type: 'success', message: 'Товар обновлён' });
      } else {
        await api.createMerchItem({
          name: formName.trim(),
          price: formPrice,
          sortOrder: formSortOrder,
        });
        setToast({ type: 'success', message: 'Товар добавлен' });
      }
      resetForm();
      fetchItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка сохранения';
      setToast({ type: 'error', message });
    }
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      await api.archiveMerchItem(archiveTarget.id);
      setToast({ type: 'success', message: `«${archiveTarget.name}» архивирован` });
      setArchiveTarget(null);
      fetchItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка архивирования';
      setToast({ type: 'error', message });
    }
  };

  const moveItem = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index].sortOrder;
    newItems[index] = {
      ...newItems[index],
      sortOrder: newItems[targetIndex].sortOrder,
    };
    newItems[targetIndex] = {
      ...newItems[targetIndex],
      sortOrder: temp,
    };

    try {
      await api.reorderMerchItems(
        newItems.map((item, idx) => ({
          id: item.id,
          sortOrder: idx + 1,
        }))
      );
      await fetchItems();
    } catch {
      setToast({ type: 'error', message: 'Ошибка сортировки' });
    }
  };

  const activeItems = items.filter((i) => i.isActive);
  const archivedItems = items.filter((i) => !i.isActive);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <svg className="animate-spin h-6 w-6 text-codify-purple-600 mx-auto" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-3 text-sm text-gray-500">Загрузка каталога...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Каталог наград</h1>
            <p className="mt-1 text-sm text-gray-500">Управление справочником товаров мерча</p>
          </div>
          {!isAdding && !editingItem && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2.5 text-sm font-medium rounded-xl bg-codify-blue-600 text-white hover:bg-codify-blue-700 transition-all active:scale-[0.97] shadow-sm"
            >
              + Добавить товар
            </button>
          )}
        </div>

        {/* Add / Edit form */}
        {(isAdding || editingItem) && (
          <div className="mb-6 p-5 border border-gray-200 rounded-2xl bg-white shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              {editingItem ? 'Редактировать товар' : 'Новый товар'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Название
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input-field"
                  placeholder="Название товара"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Цена (Coins)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formPrice || ''}
                  onChange={(e) =>
                    setFormPrice(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Порядок
                </label>
                <input
                  type="number"
                  min={0}
                  value={formSortOrder}
                  onChange={(e) =>
                    setFormSortOrder(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSave}
                className="px-5 py-2 text-sm font-medium rounded-xl bg-codify-blue-600 text-white hover:bg-codify-blue-700 transition-all active:scale-[0.97]"
              >
                {editingItem ? 'Сохранить' : 'Создать'}
              </button>
              <button
                onClick={resetForm}
                className="btn-secondary"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Active items */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Активные товары ({activeItems.length})
          </h2>
          {activeItems.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <p className="text-sm text-gray-400">Нет активных товаров. Добавьте первый товар.</p>
            </div>
          ) : (
            activeItems.map((item, index) => (
              <div
                key={item.id}
                className="card flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-codify-purple-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs leading-none transition-colors"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveItem(index, 1)}
                      disabled={index === activeItems.length - 1}
                      className="text-gray-400 hover:text-codify-purple-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs leading-none transition-colors"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      ID: {item.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold text-codify-purple-600 tabular-nums">
                    {item.price.toLocaleString()} Coins
                  </span>
                  <span className="text-xs text-gray-300">#{item.sortOrder}</span>
                  <button
                    onClick={() => openEdit(item)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg text-codify-blue-600 hover:bg-codify-blue-50 transition-colors"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => setArchiveTarget(item)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Архивировать
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Archived items */}
        {archivedItems.length > 0 && (
          <div className="mt-8 space-y-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Архивированные ({archivedItems.length})
            </h2>
            {archivedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl opacity-60"
              >
                <p className="text-sm text-gray-500">{item.name}</p>
                <span className="text-sm text-gray-400 tabular-nums">
                  {item.price.toLocaleString()} Coins
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archive confirmation modal */}
      {archiveTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        >
          <div className="absolute inset-0" onClick={() => setArchiveTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-sm mx-auto z-10 p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Архивировать товар?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Товар «{archiveTarget.name}» будет скрыт из каталога. Его можно будет восстановить через API.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setArchiveTarget(null)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmArchive}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all active:scale-[0.97]"
                >
                  Архивировать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
