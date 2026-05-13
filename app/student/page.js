'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Салам! Мен сиздин STEM окутуучу жардамчыңызмын. Суроолоруңузду бериңиз! (Привет! Я твой STEM помощник. Задавай вопросы!)',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lessonContent, setLessonContent] = useState('');
  const [user, setUser] = useState(null);
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
        if (lessonData.content) setLessonContent(lessonData.content);
      }
    };
    init();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, lessonContent }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Кечиресиз, ката кетти.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">EmoBot</h1>
          <p className="text-indigo-200 text-sm">
            {user ? `${user.firstName} ${user.lastName}` : 'Ученик'}
          </p>
        </div>
        <button onClick={handleLogout} className="text-indigo-200 hover:text-white text-sm">
          Выйти
        </button>
      </div>

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
      </div>

      <div className="bg-white border-t px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Задай вопрос..."
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
    </div>
  );
}