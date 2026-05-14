'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) { router.push('/'); return; }
      setUser(await response.json());
    };
    init();
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Заполните все поля');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Новые пароли не совпадают');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error);
    } else {
      setSuccess('Пароль успешно изменён!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">EmoBot</h1>
          <p className="text-indigo-200 text-sm">{user.firstName} {user.lastName}</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => router.push(user.role === 'teacher' ? '/teacher' : '/student')}
            className="text-indigo-200 hover:text-white text-sm"
          >
            Назад
          </button>
          <button onClick={handleLogout} className="text-indigo-200 hover:text-white text-sm">
            Выйти
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-6">

        {/* Информация профиля */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Профиль</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-800">{user.firstName} {user.lastName}</p>
              <p className="text-gray-400">@{user.username}</p>
              <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                user.role === 'teacher' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {user.role === 'teacher' ? 'Учитель' : 'Ученик'}
              </span>
            </div>
          </div>
        </div>

        {/* Смена пароля */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Сменить пароль</h2>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 px-4 py-3 rounded-xl text-sm">{success}</div>
            )}
            <input
              type="password"
              placeholder="Текущий пароль"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
            />
            <input
              type="password"
              placeholder="Новый пароль"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
            />
            <input
              type="password"
              placeholder="Повторите новый пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
            />
            <button
              onClick={handleChangePassword}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Сохраняю...' : 'Сменить пароль'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}