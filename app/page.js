'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    if (role === 'teacher') {
      router.push('/teacher');
    } else {
      router.push('/student');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">EmoBot</h1>
          <p className="text-gray-500 mt-2">AI чатбот для обучения STEM</p>
        </div>

        {/* Выбор роли */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
          <button
            onClick={() => setRole('student')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              role === 'student'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Ученик
          </button>
          <button
            onClick={() => setRole('teacher')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              role === 'teacher'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Учитель
          </button>
        </div>

        {/* Форма */}
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
          />
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Войти
          </button>
        </div>

      </div>
    </div>
  );
}