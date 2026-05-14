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
  if (user.role !== 'teacher') {
    return Response.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { class_id, username } = await request.json();

  // Ищем ученика по username
  const { data: student, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, username, role')
    .eq('username', username)
    .eq('role', 'student')
    .single();

  if (error || !student) {
    return Response.json({ error: 'Ученик не найден' }, { status: 404 });
  }

  // Добавляем в класс
  const { error: insertError } = await supabase
    .from('class_students')
    .insert({ class_id, student_id: student.id });

  if (insertError) {
    return Response.json({ error: 'Ученик уже в этом классе' }, { status: 400 });
  }

  return Response.json(student);
}

export async function DELETE(request) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return Response.json({ error: 'Не авторизован' }, { status: 401 });

  const user = jwt.verify(token, process.env.JWT_SECRET);
  const { class_id, student_id } = await request.json();

  await supabase
    .from('class_students')
    .delete()
    .eq('class_id', class_id)
    .eq('student_id', student_id);

  return Response.json({ success: true });
}