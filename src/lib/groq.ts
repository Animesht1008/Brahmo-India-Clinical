const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroq(model: string, systemPrompt: string, userMessage: string, maxTokens = 1500): Promise<string> {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err?.error?.message || err?.message || `Groq API error: ${res.status}`;
    throw new Error(message);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function callGroqWithFallback(systemPrompt: string, userMessage: string, maxTokens = 1500): Promise<string> {
  const primary = process.env.GROQ_MODEL;
  if (!primary) throw new Error('GROQ_MODEL not set');
  try {
    return await callGroq(primary, systemPrompt, userMessage, maxTokens);
  } catch (err: any) {
    const msg = err?.message || '';
    if (/does not exist|do not have access/i.test(msg) && process.env.GROQ_FALLBACK_MODELS) {
      const fallbacks = process.env.GROQ_FALLBACK_MODELS.split(',').map(s => s.trim()).filter(Boolean);
      for (const fb of fallbacks) {
        try {
          return await callGroq(fb, systemPrompt, userMessage, maxTokens);
        } catch (e) {
          console.warn(`[Groq fallback] model ${fb} failed:`, (e as any)?.message || e);
        }
      }
      throw new Error(`${msg} — tried fallbacks: ${fallbacks.join(', ')}`);
    }
    throw err;
  }
}

export async function checkModelAvailable(model: string): Promise<boolean> {
  try {
    // lightweight check: call with a tiny prompt
    await callGroq(model, 'system: health check', 'ping', 10);
    return true;
  } catch (_) {
    return false;
  }
}

export default { callGroqWithFallback, checkModelAvailable };
