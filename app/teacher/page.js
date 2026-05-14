'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherPage() {
  const [tab, setTab] = useState('lesson');
  const [lesson, setLesson] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) { router.push('/'); return; }
      const data = await response.json();
      setUser(data);

      const lessonRes = await fetch('/api/lessons');
      if (lessonRes.ok) {
        const lessonData = await lessonRes.json();
        if (lessonData.content) setLesson(lessonData.content);
      }

      const studentsRes = await fetch('/api/users');
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }
    };
    init();
  }, []);

  const handleSave = async () => {
    if (!lesson.trim()) return;
    setLoading(true);
    await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: lesson }),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Шапка */}
      <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">EmoBot</h1>
          <p className="text-indigo-200 text-sm">
            {user ? `${user.firstName} ${user.lastName}` : 'Учитель'}
          </p>
        </div>
        <button onClick={handleLogout} className="text-indigo-200 hover:text-white text-sm">
          Выйти
        </button>
      </div>

      {/* Вкладки */}
      <div className="bg-white border-b px-6">
        <div className="max-w-3xl mx-auto flex gap-6">
          <button
            onClick={() => setTab('lesson')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors ${
              tab === 'lesson'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Материал урока
          </button>
          <button
            onClick={() => setTab('students')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors ${
              tab === 'students'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Ученики ({students.length})
          </button>
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">

        {/* Материал урока */}
        {tab === 'lesson' && (
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
              disabled={loading}
              className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saved ? '✓ Сохранено!' : loading ? 'Сохраняю...' : 'Сохранить материал'}
            </button>
          </div>
        )}

        {/* Список учеников */}
        {tab === 'students' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Ученики ({students.length})
            </h2>
            {students.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                Пока нет зарегистрированных учеников
              </p>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                        {student.first_name[0]}{student.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-gray-400">@{student.username}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(student.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}