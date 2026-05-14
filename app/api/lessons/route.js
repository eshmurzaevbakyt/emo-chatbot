import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function splitIntoChunks(text, chunkSize = 500) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  return chunks;
}

async function createEmbeddings(lessonId, content) {
  await supabase.from('embeddings').delete().eq('lesson_id', lessonId);
  const chunks = splitIntoChunks(content);
  for (const chunk of chunks) {
    const res = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunk,
    });
    await supabase.from('embeddings').insert({
      lesson_id: lessonId,
      content: chunk,
      embedding: res.data[0].embedding,
    });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const { data } = await supabase.from('lessons').select('*').eq('id', id).single();
    return Response.json(data || {});
  }

  const { data } = await supabase
    .from('lessons')
    .select('*')
    .order('created_at', { ascending: false });

  return Response.json(data || []);
}

export async function POST(request) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return Response.json({ error: 'Не авторизован' }, { status: 401 });

  const user = jwt.verify(token, process.env.JWT_SECRET);
  if (!['teacher'].includes(user.role)) {
    return Response.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { title, content, key_concepts, discussion_questions, class_id, subject, grade } = await request.json();
  if (!title) return Response.json({ error: 'Укажите название урока' }, { status: 400 });

  const { data, error } = await supabase
    .from('lessons')
    .insert({ teacher_id: user.id, title, content, key_concepts, discussion_questions, class_id: class_id || null, subject, grade })
    .select()
    .single();

  if (error) return Response.json({ error: 'Ошибка создания урока' }, { status: 500 });

  // Создаём эмбеддинги если есть контент
  if (content) await createEmbeddings(data.id, content);

  return Response.json(data);
}

export async function PUT(request) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return Response.json({ error: 'Не авторизован' }, { status: 401 });

  const user = jwt.verify(token, process.env.JWT_SECRET);
  const { id, title, content, key_concepts, discussion_questions, class_id, subject, grade } = await request.json();

  const { data, error } = await supabase
    .from('lessons')
    .update({ title, content, key_concepts, discussion_questions, class_id: class_id || null, subject, grade, updated_at: new Date() })
    .eq('id', id)
    .eq('teacher_id', user.id)
    .select()
    .single();

  if (error) return Response.json({ error: 'Ошибка обновления урока' }, { status: 500 });

  // Обновляем эмбеддинги
  if (content) await createEmbeddings(id, content);

  return Response.json(data);
}

export async function DELETE(request) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return Response.json({ error: 'Не авторизован' }, { status: 401 });

  const user = jwt.verify(token, process.env.JWT_SECRET);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  await supabase.from('lessons').delete().eq('id', id).eq('teacher_id', user.id);

  return Response.json({ success: true });
}