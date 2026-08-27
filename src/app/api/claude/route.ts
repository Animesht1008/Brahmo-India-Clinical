import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { runSafetyCheck } from '@/lib/safety-engine';
import { composePrompt, fetchClinicalContext } from '@/lib/prompt-composer';
import type { Patient } from '@/lib/types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const GENERIC_SYSTEM = `You are a general medical AI assistant. 
Provide evidence-based clinical guidance for the patient described.
Do not tailor advice specifically to India or any particular region.`;

async function callGroq(systemPrompt: string, userMessage: string, maxTokens = 1500, model = MODEL): Promise<string> {
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
        { role: 'user',   content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err?.error?.message || err?.message || `Groq API error: ${res.status}`;
    if (/does not exist|do not have access/i.test(message)) {
      throw new Error(
        `${message} — The model "${MODEL}" appears unavailable. Set a valid model via GROQ_MODEL in .env.local or get access at https://console.groq.com.`
      );
    }
    throw new Error(message);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGroqWithFallback(systemPrompt: string, userMessage: string, maxTokens = 1500): Promise<string> {
  try {
    return await callGroq(systemPrompt, userMessage, maxTokens, MODEL);
  } catch (err: any) {
    const msg = err?.message || '';
    if (/does not exist|do not have access/i.test(msg) && process.env.GROQ_FALLBACK_MODELS) {
      const fallbacks = process.env.GROQ_FALLBACK_MODELS.split(',').map(s => s.trim()).filter(Boolean);
      for (const fb of fallbacks) {
        try {
          const out = await callGroq(systemPrompt, userMessage, maxTokens, fb);
          return out;
        } catch (e) {
          // try next fallback
          console.warn(`[Groq fallback] model ${fb} failed:`, (e as any)?.message || e);
        }
      }
      throw new Error(`${msg} — tried fallbacks: ${fallbacks.join(', ')}`);
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY is not set in .env.local. Get a FREE key at https://console.groq.com and restart the server.' },
      { status: 500 }
    );
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: 'Supabase env vars missing in .env.local.' },
      { status: 500 }
    );
  }

  try {
    const { patient_code, query } = await req.json();
    if (!patient_code || !query) {
      return NextResponse.json({ error: 'patient_code and query are required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: patient, error } = await supabase
      .from('patients').select('*').eq('patient_code', patient_code).single();

    if (error || !patient) {
      console.error('[Supabase error]:', JSON.stringify(error));
      return NextResponse.json(
        { error: `Patient ${patient_code} not found. Supabase: ${error?.message} (${error?.code})` },
        { status: 404 }
      );
    }

    const p            = patient as Patient;
    const safetyResult = await runSafetyCheck(p);
    const composed     = await composePrompt(p, safetyResult, query);
    const ctx          = await fetchClinicalContext(p, safetyResult);

    const genericSummary = `Patient: ${p.display_name}. Age ${p.age}${p.gender}. BMI ${p.bmi || 'N/A'}.
Conditions: ${p.conditions?.join(', ')}.
Medications: ${p.current_medications.map((m: any) => `${m.name} ${m.dose} ${m.frequency}`).join(', ') || 'None'}.
Labs: ${Object.entries(p.labs || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}.
Allergies: ${(p.allergies || []).map((a: any) => `${a.drug} (${a.reaction})`).join(', ') || 'NKDA'}.
Question: ${query}`;

    // Call Groq in parallel for both generic and Option C
    const [genericText, optionCText] = await Promise.all([
      callGroqWithFallback(GENERIC_SYSTEM, genericSummary, 1200),
      callGroqWithFallback(composed.system_prompt, composed.user_message, 2000),
    ]);

    return NextResponse.json({
      patient: p,
      generic_response:  genericText,
      option_c_response: optionCText,
      safety_alerts:     safetyResult.alerts,
      guideline_sources: composed.guideline_sources,
      context_injected: {
        guidelines_count:   ctx.relevant_guidelines.length,
        drugs_count:        ctx.relevant_drugs.length,
        interactions_count: ctx.relevant_interactions.length,
        context_summary:    composed.context_summary,
      },
      safety_summary: {
        ckd_stage:             safetyResult.ckd_stage,
        egfr:                  safetyResult.egfr,
        cha2ds2_vasc:          safetyResult.cha2ds2_vasc_score,
        hyperkalemia_risk:     safetyResult.hyperkalemia_risk,
        critical_alerts_count: safetyResult.alerts.filter((a: any) => a.severity === 'critical').length,
      },
    });
  } catch (err: any) {
    console.error('[/api/claude] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error. Check server console.' },
      { status: 500 }
    );
  }
}
