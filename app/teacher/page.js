'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherPage() {
  const [tab, setTab] = useState('lessons');
  const [lessons, setLessons] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [user, setUser] = useState(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showClassForm, setShowClassForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [newClassName, setNewClassName] = useState('');
  const [addStudentUsername, setAddStudentUsername] = useState('');
  const [addStudentError, setAddStudentError] = useState('');
  const [feedbackStats, setFeedbackStats] = useState([]);
  const [form, setForm] = useState({
    title: '',
    content: '',
    key_concepts: '',
    discussion_questions: '',
    class_id: '',
    subject: '',
    grade: '',
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
      loadClasses();
      loadStudents();
      loadFeedback();
    };

    init();
  }, []);

  const loadLessons = async () => {
    const res = await fetch('/api/lessons');
    if (res.ok) setLessons(await res.json());
  };

  const loadClasses = async () => {
    const res = await fetch('/api/classes');
    if (res.ok) setClasses(await res.json());
  };

  const loadStudents = async () => {
    const res = await fetch('/api/users');
    if (res.ok) setStudents(await res.json());
  };

  const loadFeedback = async () => {
  const res = await fetch('/api/feedback/stats');
  if (res.ok) setFeedbackStats(await res.json());
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/lessons/parse', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      setForm((prev) => ({ ...prev, content: data.text }));
    }
    setUploading(false);
  };

const handleSaveLesson = async () => {
  if (!form.title.trim()) return;
  setSaving(true);

  try {
    let lessonData;

    if (editingLesson) {
      const res = await fetch('/api/lessons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingLesson.id, ...form }),
      });
      lessonData = await res.json();
    } else {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      lessonData = await res.json();
    }

    // Урок сохранён — закрываем форму
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setShowLessonForm(false);
    setEditingLesson(null);
    setForm({ title: '', content: '', key_concepts: '', discussion_questions: '', class_id: '', subject: '', grade: '' });
    loadLessons();

    // Эмбеддинги создаём в фоне если есть контент
    if (form.content && lessonData.id) {
      fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonData.id, content: form.content }),
      }).then(() => {
        console.log('Эмбеддинги созданы!');
      }).catch(() => {
        console.log('Ошибка создания эмбеддингов');
      });
    }

  } catch (error) {
    alert('Ошибка сохранения урока');
    setSaving(false);
  }
};

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setForm({
      title: lesson.title,
      content: lesson.content || '',
      key_concepts: lesson.key_concepts || '',
      discussion_questions: lesson.discussion_questions || '',
      class_id: lesson.class_id || '',
      subject: lesson.subject || '',
      grade: lesson.grade || '',
    });
    setShowLessonForm(true);
  };

  const handleDeleteLesson = async (id) => {
    if (!confirm('Удалить урок?')) return;
    await fetch(`/api/lessons?id=${id}`, { method: 'DELETE' });
    loadLessons();
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newClassName }),
    });
    setNewClassName('');
    setShowClassForm(false);
    loadClasses();
  };

  const handleDeleteClass = async (id) => {
    if (!confirm('Удалить класс?')) return;
    await fetch(`/api/classes?id=${id}`, { method: 'DELETE' });
    loadClasses();
  };

  const handleAddStudent = async (classId) => {
    if (!addStudentUsername.trim()) return;
    setAddStudentError('');
    const res = await fetch('/api/classes/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: classId, username: addStudentUsername }),
    });
    if (res.ok) {
      setAddStudentUsername('');
      loadClasses();
    } else {
      const data = await res.json();
      setAddStudentError(data.error);
    }
  };

  const handleRemoveStudent = async (classId, studentId) => {
    await fetch('/api/classes/students', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: classId, student_id: studentId }),
    });
    loadClasses();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Шапка */}
<div className="bg-white border-b border-gray-100 shadow-sm px-6 py-3 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
      AI
    </div>
    <div>
      <h1 className="font-bold text-gray-900 text-sm leading-none">EmoBot</h1>
      <p className="text-xs text-gray-400 mt-0.5">
        {user ? `${user.firstName} ${user.lastName}` : 'Учитель'}
      </p>
    </div>
  </div>
  <div className="flex items-center gap-2">
    <button
      onClick={() => router.push('/profile')}
      className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold hover:bg-indigo-200 transition-colors"
      title="Профиль"
    >
      {user ? `${user.firstName?.[0]}${user.lastName?.[0]}` : 'У'}
    </button>
    <button
      onClick={handleLogout}
      className="px-3 py-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
    >
      Выйти
    </button>
  </div>
</div>

      {/* Вкладки */}
      <div className="bg-white border-b px-6">
        <div className="max-w-4xl mx-auto flex gap-6">
          {['lessons', 'classes', 'students', 'feedback'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'
              }`}
            >
              {t === 'lessons' ? `Уроки (${lessons.length})` : 
              t === 'classes' ? `Классы (${classes.length})` : 
              t === 'students' ? `Ученики (${students.length})` :
              'Отзывы'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">

        {/* Уроки */}
        {tab === 'lessons' && (
          <div className="space-y-4">
            {!showLessonForm && (
              <button
                onClick={() => { setShowLessonForm(true); setEditingLesson(null); setForm({ title: '', content: '', key_concepts: '', discussion_questions: '', class_id: '', subject: '', grade: '' }); }}
                className="w-full py-3 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-2xl font-medium hover:bg-indigo-50"
              >
                + Новый урок
              </button>
            )}

            {showLessonForm && (
              <div className="bg-white rounded-2xl shadow p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-800">{editingLesson ? 'Редактировать' : 'Новый урок'}</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Предмет</label>
                    <input
                      type="text"
                      placeholder="Математика"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Класс</label>
                    <input
                      type="text"
                      placeholder="2 класс"
                      value={form.grade}
                      onChange={(e) => setForm({ ...form, grade: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Класс (группа учеников)</label>
                  <select
                    value={form.class_id}
                    onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
                  >
                    <option value="">Все ученики</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Название урока *"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
                />

                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-gray-500 text-sm mb-2">Загрузите PDF или DOCX файл</p>
                  <label className="cursor-pointer">
                    <span className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100">
                      {uploading ? 'Загружаю...' : '📎 Выбрать файл'}
                    </span>
                    <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} className="hidden" />
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
                    placeholder="хлорофилл, фотосинтез..."
                    value={form.key_concepts}
                    onChange={(e) => setForm({ ...form, key_concepts: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Вопросы для обсуждения</label>
                  <textarea
                    placeholder="Почему листья зелёные?..."
                    value={form.discussion_questions}
                    onChange={(e) => setForm({ ...form, discussion_questions: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveLesson}
                    disabled={saving}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saved ? '✓ Сохранено!' : saving ? 'Сохраняю...' : 'Сохранить'}
                  </button>
                  <button
                    onClick={() => { setShowLessonForm(false); setEditingLesson(null); }}
                    className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}

            {/* Список уроков сгруппированных по предмету */}
            {Object.entries(
              lessons.reduce((acc, lesson) => {
                const key = lesson.subject || 'Без предмета';
                if (!acc[key]) acc[key] = [];
                acc[key].push(lesson);
                return acc;
              }, {})
            ).map(([subject, subjectLessons]) => (
              <div key={subject} className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-5 py-3 bg-indigo-50 border-b">
                  <h3 className="font-semibold text-indigo-700">{subject}</h3>
                </div>
                {subjectLessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between p-5 border-b last:border-0 hover:bg-gray-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-800">{lesson.title}</h4>
                        {lesson.grade && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{lesson.grade}</span>}
                      </div>
                      {lesson.key_concepts && <p className="text-xs text-indigo-500 mt-1">🔑 {lesson.key_concepts}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditLesson(lesson)} className="px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg">Изменить</button>
                      <button onClick={() => handleDeleteLesson(lesson.id)} className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg">Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {lessons.length === 0 && !showLessonForm && (
              <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">Уроков пока нет — создайте первый!</div>
            )}
          </div>
        )}

        {/* Классы */}
        {tab === 'classes' && (
          <div className="space-y-4">
            {!showClassForm && (
              <button
                onClick={() => setShowClassForm(true)}
                className="w-full py-3 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-2xl font-medium hover:bg-indigo-50"
              >
                + Новый класс
              </button>
            )}

            {showClassForm && (
              <div className="bg-white rounded-2xl shadow p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Новый класс</h2>
                <input
                  type="text"
                  placeholder="Название класса (например: 2А)"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
                />
                <div className="flex gap-3">
                  <button onClick={handleCreateClass} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">Создать</button>
                  <button onClick={() => setShowClassForm(false)} className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50">Отмена</button>
                </div>
              </div>
            )}

            {classes.length === 0 && !showClassForm ? (
              <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">Классов пока нет — создайте первый!</div>
            ) : (
              classes.map((cls) => (
                <div key={cls.id} className="bg-white rounded-2xl shadow overflow-hidden">
                  <div className="px-5 py-4 bg-indigo-50 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-indigo-700">{cls.name}</h3>
                    <button onClick={() => handleDeleteClass(cls.id)} className="text-red-400 hover:text-red-600 text-sm">Удалить класс</button>
                  </div>

                  {/* Добавить ученика */}
                  <div className="p-4 border-b">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Логин ученика (@username)"
                        value={selectedClass === cls.id ? addStudentUsername : ''}
                        onChange={(e) => { setSelectedClass(cls.id); setAddStudentUsername(e.target.value); setAddStudentError(''); }}
                        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700 text-sm"
                      />
                      <button
                        onClick={() => handleAddStudent(cls.id)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700"
                      >
                        Добавить
                      </button>
                    </div>
                    {addStudentError && selectedClass === cls.id && (
                      <p className="text-red-500 text-xs mt-1">{addStudentError}</p>
                    )}
                  </div>

                  {/* Список учеников */}
                  {cls.class_students?.length === 0 ? (
                    <p className="text-gray-400 text-sm p-4">Учеников пока нет</p>
                  ) : (
                    cls.class_students?.map((cs) => (
                      <div key={cs.student_id} className="flex items-center justify-between px-5 py-3 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-medium">
                            {cs.users?.first_name?.[0]}{cs.users?.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{cs.users?.first_name} {cs.users?.last_name}</p>
                            <p className="text-xs text-gray-400">@{cs.users?.username}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveStudent(cls.id, cs.student_id)}
                          className="text-red-400 hover:text-red-600 text-xs"
                        >
                          Удалить
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Ученики */}
        {tab === 'students' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Все ученики ({students.length})</h2>
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

        {/* Отзывы */}
{tab === 'feedback' && (
  <div className="space-y-4">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Отзывы учеников</h2>
      <p className="text-gray-400 text-sm mb-6">Оценки ответов чатбота от учеников</p>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">
            {feedbackStats.filter(f => f.rating === 'up').length}
          </p>
          <p className="text-sm text-green-500 mt-1">👍 Полезных ответов</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-red-500">
            {feedbackStats.filter(f => f.rating === 'down').length}
          </p>
          <p className="text-sm text-red-400 mt-1">👎 Непонятных ответов</p>
        </div>
      </div>

      {/* Непонятные ответы */}
      {feedbackStats.filter(f => f.rating === 'down').length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            👎 Ответы которые ученики не поняли
          </h3>
          <div className="space-y-3">
            {feedbackStats.filter(f => f.rating === 'down').map((f, i) => (
              <div key={i} className="border border-red-100 rounded-xl p-4 bg-red-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
                    {f.lessons?.subject || 'Без предмета'}
                  </span>
                  <span className="text-xs text-gray-400">→</span>
                  <span className="text-xs text-gray-500">{f.lessons?.title}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{f.message_content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Полезные ответы */}
      {feedbackStats.filter(f => f.rating === 'up').length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            👍 Ответы которые понравились ученикам
          </h3>
          <div className="space-y-3">
            {feedbackStats.filter(f => f.rating === 'up').map((f, i) => (
              <div key={i} className="border border-green-100 rounded-xl p-4 bg-green-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    {f.lessons?.subject || 'Без предмета'}
                  </span>
                  <span className="text-xs text-gray-400">→</span>
                  <span className="text-xs text-gray-500">{f.lessons?.title}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{f.message_content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {feedbackStats.length === 0 && (
        <p className="text-gray-400 text-center py-8">Пока нет отзывов от учеников</p>
      )}
    </div>
  </div>
)}

      </div>
    </div>
  );
}