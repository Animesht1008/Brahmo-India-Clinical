import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { runSafetyCheck } from '@/lib/safety-engine';
import { composePrompt } from '@/lib/prompt-composer';
import type { Patient } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { patient_code, query } = await req.json();
    const supabase = createServerClient();

    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('patient_code', patient_code)
      .single();

    if (error || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const safetyResult = await runSafetyCheck(patient as Patient);
    const composedPrompt = await composePrompt(patient as Patient, safetyResult, query);

    return NextResponse.json({ composed_prompt: composedPrompt, safety_result: safetyResult });
  } catch (err) {
    console.error('Compose prompt error:', err);
    return NextResponse.json({ error: 'Prompt composition failed' }, { status: 500 });
  }
}
