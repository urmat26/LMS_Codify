'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Group } from '@/types';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [groupId, setGroupId] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('codify_token');
    if (token) {
      router.push('/shop');
    }
  }, [router]);

  useEffect(() => {
    api.getGroups().then((res) => {
      setGroups(res.data);
      if (res.data.length > 0) setGroupId(res.data[0].id);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.register({ email, password, fullName, groupId });
      localStorage.setItem('codify_token', response.data.token);
      localStorage.setItem('codify_user', JSON.stringify(response.data.user));
      setIsSuccess(true);
      setTimeout(() => router.push('/shop'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-codify-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-codify-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Регистрация успешна!</h1>
          <p className="text-sm text-gray-500">Перенаправляем в магазин...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Codify</h1>
          <p className="text-sm text-gray-500 mt-1">
            Регистрация студента
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4"
        >
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ФИО
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Иванов Иван Иванович"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="student@codify.ru"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Минимум 4 символа"
              required
              minLength={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Группа
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              required
            >
              {groups.length === 0 && <option value="">Загрузка...</option>}
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.course} курс)</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>

          <p className="text-xs text-gray-400 text-center pt-2">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-800">
              Войти
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
