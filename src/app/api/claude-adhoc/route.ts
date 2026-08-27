import { NextRequest, NextResponse } from 'next/server';
import { runSafetyCheck } from '@/lib/safety-engine';
import { composePrompt, fetchClinicalContext } from '@/lib/prompt-composer';
import type { Patient } from '@/lib/types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GENERIC_SYSTEM = `You are a general medical AI assistant. Provide evidence-based clinical guidance for the patient described.`;

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
      { error: 'GROQ_API_KEY is not set. Get a FREE key at https://console.groq.com' },
      { status: 500 }
    );
  }

  try {
    const { patient, query } = await req.json();
    if (!patient || !query) {
      return NextResponse.json({ error: 'patient and query are required' }, { status: 400 });
    }

    const p: Patient = {
      id: patient.id || crypto.randomUUID(),
      patient_code: 'ADHOC',
      display_name: patient.display_name || `${patient.age}${patient.gender} — New Patient`,
      scenario_label: 'Ad-hoc patient — surprise test',
      age: patient.age, gender: patient.gender, bmi: patient.bmi,
      conditions: patient.conditions || [],
      current_medications: patient.current_medications || [],
      allergies: patient.allergies || [],
      labs: patient.labs || {},
      vitals: patient.vitals || {},
      insurance: patient.insurance || {},
      income_context: patient.income_context || 'unknown',
      condition_tags: patient.condition_tags || ['diabetes'],
    };

    const safetyResult = await runSafetyCheck(p);
    const composed     = await composePrompt(p, safetyResult, query);
    const ctx          = await fetchClinicalContext(p, safetyResult);

    const genericSummary = `Patient: ${p.display_name}. Age ${p.age}${p.gender}.
Conditions: ${p.conditions?.join(', ')}.
Meds: ${p.current_medications.map((m: any) => `${m.name} ${m.dose} ${m.frequency}`).join(', ') || 'None'}.
Labs: ${Object.entries(p.labs || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}.
Allergies: ${(p.allergies || []).map((a: any) => `${a.drug}(${a.reaction})`).join(', ') || 'NKDA'}.
Question: ${query}`;

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
    console.error('[/api/claude-adhoc] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
