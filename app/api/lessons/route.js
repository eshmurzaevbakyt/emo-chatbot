import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET(request) {
  const { data } = await supabase
    .from('lessons')
    .select('content')
    .limit(1)
    .single();
  return Response.json(data || { content: '' });
}

export async function POST(request) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return Response.json({ error: 'Не авторизован' }, { status: 401 });

  const user = jwt.verify(token, process.env.JWT_SECRET);
  const { content } = await request.json();

  const { data: existing } = await supabase
    .from('lessons')
    .select('id')
    .eq('teacher_id', user.id)
    .single();

  if (existing) {
    await supabase.from('lessons').update({ content }).eq('teacher_id', user.id);
  } else {
    await supabase.from('lessons').insert({ teacher_id: user.id, content });
  }

  return Response.json({ success: true });
}