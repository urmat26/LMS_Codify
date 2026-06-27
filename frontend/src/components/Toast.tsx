'use client';

import { useEffect, useState } from 'react';

export interface ToastData {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
  duration?: number;
}

export function Toast({ toast, onClose, duration = 4000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose, duration]);

  if (!toast) return null;

  const config =
    toast.type === 'success'
      ? {
          bg: 'bg-codify-green-600',
          border: 'border-codify-green-200',
          icon: 'text-codify-green-100',
          ring: 'ring-codify-green-500/20',
          badge: 'bg-codify-green-500',
        }
      : toast.type === 'error'
      ? {
          bg: 'bg-red-600',
          border: 'border-red-200',
          icon: 'text-red-100',
          ring: 'ring-red-500/20',
          badge: 'bg-red-500',
        }
      : {
          bg: 'bg-gray-800',
          border: 'border-gray-600',
          icon: 'text-gray-300',
          ring: 'ring-gray-500/20',
          badge: 'bg-gray-600',
        };

  const icon =
    toast.type === 'success' ? (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ) : toast.type === 'error' ? (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    );

  return (
    <div
      className={`fixed top-6 right-6 z-[60] transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`${config.bg} text-white px-5 py-4 rounded-2xl shadow-lg shadow-black/10 max-w-sm flex items-center gap-3 ring-1 ${config.ring}`}
      >
        <div className={`w-7 h-7 rounded-full ${config.badge} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-white/60 hover:text-white flex-shrink-0 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
