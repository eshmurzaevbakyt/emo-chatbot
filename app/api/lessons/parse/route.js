import jwt from 'jsonwebtoken';
import mammoth from 'mammoth';
import { extractText } from 'unpdf';

export async function POST(request) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return Response.json({ error: 'Не авторизован' }, { status: 401 });

  jwt.verify(token, process.env.JWT_SECRET);

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file) return Response.json({ error: 'Файл не найден' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();

  let text = '';

  if (fileName.endsWith('.pdf')) {
    const { text: pages } = await extractText(new Uint8Array(buffer), { mergePages: true });
    text = pages;
  } else if (fileName.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else {
    return Response.json({ error: 'Поддерживаются только PDF и DOCX' }, { status: 400 });
  }

  return Response.json({ text: text.trim() });
}