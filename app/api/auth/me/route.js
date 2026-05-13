import jwt from 'jsonwebtoken';

export async function GET(request) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return Response.json({ error: 'Не авторизован' }, { status: 401 });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return Response.json(user);
  } catch {
    return Response.json({ error: 'Неверный токен' }, { status: 401 });
  }
}