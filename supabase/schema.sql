-- ============================================================
-- BRAHMO India Clinical AI — Unified Schema
-- ONE set of tables for ALL conditions (diabetes, cardiovascular, ...)
-- Adding condition #3 = new rows only, ZERO code changes
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE 1: drugs — ALL drugs across ALL conditions
-- ============================================================
CREATE TABLE IF NOT EXISTS drugs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generic_name          TEXT NOT NULL,
  generic_name_normalized TEXT GENERATED ALWAYS AS (lower(trim(generic_name))) STORED,
  drug_class            TEXT NOT NULL,        -- e.g. 'DPP4i', 'SGLT2i', 'Antiplatelet'
  drug_subclass         TEXT,                 -- e.g. 'Gliptin', 'Gliflozin'
  indian_brand_name     TEXT NOT NULL,        -- Primary brand in India
  alternate_brands      TEXT[],              -- Other Indian brands
  manufacturer          TEXT,
  mrp_price             TEXT NOT NULL,        -- e.g. '₹195/strip of 10'
  monthly_cost_approx   INTEGER,             -- in INR for easy comparison
  nlem_status           BOOLEAN DEFAULT FALSE,  -- In NLEM 2022?
  jan_aushadhi_available BOOLEAN DEFAULT FALSE, -- Available at Jan Aushadhi stores?
  renal_dosing          JSONB DEFAULT '{}',  -- dosing at eGFR thresholds
  hf_safe               BOOLEAN DEFAULT TRUE, -- Safe in heart failure?
  weight_effect         TEXT CHECK (weight_effect IN ('gain','neutral','loss')),
  hypoglycemia_risk     TEXT CHECK (hypoglycemia_risk IN ('low','moderate','high')),
  condition_tags        JSONB DEFAULT '[]',  -- e.g. ["diabetes","cardiovascular"]
  contraindications     TEXT[],
  key_interactions      TEXT[],
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drugs_condition_tags ON drugs USING gin(condition_tags);
CREATE INDEX idx_drugs_generic_normalized ON drugs(generic_name_normalized);
CREATE INDEX idx_drugs_nlem ON drugs(nlem_status);

-- ============================================================
-- TABLE 2: drug_interactions — cross-condition pairs
-- ============================================================
CREATE TABLE IF NOT EXISTS drug_interactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drug_a_id       UUID REFERENCES drugs(id),
  drug_b_id       UUID REFERENCES drugs(id),
  drug_a_name     TEXT NOT NULL,   -- denormalized for quick lookup
  drug_b_name     TEXT NOT NULL,
  severity        TEXT NOT NULL CHECK (severity IN ('mild','moderate','severe','contraindicated')),
  mechanism       TEXT,
  clinical_effect TEXT NOT NULL,
  management      TEXT NOT NULL,
  condition_tags  JSONB DEFAULT '[]',  -- which condition pair this applies to
  evidence_level  TEXT DEFAULT 'C',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_drug_a ON drug_interactions(drug_a_name);
CREATE INDEX idx_interactions_drug_b ON drug_interactions(drug_b_name);
CREATE INDEX idx_interactions_severity ON drug_interactions(severity);

-- ============================================================
-- TABLE 3: indian_guidelines — ALL guidelines, ALL conditions
-- ============================================================
CREATE TABLE IF NOT EXISTS indian_guidelines (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id         TEXT NOT NULL CHECK (source_id IN ('RSSDI','CSI','MoHFW_STG','IHRS','ICMR','ISN')),
  guideline_year    INTEGER,
  condition         TEXT NOT NULL,     -- e.g. 'diabetes', 'heart_failure', 'STEMI', 'AF'
  section           TEXT NOT NULL,     -- e.g. 'Second-line therapy', 'Reperfusion'
  recommendation    TEXT NOT NULL,
  evidence_level    TEXT,              -- A, B, C or I, IIa, IIb
  class_of_rec      TEXT,             -- Class I / IIa / IIb / III
  condition_tags    JSONB DEFAULT '[]', -- ["diabetes"] or ["cardiovascular"] or ["diabetes","heart_failure"]
  clinical_context  TEXT,             -- When this recommendation applies
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guidelines_source ON indian_guidelines(source_id);
CREATE INDEX idx_guidelines_condition ON indian_guidelines(condition);
CREATE INDEX idx_guidelines_tags ON indian_guidelines USING gin(condition_tags);

-- ============================================================
-- TABLE 4: hospital_formulary — Apollo Chennai availability
-- ============================================================
CREATE TABLE IF NOT EXISTS hospital_formulary (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drug_id         UUID REFERENCES drugs(id),
  drug_name       TEXT NOT NULL,  -- denormalized
  in_stock        BOOLEAN DEFAULT TRUE,
  stock_level     TEXT CHECK (stock_level IN ('adequate','low','critical','unavailable')),
  pharmacy_notes  TEXT,
  department      TEXT,           -- which dept stocks this
  formulary_tier  TEXT,           -- 'tier1_generic', 'tier2_branded', 'tier3_specialty'
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 5: patients — 6 demo profiles + extensible
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_code        TEXT UNIQUE NOT NULL,  -- P1, P2, ... P6
  display_name        TEXT NOT NULL,         -- e.g. "Failing Metformin — 48M"
  scenario_label      TEXT,                  -- "Second-line drug selection"
  age                 INTEGER,
  gender              TEXT CHECK (gender IN ('M','F','Other')),
  bmi                 DECIMAL(4,1),
  conditions          TEXT[],               -- active diagnoses
  current_medications JSONB DEFAULT '[]',    -- [{name, dose, frequency}]
  allergies           JSONB DEFAULT '[]',    -- [{drug, reaction, severity}]
  labs                JSONB DEFAULT '{}',   -- {hba1c, egfr, creatinine, k, ...}
  vitals              JSONB DEFAULT '{}',   -- {bp, hr, spo2}
  insurance           JSONB DEFAULT '{}',   -- {provider, cap_monthly, notes}
  income_context      TEXT,                 -- 'middle_class', 'daily_wage', 'retired_govt', etc.
  condition_tags      JSONB DEFAULT '[]',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 6: hospital_contacts — Apollo Chennai departments
-- ============================================================
CREATE TABLE IF NOT EXISTS hospital_contacts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department  TEXT NOT NULL,
  role        TEXT NOT NULL,
  name        TEXT,
  extension   TEXT,
  notes       TEXT,
  available   TEXT,   -- e.g. 'Mon/Wed/Fri', '24x7'
  condition_tags JSONB DEFAULT '[]'
);
