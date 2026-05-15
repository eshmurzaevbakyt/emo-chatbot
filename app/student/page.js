'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const SUBJECT_ICONS = {
  'математика': '📐',
  'биология': '🌿',
  'физика': '⚡',
  'химия': '🧪',
  'история': '📜',
  'география': '🌍',
  'литература': '📚',
  'русский язык': '✏️',
  'кыргызский язык': '🇰🇬',
  'информатика': '💻',
  'окружающий мир': '🌱',
  'айлана чейре': '🌱',
  'илим': '🔬',
  'english': '🇬🇧',
};

function getSubjectIcon(subject) {
  const key = subject.toLowerCase();
  for (const [name, icon] of Object.entries(SUBJECT_ICONS)) {
    if (key.includes(name)) return icon;
  }
  return '📖';
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0">
        AI
      </div>
      <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-gray-100">
        <div className="flex gap-1 items-center h-5">
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default function StudentChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [user, setUser] = useState(null);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) { router.push('/'); return; }
      setUser(await response.json());
      const lessonsRes = await fetch('/api/lessons');
      if (lessonsRes.ok) setLessons(await lessonsRes.json());
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
        setMessages(data.map(m => ({ role: m.role, content: m.content, image: m.image })));
      } else {
        setMessages([{
          role: 'assistant',
          content: `Салам! Бүгүн биз "${lesson.title}" темасын окуйбуз. Суроолоруңузду бериңиз! (Привет! Сегодня изучаем "${lesson.title}". Задавай вопросы!)`,
        }]);
      }
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const sendMessage = async () => {
    if (!input.trim() && !image) return;
    if (!selectedLesson) return;

    const currentImage = image;
    const userMessage = {
      role: 'user',
      content: input || 'Помоги с этим заданием',
      image: currentImage,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setImage(null);
    setImagePreview(null);
    setLoading(true);

    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user', content: userMessage.content, lesson_id: selectedLesson.id }),
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          lessonId: selectedLesson.id,
          lessonContent: [
            selectedLesson.key_concepts ? `Ключевые понятия: ${selectedLesson.key_concepts}` : '',
            selectedLesson.discussion_questions ? `Вопросы: ${selectedLesson.discussion_questions}` : '',
          ].filter(Boolean).join('\n'),
          image: currentImage,
        }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: data.message,
        usedWebSearch: data.usedWebSearch 
      }]);

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

  const groupedLessons = lessons.reduce((acc, lesson) => {
    const key = lesson.subject || 'Без предмета';
    if (!acc[key]) acc[key] = [];
    acc[key].push(lesson);
    return acc;
  }, {});

  const initials = user ? `${user.firstName?.[0]}${user.lastName?.[0]}` : '?';

  const handleFeedback = async (messageContent, rating, currentFeedback) => {
  if (!selectedLesson) return;

  // Обновляем UI сразу
  setMessages((prev) =>
    prev.map((msg) =>
      msg.content === messageContent
        ? { ...msg, feedback: msg.feedback === rating ? null : rating }
        : msg
    )
  );

  await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lesson_id: selectedLesson.id,
      rating: currentFeedback === rating ? null : rating,
      message_content: messageContent,
    }),
  });
};

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)' }}>

      {/* Шапка */}
      <div className="bg-white border-b border-gray-100 shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
            AI
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-sm leading-none">EmoBot</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedLesson ? selectedLesson.title : user ? `${user.firstName} ${user.lastName}` : 'Ученик'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedLesson && (
            <button
              onClick={() => { setSelectedLesson(null); setMessages([]); }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              ← Предметы
            </button>
          )}
          <button
            onClick={() => router.push('/profile')}
            className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold hover:bg-indigo-200 transition-colors"
            title="Профиль"
          >
            {initials}
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Список предметов */}
      {!selectedLesson && (
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Мои предметы</h2>
            <p className="text-gray-400 text-sm mt-1">Выбери урок и задавай вопросы</p>
          </div>

          {Object.keys(groupedLessons).length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <div className="text-4xl mb-3">📚</div>
              <p className="text-gray-400">Учитель ещё не добавил уроки</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedLessons).map(([subject, subjectLessons]) => (
                <div key={subject} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 flex items-center gap-2 border-b border-gray-50">
                    <span className="text-xl">{getSubjectIcon(subject)}</span>
                    <h3 className="font-semibold text-gray-800">{subject}</h3>
                    <span className="ml-auto text-xs text-gray-300">{subjectLessons.length} урок</span>
                  </div>
                  {subjectLessons.map((lesson, i) => (
                    <button
                      key={lesson.id}
                      onClick={() => selectLesson(lesson)}
                      className="w-full text-left px-5 py-4 border-b last:border-0 border-gray-50 hover:bg-indigo-50 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800 group-hover:text-indigo-700 transition-colors">{lesson.title}</p>
                          {lesson.key_concepts && (
                            <p className="text-xs text-gray-400 mt-0.5">🔑 {lesson.key_concepts}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {lesson.grade && (
                            <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">{lesson.grade}</span>
                          )}
                          <span className="text-gray-300 group-hover:text-indigo-400 transition-colors">→</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Чат */}
      {selectedLesson && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
            <div className="space-y-2">
              {messages.map((msg, i) => (
  <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} mb-4`}>

    {/* Аватарка */}
    {msg.role === 'assistant' && (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md flex-shrink-0">
        AI
      </div>
    )}
    {msg.role === 'user' && (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold shadow-md flex-shrink-0">
        {initials}
      </div>
    )}

    {/* Сообщение */}
    <div className={`max-w-xs lg:max-w-md ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
      {msg.image && (
        <img src={msg.image} alt="фото" className="rounded-2xl max-w-full shadow-sm border border-gray-100" />
      )}
      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        msg.role === 'user'
          ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-br-none shadow-md'
          : 'bg-white text-gray-700 rounded-bl-none shadow-sm border border-gray-100'
      }`}>
        {msg.content}
      </div>

      {/* Кнопки оценки — только для ответов бота */}
      {msg.role === 'assistant' && i > 0 && (
        <div className="flex gap-1 px-1">
          <button
            onClick={() => handleFeedback(msg.content, 'up', msg.feedback)}
            className={`text-sm px-2 py-0.5 rounded-lg transition-colors ${
              msg.feedback === 'up'
                ? 'bg-green-100 text-green-600'
                : 'text-gray-300 hover:text-green-500 hover:bg-green-50'
            }`}
          >
            👍
          </button>
          <button
            onClick={() => handleFeedback(msg.content, 'down', msg.feedback)}
            className={`text-sm px-2 py-0.5 rounded-lg transition-colors ${
              msg.feedback === 'down'
                ? 'bg-red-100 text-red-500'
                : 'text-gray-300 hover:text-red-400 hover:bg-red-50'
            }`}
          >
            👎
          </button>
        </div>
      )}

      {/* Индикатор веб-поиска — вставь сюда */}
      {msg.role === 'assistant' && msg.usedWebSearch && (
        <p className="text-xs text-gray-400 px-1 flex items-center gap-1">
          🌐 Ответ дополнен из интернета
        </p>
      )}
    </div>
  </div>
))}

              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Превью изображения */}
          {imagePreview && (
            <div className="max-w-2xl mx-auto w-full px-4 pb-2">
              <div className="relative inline-block">
                <img src={imagePreview} alt="preview" className="h-20 rounded-xl border-2 border-indigo-200 shadow-sm" />
                <button
                  onClick={() => { setImage(null); setImagePreview(null); }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Поле ввода */}
          <div className="bg-white border-t border-gray-100 px-4 py-3">
            <div className="max-w-2xl mx-auto flex gap-2 items-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-2.5 rounded-xl transition-colors ${imagePreview ? 'text-indigo-600 bg-indigo-100' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                title="Загрузить фото задания"
              >
                📷
              </button>
              <input type="file" accept="image/*" onChange={handleImageSelect} ref={fileInputRef} className="hidden" />

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={image ? "Добавь вопрос к фото..." : "Задай вопрос по уроку..."}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent text-gray-700 text-sm bg-gray-50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || (!input.trim() && !image)}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 shadow-md"
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