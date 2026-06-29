'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Group } from '@/types';
import { api } from '@/lib/api';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Sidebar } from '@/components/Sidebar';
import { Toast, ToastData } from '@/components/Toast';

interface StaffAssignment {
  user: { id: string; fullName: string; email: string; role: string };
  groups: Array<{ id: string; name: string; course: number }>;
}

export default function StaffGroupsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

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

  useEffect(() => {
    if (!mounted) return;
    loadData();
  }, [mounted]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [assignRes, groupsRes] = await Promise.all([
        api.getStaffGroupAssignments(),
        api.getGroups(),
      ]);
      setAssignments(assignRes.data);
      setAllGroups(groupsRes.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки';
      setToast({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (staff: StaffAssignment) => {
    setEditingUserId(staff.user.id);
    setSelectedGroupIds(staff.groups.map((g) => g.id));
  };

  const handleSave = async () => {
    if (!editingUserId) return;
    try {
      await api.assignStaffGroups(editingUserId, selectedGroupIds);
      setToast({ type: 'success', message: 'Привязки обновлены' });
      setEditingUserId(null);
      loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка сохранения';
      setToast({ type: 'error', message });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('codify_token');
    localStorage.removeItem('codify_user');
    router.push('/login');
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  if (!mounted || !user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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
                { label: 'Доступ к группам' },
              ]} />
            </div>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Доступ сотрудников к группам</h1>
          <p className="mt-1 text-sm text-gray-500">
            Если у сотрудника нет привязок — он видит все группы (обратная совместимость)
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-100 rounded w-16" />
                  <div className="h-6 bg-gray-100 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((staff) => (
              <div key={staff.user.id} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{staff.user.fullName}</p>
                    <p className="text-xs text-gray-400">{staff.user.email} · {staff.user.role === 'admin' ? 'Администратор' : 'Отдел заботы'}</p>
                  </div>
                  {staff.user.role !== 'admin' && (
                    <button
                      onClick={() => handleEdit(staff)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg text-codify-blue-600 hover:bg-codify-blue-50 transition-colors"
                    >
                      {staff.groups.length > 0 ? 'Изменить' : 'Назначить'}
                    </button>
                  )}
                </div>
                {staff.user.role === 'admin' ? (
                  <p className="text-xs text-gray-400">Администратор имеет доступ ко всем группам</p>
                ) : staff.groups.length === 0 ? (
                  <p className="text-xs text-amber-600">Нет привязок — видит все группы</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {staff.groups.map((g) => (
                      <span key={g.id} className="inline-flex px-2.5 py-1 text-xs font-medium bg-codify-purple-50 text-codify-purple-700 rounded-full">
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Edit modal */}
        {editingUserId && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          >
            <div className="absolute inset-0" onClick={() => setEditingUserId(null)} />
            <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-lg mx-auto z-10 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Назначение групп</h3>
              <p className="text-sm text-gray-500 mb-4">Выберите группы, к которым сотрудник будет иметь доступ</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allGroups.map((g) => (
                  <label
                    key={g.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroupIds.includes(g.id)}
                      onChange={() => toggleGroup(g.id)}
                      className="w-4 h-4 rounded border-gray-300 text-codify-purple-600 focus:ring-codify-purple-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{g.name}</p>
                      <p className="text-xs text-gray-400">{g.course} курс · {g.studentCount} студентов</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setEditingUserId(null)}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-5 py-2.5 text-sm font-medium rounded-xl bg-codify-blue-600 text-white hover:bg-codify-blue-700 transition-all"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
