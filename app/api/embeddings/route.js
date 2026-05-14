import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Разбиваем текст на чанки по ~500 слов
function splitIntoChunks(text, chunkSize = 500) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  return chunks;
}

// Создаём эмбеддинги для урока
export async function POST(request) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return Response.json({ error: 'Не авторизован' }, { status: 401 });

  jwt.verify(token, process.env.JWT_SECRET);

  const { lesson_id, content } = await request.json();

  if (!content || !lesson_id) {
    return Response.json({ error: 'Нет данных' }, { status: 400 });
  }

  // Удаляем старые эмбеддинги для этого урока
  await supabase.from('embeddings').delete().eq('lesson_id', lesson_id);

  // Разбиваем на чанки
  const chunks = splitIntoChunks(content);

  // Создаём эмбеддинги для каждого чанка
  for (const chunk of chunks) {
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunk,
    });

    const embedding = embeddingResponse.data[0].embedding;

    await supabase.from('embeddings').insert({
      lesson_id,
      content: chunk,
      embedding,
    });
  }

  return Response.json({ success: true, chunks: chunks.length });
}

// Ищем похожие чанки по вопросу
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const lesson_id = searchParams.get('lesson_id');

  if (!query) return Response.json({ error: 'Нет запроса' }, { status: 400 });

  // Создаём эмбеддинг для вопроса
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });

  const queryEmbedding = embeddingResponse.data[0].embedding;

  // Ищем похожие чанки
  const { data } = await supabase.rpc('match_embeddings', {
    query_embedding: queryEmbedding,
    match_lesson_id: lesson_id || null,
    match_count: 3,
  });

  return Response.json(data || []);
}