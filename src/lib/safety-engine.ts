import { createServerClient } from './supabase';
import {
  calculateEGFR,
  classifyCKD,
  getRenalDosing,
  assessHyperkalemiaRisk,
  getHbA1cTarget,
  calculateCHA2DS2VASc,
} from './calculators';
import type {
  Patient,
  SafetyAlert,
  SafetyCheckResult,
  Drug,
  DrugInteraction,
} from './types';

export async function runSafetyCheck(patient: Patient): Promise<SafetyCheckResult> {
  const supabase = createServerClient();
  const alerts: SafetyAlert[] = [];
  const drugFlags: Record<string, string[]> = {};
  const monitoring: string[] = [];

  const creatinine = patient.labs.creatinine;
  const computedEGFR =
    creatinine && patient.age && patient.gender
      ? calculateEGFR(creatinine, patient.age, patient.gender)
      : patient.labs.egfr;
  const egfr = computedEGFR || 90;
  const ckdInfo = classifyCKD(egfr);

  const medNames = patient.current_medications.map((m) => m.name);
  const allMedNamesLower = medNames.map((m) => m.toLowerCase());

  const { data: drugs } = await supabase
    .from('drugs')
    .select('*')
    .or(
      medNames
        .map((m) => `generic_name_normalized.ilike.${m.toLowerCase().split(' ')[0]}%`)
        .join(',')
    );

  if (drugs) {
    for (const drug of drugs as Drug[]) {
      const flags: string[] = [];

      const renalRec = getRenalDosing(drug.renal_dosing, egfr);
      const isStop =
        renalRec.toLowerCase().includes('stop') ||
        renalRec.toLowerCase().includes('contraindicated') ||
        renalRec.toLowerCase().includes('avoid');

      if (isStop) {
        alerts.push({
          type: 'contraindication',
          severity: 'critical',
          drug: drug.generic_name,
          title: `⛔ STOP ${drug.generic_name} — eGFR ${egfr} (${ckdInfo.label})`,
          detail: renalRec,
          action: `Discontinue ${drug.generic_name} immediately. ${renalRec}`,
        });
        flags.push(`STOP at eGFR ${egfr}`);
      } else if (
        renalRec.toLowerCase().includes('reduce') ||
        renalRec.toLowerCase().includes('caution') ||
        renalRec.toLowerCase().includes('monitor')
      ) {
        alerts.push({
          type: 'dose_adjustment',
          severity: 'high',
          drug: drug.generic_name,
          title: `⚠️ Dose Adjust: ${drug.generic_name} — eGFR ${egfr}`,
          detail: renalRec,
          action: renalRec,
        });
        flags.push(`Dose adjust at eGFR ${egfr}`);
      }

      const hasHF = patient.conditions?.some((c) =>
        c.toLowerCase().includes('heart failure')
      );
      if (hasHF && !drug.hf_safe) {
        alerts.push({
          type: 'contraindication',
          severity: 'critical',
          drug: drug.generic_name,
          title: `⛔ ${drug.generic_name} CONTRAINDICATED in Heart Failure`,
          detail: `${drug.generic_name} is unsafe in heart failure. Causes fluid retention and cardiac decompensation (e.g., Pioglitazone) or increased HF hospitalizations (e.g., Saxagliptin).`,
          action: `STOP ${drug.generic_name}. Switch to SGLT2i (empagliflozin/dapagliflozin) which has dual benefit for T2DM + HF.`,
        });
        flags.push('CONTRAINDICATED in HF');
      }

      const hasHFAndHighHypoRisk =
        hasHF && drug.hypoglycemia_risk === 'high';
      if (hasHFAndHighHypoRisk) {
        alerts.push({
          type: 'warning',
          severity: 'high',
          drug: drug.generic_name,
          title: `⚠️ ${drug.generic_name} — High Hypoglycemia Risk in Heart Failure`,
          detail: `Hypoglycemia in heart failure patients triggers cardiac arrhythmias and acute events. Sulfonylureas (glimepiride, glipizide) have HIGH hypoglycemia risk and should be avoided in HF patients.`,
          action: `Replace ${drug.generic_name} with low-hypoglycemia-risk agent: Teneligliptin (DPP4i) or SGLT2i. RSSDI 2022.`,
        });
        flags.push('High hypo risk in HF');
      }

      const hasSulfonamideAllergy = patient.allergies.some(
        (a) =>
          a.drug.toLowerCase().includes('sulfonamide') ||
          a.drug.toLowerCase().includes('sulfon')
      );
      const isSulfonylurea =
        drug.drug_class.toLowerCase().includes('sulfonylurea') ||
        drug.drug_class.toLowerCase().includes('sulfonyl');

      if (hasSulfonamideAllergy && isSulfonylurea) {
        alerts.push({
          type: 'contraindication',
          severity: 'critical',
          drug: drug.generic_name,
          title: `⛔ ALLERGY ALERT: ${drug.generic_name} + Sulfonamide Allergy`,
          detail: `Sulfonylureas share structural similarity with sulfonamide antibiotics. Documented sulfonamide allergy → potential cross-reactivity with all sulfonylureas (glimepiride, glipizide, glibenclamide).`,
          action: `AVOID all sulfonylureas. Switch to Teneligliptin (DPP4i) — no sulfonamide cross-reactivity. RSSDI 2022.`,
        });
        flags.push('Sulfonamide allergy — avoid');
      }

      const hasPenicillinAllergy = patient.allergies.some((a) =>
        a.drug.toLowerCase().includes('penicillin')
      );
      const isPenicillinRelated =
        drug.generic_name.toLowerCase().includes('amoxicillin') ||
        drug.generic_name.toLowerCase().includes('ampicillin') ||
        drug.generic_name.toLowerCase().includes('penicillin');

      if (hasPenicillinAllergy && isPenicillinRelated) {
        const severity = patient.allergies.find(a =>
          a.drug.toLowerCase().includes('penicillin')
        )?.severity;
        alerts.push({
          type: 'contraindication',
          severity: severity === 'severe' ? 'critical' : 'high',
          drug: drug.generic_name,
          title: `🚨 ANAPHYLAXIS RISK: ${drug.generic_name} — Penicillin ANAPHYLAXIS history`,
          detail: `Patient has documented penicillin ANAPHYLAXIS. All penicillins and potentially cephalosporins are ABSOLUTELY CONTRAINDICATED.`,
          action: `HARD BLOCK: DO NOT prescribe any penicillin or cephalosporin. Use non-beta-lactam antibiotics (clindamycin, macrolides, quinolones) if antibiotics needed.`,
        });
        flags.push('Penicillin anaphylaxis — HARD BLOCK');
      }

      if (flags.length > 0) {
        drugFlags[drug.generic_name] = flags;
      }
    }
  }

  if (medNames.length >= 2) {
    const { data: interactions } = await supabase
      .from('drug_interactions')
      .select('*')
      .or(
        medNames
          .map((m) => `drug_a_name.ilike.%${m.split(' ')[0]}%`)
          .join(',')
      );

    if (interactions) {
      for (const interaction of interactions as DrugInteraction[]) {
        const drugAPresent = allMedNamesLower.some((m) =>
          m.includes(interaction.drug_a_name.toLowerCase().split(' ')[0])
        );
        const drugBPresent = allMedNamesLower.some((m) =>
          m.includes(interaction.drug_b_name.toLowerCase().split(' ')[0])
        );

        if (drugAPresent && drugBPresent) {
          const severityMap: Record<string, SafetyAlert['severity']> = {
            contraindicated: 'critical',
            severe: 'critical',
            moderate: 'high',
            mild: 'moderate',
          };

          alerts.push({
            type: 'interaction',
            severity: severityMap[interaction.severity] || 'moderate',
            drug: `${interaction.drug_a_name} + ${interaction.drug_b_name}`,
            title: `${interaction.severity.toUpperCase()} DDI: ${interaction.drug_a_name} ↔ ${interaction.drug_b_name}`,
            detail: `${interaction.clinical_effect}. Mechanism: ${interaction.mechanism || 'See management.'}`,
            action: interaction.management,
          });
        }
      }
    }
  }

  const potassium = patient.labs.k;
  if (potassium) {
    const hypokalemiaResult = assessHyperkalemiaRisk(potassium, medNames, egfr);
    if (hypokalemiaResult.risk_level !== 'low') {
      alerts.push({
        type: 'monitoring',
        severity:
          hypokalemiaResult.risk_level === 'critical'
            ? 'critical'
            : hypokalemiaResult.risk_level === 'high'
            ? 'high'
            : 'moderate',
        title: `🔴 Hyperkalemia Risk: K+ = ${potassium} mEq/L`,
        detail: hypokalemiaResult.message,
        action: hypokalemiaResult.action,
      });
      monitoring.push(`Serum K+ in 1 week, then monthly`);
    }
  }

  if (egfr < 60) {
    monitoring.push(`eGFR monitoring every 3 months (current: ${egfr} mL/min — ${ckdInfo.label})`);
    monitoring.push('Urine ACR annually for proteinuria');
  }

  let cha2Score: number | undefined;
  let cha2Components: Record<string, number> | undefined;
  const hasAF = patient.conditions?.some((c) =>
    c.toLowerCase().includes('atrial fibrillation') || c.toLowerCase().includes(' af')
  );

  if (hasAF && patient.age && patient.gender) {
    const cha2Result = calculateCHA2DS2VASc({
      age: patient.age,
      gender: patient.gender,
      heart_failure: patient.conditions?.some(c => c.toLowerCase().includes('heart failure')) || false,
      hypertension: patient.conditions?.some(c => c.toLowerCase().includes('hypert')) || false,
      diabetes: patient.conditions?.some(c => c.toLowerCase().includes('diabetes') || c.toLowerCase().includes('t2dm')) || false,
      stroke_history: patient.conditions?.some(c => c.toLowerCase().includes('stroke') || c.toLowerCase().includes('tia')) || false,
      vascular_disease: patient.conditions?.some(c => c.toLowerCase().includes('mi') || c.toLowerCase().includes('myocardial')) || false,
    });

    cha2Score = cha2Result.score;
    cha2Components = cha2Result.components;

    alerts.push({
      type: 'monitoring',
      severity: cha2Result.anticoagulate ? 'high' : 'moderate',
      title: `🫀 CHA₂DS₂-VASc Score = ${cha2Result.score}`,
      detail: `Components: ${Object.entries(cha2Result.components).filter(([, v]) => v > 0).map(([k, v]) => `${k} (+${v})`).join(', ')}`,
      action: cha2Result.recommendation,
    });
  }

  const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    patient_id: patient.id,
    ckd_stage: ckdInfo.label,
    egfr,
    cha2ds2_vasc_score: cha2Score,
    cha2ds2_vasc_components: cha2Components,
    hyperkalemia_risk:
      potassium ? assessHyperkalemiaRisk(potassium, medNames, egfr).risk_level : undefined,
    alerts,
    drug_flags: drugFlags,
    recommended_monitoring: [...new Set(monitoring)],
  };
}
