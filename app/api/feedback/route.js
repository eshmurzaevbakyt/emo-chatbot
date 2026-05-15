import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(request) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return Response.json({ error: 'Не авторизован' }, { status: 401 });

  const user = jwt.verify(token, process.env.JWT_SECRET);
  const { lesson_id, rating, message_content } = await request.json();

  // Удаляем старый фидбек если уже оценивал
  await supabase
    .from('feedback')
    .delete()
    .eq('user_id', user.id)
    .eq('lesson_id', lesson_id)
    .eq('message_content', message_content);

  const { data, error } = await supabase
    .from('feedback')
    .insert({ user_id: user.id, lesson_id, rating, message_content })
    .select()
    .single();

  if (error) return Response.json({ error: 'Ошибка сохранения' }, { status: 500 });

  return Response.json(data);
}