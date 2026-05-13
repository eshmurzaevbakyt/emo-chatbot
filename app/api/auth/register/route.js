import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(request) {
  const { firstName, lastName, password, role } = await request.json();

  // Валидация
  if (!firstName || !lastName || !password || !role) {
    return Response.json({ error: 'Заполните все поля' }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ error: 'Пароль минимум 6 символов' }, { status: 400 });
  }

  // Генерируем username
  const baseUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Zа-яА-Я0-9.]/g, '');

  // Проверяем уникальность username
  let username = baseUsername;
  let counter = 1;
  while (true) {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();
    if (!data) break;
    username = `${baseUsername}${counter}`;
    counter++;
  }

  // Шифруем пароль
  const hashedPassword = await bcrypt.hash(password, 10);

  // Создаём пользователя
  const { data: user, error } = await supabase
    .from('users')
    .insert({ first_name: firstName, last_name: lastName, username, password: hashedPassword, role })
    .select()
    .single();

  if (error) {
    return Response.json({ error: 'Ошибка создания аккаунта' }, { status: 500 });
  }

  // Создаём JWT токен
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, firstName: user.first_name, lastName: user.last_name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const response = Response.json({
    success: true,
    username,
    role: user.role,
  });

  response.headers.set('Set-Cookie', 
    `auth-token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`
  );

  return response;
}