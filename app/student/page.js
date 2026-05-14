'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [user, setUser] = useState(null);
  const bottomRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) { router.push('/'); return; }
      setUser(await response.json());

      const lessonsRes = await fetch('/api/lessons');
      if (lessonsRes.ok) {
        const data = await lessonsRes.json();
        setLessons(data);
      }
    };
    init();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectLesson = async (lesson) => {
    setSelectedLesson(lesson);

    const messagesRes = await fetch(`/api/messages?lesson_id=${lesson.id}`);
    if (messagesRes.ok) {
      const data = await messagesRes.json();
      if (data.length > 0) {
        setMessages(data.map(m => ({ role: m.role, content: m.content })));
      } else {
        setMessages([{
          role: 'assistant',
          content: `Салам! Бүгүн биз "${lesson.title}" темасын окуйбуз. Суроолоруңузду бериңиз! (Привет! Сегодня мы изучаем тему "${lesson.title}". Задавай вопросы!)`,
        }]);
      }
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedLesson) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user', content: input, lesson_id: selectedLesson.id }),
    });

    const lessonContent = [
      selectedLesson.content,
      selectedLesson.key_concepts ? `Ключевые понятия: ${selectedLesson.key_concepts}` : '',
      selectedLesson.discussion_questions ? `Вопросы для обсуждения: ${selectedLesson.discussion_questions}` : '',
    ].filter(Boolean).join('\n\n');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, lessonContent }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);

      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'assistant', content: data.message, lesson_id: selectedLesson.id }),
      });
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Кечиресиз, ката кетти.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Шапка */}
      <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">EmoBot</h1>
          <p className="text-indigo-200 text-sm">
            {selectedLesson ? selectedLesson.title : user ? `${user.firstName} ${user.lastName}` : 'Ученик'}
          </p>
        </div>
        <div className="flex gap-4 items-center">
          {selectedLesson && (
            <button
              onClick={() => { setSelectedLesson(null); setMessages([]); }}
              className="text-indigo-200 hover:text-white text-sm"
            >
              ← Уроки
            </button>
          )}
          <button onClick={() => router.push('/profile')} className="text-indigo-200 hover:text-white text-sm">Профиль</button>
          <button onClick={handleLogout} className="text-indigo-200 hover:text-white text-sm">Выйти</button>
        </div>
      </div>

      {/* Выбор урока */}
      {!selectedLesson && (
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Выбери урок</h2>
          {lessons.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
              Учитель ещё не добавил уроки
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => selectLesson(lesson)}
                  className="w-full bg-white rounded-2xl shadow p-5 text-left hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-800">{lesson.title}</h3>
                  {lesson.key_concepts && (
                    <p className="text-sm text-indigo-500 mt-1">🔑 {lesson.key_concepts}</p>
                  )}
                  {lesson.discussion_questions && (
                    <p className="text-sm text-gray-400 mt-1">💬 {lesson.discussion_questions.slice(0, 60)}...</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Чат */}
      {selectedLesson && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl mx-auto w-full">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white text-gray-700 shadow rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-400 px-4 py-3 rounded-2xl shadow text-sm">Думаю...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="bg-white border-t px-4 py-4">
            <div className="max-w-2xl mx-auto flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Задай вопрос по уроку..."
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                Отправить
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}