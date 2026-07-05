'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Sidebar } from '@/components/Sidebar';
import { GroupWithdrawPage } from '@/components/GroupWithdrawPage';

export default function GroupPage() {
  const params = useParams();
  const groupId = params?.groupId as string | undefined;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [user, setUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('codify_token');
    const userData = localStorage.getItem('codify_user');
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    const u = JSON.parse(userData);
    if (u.role === 'student') {
      router.push('/shop');
      return;
    }
    setUser(u);
  }, [router]);

  if (!mounted || !user || !groupId) return null;

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 sm:gap-2.5">
                <Sidebar isAdmin={isAdmin} />
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Назад
                </button>
              </div>
              <span className="text-gray-200 text-sm">/</span>
              <Breadcrumbs items={[
                { label: 'Выдача мерча', href: '/dashboard' },
                { label: groupName || 'Загрузка...' },
              ]} />
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-codify-purple-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-codify-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <span className="text-xs text-gray-400 hidden sm:inline">{isAdmin ? 'Администратор' : 'Отдел заботы'}</span>
            </div>
          </div>
        </div>
      </header>

      <main>
        <GroupWithdrawPage groupId={groupId} onGroupNameChange={setGroupName} />
      </main>
    </div>
  );
}
