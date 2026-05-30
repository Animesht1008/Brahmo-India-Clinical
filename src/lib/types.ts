// ============================================================
// BRAHMO India Clinical AI — Shared TypeScript Types
// ============================================================

export interface Drug {
  id: string;
  generic_name: string;
  drug_class: string;
  drug_subclass?: string;
  indian_brand_name: string;
  alternate_brands?: string[];
  manufacturer?: string;
  mrp_price: string;
  monthly_cost_approx?: number;
  nlem_status: boolean;
  jan_aushadhi_available?: boolean;
  renal_dosing: Record<string, string>;
  hf_safe: boolean;
  weight_effect?: 'gain' | 'neutral' | 'loss';
  hypoglycemia_risk?: 'low' | 'moderate' | 'high';
  condition_tags: string[];
  contraindications?: string[];
  key_interactions?: string[];
  notes?: string;
}

export interface DrugInteraction {
  id: string;
  drug_a_name: string;
  drug_b_name: string;
  severity: 'mild' | 'moderate' | 'severe' | 'contraindicated';
  mechanism?: string;
  clinical_effect: string;
  management: string;
  condition_tags: string[];
  evidence_level?: string;
}

export interface IndianGuideline {
  id: string;
  source_id: 'RSSDI' | 'CSI' | 'MoHFW_STG' | 'IHRS' | 'ICMR' | 'ISN';
  guideline_year?: number;
  condition: string;
  section: string;
  recommendation: string;
  evidence_level?: string;
  class_of_rec?: string;
  condition_tags: string[];
  clinical_context?: string;
}

export interface HospitalFormulary {
  drug_id?: string;
  drug_name: string;
  in_stock: boolean;
  stock_level?: 'adequate' | 'low' | 'critical' | 'unavailable';
  pharmacy_notes?: string;
  department?: string;
  formulary_tier?: string;
}

export interface HospitalContact {
  department: string;
  role: string;
  name?: string;
  extension: string;
  notes?: string;
  available?: string;
  condition_tags: string[];
}

export interface Patient {
  id: string;
  patient_code: string;
  display_name: string;
  scenario_label?: string;
  age?: number;
  gender?: 'M' | 'F' | 'Other';
  bmi?: number;
  conditions?: string[];
  current_medications: Array<{
    name: string;
    dose: string;
    frequency: string;
    notes?: string;
  }>;
  allergies: Array<{
    drug: string;
    reaction: string;
    severity: string;
    year?: number;
  }>;
  labs: PatientLabs;
  vitals: PatientVitals;
  insurance: PatientInsurance;
  income_context?: string;
  condition_tags: string[];
}

export interface PatientLabs {
  hba1c?: number;
  fbs?: number;
  creatinine?: number;
  egfr?: number;
  k?: number;             // potassium
  na?: number;            // sodium
  bnp?: number;
  troponin?: number;
  alt?: number;
  total_cholesterol?: number;
  ldl?: number;
  hdl?: number;
  tg?: number;
  urine_acr?: number;
  glucose?: number;
}

export interface PatientVitals {
  bp?: string;
  hr?: number;
  spo2?: number;
  rr?: number;
  ecg?: string;
  rhythm?: string;
}

export interface PatientInsurance {
  provider?: string;
  monthly_cap_inr?: number;
  total_cap_inr?: number;
  notes?: string;
}

// ============================================================
// Safety Engine Types
// ============================================================

export interface SafetyAlert {
  type: 'contraindication' | 'warning' | 'interaction' | 'dose_adjustment' | 'monitoring';
  severity: 'critical' | 'high' | 'moderate' | 'low';
  drug?: string;
  title: string;
  detail: string;
  action: string;
}

export interface SafetyCheckResult {
  patient_id: string;
  ckd_stage?: string;
  egfr?: number;
  cha2ds2_vasc_score?: number;
  cha2ds2_vasc_components?: Record<string, number>;
  hyperkalemia_risk?: 'low' | 'moderate' | 'high' | 'critical';
  alerts: SafetyAlert[];
  drug_flags: Record<string, string[]>;
  recommended_monitoring: string[];
}

// ============================================================
// Prompt Composer Types
// ============================================================

export interface ClinicalContext {
  patient: Patient;
  safety_result: SafetyCheckResult;
  relevant_guidelines: IndianGuideline[];
  relevant_drugs: Drug[];
  relevant_interactions: DrugInteraction[];
  formulary_data: HospitalFormulary[];
  hospital_contacts: HospitalContact[];
}

export interface ComposedPrompt {
  system_prompt: string;
  user_message: string;
  context_summary: string;
  guideline_sources: string[];
  safety_flags: string[];
}

// ============================================================
// API Response Types
// ============================================================

export interface ComparisonResponse {
  patient: Patient;
  generic_response: string;
  option_c_response: string;
  safety_alerts: SafetyAlert[];
  guideline_sources: string[];
  context_injected: ClinicalContext;
  composed_prompt: ComposedPrompt;
}
