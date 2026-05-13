'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherPage() {
  const [lesson, setLesson] = useState('');
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleSave = () => {
    if (!lesson.trim()) return;
    localStorage.setItem('lessonContent', lesson);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Шапка */}
      <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">EmoBot</h1>
          <p className="text-indigo-200 text-sm">Режим учителя</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="text-indigo-200 hover:text-white text-sm"
        >
          Выйти
        </button>
      </div>

      {/* Контент */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Материал урока</h2>
          <p className="text-gray-500 text-sm mb-4">
            Вставьте текст урока — чатбот будет отвечать на основе этого материала
          </p>
          <textarea
            value={lesson}
            onChange={(e) => setLesson(e.target.value)}
            placeholder="Вставьте текст урока сюда..."
            rows={12}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700 resize-none"
          />
          <button
            onClick={handleSave}
            className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            {saved ? '✓ Сохранено!' : 'Сохранить материал'}
          </button>
        </div>
      </div>

    </div>
  );
}