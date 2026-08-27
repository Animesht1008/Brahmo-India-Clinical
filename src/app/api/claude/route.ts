import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { runSafetyCheck } from '@/lib/safety-engine';
import { composePrompt, fetchClinicalContext } from '@/lib/prompt-composer';
import { callGroqWithFallback } from '@/lib/groq';
import type { Patient } from '@/lib/types';

const GENERIC_SYSTEM = `You are a general medical AI assistant. 
Provide evidence-based clinical guidance for the patient described.
Do not tailor advice specifically to India or any particular region.`;

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
