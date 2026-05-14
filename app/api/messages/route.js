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
  const { searchParams } = new URL(request.url);
  const lesson_id = searchParams.get('lesson_id');

  if (!lesson_id) return Response.json([]);

  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', user.id)
    .eq('lesson_id', lesson_id)
    .order('created_at', { ascending: true });

  return Response.json(data || []);
}

export async function POST(request) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return Response.json({ error: 'Не авторизован' }, { status: 401 });

  const user = jwt.verify(token, process.env.JWT_SECRET);
  const { role, content, lesson_id } = await request.json();

  const { data } = await supabase
    .from('messages')
    .insert({ user_id: user.id, role, content, lesson_id })
    .select()
    .single();

  return Response.json(data);
}