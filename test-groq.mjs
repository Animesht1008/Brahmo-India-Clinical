const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const key = process.env.GROQ_API_KEY;

if (!key) {
  console.error('GROQ_API_KEY not set. Set it in environment or .env.local');
  process.exit(1);
}

async function main() {
  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 60,
        messages: [{ role: 'user', content: 'Ping: are you available? Reply with yes.' }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Groq returned error:', data);
      process.exit(2);
    }
    console.log('Model:', model);
    console.log('Response:', data.choices?.[0]?.message?.content);
  } catch (err) {
    console.error('Error calling Groq:', err);
    process.exit(3);
  }
}

main();
