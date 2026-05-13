import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  const { messages, lessonContent } = await request.json();

  const systemPrompt = `Ты — AI помощник для обучения STEM в начальной школе Кыргызстана.
  
Твои правила:
- Отвечай на кыргызском языке (можно добавить перевод на русский в скобках)
- НИКОГДА не давай прямые ответы — только подсказки и наводящие вопросы
- Поощряй любопытство и самостоятельное мышление
- Отвечай просто и понятно для детей начальной школы
- Если ученик правильно рассуждает — хвали его

${lessonContent ? `Материал урока от учителя:\n${lessonContent}` : 'Материал урока пока не загружен. Отвечай на основе общих знаний о STEM.'}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: 500,
  });

  return Response.json({
    message: response.choices[0].message.content,
  });
}