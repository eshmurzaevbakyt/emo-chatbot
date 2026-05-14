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

  if (user.role === 'teacher') {
    // Учитель видит свои классы
    const { data } = await supabase
      .from('classes')
      .select(`
        *,
        class_students(
          student_id,
          users(id, first_name, last_name, username)
        )
      `)
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    return Response.json(data || []);
  } else {
    // Ученик видит свои классы
    const { data } = await supabase
      .from('class_students')
      .select(`
        class_id,
        classes(
          *,
          users(id, first_name, last_name)
        )
      `)
      .eq('student_id', user.id);

    return Response.json(data?.map(d => d.classes) || []);
  }
}

export async function POST(request) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return Response.json({ error: 'Не авторизован' }, { status: 401 });

  const user = jwt.verify(token, process.env.JWT_SECRET);
  if (user.role !== 'teacher') {
    return Response.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { name } = await request.json();
  if (!name) return Response.json({ error: 'Укажите название класса' }, { status: 400 });

  const { data, error } = await supabase
    .from('classes')
    .insert({ name, teacher_id: user.id })
    .select()
    .single();

  if (error) return Response.json({ error: 'Ошибка создания класса' }, { status: 500 });

  return Response.json(data);
}

export async function DELETE(request) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return Response.json({ error: 'Не авторизован' }, { status: 401 });

  const user = jwt.verify(token, process.env.JWT_SECRET);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  await supabase.from('classes').delete().eq('id', id).eq('teacher_id', user.id);

  return Response.json({ success: true });
}