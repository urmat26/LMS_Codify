'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isAdmin: boolean;
  isStudent?: boolean;
}

export function Sidebar({ isAdmin, isStudent }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('sidebar_pinned');
    if (stored !== null) {
      setIsPinned(stored === 'true');
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('sidebar_pinned', String(isPinned));
  }, [isPinned, mounted]);

  useEffect(() => {
    if (isOpen || !isPinned) {
      document.body.style.overflow = '';
    } else {
      document.body.style.overflow = '';
    }
    if (isOpen && isPinned) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isPinned]);

  useEffect(() => {
    if (isPinned) setIsOpen(false);
  }, [pathname, isPinned]);

  useEffect(() => {
    if (!isPinned) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, isPinned]);

  type NavItem = { label: string; href: string; icon: React.ReactNode; disabled?: boolean };
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (isPinned) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsOpen(true);
  }, [isPinned]);

  const handleMouseLeave = useCallback(() => {
    if (isPinned) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  }, [isPinned]);

  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

  const PinIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      {isPinned ? (
        <>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </>
      ) : (
        <circle cx="12" cy="12" r="8" />
      )}
    </svg>
  );

  const navItems: NavItem[] = isStudent
    ? [
        {
          label: 'Магазин',
          href: '/shop',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
            </svg>
          ),
        },
        {
          label: 'Мои покупки',
          href: '/purchases',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          ),
        },
      ]
    : [
        {
          label: 'Выдача мерча',
          href: '/dashboard',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          label: 'Каталог наград',
          href: '/merch',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          ),
        },
        {
          label: 'Журнал аудита',
          href: '/admin/audit',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          ),
        },
        {
          label: 'Доступ к группам',
          href: '/admin/staff',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          ),
        },
      ];

  const condensed = !isPinned && !isOpen;

  const handleHamburgerClick = () => {
    if (isPinned || isTouchDevice) {
      setIsOpen(!isOpen);
    } else {
      setIsPinned(true);
    }
  };

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={handleHamburgerClick}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-codify-purple-600 hover:bg-codify-purple-50 transition-all"
        aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
      >
        <div className="relative w-5 h-5">
          <span
            className={`absolute left-0 block h-0.5 w-5 bg-current rounded-full transition-all duration-300 ${
              isOpen ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0.5'
            }`}
          />
          <span
            className={`absolute left-0 block h-0.5 bg-current rounded-full transition-all duration-300 ${
              isOpen ? 'top-1/2 -translate-y-1/2 w-0 opacity-0' : 'top-1/2 -translate-y-1/2 w-4'
            }`}
          />
          <span
            className={`absolute left-0 block h-0.5 w-5 bg-current rounded-full transition-all duration-300 ${
              isOpen ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'bottom-0.5'
            }`}
          />
        </div>
      </button>

      {/* Backdrop overlay — only when pinned */}
      {isPinned && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed top-0 left-0 z-50 h-full bg-white shadow-xl border-r border-gray-100 transition-all duration-300 ease-in-out ${
          condensed ? 'w-16 translate-x-0' : isPinned && !isOpen ? 'w-64 -translate-x-full' : 'w-64 translate-x-0'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center h-16 border-b border-gray-100 px-5">
          <div className={`flex items-center gap-2.5 ${condensed ? 'justify-center w-full' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-codify-purple-600 to-codify-purple-800 flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">C</span>
            </div>
            {!condensed && (
              <>
                {isPinned && <span className="text-base font-semibold text-gray-900">Кодифай</span>}
                <div className="flex items-center gap-1 ml-auto">
                  {isPinned && (
                    <button
                      onClick={() => setIsPinned(false)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-codify-purple-600 hover:bg-codify-purple-50 transition-all"
                      title="Открепить меню"
                    >
                      <PinIcon />
                    </button>
                  )}
                  {isPinned && (
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Nav items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.disabled ? '#' : item.href}
                onClick={() => {
                  if (!item.disabled) setIsOpen(false);
                }}
                className={`flex items-center rounded-xl text-sm font-medium transition-all ${
                  condensed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-codify-purple-50 text-codify-purple-700'
                    : item.disabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className={condensed ? '' : 'shrink-0'}>
                  <span className={isActive ? 'text-codify-purple-600' : item.disabled ? 'text-gray-300' : 'text-gray-400'}>
                    {item.icon}
                  </span>
                </span>
                {!condensed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {item.disabled && (
                      <span className="ml-auto text-[10px] text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        {!condensed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">Codify LMS v1.0</p>
          </div>
        )}
      </div>
    </>
  );
}
