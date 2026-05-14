'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherPage() {
  const [tab, setTab] = useState('lessons');
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    key_concepts: '',
    discussion_questions: '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) { router.push('/'); return; }
      setUser(await response.json());
      loadLessons();
      loadStudents();
    };
    init();
  }, []);

  const loadLessons = async () => {
    const res = await fetch('/api/lessons');
    if (res.ok) setLessons(await res.json());
  };

  const loadStudents = async () => {
    const res = await fetch('/api/users');
    if (res.ok) setStudents(await res.json());
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/lessons/parse', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      setForm((prev) => ({ ...prev, content: data.text }));
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);

    if (editingLesson) {
      await fetch('/api/lessons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingLesson.id, ...form }),
      });
    } else {
      await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setShowForm(false);
    setEditingLesson(null);
    setForm({ title: '', content: '', key_concepts: '', discussion_questions: '' });
    loadLessons();
  };

  const handleEdit = (lesson) => {
    setEditingLesson(lesson);
    setForm({
      title: lesson.title,
      content: lesson.content || '',
      key_concepts: lesson.key_concepts || '',
      discussion_questions: lesson.discussion_questions || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить урок?')) return;
    await fetch(`/api/lessons?id=${id}`, { method: 'DELETE' });
    loadLessons();
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
          <p className="text-indigo-200 text-sm">{user ? `${user.firstName} ${user.lastName}` : 'Учитель'}</p>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={() => router.push('/profile')} className="text-indigo-200 hover:text-white text-sm">Профиль</button>
          <button onClick={handleLogout} className="text-indigo-200 hover:text-white text-sm">Выйти</button>
        </div>
      </div>

      {/* Вкладки */}
      <div className="bg-white border-b px-6">
        <div className="max-w-3xl mx-auto flex gap-6">
          <button
            onClick={() => setTab('lessons')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors ${
              tab === 'lessons' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'
            }`}
          >
            Уроки ({lessons.length})
          </button>
          <button
            onClick={() => setTab('students')}
            className={`py-4 text-sm font-medium border-b-2 transition-colors ${
              tab === 'students' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'
            }`}
          >
            Ученики ({students.length})
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">

        {/* Уроки */}
        {tab === 'lessons' && (
          <div className="space-y-4">
            {!showForm && (
              <button
                onClick={() => { setShowForm(true); setEditingLesson(null); setForm({ title: '', content: '', key_concepts: '', discussion_questions: '' }); }}
                className="w-full py-3 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-2xl font-medium hover:bg-indigo-50 transition-colors"
              >
                + Новый урок
              </button>
            )}

            {/* Форма создания/редактирования */}
            {showForm && (
              <div className="bg-white rounded-2xl shadow p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingLesson ? 'Редактировать урок' : 'Новый урок'}
                </h2>

                <input
                  type="text"
                  placeholder="Название урока *"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
                />

                {/* Загрузка файла */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-gray-500 text-sm mb-2">Загрузите PDF или DOCX файл</p>
                  <label className="cursor-pointer">
                    <span className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100">
                      {uploading ? 'Загружаю...' : '📎 Выбрать файл'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {form.content && (
                    <p className="text-green-600 text-xs mt-2">✓ Текст извлечён ({form.content.length} символов)</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Материал урока</label>
                  <textarea
                    placeholder="Или вставьте текст вручную..."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700 resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Ключевые понятия</label>
                  <input
                    type="text"
                    placeholder="хлорофилл, фотосинтез, глюкоза..."
                    value={form.key_concepts}
                    onChange={(e) => setForm({ ...form, key_concepts: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Вопросы для обсуждения</label>
                  <textarea
                    placeholder="Почему листья зелёные? Что нужно растению для роста?..."
                    value={form.discussion_questions}
                    onChange={(e) => setForm({ ...form, discussion_questions: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {saved ? '✓ Сохранено!' : saving ? 'Сохраняю...' : 'Сохранить'}
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setEditingLesson(null); }}
                    className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}

            {/* Список уроков */}
            {lessons.length === 0 && !showForm ? (
              <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
                Уроков пока нет — создайте первый!
              </div>
            ) : (
              lessons.map((lesson) => (
                <div key={lesson.id} className="bg-white rounded-2xl shadow p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{lesson.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {lesson.content ? `${lesson.content.slice(0, 60)}...` : 'Нет материала'}
                    </p>
                    {lesson.key_concepts && (
                      <p className="text-xs text-indigo-500 mt-1">🔑 {lesson.key_concepts}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(lesson)}
                      className="px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => handleDelete(lesson.id)}
                      className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Ученики */}
        {tab === 'students' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Ученики ({students.length})</h2>
            {students.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Пока нет зарегистрированных учеников</p>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                        {student.first_name[0]}{student.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{student.first_name} {student.last_name}</p>
                        <p className="text-sm text-gray-400">@{student.username}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(student.created_at).toLocaleDateString('ru-RU')}</p>
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