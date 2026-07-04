'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MerchItem, MerchSize } from '@/types';
import { api } from '@/lib/api';
import { Toast, ToastData } from './Toast';

const CATEGORIES = ['', 'Одежда', 'Канцелярия', 'Сувениры', 'Аксессуары'] as const;

function SortableItem({
  item,
  index,
  total,
  onEdit,
  onArchive,
}: {
  item: MerchItem;
  index: number;
  total: number;
  onEdit: (item: MerchItem) => void;
  onArchive: (item: MerchItem) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card flex items-center justify-between p-4 ${isDragging ? 'shadow-md' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          {...attributes}
          {...listeners}
          className="flex flex-col gap-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-codify-purple-500 transition-colors px-1"
          title="Перетащить"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
          </svg>
        </button>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {item.name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {item.category ?? 'Без категории'} · {item.stock ?? 0} шт. · {item.price.toLocaleString()} Coins
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-gray-300">#{item.sortOrder}</span>
        <button
          onClick={() => onEdit(item)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg text-codify-blue-600 hover:bg-codify-blue-50 transition-colors"
        >
          Изменить
        </button>
        <button
          onClick={() => onArchive(item)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 transition-colors"
        >
          Архивировать
        </button>
      </div>
    </div>
  );
}

export function MerchCatalogManager() {
  const [items, setItems] = useState<MerchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MerchItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<MerchItem | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCategory, setFormCategory] = useState('');
  const [formStock, setFormStock] = useState<number>(0);
  const [formSortOrder, setFormSortOrder] = useState<number>(0);

  // Sizes
  const [formSizes, setFormSizes] = useState<{ size: string; quantity: number }[]>([]);
  const [newSize, setNewSize] = useState('');
  const [newSizeQty, setNewSizeQty] = useState(1);

  // Tab
  const [tab, setTab] = useState<'catalog' | 'inventory'>('catalog');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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
    setFormDescription('');
    setFormPrice(0);
    setFormCategory('');
    setFormStock(0);
    setFormSortOrder(0);
    setFormSizes([]);
    setNewSize('');
    setNewSizeQty(1);
    setEditingItem(null);
    setIsAdding(false);
  };

  const openEdit = (item: MerchItem) => {
    setFormName(item.name);
    setFormDescription(item.description ?? '');
    setFormPrice(item.price);
    setFormCategory(item.category ?? '');
    setFormStock(item.stock ?? 0);
    setFormSortOrder(item.sortOrder);
    setFormSizes(item.sizes?.map((s: MerchSize) => ({ size: s.size, quantity: s.quantity })) ?? []);
    setEditingItem(item);
    setIsAdding(false);
  };

  const addSize = () => {
    if (!newSize.trim()) return;
    if (formSizes.some((s) => s.size === newSize.trim())) {
      setToast({ type: 'error', message: 'Этот размер уже добавлен' });
      return;
    }
    setFormSizes([...formSizes, { size: newSize.trim(), quantity: newSizeQty }]);
    setNewSize('');
    setNewSizeQty(1);
  };

  const removeSize = (size: string) => {
    setFormSizes(formSizes.filter((s) => s.size !== size));
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
          description: formDescription.trim() || undefined,
          price: formPrice,
          category: formCategory || undefined,
          stock: formStock,
          sortOrder: formSortOrder,
        });
        setToast({ type: 'success', message: 'Товар обновлён' });
      } else {
        await api.createMerchItem({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          price: formPrice,
          category: formCategory || undefined,
          stock: formStock,
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = activeItems.findIndex((i) => i.id === active.id);
    const newIndex = activeItems.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(activeItems, oldIndex, newIndex);

    try {
      await api.reorderMerchItems(
        reordered.map((item, idx) => ({
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

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab('catalog')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === 'catalog' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Каталог
          </button>
          <button
            onClick={() => setTab('inventory')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === 'inventory' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Управление товарами
          </button>
        </div>

        {tab === 'catalog' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Каталог наград</h1>
                <p className="mt-1 text-sm text-gray-500">Просмотр списка товаров</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeItems.map((item) => (
                <div key={item.id} className="card p-4 flex flex-col">
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
                      <span className="text-xs text-gray-400">
                        {item.stock ?? 0} шт.
                      </span>
                    </div>
                    {item.category && (
                      <span className="mt-2 inline-block text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'inventory' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Управление товарами</h1>
                <p className="mt-1 text-sm text-gray-500">Редактирование справочника мерча</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      Категория
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Без категории</option>
                      {CATEGORIES.filter(Boolean).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Сток (шт.)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formStock}
                      onChange={(e) =>
                        setFormStock(Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="input-field"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Описание
                    </label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="input-field resize-none"
                      placeholder="Описание товара"
                      rows={2}
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

                {/* Sizes */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Размеры (для одежды)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formSizes.map((s) => (
                      <span
                        key={s.size}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
                      >
                        {s.size} ({s.quantity} шт.)
                        <button
                          onClick={() => removeSize(s.size)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 items-end">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 mb-1">Размер</label>
                      <input
                        type="text"
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        className="input-field w-24"
                        placeholder="S, M, L..."
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 mb-1">Кол-во</label>
                      <input
                        type="number"
                        min={1}
                        value={newSizeQty}
                        onChange={(e) => setNewSizeQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="input-field w-20"
                      />
                    </div>
                    <button
                      onClick={addSize}
                      className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      Добавить
                    </button>
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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={activeItems.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {activeItems.map((item, index) => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          index={index}
                          total={activeItems.length}
                          onEdit={openEdit}
                          onArchive={setArchiveTarget}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
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
                Товар «{archiveTarget.name}» будет скрыт из каталога.
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
