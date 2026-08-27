import { NextResponse } from 'next/server';
import { checkModelAvailable } from '@/lib/groq';

export async function GET() {
  const model = process.env.GROQ_MODEL;
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ ok: false, error: 'GROQ_API_KEY not set' }, { status: 500 });
  }
  if (!model) {
    return NextResponse.json({ ok: false, error: 'GROQ_MODEL not set' }, { status: 500 });
  }

  const available = await checkModelAvailable(model);
  return NextResponse.json({ ok: available, model, message: available ? 'Model available' : 'Model unavailable' });
}
