import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET(request) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return Response.json({ error: 'Не авторизован' }, { status: 401 });

  const user = jwt.verify(token, process.env.JWT_SECRET);
  if (user.role !== 'teacher') {
    return Response.json({ error: 'Нет доступа' }, { status: 403 });
  }

  // Получаем фидбек по урокам этого учителя
  const { data } = await supabase
    .from('feedback')
    .select(`
      rating,
      message_content,
      lesson_id,
      lessons(title, subject)
    `)
    .order('created_at', { ascending: false });

  return Response.json(data || []);
}