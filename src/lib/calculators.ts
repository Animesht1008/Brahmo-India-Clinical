// ============================================================
// BRAHMO India Clinical AI — Clinical Calculators
// ============================================================

/**
 * CKD-EPI 2021 eGFR Calculation (Race-free equation)
 * Reference: Inker LA et al. NEJM 2021; 385:1737-1749
 */
export function calculateEGFR(creatinine: number, age: number, gender: 'M' | 'F' | 'Other'): number {
  const isFemale = gender === 'F';
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const sexFactor = isFemale ? 1.012 : 1.0;

  const scrKappa = creatinine / kappa;
  const minTerm = Math.min(scrKappa, 1);
  const maxTerm = Math.max(scrKappa, 1);

  const egfr =
    142 *
    Math.pow(minTerm, alpha) *
    Math.pow(maxTerm, -1.2) *
    Math.pow(0.9938, age) *
    sexFactor;

  return Math.round(egfr);
}

/**
 * CKD Stage Classification
 */
export function classifyCKD(egfr: number): {
  stage: string;
  label: string;
  description: string;
  color: string;
} {
  if (egfr >= 90) return { stage: 'G1', label: 'CKD Stage 1 (if structural damage)', description: 'Normal or high', color: 'green' };
  if (egfr >= 60) return { stage: 'G2', label: 'CKD Stage 2', description: 'Mildly decreased', color: 'yellow' };
  if (egfr >= 45) return { stage: 'G3a', label: 'CKD Stage 3a', description: 'Mildly to moderately decreased', color: 'orange' };
  if (egfr >= 30) return { stage: 'G3b', label: 'CKD Stage 3b', description: 'Moderately to severely decreased', color: 'orange' };
  if (egfr >= 15) return { stage: 'G4', label: 'CKD Stage 4', description: 'Severely decreased', color: 'red' };
  return { stage: 'G5', label: 'CKD Stage 5 / ESRD', description: 'Kidney failure', color: 'darkred' };
}

/**
 * Get renal dosing recommendation for a drug at given eGFR
 */
export function getRenalDosing(renalDosing: Record<string, string>, egfr: number): string {
  if (!renalDosing || Object.keys(renalDosing).length === 0) {
    return 'No specific renal dose adjustment data available';
  }

  // Match eGFR to threshold
  if (egfr < 15 && renalDosing['egfr_lt15']) return renalDosing['egfr_lt15'];
  if (egfr < 30 && renalDosing['egfr_lt30']) return renalDosing['egfr_lt30'];
  if (egfr < 45 && renalDosing['egfr_30_44']) return renalDosing['egfr_30_44'];
  if (egfr < 60 && renalDosing['egfr_45_59']) return renalDosing['egfr_45_59'];
  if (egfr < 90 && renalDosing['egfr_60_89']) return renalDosing['egfr_60_89'];
  if (renalDosing['egfr_ge90']) return renalDosing['egfr_ge90'];
  if (renalDosing['all_egfr']) return renalDosing['all_egfr'];

  return 'Normal dosing — no specific adjustment for this eGFR range';
}

/**
 * CHA₂DS₂-VASc Score Calculator
 * For stroke risk stratification in Atrial Fibrillation
 * Reference: IHRS / CSI Guidelines
 */
export interface CHA2DS2VascInput {
  age: number;
  gender: 'M' | 'F' | 'Other';
  heart_failure: boolean;
  hypertension: boolean;
  diabetes: boolean;
  stroke_history: boolean;
  vascular_disease: boolean;   // Prior MI, PAD, or aortic plaque
}

export function calculateCHA2DS2VASc(input: CHA2DS2VascInput): {
  score: number;
  components: Record<string, number>;
  recommendation: string;
  anticoagulate: boolean;
} {
  const components: Record<string, number> = {
    'Congestive Heart Failure': input.heart_failure ? 1 : 0,
    'Hypertension': input.hypertension ? 1 : 0,
    'Age ≥ 75': input.age >= 75 ? 2 : 0,
    'Diabetes': input.diabetes ? 1 : 0,
    'Stroke/TIA history': input.stroke_history ? 2 : 0,
    'Vascular disease (MI/PAD)': input.vascular_disease ? 1 : 0,
    'Age 65-74': (input.age >= 65 && input.age < 75) ? 1 : 0,
    'Sex category (Female)': input.gender === 'F' ? 1 : 0,
  };

  const score = Object.values(components).reduce((a, b) => a + b, 0);

  // IHRS/CSI threshold: men ≥ 2, women ≥ 3 → anticoagulate
  const threshold = input.gender === 'F' ? 3 : 2;
  const anticoagulate = score >= threshold;

  let recommendation: string;
  if (anticoagulate) {
    recommendation = `CHA₂DS₂-VASc = ${score} → ORAL ANTICOAGULATION RECOMMENDED (CSI/IHRS). Prefer DOAC (dabigatran, rivaroxaban, or apixaban) over warfarin for non-valvular AF.`;
  } else if (score === (input.gender === 'F' ? 2 : 1)) {
    recommendation = `CHA₂DS₂-VASc = ${score} → CONSIDER anticoagulation (discuss bleeding risk).`;
  } else {
    recommendation = `CHA₂DS₂-VASc = ${score} → Anticoagulation NOT recommended.`;
  }

  return { score, components, recommendation, anticoagulate };
}

/**
 * Hyperkalemia Risk Assessment
 * Especially relevant for HF patients on RAASi + MRA
 */
export function assessHyperkalemiaRisk(
  potassium: number,
  medications: string[],
  egfr: number
): {
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  message: string;
  action: string;
} {
  const medsLower = medications.map(m => m.toLowerCase());
  const onRAASi = medsLower.some(m => 
    m.includes('ramipril') || m.includes('enalapril') || m.includes('lisinopril') ||
    m.includes('telmisartan') || m.includes('losartan') || m.includes('valsartan')
  );
  const onMRA = medsLower.some(m => 
    m.includes('spironolactone') || m.includes('eplerenone')
  );
  const onKSparing = medsLower.some(m =>
    m.includes('triamterene') || m.includes('amiloride')
  );

  const riskMedsCount = [onRAASi, onMRA, onKSparing].filter(Boolean).length;

  // Critical: K+ ≥ 5.5 with any K+-sparing drug
  if (potassium >= 5.5) {
    return {
      risk_level: 'critical',
      message: `CRITICAL: K+ = ${potassium} mEq/L — DANGEROUS HYPERKALEMIA`,
      action: 'HOLD spironolactone and ACE inhibitor immediately. Urgent nephrology/cardiology review. Consider emergency K+-lowering therapy.'
    };
  }

  // High: K+ ≥ 5.0 + RAASi + MRA
  if (potassium >= 5.0 && onRAASi && onMRA) {
    return {
      risk_level: 'high',
      message: `HIGH RISK: K+ = ${potassium} mEq/L + Spironolactone + ACEi/ARB — Classic hyperkalemia triple. CKD (eGFR ${egfr}) further increases risk.`,
      action: 'Reduce spironolactone to 12.5mg. Dietary potassium restriction. Recheck K+ in 1 week. Hold if K+ rises > 5.5 mEq/L.'
    };
  }

  // High: K+ ≥ 5.0 + eGFR < 45 + any K+-sparing
  if (potassium >= 5.0 && egfr < 45 && riskMedsCount >= 1) {
    return {
      risk_level: 'high',
      message: `HIGH RISK: K+ = ${potassium} mEq/L + CKD Stage 3b+ (eGFR ${egfr}) + K+-sparing medications`,
      action: 'Review all K+-sparing drugs. Dietary K+ restriction. Frequent monitoring.'
    };
  }

  // Moderate: K+ 4.5-5.0 + risk drugs
  if (potassium >= 4.5 && riskMedsCount >= 2) {
    return {
      risk_level: 'moderate',
      message: `MODERATE RISK: K+ trending up (${potassium} mEq/L) with multiple K+-sparing drugs`,
      action: 'Monitor K+ in 2-4 weeks. Dietary counseling.'
    };
  }

  return {
    risk_level: 'low',
    message: `K+ = ${potassium} mEq/L — within acceptable range`,
    action: 'Routine monitoring as per standard of care.'
  };
}

/**
 * HbA1c Target Recommendation (RSSDI 2022)
 */
export function getHbA1cTarget(
  age: number,
  conditions: string[],
  egfr: number
): { target: string; rationale: string } {
  const conditionsLower = conditions.map(c => c.toLowerCase());
  const hasHF = conditionsLower.some(c => c.includes('heart failure'));
  const hasHypoglycemiaUnawareness = conditionsLower.some(c => c.includes('hypoglycemia unawareness'));
  
  if (age >= 75 || hasHypoglycemiaUnawareness || egfr < 30) {
    return {
      target: 'HbA1c 7.5–8.5% (relaxed target)',
      rationale: 'RSSDI 2022: Elderly ≥75 years, CKD Stage 4-5, or hypoglycemia unawareness → relaxed target to prevent dangerous hypoglycemia. Safety > tight control.'
    };
  }

  if (age >= 65 || hasHF || egfr < 45) {
    return {
      target: 'HbA1c 7.0–8.0% (individualized)',
      rationale: 'RSSDI 2022: Patients ≥65 years, heart failure, or CKD 3b → individualized relaxed target. Avoid sulfonylureas. Prefer SGLT2i or DPP4i with low hypo risk.'
    };
  }

  return {
    target: 'HbA1c ≤ 7.0% (standard target)',
    rationale: 'RSSDI 2022: Standard target for non-elderly adults without major comorbidities.'
  };
}

/**
 * Estimate monthly cost for medication regimen
 */
export function estimateMonthlyCost(drugs: Array<{ name: string; monthly_cost?: number }>): {
  total: number;
  breakdown: string;
} {
  const total = drugs.reduce((sum, d) => sum + (d.monthly_cost || 0), 0);
  const breakdown = drugs
    .filter(d => d.monthly_cost)
    .map(d => `${d.name}: ₹${d.monthly_cost}`)
    .join(' + ');
  return { total, breakdown };
}
