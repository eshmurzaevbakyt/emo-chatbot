import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(request) {
  const { messages, lessonContent, lessonId, image } = await request.json();

  let context = lessonContent || '';
  let usedWebSearch = false;

  // RAG поиск если есть lessonId
  if (lessonId && messages.length > 0) {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage && typeof lastUserMessage.content === 'string') {
      const embeddingRes = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: lastUserMessage.content,
      });

      const queryEmbedding = embeddingRes.data[0].embedding;

      const { data: chunks } = await supabase.rpc('match_embeddings', {
        query_embedding: queryEmbedding,
        match_lesson_id: lessonId,
        match_count: 3,
      });

      if (chunks && chunks.length > 0) {
        const relevantChunks = chunks.filter(c => c.similarity > 0.5);
        if (relevantChunks.length > 0) {
          context = relevantChunks.map(c => c.content).join('\n\n');
        }
      }
    }
  }

  // Если контекста мало — ищем в интернете через GPT с web_search
  if (!context || context.length < 100) {
    usedWebSearch = true;
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    
    if (lastUserMessage) {
      try {
        const searchResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Найди краткую информацию по теме для ученика начальной школы. Отвечай только фактами, без лишних слов. Максимум 200 слов.'
            },
            { role: 'user', content: lastUserMessage.content }
          ],
          max_tokens: 300,
        });

        const webInfo = searchResponse.choices[0].message.content;
        context = `Дополнительная информация из интернета:\n${webInfo}`;
      } catch (e) {
        console.log('Web search failed:', e);
      }
    }
  }

  const systemPrompt = `Ты — AI помощник для обучения STEM в начальной школе Кыргызстана.

Твои правила:
- Отвечай на кыргызском языке (можно добавить перевод на русский в скобках)
- НИКОГДА не давай прямые ответы — только подсказки и наводящие вопросы
- Поощряй любопытство и самостоятельное мышление
- Отвечай просто и понятно для детей начальной школы
- Если ученик правильно рассуждает — хвали его
- Если ученик загрузил картинку — анализируй её и давай подсказки
${usedWebSearch ? '- Используй дополнительную информацию из интернета для помощи ученику' : ''}

${context ? `Материал урока:\n${context}` : 'Материал урока пока не загружен.'}`;

  // Формируем сообщения с поддержкой изображений
  const formattedMessages = messages.map((msg, index) => {
    if (index === messages.length - 1 && msg.role === 'user' && image) {
      return {
        role: 'user',
        content: [
          { type: 'text', text: msg.content || 'Помоги с этим заданием' },
          { type: 'image_url', image_url: { url: image } },
        ],
      };
    }
    return { role: msg.role, content: msg.content };
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...formattedMessages,
    ],
    max_tokens: 500,
  });

  return Response.json({
    message: response.choices[0].message.content,
    usedWebSearch,
  });
}