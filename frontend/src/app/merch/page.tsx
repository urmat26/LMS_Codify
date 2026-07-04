'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Sidebar } from '@/components/Sidebar';
import { MerchCatalogManager } from '@/components/MerchCatalogManager';

export default function MerchPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('codify_token');
    const userData = localStorage.getItem('codify_user');
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const u = JSON.parse(userData);
    if (u.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setUser(u);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('codify_token');
    localStorage.removeItem('codify_user');
    router.push('/login');
  };

  if (!mounted || !user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and breadcrumbs */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 sm:gap-2.5">
                <Sidebar isAdmin={isAdmin} />
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-codify-purple-600 to-codify-purple-800 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">C</span>
                </div>
                <span className="text-base font-semibold text-gray-900">Кодифай</span>
              </div>
              <span className="text-gray-200 text-sm">/</span>
              <Breadcrumbs items={[
                { label: 'Выдача мерча', href: '/dashboard' },
                { label: 'Каталог наград' },
              ]} />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-codify-purple-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-codify-purple-700">
                    {user.fullName.charAt(0)}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-700 leading-tight">{user.fullName}</p>
                  <p className="text-xs text-gray-400 leading-tight">Администратор</p>
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

      {/* Page content */}
      <main>
        <MerchCatalogManager />
      </main>
    </div>
  );
}
