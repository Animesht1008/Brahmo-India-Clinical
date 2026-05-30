import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { runSafetyCheck } from '@/lib/safety-engine';
import type { Patient } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { patient_code } = await req.json();
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
    return NextResponse.json(safetyResult);
  } catch (err) {
    console.error('Safety check error:', err);
    return NextResponse.json({ error: 'Safety check failed' }, { status: 500 });
  }
}
