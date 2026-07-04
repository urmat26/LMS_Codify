'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Student, MerchItem, WithdrawPayload, CartItem } from '@/types';
import { useWithdraw } from '@/hooks/useWithdraw';

interface WithdrawModalProps {
  student: Student;
  merchItems: MerchItem[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (studentId: string, newBalance: number, transactionId: string) => void;
}

export function WithdrawModal({
  student,
  merchItems,
  isOpen,
  onClose,
  onSuccess,
}: WithdrawModalProps) {
  const [mode, setMode] = useState<'merch' | 'manual'>('merch');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [manualComment, setManualComment] = useState<string>('');
  const [merchComment, setMerchComment] = useState<string>('');
  const [confirmStep, setConfirmStep] = useState(false);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const { withdraw, isProcessing, error, clearError, clearResult } =
    useWithdraw();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCart([]);
      setMode('merch');
      setManualAmount(0);
      setManualComment('');
      setMerchComment('');
      setConfirmStep(false);
      clearError();
      clearResult();
    }
  }, [isOpen, clearError, clearResult]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Add item to cart
  const addToCart = useCallback((merchItemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.merchItemId === merchItemId);
      if (existing) {
        return prev.map((c) =>
          c.merchItemId === merchItemId
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { merchItemId, quantity: 1 }];
    });
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((merchItemId: string) => {
    setCart((prev) => prev.filter((c) => c.merchItemId !== merchItemId));
  }, []);

  // Update quantity for a cart item
  const updateCartQty = useCallback((merchItemId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((c) =>
        c.merchItemId === merchItemId ? { ...c, quantity } : c
      )
    );
  }, []);

  // Calculate total cost
  const totalCost =
    mode === 'merch'
      ? cart.reduce((sum, c) => {
          const item = merchItems.find((m) => m.id === c.merchItemId);
          return sum + (item ? item.price * c.quantity : 0);
        }, 0)
      : manualAmount;

  const hasEnoughBalance = student.coinBalance >= totalCost;
  const canSubmit =
    totalCost > 0 &&
    hasEnoughBalance &&
    !isProcessing &&
    (mode === 'merch' ? cart.length > 0 : manualAmount > 0);

  // Handle actual withdrawal (called from confirm step)
  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isProcessing) return;

    if (submitButtonRef.current) {
      submitButtonRef.current.disabled = true;
    }

    const payload: WithdrawPayload =
      mode === 'merch'
        ? { type: 'merch', items: cart, comment: merchComment || undefined }
        : { type: 'manual', amount: manualAmount, comment: manualComment || undefined };

    try {
      const result = await withdraw(student.id, payload);
      onSuccess(student.id, result.newBalance, result.transactionId);
      onClose();
    } catch {
      // Error handled by hook's error state (inline display)
    }
  }, [
    canSubmit, isProcessing, mode, cart, merchComment,
    manualAmount, manualComment, student, withdraw, onSuccess, onClose,
  ]);

  // Handle keyboard: ESC to close/back, Ctrl+Enter to submit
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (confirmStep) {
          setConfirmStep(false);
        } else {
          onClose();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (confirmStep && canSubmit && !isProcessing) {
          e.preventDefault();
          handleSubmit();
        }
        if (!confirmStep && canSubmit && !isProcessing) {
          e.preventDefault();
          setConfirmStep(true);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, confirmStep, canSubmit, isProcessing, handleSubmit]);

  if (!isOpen) return null;

  // Build summary label for confirm step
  const summaryLabel =
    mode === 'merch'
      ? cart
          .map((c) => {
            const item = merchItems.find((m) => m.id === c.merchItemId);
            return item ? `${item.name} ×${c.quantity}` : '';
          })
          .filter(Boolean)
          .join(', ')
      : manualComment || 'Произвольное списание';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      >
        {/* Click outside to close */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-lg mx-auto z-10 animate-in">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all z-10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-codify-purple-100 flex items-center justify-center text-sm font-bold text-codify-purple-700">
                {student.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Списание коинов</h2>
                <p className="text-sm text-gray-500">{student.fullName}</p>
              </div>
            </div>
          </div>

          {!confirmStep ? (
            /* ---- FORM STEP ---- */
            <>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Current balance block */}
                <div className={`rounded-xl p-4 border transition-colors ${
                  hasEnoughBalance || totalCost === 0
                    ? 'bg-codify-green-50/50 border-codify-green-100'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        hasEnoughBalance || totalCost === 0
                          ? 'bg-codify-green-100 text-codify-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Текущий баланс</p>
                        <p className={`text-xl sm:text-2xl font-bold tabular-nums ${
                          hasEnoughBalance || totalCost === 0
                            ? 'text-codify-green-600'
                            : 'text-red-600'
                        }`}>
                          {student.coinBalance.toLocaleString()} <span className="text-sm font-medium">Coins</span>
                        </p>
                      </div>
                    </div>
                    {totalCost > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Списание</p>
                        <p className="text-base sm:text-lg font-bold text-gray-900 tabular-nums">
                          −{totalCost.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setMode('merch')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      mode === 'merch'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Корзина товаров
                  </button>
                  <button
                    onClick={() => setMode('manual')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      mode === 'manual'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Произвольное списание
                  </button>
                </div>

                {/* Tab content: Cart */}
                {mode === 'merch' && (
                  <div className="space-y-4">
                    {/* Graduation set shortcut */}
                    <div>
                      <button
                        onClick={() => {
                          const hoodie = merchItems.find((i) => i.name.includes('Худи') || i.name.includes('худи'));
                          const socks = merchItems.find((i) => i.name.includes('Носки') || i.name.includes('носки'));
                          const stickers = merchItems.find((i) => i.name.includes('Стикеры') || i.name.includes('стикеры'));
                          const items = [hoodie, socks, stickers].filter(Boolean) as MerchItem[];
                          // Clear existing cart and add graduation set
                          setCart(items.map((i) => ({ merchItemId: i.id, quantity: 1 })));
                        }}
                        className="w-full flex items-center gap-3 p-3 mb-3 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-400 transition-all text-left"
                      >
                        <span className="text-lg">🎓</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-800">Выпускной набор</p>
                          <p className="text-xs text-amber-600">Худи + Носки + Стикеры · одним кликом</p>
                        </div>
                        <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                          1300 Coins
                        </span>
                      </button>
                    </div>

                    {/* Available items grid */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Доступные товары
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {merchItems.map((item) => {
                          const inCart = cart.find((c) => c.merchItemId === item.id);
                          return (
                            <button
                              key={item.id}
                              onClick={() => addToCart(item.id)}
                              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                inCart
                                  ? 'bg-codify-purple-50 border-codify-purple-200'
                                  : 'bg-white border-gray-200 hover:border-codify-purple-200 hover:bg-codify-purple-50/30'
                              }`}
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.price} Coins</p>
                              </div>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                inCart
                                  ? 'bg-codify-purple-200 text-codify-purple-700'
                                  : 'bg-gray-100 text-gray-400'
                              }`}>
                                {inCart ? inCart.quantity : '+'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Cart summary */}
                    {cart.length > 0 && (
                      <>
                        <div className="border-t border-gray-100 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">Корзина</label>
                            <span className="text-xs text-gray-400">{cart.reduce((s, c) => s + c.quantity, 0)} шт.</span>
                          </div>
                          <div className="space-y-2">
                            {cart.map((c) => {
                              const item = merchItems.find((m) => m.id === c.merchItemId);
                              if (!item) return null;
                              return (
                                <div
                                  key={c.merchItemId}
                                  className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <button
                                      onClick={() => removeFromCart(c.merchItemId)}
                                      className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 flex-shrink-0"
                                    >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                    <span className="text-sm text-gray-900 truncate">{item.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                      onClick={() => updateCartQty(c.merchItemId, c.quantity - 1)}
                                      disabled={c.quantity <= 1}
                                      className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                                    >
                                      −
                                    </button>
                                    <span className="w-6 text-center text-sm font-semibold tabular-nums">{c.quantity}</span>
                                    <button
                                      onClick={() => updateCartQty(c.merchItemId, c.quantity + 1)}
                                      className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                                    >
                                      +
                                    </button>
                                    <span className="text-sm font-bold text-gray-900 tabular-nums w-14 text-right">
                                      {(item.price * c.quantity).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Cart comment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Комментарий <span className="text-gray-400 font-normal">(необязательно)</span>
                          </label>
                          <textarea
                            value={merchComment}
                            onChange={(e) => setMerchComment(e.target.value)}
                            className="input-field min-h-[60px] resize-none"
                            placeholder="Добавьте комментарий к выдаче..."
                            rows={2}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Tab content: Manual */}
                {mode === 'manual' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Сумма списания (Coins)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={student.coinBalance}
                        value={manualAmount || ''}
                        onChange={(e) =>
                          setManualAmount(Math.max(0, parseInt(e.target.value) || 0))
                        }
                        className="input-field"
                        placeholder="Введите сумму"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Комментарий <span className="text-gray-400 font-normal">(необязательно)</span>
                      </label>
                      <textarea
                        value={manualComment}
                        onChange={(e) => setManualComment(e.target.value)}
                        className="input-field min-h-[80px] resize-none"
                        placeholder="Укажите причину списания..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Insufficient balance warning */}
                {!hasEnoughBalance && totalCost > 0 && (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-800">Недостаточно коинов</p>
                      <p className="text-sm text-red-600 mt-0.5">
                        Баланс: {student.coinBalance.toLocaleString()} Coins, требуется: {totalCost.toLocaleString()} Coins
                      </p>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>

              {/* Footer (form step) */}
              <div className="px-4 sm:px-6 pb-3 sm:pb-4 flex justify-end gap-3">
                <button onClick={onClose} className="btn-secondary">
                  Отмена
                </button>
                <button
                  onClick={() => setConfirmStep(true)}
                  disabled={!canSubmit || isProcessing}
                  className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all active:scale-[0.97] ${
                    canSubmit && !isProcessing
                      ? 'bg-codify-blue-600 text-white hover:bg-codify-blue-700 shadow-sm'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  Списать {totalCost > 0 ? `${totalCost.toLocaleString()} Coins` : ''}
                </button>
              </div>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <p className="text-xs text-gray-400 text-center sm:text-right">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Esc</kbd> — закрыть ·{' '}
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Ctrl+Enter</kbd> — далее
                </p>
              </div>
            </>
          ) : (
            /* ---- CONFIRM STEP ---- */
            <>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-5">
                {/* Summary card */}
                <div className="rounded-xl bg-codify-purple-50 border border-codify-purple-100 p-5 text-center">
                  <p className="text-xs font-medium text-codify-purple-500 uppercase tracking-wider mb-1">
                    Подтвердите списание
                  </p>
                  <p className="text-3xl sm:text-4xl font-bold text-codify-purple-700 tabular-nums my-3">
                    −{totalCost.toLocaleString()}
                    <span className="text-base sm:text-lg font-medium ml-1">Coins</span>
                  </p>
                  <p className="text-sm text-codify-purple-600">
                    у студента <span className="font-semibold">{student.fullName}</span>
                  </p>
                </div>

                {/* Detail rows */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2.5 px-4 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-500">Основание</span>
                    <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">
                      {summaryLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 px-4 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-500">Текущий баланс</span>
                    <span className="text-sm font-bold text-codify-green-600 tabular-nums">
                      {student.coinBalance.toLocaleString()} Coins
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 px-4 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-500">Баланс после списания</span>
                    <span className="text-sm font-bold text-gray-900 tabular-nums">
                      {(student.coinBalance - totalCost).toLocaleString()} Coins
                    </span>
                  </div>
                </div>

                {/* Error still shows here */}
                {error && (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>

              {/* Footer (confirm step) */}
              <div className="px-4 sm:px-6 pb-3 sm:pb-4 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmStep(false)}
                  className="btn-secondary"
                >
                  Назад
                </button>
                <button
                  ref={submitButtonRef}
                  onClick={handleSubmit}
                  disabled={!canSubmit || isProcessing}
                  className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all active:scale-[0.97] ${
                    canSubmit && !isProcessing
                      ? 'bg-codify-purple-600 text-white hover:bg-codify-purple-700 shadow-sm'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Обработка...
                    </span>
                  ) : (
                    'Подтвердить списание'
                  )}
                </button>
              </div>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <p className="text-xs text-gray-400 text-center sm:text-right">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Esc</kbd> — назад ·{' '}
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Ctrl+Enter</kbd> — подтвердить
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
