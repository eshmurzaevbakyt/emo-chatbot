import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(request) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return Response.json({ error: 'Не авторизован' }, { status: 401 });

  const user = jwt.verify(token, process.env.JWT_SECRET);
  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return Response.json({ error: 'Заполните все поля' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return Response.json({ error: 'Пароль минимум 6 символов' }, { status: 400 });
  }

  // Получаем текущий пароль
  const { data: userData } = await supabase
    .from('users')
    .select('password')
    .eq('id', user.id)
    .single();

  // Проверяем текущий пароль
  const match = await bcrypt.compare(currentPassword, userData.password);
  if (!match) {
    return Response.json({ error: 'Неверный текущий пароль' }, { status: 400 });
  }

  // Сохраняем новый пароль
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', user.id);

  return Response.json({ success: true });
}