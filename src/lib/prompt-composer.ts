// ============================================================
// BRAHMO India Clinical AI — Prompt Composer
// Injects Indian-specific context BEFORE the LLM sees the query
// This is what makes Option C dramatically better than generic AI
// ============================================================

import { createServerClient } from './supabase';
import { getHbA1cTarget } from './calculators';
import type {
  Patient,
  SafetyCheckResult,
  IndianGuideline,
  Drug,
  DrugInteraction,
  HospitalFormulary,
  HospitalContact,
  ClinicalContext,
  ComposedPrompt,
} from './types';

// ============================================================
// FETCH CLINICAL CONTEXT from Supabase
// ============================================================

export async function fetchClinicalContext(
  patient: Patient,
  safetyResult: SafetyCheckResult
): Promise<ClinicalContext> {
  const supabase = createServerClient();

  // Determine which conditions to query — supports multi-condition patients
  const conditionTags = patient.condition_tags as string[];

  // Build condition filter: match any of patient's condition tags
  const tagConditions = conditionTags
    .map((tag) => `condition_tags.cs.["${tag}"]`)
    .join(',');

  // Fetch relevant guidelines (RSSDI + CSI + both for overlap patients)
  const { data: guidelines } = await supabase
    .from('indian_guidelines')
    .select('*')
    .or(tagConditions)
    .order('source_id', { ascending: true });

  // Fetch relevant drugs tagged for patient's conditions
  const { data: drugs } = await supabase
    .from('drugs')
    .select('*')
    .or(tagConditions)
    .order('monthly_cost_approx', { ascending: true });

  // Fetch drug interactions for patient's current meds
  const medNames = patient.current_medications.map((m) => m.name);
  const interactionFilters = medNames
    .map((m) => `drug_a_name.ilike.%${m.split(' ')[0]}%`)
    .join(',');

  const { data: interactions } = medNames.length > 0
    ? await supabase
        .from('drug_interactions')
        .select('*')
        .or(interactionFilters)
    : { data: [] };

  // Fetch formulary status for relevant drugs
  const drugNames = (drugs || []).map((d: Drug) => d.generic_name);
  const { data: formulary } = await supabase
    .from('hospital_formulary')
    .select('*')
    .in('drug_name', drugNames.slice(0, 25));

  // Fetch hospital contacts for patient's conditions
  const { data: contacts } = await supabase
    .from('hospital_contacts')
    .select('*')
    .or(tagConditions);

  return {
    patient,
    safety_result: safetyResult,
    relevant_guidelines: (guidelines || []) as IndianGuideline[],
    relevant_drugs: (drugs || []) as Drug[],
    relevant_interactions: (interactions || []) as DrugInteraction[],
    formulary_data: (formulary || []) as HospitalFormulary[],
    hospital_contacts: (contacts || []) as HospitalContact[],
  };
}

// ============================================================
// BUILD SYSTEM PROMPT — India-specific context injector
// ============================================================

export function composeSystemPrompt(context: ClinicalContext): string {
  const { patient, safety_result, relevant_guidelines, relevant_drugs,
          relevant_interactions, formulary_data, hospital_contacts } = context;

  const egfr = safety_result.egfr || patient.labs.egfr;
  const ckdStage = safety_result.ckd_stage;
  const conditionTags = patient.condition_tags as string[];
  const isMultiCondition = conditionTags.length > 1 ||
    conditionTags.includes('heart_failure');
  const hba1cTarget = patient.age && patient.conditions
    ? getHbA1cTarget(patient.age, patient.conditions, egfr || 90)
    : null;

  // ── SECTION 1: ROLE ──────────────────────────────────────
  const roleSection = `You are BRAHMO, an India-specific clinical decision support AI for doctors at Apollo Hospitals, Chennai.

CRITICAL RULES:
1. ALWAYS cite RSSDI guidelines for diabetes (NOT ADA or ACC/AHA)
2. ALWAYS cite CSI/IHRS guidelines for cardiovascular (NOT ACC/AHA or ESC)
3. ALWAYS use Indian drug brand names with ₹ MRP prices
4. ALWAYS flag NLEM 2022 status — NLEM drugs are price-controlled and cheapest
5. ALWAYS consider the patient's insurance/financial context
6. NEVER recommend drugs that are contraindicated for this patient
7. For overlap patients (diabetes + cardiac): pull guidelines from BOTH RSSDI and CSI`;

  // ── SECTION 2: PATIENT SUMMARY ───────────────────────────
  const allergyStr = patient.allergies
    .map((a) => `${a.drug} (${a.reaction.toUpperCase()} — ${a.severity})`)
    .join(', ') || 'NKDA';

  const medsStr = patient.current_medications
    .map((m) => `${m.name} ${m.dose} ${m.frequency}`)
    .join(', ') || 'None';

  const labsStr = Object.entries(patient.labs)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => {
      const labLabels: Record<string, string> = {
        hba1c: 'HbA1c', egfr: 'eGFR', creatinine: 'Cr', k: 'K+', na: 'Na+',
        bnp: 'BNP', troponin: 'Troponin', ldl: 'LDL', hdl: 'HDL',
        tg: 'TG', fbs: 'FBS', alt: 'ALT', urine_acr: 'Urine ACR', glucose: 'Glucose'
      };
      return `${labLabels[k] || k}: ${v}`;
    })
    .join(', ');

  const vitalsStr = Object.entries(patient.vitals)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
    .join(', ');

  const patientSection = `
PATIENT CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Patient: ${patient.display_name} (${patient.age}${patient.gender}, BMI ${patient.bmi})
Conditions: ${patient.conditions?.join(', ')}
Current Medications: ${medsStr}
⚠️ ALLERGIES: ${allergyStr}
Labs: ${labsStr}
${vitalsStr ? `Vitals: ${vitalsStr}` : ''}
${egfr ? `Computed eGFR: ${egfr} mL/min/1.73m² → ${ckdStage}` : ''}
${hba1cTarget ? `HbA1c Target (RSSDI 2022): ${hba1cTarget.target} — ${hba1cTarget.rationale}` : ''}
Insurance: ${patient.insurance?.provider || 'None'} — ${patient.insurance?.notes || ''}
Income context: ${patient.income_context?.replace(/_/g, ' ')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  // ── SECTION 3: SAFETY FLAGS ──────────────────────────────
  const criticalAlerts = safety_result.alerts.filter((a) => a.severity === 'critical');
  const highAlerts = safety_result.alerts.filter((a) => a.severity === 'high');

  let safetySection = '\nSAFETY ENGINE OUTPUT (PRE-COMPUTED):\n';

  if (criticalAlerts.length > 0) {
    safetySection += '\n🚨 CRITICAL ALERTS — MUST ADDRESS IN RESPONSE:\n';
    criticalAlerts.forEach((a) => {
      safetySection += `  • ${a.title}\n    → ${a.action}\n`;
    });
  }

  if (highAlerts.length > 0) {
    safetySection += '\n⚠️ HIGH PRIORITY WARNINGS:\n';
    highAlerts.forEach((a) => {
      safetySection += `  • ${a.title}\n    → ${a.action}\n`;
    });
  }

  if (safety_result.cha2ds2_vasc_score !== undefined) {
    safetySection += `\nCHA₂DS₂-VASc Score: ${safety_result.cha2ds2_vasc_score} → ${
      safety_result.cha2ds2_vasc_score >= 2 ? 'ANTICOAGULATION RECOMMENDED (CSI/IHRS)' : 'Lower risk — assess individually'
    }\n`;
  }

  if (safety_result.hyperkalemia_risk && safety_result.hyperkalemia_risk !== 'low') {
    safetySection += `\nHyperkalemia Risk: ${safety_result.hyperkalemia_risk.toUpperCase()} — K+ ${patient.labs.k} mEq/L\n`;
  }

  // ── SECTION 4: INDIAN GUIDELINES ─────────────────────────
  const guidelineSources = [...new Set(relevant_guidelines.map((g) => g.source_id))];
  let guidelinesSection = `\nINDIAN CLINICAL GUIDELINES (${guidelineSources.join(' + ')}):\n`;
  guidelinesSection += `Sources: ${guidelineSources.join(', ')} — Use THESE, not ADA/ACC-AHA\n\n`;

  // Group by source for clarity
  const guidelinesBySource: Record<string, IndianGuideline[]> = {};
  relevant_guidelines.forEach((g) => {
    if (!guidelinesBySource[g.source_id]) guidelinesBySource[g.source_id] = [];
    guidelinesBySource[g.source_id].push(g);
  });

  Object.entries(guidelinesBySource).forEach(([source, guidelines]) => {
    guidelinesSection += `[${source} ${guidelines[0]?.guideline_year || '2022'} Guidelines]\n`;
    // Prioritize most relevant guidelines (limit to avoid token overflow)
    guidelines.slice(0, 8).forEach((g) => {
      guidelinesSection += `  • ${g.section}: ${g.recommendation.substring(0, 280)}...\n`;
      guidelinesSection += `    Evidence: ${g.evidence_level || 'B'} | Class: ${g.class_of_rec || 'I'}\n`;
    });
    guidelinesSection += '\n';
  });

  // ── SECTION 5: INDIAN DRUGS WITH ₹ PRICES ────────────────
  let drugsSection = '\nINDIAN DRUG DATABASE (₹ MRP — Verified):\n';

  // Categorize drugs
  const diabetesDrugs = relevant_drugs.filter((d) =>
    (d.condition_tags as string[]).includes('diabetes')
  );
  const cardiacDrugs = relevant_drugs.filter((d) =>
    (d.condition_tags as string[]).includes('cardiovascular') &&
    !(d.condition_tags as string[]).includes('diabetes')
  );
  const overlapDrugs = relevant_drugs.filter((d) =>
    (d.condition_tags as string[]).includes('diabetes') &&
    (d.condition_tags as string[]).includes('cardiovascular')
  );

  const formatDrugLine = (d: Drug) => {
    const formularyMatch = formulary_data.find((f) => 
      f.drug_name.toLowerCase() === d.generic_name.toLowerCase()
    );
    const inStock = formularyMatch?.in_stock !== false;
    const nlemBadge = d.nlem_status ? ' ✅NLEM' : '';
    const hfBadge = !d.hf_safe ? ' ❌HF-UNSAFE' : '';
    const stockBadge = !inStock ? ' 📦OUT OF STOCK' : '';
    return `  • ${d.generic_name} → ${d.indian_brand_name} ${d.mrp_price}${nlemBadge}${hfBadge}${stockBadge}
    [${d.drug_class}] Hypo risk: ${d.hypoglycemia_risk || 'low'} | Weight: ${d.weight_effect || 'neutral'} | HF safe: ${d.hf_safe ? 'Yes' : 'NO'}
    ${d.notes?.substring(0, 180) || ''}`;
  };

  if (diabetesDrugs.length > 0) {
    drugsSection += '\nDiabetes Drugs:\n';
    diabetesDrugs.slice(0, 12).forEach((d) => { drugsSection += formatDrugLine(d) + '\n'; });
  }
  if (cardiacDrugs.length > 0) {
    drugsSection += '\nCardiac Drugs:\n';
    cardiacDrugs.slice(0, 12).forEach((d) => { drugsSection += formatDrugLine(d) + '\n'; });
  }
  if (overlapDrugs.length > 0) {
    drugsSection += '\nDual-benefit Drugs (Diabetes + Cardiac):\n';
    overlapDrugs.forEach((d) => { drugsSection += formatDrugLine(d) + '\n'; });
  }

  // ── SECTION 6: HOSPITAL CONTACTS ─────────────────────────
  let contactsSection = '\nAPOLLO CHENNAI — RELEVANT DEPARTMENT CONTACTS:\n';
  hospital_contacts.slice(0, 8).forEach((c) => {
    contactsSection += `  • ${c.role} (${c.department}): ${c.name || ''} — Ext. ${c.extension}`;
    if (c.available) contactsSection += ` [${c.available}]`;
    contactsSection += '\n';
  });

  // ── SECTION 7: RESPONSE INSTRUCTIONS ─────────────────────
  const responseInstructions = `
RESPONSE FORMAT REQUIREMENTS:
1. Start with critical safety flags (if any) — these MUST come first
2. Cite RSSDI for diabetes recommendations, CSI for cardiac
3. For every drug recommendation: include Indian brand name + ₹ MRP + NLEM status
4. For CKD patients: include specific renal dosing
5. For cost-constrained patients: rank options cheapest first, flag NLEM/Jan Aushadhi
6. For overlap patients (diabetes + HF/cardiac): explicitly note which guideline applies to which recommendation
7. Include relevant Apollo Chennai contacts at the end
8. End with monitoring plan
${isMultiCondition ? '9. ⭐ OVERLAP CASE: Pull guidelines from BOTH RSSDI AND CSI — label each recommendation with its source' : ''}`;

  return [
    roleSection,
    patientSection,
    safetySection,
    guidelinesSection,
    drugsSection,
    contactsSection,
    responseInstructions,
  ].join('\n');
}

// ============================================================
// MAIN COMPOSE FUNCTION — Entry point
// ============================================================

export async function composePrompt(
  patient: Patient,
  safetyResult: SafetyCheckResult,
  userQuery: string
): Promise<ComposedPrompt> {
  // Fetch all clinical context
  const context = await fetchClinicalContext(patient, safetyResult);

  // Build system prompt
  const systemPrompt = composeSystemPrompt(context);

  // Build user message with clinical question
  const userMessage = `Doctor's question: "${userQuery}"

Patient: ${patient.display_name}
Please provide India-specific guidance citing RSSDI/CSI guidelines, Indian drug brands with ₹ prices, and Apollo Chennai contacts as relevant.`;

  // Summary for UI display
  const guidelineSources = [
    ...new Set(context.relevant_guidelines.map((g) => `${g.source_id} ${g.guideline_year || '2022'}`)),
  ];

  const safetyFlags = context.safety_result.alerts
    .filter((a) => a.severity === 'critical' || a.severity === 'high')
    .map((a) => a.title);

  return {
    system_prompt: systemPrompt,
    user_message: userMessage,
    context_summary: `Loaded ${context.relevant_guidelines.length} guidelines (${guidelineSources.join(', ')}), ${context.relevant_drugs.length} drugs, ${context.relevant_interactions.length} interaction pairs`,
    guideline_sources: guidelineSources,
    safety_flags: safetyFlags,
  };
}
