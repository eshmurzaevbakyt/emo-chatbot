import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return Response.json({ error: 'Заполните все поля' }, { status: 400 });
  }

  // Ищем пользователя
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !user) {
    return Response.json({ error: 'Пользователь не найден' }, { status: 401 });
  }

  // Проверяем пароль
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return Response.json({ error: 'Неверный пароль' }, { status: 401 });
  }

  // Создаём JWT токен
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, firstName: user.first_name, lastName: user.last_name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const response = Response.json({
    success: true,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name,
  });

  response.headers.set('Set-Cookie',
    `auth-token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`
  );

  return response;
}