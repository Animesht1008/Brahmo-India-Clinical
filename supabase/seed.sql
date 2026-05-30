-- ============================================================
-- BRAHMO India Clinical AI — Seed Data
-- Sources: RSSDI 2022, CSI STEMI Guidelines (IHJ 2017 + 2022 update),
--          NLEM 2022, 1mg.com / PharmEasy.in (prices verified May 2025)
-- ============================================================

-- ============================================================
-- DRUGS — Diabetes (condition_tags: ["diabetes"])
-- ============================================================

INSERT INTO drugs (generic_name, drug_class, drug_subclass, indian_brand_name, alternate_brands, manufacturer, mrp_price, monthly_cost_approx, nlem_status, jan_aushadhi_available, renal_dosing, hf_safe, weight_effect, hypoglycemia_risk, condition_tags, contraindications, key_interactions, notes) VALUES

-- Metformin 500mg/1000mg
('Metformin', 'Biguanide', NULL, 'Glycomet 500mg', ARRAY['Glucophage','Obimet','Walaphage'], 'USV Ltd', '₹30/strip of 20 tabs', 30, TRUE, TRUE,
 '{"egfr_60_89":"full dose","egfr_45_59":"full dose, monitor","egfr_30_44":"reduce to 500mg BD, caution","egfr_lt30":"STOP — lactic acidosis risk"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["diabetes"]'::JSONB,
 ARRAY['eGFR < 30', 'Active liver disease', 'IV contrast (hold 48h)', 'Alcoholism'],
 ARRAY['Contrast dye (hold 48h pre-procedure)', 'Alcohol'],
 'First-line T2DM. NLEM 2022. Jan Aushadhi available ~₹10/strip. Hold before IV contrast.'),

-- Glimepiride 1mg/2mg/4mg
('Glimepiride', 'Sulfonylurea', NULL, 'Amaryl 2mg', ARRAY['Glimpid','Glimisave','Zoryl'], 'Sanofi India', '₹68/strip of 10 tabs', 68, TRUE, TRUE,
 '{"egfr_60_89":"use cautiously","egfr_45_59":"reduce dose, monitor","egfr_30_44":"AVOID — hypoglycemia risk","egfr_lt30":"CONTRAINDICATED"}'::JSONB,
 FALSE, 'gain', 'high',
 '["diabetes"]'::JSONB,
 ARRAY['eGFR < 30', 'Sulfonamide allergy', 'CKD Stage 3b+', 'Elderly (high hypo risk)'],
 ARRAY['Beta-blockers (mask hypo symptoms)', 'Fluconazole (increase levels)', 'NSAIDs'],
 'SULFONAMIDE CROSS-REACTIVITY. NLEM 2022. HIGH hypo risk in CKD. STOP if eGFR < 30.'),

-- Teneligliptin 20mg — India's most prescribed DPP4i
('Teneligliptin', 'DPP4 inhibitor', 'Gliptin', 'Teneza 20mg', ARRAY['Tenepure','Zita','Teneglip','TENLIA'], 'Glenmark Pharmaceuticals', '₹199/strip of 10 tabs', 199, TRUE, FALSE,
 '{"egfr_60_89":"full dose 20mg OD","egfr_45_59":"full dose — DPP4i safe in CKD","egfr_30_44":"full dose — safe, no dose adjustment","egfr_15_29":"20mg OD — safe, mild renal excretion","egfr_lt15":"20mg OD — safe"}'::JSONB,
 FALSE, 'neutral', 'low',
 '["diabetes"]'::JSONB,
 ARRAY['Pancreatitis history'],
 ARRAY['None significant for cardiac drugs'],
 'INDIA-SPECIFIC: Most prescribed DPP4i in India. ~1/4 cost of sitagliptin. Added to NLEM 2022. No dose adjustment in CKD — major advantage. ~₹39/day.'),

-- Sitagliptin 100mg
('Sitagliptin', 'DPP4 inhibitor', 'Gliptin', 'Januvia 100mg', ARRAY['Istavel','Zita'], 'MSD / Sun Pharma', '₹1200/strip of 7 tabs', 514, FALSE, FALSE,
 '{"egfr_60_89":"100mg OD","egfr_45_59":"50mg OD","egfr_30_44":"25mg OD","egfr_lt30":"25mg OD"}'::JSONB,
 FALSE, 'neutral', 'low',
 '["diabetes"]'::JSONB,
 ARRAY['None major'],
 ARRAY['None significant'],
 'More expensive than Teneligliptin. Not NLEM. Requires dose reduction in CKD.'),

-- Empagliflozin 10mg/25mg — SGLT2i
('Empagliflozin', 'SGLT2 inhibitor', 'Gliflozin', 'Jardiance 10mg', ARRAY['Empa-EQ','Empareg'], 'Boehringer Ingelheim / Eli Lilly', '₹499/strip of 10 tabs', 499, FALSE, FALSE,
 '{"egfr_60_89":"10mg OD full dose","egfr_45_59":"10mg OD — use for CV/HF benefit","egfr_30_44":"may use for HF/CV benefit, NOT for glucose lowering","egfr_lt30":"STOP for glucose lowering, HF benefit data limited"}'::JSONB,
 TRUE, 'loss', 'low',
 '["diabetes","cardiovascular","heart_failure"]'::JSONB,
 ARRAY['eGFR < 30 (glucose lowering)', 'Recurrent UTI', 'Ketoacidosis', 'Type 1 DM'],
 ARRAY['Diuretics (additive — monitor hydration)', 'Insulin (reduce dose to avoid hypo)'],
 'DUAL BENEFIT: Proven heart failure + diabetes benefit. Reduces HHF by 35% (EMPEROR). Safe in HFrEF. Premium price but saves lives.'),

-- Dapagliflozin 10mg
('Dapagliflozin', 'SGLT2 inhibitor', 'Gliflozin', 'Forxiga 10mg', ARRAY['Dapablu','Oxra'], 'AstraZeneca', '₹479/strip of 10 tabs', 479, FALSE, FALSE,
 '{"egfr_60_89":"10mg OD","egfr_45_59":"10mg OD for HF/CKD","egfr_30_44":"10mg for HF/CKD only, not glucose","egfr_lt30":"STOP"}'::JSONB,
 TRUE, 'loss', 'low',
 '["diabetes","cardiovascular","heart_failure"]'::JSONB,
 ARRAY['eGFR < 25 (glucose lowering)', 'Recurrent UTI'],
 ARRAY['Diuretics', 'Insulin'],
 'SGLT2i — proven HF benefit (DAPA-HF). Similar to empagliflozin. Prefer SGLT2i over pioglitazone in HF patients.'),

-- Pioglitazone 15mg/30mg
('Pioglitazone', 'Thiazolidinedione', 'TZD/Glitazone', 'Pioz 15mg', ARRAY['Actos','Piosafe','Glizone'], 'USV / Takeda', '₹120/strip of 10 tabs', 120, TRUE, FALSE,
 '{"egfr_60_89":"15mg OD","egfr_45_59":"15mg OD, caution","egfr_30_44":"use cautiously","egfr_lt30":"use cautiously, fluid retention risk"}'::JSONB,
 FALSE, 'gain', 'low',
 '["diabetes"]'::JSONB,
 ARRAY['HEART FAILURE — ABSOLUTE CONTRAINDICATION (fluid retention)', 'Bladder cancer history', 'Hepatic impairment', 'Macular edema'],
 ARRAY['Insulin (additive fluid retention)', 'CYP2C8 inhibitors'],
 'NLEM 2022. Cheap. Benefit for NAFLD/fatty liver. HARD BLOCK in heart failure — causes fluid retention.'),

-- Insulin Glargine (Basaglar/Lantus)
('Insulin Glargine', 'Insulin analog', 'Long-acting insulin', 'Basalog 100IU/mL', ARRAY['Lantus','Glaritus','Toujeo'], 'Biocon / Sanofi', '₹550/vial (10mL)', 550, TRUE, TRUE,
 '{"egfr_60_89":"standard dosing","egfr_45_59":"start low, titrate — reduced insulin clearance","egfr_30_44":"reduce basal dose 25%, monitor closely","egfr_lt30":"reduce 50%, frequent glucose monitoring"}'::JSONB,
 TRUE, 'gain', 'high',
 '["diabetes"]'::JSONB,
 ARRAY['Hypoglycemia unawareness (caution)'],
 ARRAY['Beta-blockers (mask hypo)', 'ACE inhibitors (may increase insulin sensitivity)'],
 'NLEM 2022. Biocon Basalog is biosimilar at lower cost than Lantus. Safe in CKD (unlike metformin/SU). Preferred insulin for CKD patients.'),

-- Insulin NPH (Intermediate)
('Insulin NPH (Isophane)', 'Insulin', 'Intermediate-acting', 'Huminsulin N', ARRAY['Wosulin N','Insugen N'], 'Eli Lilly India / Wockhardt', '₹230/vial', 230, TRUE, TRUE,
 '{"egfr_lt30":"reduce dose 25-50%, risk of prolonged hypo"}'::JSONB,
 TRUE, 'gain', 'high',
 '["diabetes"]'::JSONB,
 ARRAY['Hypoglycemia unawareness'],
 ARRAY['Beta-blockers', 'Alcohol'],
 'NLEM 2022. Lowest cost insulin. Two injections/day. Less predictable than glargine.'),

-- Voglibose 0.2mg/0.3mg
('Voglibose', 'Alpha-glucosidase inhibitor', NULL, 'Volix 0.3mg', ARRAY['Vogliser','Volibo'], 'Ranbaxy/Sun Pharma', '₹95/strip of 10 tabs', 285, FALSE, FALSE,
 '{"all_egfr":"safe, not renally cleared"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["diabetes"]'::JSONB,
 ARRAY['IBD', 'Intestinal obstruction'],
 ARRAY['None significant'],
 'India-specific: popular with post-meal glucose spikes. Good add-on. Not NLEM. Safe across all CKD stages.'),

-- Metformin + Glimepiride FDC
('Metformin + Glimepiride (FDC)', 'Biguanide + Sulfonylurea', 'Fixed-dose combo', 'Glycomet GP 2/500mg', ARRAY['Amaryl M','Glimisave M'], 'USV Ltd / Sanofi', '₹110/strip of 10 tabs', 110, FALSE, TRUE,
 '{"egfr_lt45":"AVOID — both drugs unsafe in low eGFR"}'::JSONB,
 FALSE, 'neutral', 'high',
 '["diabetes"]'::JSONB,
 ARRAY['eGFR < 45', 'Sulfonamide allergy', 'CKD 3b+'],
 ARRAY['Same as individual components'],
 'Very popular Indian FDC. AVOID in CKD. Sulfonamide allergy = hard block.'),

-- Metformin + Teneligliptin FDC  
('Metformin + Teneligliptin (FDC)', 'Biguanide + DPP4i', 'Fixed-dose combo', 'Teneza M 500mg', ARRAY['Teneglip M','Zita-Met'], 'Glenmark', '₹280/strip of 10 tabs', 280, FALSE, FALSE,
 '{"egfr_45_59":"reduce metformin, keep teneli","egfr_lt30":"STOP metformin component"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["diabetes"]'::JSONB,
 ARRAY['eGFR < 30'],
 ARRAY['Same as components'],
 'Popular Indian FDC. Once-daily convenience. Teneligliptin safe in CKD even when metformin stopped.'),

-- ============================================================
-- DRUGS — Cardiovascular (condition_tags: ["cardiovascular"])
-- ============================================================

-- Aspirin 75mg (antiplatelet)
('Aspirin', 'Antiplatelet', 'COX inhibitor', 'Ecosprin 75mg', ARRAY['Disprin','Loprin'], 'USV Ltd', '₹22/strip of 14 tabs', 22, TRUE, TRUE,
 '{"all_egfr":"use — GI protection with PPI","egfr_lt30":"use with PPI, monitor bleeding"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["cardiovascular"]'::JSONB,
 ARRAY['Active GI bleed', 'Allergy', 'Severe hepatic disease'],
 ARRAY['Warfarin (triple therapy — high bleeding)', 'NSAIDs (avoid combination)', 'Ticagrelor (dual antiplatelet)'],
 'NLEM 2022. Cornerstone of ACS. Low dose 75mg standard in India. Give with PPI (omeprazole/pantoprazole) if at GI risk.'),

-- Clopidogrel 75mg
('Clopidogrel', 'Antiplatelet', 'P2Y12 inhibitor', 'Clopilet 75mg', ARRAY['Plavix','Deplatt','Clavix'], 'Sun Pharma / Sanofi', '₹68/strip of 10 tabs', 68, TRUE, TRUE,
 '{"all_egfr":"full dose — not renally cleared"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["cardiovascular"]'::JSONB,
 ARRAY['Active bleeding', 'Severe hepatic impairment'],
 ARRAY['Omeprazole (reduces efficacy — prefer pantoprazole)', 'Warfarin', 'Aspirin (DAPT)'],
 'NLEM 2022. CSI first-choice P2Y12 in STEMI when ticagrelor not available. Cheaper than ticagrelor. Use pantoprazole (not omeprazole) for GI protection.'),

-- Ticagrelor 90mg
('Ticagrelor', 'Antiplatelet', 'P2Y12 inhibitor', 'Brilinta 90mg', ARRAY['Ticavir'], 'AstraZeneca', '₹580/strip of 14 tabs', 580, FALSE, FALSE,
 '{"all_egfr":"full dose"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["cardiovascular"]'::JSONB,
 ARRAY['Active bleeding', 'Hepatic impairment', 'Strong CYP3A4 inhibitors'],
 ARRAY['Aspirin high dose (avoid > 100mg with ticagrelor)', 'Warfarin/DOAC (triple therapy = high bleed)', 'Digoxin (increase levels)'],
 'CSI preferred P2Y12 for ACS (superior to clopidogrel). PLATO trial. Not NLEM. Costly. Post-MI: 12 months DAPT then review.'),

-- Streptokinase (thrombolytic)
('Streptokinase', 'Thrombolytic', 'Fibrinolytic', 'Streptokinase 1.5MU', ARRAY['Streptase','Kabikinase'], 'Cadila Healthcare', '₹5500/vial', 5500, FALSE, FALSE,
 '{"all_egfr":"use — thrombolytic, not renally excreted"}'::JSONB,
 FALSE, 'neutral', 'low',
 '["cardiovascular"]'::JSONB,
 ARRAY['Prior streptokinase use (antibodies)', 'Active bleeding', 'Stroke < 3 months', 'Recent surgery', 'Penicillin allergy (CHECK — different allergen)', 'Severe HTN > 180/110'],
 ARRAY['Anticoagulants (major bleeding risk)', 'Antiplatelets (additive bleeding)'],
 'CSI: First-choice thrombolytic at non-PCI hospitals. ₹5,000-8,000 vs tenecteplase ₹25,000-35,000. CANNOT use if prior SK treatment (antibodies). Not for penicillin allergy concern.'),

-- Tenecteplase (thrombolytic)
('Tenecteplase', 'Thrombolytic', 'Fibrinolytic', 'Metalyse 40mg', ARRAY['TNKase','Elaxim'], 'Boehringer Ingelheim', '₹28000/vial', 28000, TRUE, FALSE,
 '{"all_egfr":"use — not renally excreted"}'::JSONB,
 FALSE, 'neutral', 'low',
 '["cardiovascular"]'::JSONB,
 ARRAY['Active bleeding', 'Stroke < 3 months', 'Recent surgery', 'Severe HTN'],
 ARRAY['Anticoagulants', 'Antiplatelets'],
 'NLEM 2022 addition. Weight-based single IV bolus — simpler than SK. 5-7x more expensive than SK. CSI: Prefer if SK previously used. Preferred when bolus administration needed.'),

-- Heparin (UFH)
('Unfractionated Heparin', 'Anticoagulant', 'UFH', 'Heparin Sodium Inj 5000IU', ARRAY['Heparinum'], 'Neon Laboratories', '₹45/vial', 45, TRUE, TRUE,
 '{"all_egfr":"use — monitor APTT, dose adjust in severe renal impairment"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["cardiovascular"]'::JSONB,
 ARRAY['Active bleeding', 'HIT history', 'Thrombocytopenia'],
 ARRAY['Aspirin + ticagrelor (triple therapy)', 'DOAC (avoid combination)'],
 'NLEM 2022. Standard anticoagulation in STEMI/ACS. IV infusion + APTT monitoring. Reversed by protamine.'),

-- Atorvastatin 20mg/40mg/80mg
('Atorvastatin', 'Statin', 'HMG-CoA reductase inhibitor', 'Atorva 40mg', ARRAY['Lipitor','Tonact','Storvas'], 'Zydus Cadila / Pfizer India', '₹65/strip of 10 tabs', 65, TRUE, TRUE,
 '{"all_egfr":"full dose — not renally cleared"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["cardiovascular","diabetes"]'::JSONB,
 ARRAY['Active liver disease', 'Rhabdomyolysis history', 'Pregnancy'],
 ARRAY['Clarithromycin (increase levels)', 'Gemfibrozil (myopathy risk)', 'Colchicine'],
 'NLEM 2022. HIGH intensity post-ACS: 80mg. Moderate (40mg) for primary prevention. Generic brands very affordable. CSI recommends high-intensity statin post-MI.'),

-- Ramipril 2.5mg/5mg/10mg (ACE inhibitor)
('Ramipril', 'ACE inhibitor', 'RAAS blocker', 'Cardace 5mg', ARRAY['Hopace','Ramistar','Ramipres'], 'Sanofi India / Sun Pharma', '₹55/strip of 10 tabs', 55, TRUE, TRUE,
 '{"egfr_60_89":"full dose","egfr_45_59":"start 2.5mg, titrate slowly","egfr_30_44":"start 1.25mg, monitor K+, Cr closely","egfr_lt30":"use with extreme caution, nephrology review"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["cardiovascular","heart_failure","diabetes"]'::JSONB,
 ARRAY['Hyperkalemia', 'Bilateral RAS', 'Angioedema history', 'Pregnancy'],
 ARRAY['Spironolactone + Ramipril = HYPERKALEMIA (monitor K+)', 'NSAIDs (reduce benefit)', 'Potassium supplements'],
 'NLEM 2022. First-choice ACE inhibitor post-MI, heart failure, diabetic nephropathy. CRITICAL: Spironolactone + Ramipril → hyperkalemia especially if K+ already elevated.'),

-- Metoprolol succinate 25mg/50mg (beta-blocker)
('Metoprolol Succinate', 'Beta-blocker', 'Beta-1 selective', 'Metolar XR 25mg', ARRAY['Betaloc ZOK','Seloken ZOK'], 'Cipla / AstraZeneca India', '₹75/strip of 10 tabs', 75, TRUE, TRUE,
 '{"all_egfr":"full dose — hepatically metabolized"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["cardiovascular","heart_failure"]'::JSONB,
 ARRAY['Acute decompensated heart failure', 'Bradycardia < 50', 'Severe asthma', 'Cardiogenic shock'],
 ARRAY['Diltiazem/Verapamil (bradycardia)', 'Glimepiride/Insulin (mask hypoglycemia)', 'Amiodarone'],
 'NLEM 2022. Extended-release for HF. Proven mortality benefit in HF (MERIT-HF). Masks hypoglycemia symptoms — important for diabetic patients.'),

-- Carvedilol 12.5mg/25mg
('Carvedilol', 'Beta-blocker', 'Non-selective alpha+beta', 'Carloc 12.5mg', ARRAY['Carca','Cardivas'], 'Sun Pharma', '₹80/strip of 10 tabs', 80, TRUE, TRUE,
 '{"all_egfr":"full dose"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["cardiovascular","heart_failure"]'::JSONB,
 ARRAY['Acute decompensated HF', 'Severe bradycardia', 'Severe reactive airway disease'],
 ARRAY['Insulin (mask hypo + insulin resistance)', 'Amiodarone (bradycardia)', 'Diltiazem'],
 'NLEM 2022. Preferred beta-blocker in HFrEF. Also has alpha-blocking (vasodilation). Standard HF therapy.'),

-- Furosemide 40mg (loop diuretic)
('Furosemide', 'Loop diuretic', NULL, 'Lasix 40mg', ARRAY['Frusenex','Frusemide'], 'Sanofi India', '₹22/strip of 10 tabs', 22, TRUE, TRUE,
 '{"egfr_lt30":"higher doses may be needed for diuretic effect"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["cardiovascular","heart_failure"]'::JSONB,
 ARRAY['Anuria', 'Severe hypokalemia', 'Sulfonamide allergy (rare cross-sensitivity)'],
 ARRAY['Spironolactone (watch K+)', 'Ramipril (watch K+ and BP)', 'Digoxin (hypokalemia increases toxicity)'],
 'NLEM 2022. Standard HF diuretic. Decongestion. Watch electrolytes.'),

-- Spironolactone 25mg (MRA)
('Spironolactone', 'MRA (Mineralocorticoid Receptor Antagonist)', NULL, 'Aldactone 25mg', ARRAY['Spiromide','Lasilactone'], 'Pfizer India', '₹45/strip of 15 tabs', 45, TRUE, TRUE,
 '{"egfr_30_44":"use caution, monitor K+","egfr_lt30":"AVOID — dangerous hyperkalemia"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["cardiovascular","heart_failure"]'::JSONB,
 ARRAY['Hyperkalemia (K+ > 5.0)', 'eGFR < 30', 'Concurrent ACEi/ARB with K+ > 5.0'],
 ARRAY['Ramipril/ACEi = HYPERKALEMIA (CRITICAL)', 'NSAIDs (reduce effect + worsen renal function)', 'Potassium supplements'],
 'NLEM 2022. Proven HF mortality benefit (RALES). CRITICAL WARNING: Spironolactone + Ramipril → dangerous hyperkalemia. Patient 6 K+=5.1 → HIGH RISK.'),

-- Dabigatran 110mg/150mg (DOAC)
('Dabigatran', 'DOAC', 'Direct thrombin inhibitor', 'Pradaxa 110mg', ARRAY['Xabetran'], 'Boehringer Ingelheim', '₹2800/strip of 10 caps', 2800, TRUE, FALSE,
 '{"egfr_60_89":"150mg BD or 110mg BD","egfr_45_59":"110mg BD preferred","egfr_30_44":"110mg BD, monitor closely","egfr_lt30":"CONTRAINDICATED"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["cardiovascular"]'::JSONB,
 ARRAY['eGFR < 30', 'Active major bleeding', 'Mechanical heart valves', 'Moderate-severe mitral stenosis'],
 ARRAY['Aspirin + P2Y12 (triple therapy = high bleed)', 'P-gp inhibitors (increase levels)', 'Rifampicin (decrease levels)'],
 'NLEM 2022 addition. IHRS preferred DOAC for AF. Renal clearance 80% — avoid if eGFR < 30. Not for mechanical valves.'),

-- Rivaroxaban 15mg/20mg (DOAC)
('Rivaroxaban', 'DOAC', 'Factor Xa inhibitor', 'Xarelto 20mg', ARRAY['Rivaro','Reltavix'], 'Bayer India', '₹2100/strip of 10 tabs', 2100, FALSE, FALSE,
 '{"egfr_45_59":"15mg OD with evening meal","egfr_30_44":"15mg OD — use with caution","egfr_lt30":"AVOID"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["cardiovascular"]'::JSONB,
 ARRAY['eGFR < 30', 'Active bleeding', 'Mechanical heart valves'],
 ARRAY['Aspirin + ticagrelor (triple therapy — use for shortest duration)', 'Azole antifungals (increase levels)'],
 'Not NLEM. IHRS option for AF anticoagulation. Once daily (20mg with dinner for AF). Convenient dosing. Costly.'),

-- Apixaban 5mg (DOAC)
('Apixaban', 'DOAC', 'Factor Xa inhibitor', 'Eliquis 5mg', ARRAY['Apix','Apicoag'], 'Bristol-Myers Squibb / Pfizer India', '₹2400/strip of 20 tabs', 2400, FALSE, FALSE,
 '{"egfr_30_44":"use, possible dose reduction to 2.5mg BD if 2 criteria met","egfr_15_29":"use with caution"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["cardiovascular"]'::JSONB,
 ARRAY['Active bleeding', 'Mechanical heart valves'],
 ARRAY['Aspirin + ticagrelor (triple therapy)', 'CYP3A4 inhibitors'],
 'Not NLEM. Least renal clearance of DOACs (~27%) — preferred in CKD. BD dosing. Dose reduce: 2.5mg BD if ≥2 of: age ≥80, weight ≤60kg, Cr ≥1.5mg/dL.'),

-- Telmisartan 40mg/80mg (ARB)
('Telmisartan', 'ARB', 'RAAS blocker', 'Telsartan 40mg', ARRAY['Telma','Micardis'], 'Glenmark / Boehringer Ingelheim', '₹68/strip of 10 tabs', 68, TRUE, TRUE,
 '{"all_egfr":"full dose — hepatically cleared, safe in CKD"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["cardiovascular","diabetes"]'::JSONB,
 ARRAY['Hyperkalemia', 'Bilateral RAS', 'Pregnancy'],
 ARRAY['ACE inhibitor (avoid combination — dual RAAS block)', 'Potassium-sparing diuretics', 'NSAIDs'],
 'NLEM 2022. Preferred ARB in diabetic nephropathy + HTN. Hepatically cleared — safe across all CKD stages. Once daily.'),

-- Digoxin 0.25mg
('Digoxin', 'Cardiac glycoside', NULL, 'Lanoxin 0.25mg', ARRAY['Digoxin'], 'GSK India', '₹28/strip of 30 tabs', 28, TRUE, FALSE,
 '{"egfr_60_89":"0.25mg OD, monitor levels","egfr_45_59":"0.125mg OD","egfr_30_44":"0.125mg alternate day, monitor closely","egfr_lt30":"AVOID or extreme caution, toxicity risk"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["cardiovascular","heart_failure"]'::JSONB,
 ARRAY['WPW syndrome', 'Heart block', 'Hypokalemia (increases toxicity)'],
 ARRAY['Furosemide (hypokalemia → digoxin toxicity)', 'Amiodarone (doubles digoxin levels)', 'Ticagrelor (may increase levels)'],
 'NLEM 2022. Rate control in AF with HF. Narrow therapeutic window. Watch K+ levels — hypokalemia from furosemide → digoxin toxicity.'),

-- Amiodarone 200mg
('Amiodarone', 'Antiarrhythmic', 'Class III', 'Cordarone 200mg', ARRAY['Tachyra','Amiodar'], 'Sanofi India', '₹120/strip of 10 tabs', 120, TRUE, FALSE,
 '{"all_egfr":"full dose — minimal renal excretion"}'::JSONB,
 TRUE, 'neutral', 'low',
 '["cardiovascular"]'::JSONB,
 ARRAY['Thyroid disease', 'Pulmonary fibrosis', 'Severe bradycardia'],
 ARRAY['Warfarin (doubles INR — CRITICAL)', 'Digoxin (doubles levels)', 'Beta-blockers (bradycardia)', 'Statins (myopathy risk)'],
 'NLEM 2022. Cardioversion of AF/VT. Multiple interactions. Long half-life (40-55 days). Monitor TFT, LFT, PFT, eye exam annually.');

-- ============================================================
-- DRUG INTERACTIONS — 20+ pairs including cross-condition
-- ============================================================

INSERT INTO drug_interactions (drug_a_name, drug_b_name, severity, mechanism, clinical_effect, management, condition_tags, evidence_level) VALUES

-- Critical cross-condition interactions
('Spironolactone', 'Ramipril', 'severe', 'Both increase potassium retention — additive hyperkalemia', 'Dangerous hyperkalemia (K+ can rise > 6.0 mEq/L) — arrhythmia and cardiac arrest risk. ESPECIALLY DANGEROUS if baseline K+ already ≥ 5.0', 'Monitor K+ and Cr at baseline, 1 week, 1 month, then every 3 months. If K+ > 5.5 mEq/L reduce/stop spironolactone. If K+ > 6.0 mEq/L STOP BOTH immediately.', '["diabetes","heart_failure","cardiovascular"]'::JSONB, 'A'),

('Glimepiride', 'Metoprolol', 'moderate', 'Beta-blockers mask adrenergic symptoms of hypoglycemia (tachycardia, tremor)', 'Hypoglycemia may be prolonged and unrecognized. Sweating (cholinergic) is NOT masked — only warning remaining', 'Counsel patient to monitor glucose more frequently. Prefer cardioselective beta-blockers (metoprolol). Avoid non-selective (propranolol) if on SU.', '["diabetes","cardiovascular"]'::JSONB, 'B'),

('Pioglitazone', 'Furosemide', 'moderate', 'Pioglitazone causes Na+/water retention; furosemide is diuretic — competing effects + worsened HF risk', 'Fluid retention, edema, worsening heart failure. Pioglitazone fluid retention can overwhelm diuretic therapy', 'AVOID pioglitazone in any patient with heart failure or on high-dose diuretics for HF. Use SGLT2i instead.', '["diabetes","heart_failure"]'::JSONB, 'A'),

('Ticagrelor', 'Aspirin', 'moderate', 'Dual antiplatelet therapy (DAPT) — additive platelet inhibition', 'Increased bleeding risk (GI, intracranial). Required post-ACS/PCI for 12 months. CSI: do not exceed aspirin 100mg with ticagrelor', 'DAPT is necessary post-ACS/DES. Co-prescribe PPI (pantoprazole preferred). Avoid NSAIDs. Reassess DAPT duration at 12 months.', '["cardiovascular"]'::JSONB, 'A'),

('Aspirin', 'Dabigatran', 'severe', 'Triple therapy when P2Y12 also present — three antiplatelet/anticoagulant drugs', 'Major bleeding risk increased 3-4x. Required short-term post-ACS + new AF. CSI/IHRS: minimize triple therapy duration', 'Triple therapy for minimum necessary duration (1-4 weeks then drop aspirin). Use PPI. Monitor for any bleeding signs. IHRS 2023: prefer dual therapy (P2Y12 + DOAC) over triple.', '["cardiovascular"]'::JSONB, 'A'),

('Metformin', 'Ramipril', 'mild', 'ACE inhibitors may increase insulin sensitivity slightly', 'Mild glucose-lowering additive effect — rarely clinically significant', 'Monitor for any signs of hypoglycemia if on higher doses. Generally safe and beneficial combination.', '["diabetes","cardiovascular"]'::JSONB, 'C'),

('Glimepiride', 'Fluconazole', 'severe', 'CYP2C9 inhibition increases glimepiride plasma levels', 'Severe prolonged hypoglycemia', 'Avoid combination or monitor glucose hourly if antifungal essential. Consider dose reduction of glimepiride. Prefer topical antifungal if possible.', '["diabetes"]'::JSONB, 'B'),

('Atorvastatin', 'Clarithromycin', 'severe', 'CYP3A4 inhibition raises atorvastatin levels', 'Myopathy, rhabdomyolysis risk', 'Temporarily STOP atorvastatin during clarithromycin course. Resume after antibiotic complete.', '["cardiovascular","diabetes"]'::JSONB, 'B'),

('Amiodarone', 'Digoxin', 'severe', 'Amiodarone inhibits P-gp, increases digoxin levels approximately 2x', 'Digoxin toxicity — nausea, bradycardia, heart block, VT', 'Reduce digoxin dose by 50% when starting amiodarone. Monitor digoxin levels closely.', '["cardiovascular"]'::JSONB, 'A'),

('Amiodarone', 'Metoprolol', 'moderate', 'Additive negative chronotropic and dromotropic effects', 'Profound bradycardia, heart block', 'Monitor HR and PR interval. Reduce metoprolol dose. Avoid in sick sinus syndrome.', '["cardiovascular"]'::JSONB, 'B'),

('Furosemide', 'Digoxin', 'moderate', 'Furosemide causes hypokalemia; hypokalemia increases digoxin-myocyte binding', 'Digoxin toxicity at "normal" levels — nausea, arrhythmia', 'Monitor K+ when both used. Keep K+ > 3.5 mEq/L. Consider K+ supplementation or spironolactone.', '["cardiovascular","heart_failure"]'::JSONB, 'A'),

('Empagliflozin', 'Furosemide', 'mild', 'Both cause diuresis/volume depletion — additive', 'Dehydration, hypotension, dizziness — especially in elderly', 'Counsel about fluid intake. Monitor BP. Reduce furosemide dose if needed when starting SGLT2i.', '["diabetes","heart_failure"]'::JSONB, 'B'),

('Telmisartan', 'Spironolactone', 'moderate', 'Both increase potassium — additive hyperkalemia', 'Hyperkalemia risk (less severe than ACEi + MRA but significant)', 'Monitor K+ 1-2 weeks after starting. Avoid if baseline K+ > 5.0', '["cardiovascular","heart_failure"]'::JSONB, 'B'),

('Ticagrelor', 'Digoxin', 'mild', 'Ticagrelor is P-gp inhibitor — may increase digoxin levels', 'Digoxin toxicity at lower levels', 'Monitor digoxin levels when starting ticagrelor. May need dose reduction.', '["cardiovascular"]'::JSONB, 'B'),

('Metformin', 'IV Contrast', 'severe', 'Contrast-induced nephropathy reduces eGFR; metformin accumulates → lactic acidosis', 'Potentially fatal lactic acidosis', 'HOLD metformin 48h before IV contrast. Resume 48h after only if Cr stable. MANDATORY protocol.', '["diabetes"]'::JSONB, 'A'),

('Glimepiride', 'Carvedilol', 'moderate', 'Non-selective beta-blockade masks hypoglycemia symptoms including palpitations', 'Undetected prolonged hypoglycemia', 'Monitor glucose more frequently. Sweating (cholinergic) still present as warning. Educate patient.', '["diabetes","cardiovascular","heart_failure"]'::JSONB, 'B'),

('Insulin Glargine', 'Ramipril', 'mild', 'ACE inhibitors may enhance insulin sensitivity', 'Increased hypoglycemia risk', 'Monitor glucose. May need insulin dose reduction. Generally a beneficial combination.', '["diabetes","cardiovascular"]'::JSONB, 'C'),

('Atorvastatin', 'Metformin', 'mild', 'No direct PK interaction', 'Statins may minimally impair glucose tolerance in some patients', 'Benefit of statin far exceeds this minimal risk. Continue both. Monitor HbA1c routinely.', '["diabetes","cardiovascular"]'::JSONB, 'B'),

('Clopidogrel', 'Omeprazole', 'moderate', 'Omeprazole inhibits CYP2C19 reducing clopidogrel activation to active metabolite', 'Reduced antiplatelet effect — increased cardiovascular events risk', 'Use PANTOPRAZOLE (not omeprazole) as PPI with clopidogrel. Safe combination.', '["cardiovascular"]'::JSONB, 'A'),

('Spironolactone', 'Teneligliptin', 'mild', 'No significant pharmacokinetic interaction', 'No significant interaction — can be co-prescribed safely', 'Safe combination. Teneligliptin is preferred DPP4i in HF patients on spironolactone.', '["diabetes","heart_failure"]'::JSONB, 'C'),

('Empagliflozin', 'Ramipril', 'mild', 'Both may lower BP — additive hypotension, both renoprotective', 'Additive BP lowering. Can cause orthostatic hypotension. Both beneficial for diabetic nephropathy', 'Excellent combination for DM+HF+CKD. Monitor BP. Start SGLT2i at lower dose if on ACEi.', '["diabetes","cardiovascular","heart_failure"]'::JSONB, 'A'),

('Pioglitazone', 'Carvedilol', 'moderate', 'Both cause fluid retention; pioglitazone worsens HF', 'Additive fluid retention, cardiac decompensation', 'CONTRAINDICATION: Do not use pioglitazone with carvedilol in heart failure patients. Use SGLT2i instead.', '["diabetes","heart_failure"]'::JSONB, 'A');

-- ============================================================
-- INDIAN GUIDELINES — RSSDI (Diabetes)
-- ============================================================

INSERT INTO indian_guidelines (source_id, guideline_year, condition, section, recommendation, evidence_level, class_of_rec, condition_tags, clinical_context) VALUES

-- RSSDI 2022 Guidelines
('RSSDI', 2022, 'T2DM', 'HbA1c Targets — General', 'For most non-elderly adults with T2DM, HbA1c target should be ≤ 7.0%. Individualize based on age, comorbidities, hypoglycemia risk, and patient preference.', 'A', 'Class I', '["diabetes"]'::JSONB, 'General target for adults without major comorbidities'),

('RSSDI', 2022, 'T2DM', 'HbA1c Targets — Elderly', 'For elderly patients (≥65 years) with T2DM and multiple comorbidities or limited life expectancy, a relaxed target of HbA1c 7.5-8.0% is recommended to minimize hypoglycemia risk and preserve quality of life.', 'B', 'Class I', '["diabetes"]'::JSONB, 'Age > 65 with comorbidities or functional limitations'),

('RSSDI', 2022, 'T2DM', 'First-line therapy', 'Metformin remains the first-line oral agent for T2DM in India unless contraindicated. Start at 500mg BD with meals and titrate to 1g BD over 4-8 weeks. Check eGFR before starting.', 'A', 'Class I', '["diabetes"]'::JSONB, 'Newly diagnosed T2DM, eGFR > 45'),

('RSSDI', 2022, 'T2DM', 'Second-line therapy — DPP4i', 'Teneligliptin 20mg OD is the preferred DPP4 inhibitor in India due to its efficacy equivalent to sitagliptin at approximately 25% of the cost. It can be used safely across all stages of CKD without dose adjustment — a significant advantage in the Indian population where CKD co-prevalence is high.', 'A', 'Class I', '["diabetes"]'::JSONB, 'Second-line after metformin, or metformin-intolerant, any CKD stage'),

('RSSDI', 2022, 'T2DM', 'Second-line therapy — SGLT2i', 'SGLT2 inhibitors (empagliflozin or dapagliflozin) are preferred as add-on therapy in patients with T2DM and established cardiovascular disease, heart failure, or CKD stages 1-3 for cardioprotection beyond glucose lowering. RSSDI endorses SGLT2i as a disease-modifying drug, not merely glucose-lowering.', 'A', 'Class I', '["diabetes","cardiovascular","heart_failure"]'::JSONB, 'T2DM with ASCVD, HF with EF ≤ 40%, or CKD stages 1-3'),

('RSSDI', 2022, 'T2DM', 'CKD and Diabetes — Metformin', 'Metformin can be continued in T2DM with CKD stage 3a (eGFR 45-59): reduce to 500mg BD. For CKD stage 3b (eGFR 30-44): 500mg once daily, use with caution. STOP metformin when eGFR < 30 (CKD Stage 4-5) — risk of lactic acidosis.', 'A', 'Class I', '["diabetes"]'::JSONB, 'T2DM with CKD — guides metformin use'),

('RSSDI', 2022, 'T2DM', 'CKD and Diabetes — Sulfonylureas', 'Glimepiride should be AVOIDED in eGFR < 30 (CKD Stage 4-5) due to accumulation of active metabolites causing prolonged severe hypoglycemia. Use with extreme caution in eGFR 30-44. Teneligliptin (DPP4i) preferred over glimepiride in any stage of CKD.', 'A', 'Class I', '["diabetes"]'::JSONB, 'Sulfonylurea safety in CKD patients'),

('RSSDI', 2022, 'T2DM', 'Insulin therapy — Indications', 'Insulin should be initiated when: HbA1c > 9% with symptoms, HbA1c > 10% in newly diagnosed, failure of 2-drug OAD combination, CKD Stage 4-5 (eGFR < 30) where most OADs are contraindicated, or acute illness requiring hospitalization. Insulin Glargine (Basalog/Lantus) preferred as basal insulin — once daily, predictable, low hypoglycemia risk.', 'A', 'Class I', '["diabetes"]'::JSONB, 'Criteria for insulin initiation in T2DM'),

('RSSDI', 2022, 'T2DM', 'Obesity and T2DM — Drug Choice', 'In obese T2DM patients (BMI ≥ 27.5 kg/m², Indian criteria), SGLT2i and GLP-1 RA are preferred for weight loss benefit. Metformin is weight-neutral. Pioglitazone and sulfonylureas cause weight gain — avoid as first choice in obese patients. For cost-constrained obese patients: Metformin + Teneligliptin is preferred combination.', 'A', 'Class I', '["diabetes"]'::JSONB, 'T2DM with obesity (BMI ≥ 27.5 by Indian criteria)'),

('RSSDI', 2022, 'T2DM', 'NAFLD and T2DM', 'Pioglitazone is beneficial in T2DM with NAFLD/NASH — reduces hepatic steatosis and inflammation. However, CONTRAINDICATED if heart failure present. For T2DM + NAFLD without HF: Pioglitazone 15mg OD is cost-effective (NLEM, ₹120/strip). For T2DM + NAFLD + HF: use SGLT2i instead.', 'B', 'Class IIa', '["diabetes"]'::JSONB, 'T2DM with NAFLD (fatty liver)'),

('RSSDI', 2022, 'T2DM', 'Diabetes + Heart Failure — Drug Safety', 'Pioglitazone is ABSOLUTELY CONTRAINDICATED in T2DM with heart failure — causes sodium and water retention, precipitating cardiac decompensation. SGLT2 inhibitors (empagliflozin, dapagliflozin) are the agents of choice in T2DM + HF — proven to reduce hospitalizations for HF by 25-35%.', 'A', 'Class I', '["diabetes","heart_failure"]'::JSONB, 'T2DM concurrent with heart failure'),

('RSSDI', 2022, 'T2DM', 'Sulfonamide allergy and diabetes drugs', 'Patients with sulfonamide allergy (which includes sulfonyl-containing drugs) may have cross-reactivity with sulfonylureas. Glimepiride, glipizide, glibenclamide share the sulfonylurea chemical structure. If documented sulfonamide allergy: AVOID all sulfonylureas. Preferred alternatives: Teneligliptin (DPP4i), Metformin, or SGLT2i.', 'C', 'Class I', '["diabetes"]'::JSONB, 'T2DM with documented sulfonamide allergy'),

('RSSDI', 2022, 'T2DM', 'South Indian Diet Counseling', 'South Indian diets are high in refined carbohydrates (white rice, idli, dosa, maida-based snacks) and low in protein. RSSDI recommends dietary modification: replace white rice with brown/parboiled rice or millets (ragi, bajra), increase protein intake (pulses, legumes, fish), reduce portion size of carbohydrate staples. Refer to qualified dietitian familiar with regional dietary patterns.', 'B', 'Class I', '["diabetes"]'::JSONB, 'All T2DM patients — diet counseling specific to South India'),

('RSSDI', 2022, 'T2DM', 'Cost-effective management for uninsured patients', 'For uninsured or economically constrained patients with T2DM in India: First-line Metformin (₹30/month, NLEM, Jan Aushadhi). Second-line Teneligliptin (₹199/strip, NLEM 2022). Pioglitazone (₹120/strip, NLEM) for add-on if NAFLD without HF. Glimepiride (₹68/strip, NLEM) only if cost is the primary constraint and eGFR > 45. Jan Aushadhi stores (Pradhan Mantri Bhartiya Janaushadhi Pariyojana) offer generic medicines at 50-90% lower prices.', 'C', 'Class I', '["diabetes"]'::JSONB, 'Low-income uninsured patients — economic prescribing'),

('RSSDI', 2022, 'T2DM', 'HbA1c Targets — Diabetes + HF', 'In T2DM with heart failure, RSSDI recommends a slightly relaxed HbA1c target of 7.0-8.0% to avoid hypoglycemia (hypoglycemia in HF patients increases risk of cardiac arrhythmias and sudden death). Avoid agents causing hypoglycemia (sulfonylureas) in HF patients. SGLT2i reduces HbA1c with very low hypoglycemia risk.', 'B', 'Class IIa', '["diabetes","heart_failure"]'::JSONB, 'T2DM with concurrent heart failure'),

-- ============================================================
-- GUIDELINES — CSI (Cardiovascular)
-- ============================================================

('CSI', 2022, 'STEMI', 'Reperfusion — Primary PCI', 'Primary PCI is the preferred reperfusion strategy for STEMI when available within 120 minutes of first medical contact (FMC-to-balloon ≤ 120 min). In India, primary PCI should be the default at PCI-capable hospitals. TIME IS MUSCLE — every 30-minute delay increases mortality by 7.5%.', 'A', 'Class I', '["cardiovascular"]'::JSONB, 'STEMI within 12 hours, PCI-capable hospital available'),

('CSI', 2022, 'STEMI', 'Reperfusion — Thrombolysis', 'When primary PCI cannot be achieved within 120 minutes of FMC, pharmacological thrombolysis should be administered within 30 minutes of hospital arrival (door-to-needle ≤ 30 min). In India, Streptokinase (₹5,000-8,000) or Tenecteplase (₹28,000) — choice depends on prior exposure and cost. CSI: Tenecteplase preferred if streptokinase previously used (antibodies).', 'A', 'Class I', '["cardiovascular"]'::JSONB, 'STEMI when PCI not achievable within 120 minutes'),

('CSI', 2022, 'STEMI', 'Antiplatelet — Loading dose', 'All STEMI patients should receive dual antiplatelet therapy (DAPT): Aspirin 325mg loading dose STAT (then 75mg OD maintenance) + Ticagrelor 180mg loading dose (then 90mg BD). If ticagrelor unavailable or contraindicated: Clopidogrel 600mg loading (then 75mg OD). CSI: Ticagrelor superior to clopidogrel in STEMI (PLATO trial).', 'A', 'Class I', '["cardiovascular"]'::JSONB, 'Acute STEMI — antiplatelet protocol'),

('CSI', 2022, 'STEMI', 'Acute STEMI — Time-stamped protocol', 'MINUTE 0 (arrival): ECG within 10 min, troponin, IV access, O2 if SpO2 < 94%, pain relief (morphine 2-4mg IV). MINUTE 5: Aspirin 325mg + Ticagrelor 180mg (or clopidogrel 600mg). MINUTE 10: Decision — PCI or thrombolysis. Alert cath lab if PCI. MINUTE 30 (if no PCI): Thrombolytic + LMWH/UFH anticoagulation. Continuous monitoring CCU.', 'A', 'Class I', '["cardiovascular"]'::JSONB, 'Acute STEMI management timeline'),

('CSI', 2022, 'STEMI', 'Anticoagulation in STEMI', 'Anticoagulation in STEMI with primary PCI: Unfractionated Heparin (UFH) 70-100 IU/kg IV bolus. With thrombolysis: Enoxaparin preferred over UFH (NLEM — Clexane 60mg SC). Do not combine thrombolytics with ticagrelor — use clopidogrel 300mg loading with thrombolysis.', 'A', 'Class I', '["cardiovascular"]'::JSONB, 'Anticoagulation during STEMI reperfusion'),

('CSI', 2022, 'STEMI', 'Penicillin allergy and STEMI', 'Penicillin allergy does NOT affect standard STEMI management (aspirin, ticagrelor, heparin, statins are not penicillin-related). However if antibiotics required during admission (e.g. prophylactic, secondary infection): use non-beta-lactam antibiotics. Document allergy prominently. Clarify if anaphylaxis vs. mild rash — anaphylaxis requires absolute avoidance of all penicillins and cephalosporins.', 'C', 'Class I', '["cardiovascular"]'::JSONB, 'STEMI patient with documented penicillin allergy'),

('CSI', 2022, 'AF', 'Anticoagulation — CHA₂DS₂-VASc', 'CHA₂DS₂-VASc score ≥ 2 in males or ≥ 3 in females: ORAL ANTICOAGULATION RECOMMENDED. Score 1 (male) or 2 (female): consider anticoagulation. Score 0 (male) or 1 (female): anticoagulation NOT recommended. IHRS 2023: Prefer DOAC over warfarin for non-valvular AF. Dabigatran (NLEM 2022), rivaroxaban, or apixaban based on renal function.', 'A', 'Class I', '["cardiovascular"]'::JSONB, 'Atrial fibrillation — stroke risk assessment and anticoagulation'),

('CSI', 2023, 'AF', 'Triple therapy — Post-ACS + AF', 'Triple therapy (aspirin + P2Y12 inhibitor + anticoagulant) carries high bleeding risk. CSI/IHRS recommend: After ACS/PCI with AF requiring anticoagulation: triple therapy for minimum duration (1-4 weeks post-PCI), then drop aspirin → dual therapy (P2Y12 + DOAC) for 12 months, then DOAC alone. Use PPI throughout. Prefer rivaroxaban 15mg OD or apixaban 5mg BD over warfarin in AF post-ACS.', 'A', 'Class IIa', '["cardiovascular"]'::JSONB, 'Post-ACS/PCI patient who now needs AF anticoagulation'),

('CSI', 2022, 'Heart Failure', 'HFrEF Foundation Therapy', 'Evidence-based quadruple therapy for HFrEF (EF ≤ 40%): 1) ACE inhibitor/ARB (Ramipril/Telmisartan) 2) Beta-blocker (Carvedilol or Metoprolol succinate) 3) MRA (Spironolactone 25mg) 4) SGLT2i (Empagliflozin or Dapagliflozin — dual benefit in T2DM+HF). All four proven to reduce mortality. Initiate and uptitrate as BP/HR tolerates.', 'A', 'Class I', '["cardiovascular","heart_failure","diabetes"]'::JSONB, 'Heart failure with reduced EF ≤ 40%'),

('CSI', 2022, 'Heart Failure', 'HF + Hyperkalemia Management', 'Hyperkalemia (K+ > 5.0 mEq/L) is common with RAASi + MRA in HF. If K+ 5.0-5.4: reduce spironolactone to 12.5mg, review ACEi dose, dietary K+ restriction. If K+ 5.5-5.9: HOLD spironolactone, continue ACEi at reduced dose, urgent dietary review. If K+ ≥ 6.0: HOLD spironolactone AND ACEi, emergency management. K+ 5.1 (Patient 6) + Spironolactone + Ramipril = HIGH RISK → close monitoring mandatory.', 'A', 'Class I', '["cardiovascular","heart_failure"]'::JSONB, 'HF patient on RAASi + MRA with rising potassium'),

('CSI', 2022, 'Cardiovascular', 'Statin therapy post-ACS', 'High-intensity statin therapy (Atorvastatin 80mg OD or Rosuvastatin 40mg OD) should be initiated in ALL post-ACS patients regardless of baseline LDL. Target LDL < 55 mg/dL for very high risk (post-ACS). Continue indefinitely. CSI: Do not interrupt statin therapy — statin withdrawal post-ACS is associated with worse outcomes.', 'A', 'Class I', '["cardiovascular"]'::JSONB, 'Post-ACS statin therapy'),

-- ============================================================
-- OVERLAP GUIDELINES — Diabetes + Cardiovascular
-- ============================================================

('RSSDI', 2022, 'T2DM+Heart Failure', 'SGLT2i in Diabetes + HF', 'SGLT2 inhibitors (empagliflozin, dapagliflozin) provide DUAL BENEFIT in T2DM + HF: both glucose lowering AND reduction in HF hospitalizations (35% reduction, EMPEROR trial). RSSDI strongly recommends SGLT2i as preferred diabetes drug in T2DM + HFrEF. Continue even if eGFR 30-60 (HF/CV benefit preserved).', 'A', 'Class I', '["diabetes","heart_failure","cardiovascular"]'::JSONB, 'T2DM + HFrEF — SGLT2i as dual-purpose therapy'),

('RSSDI', 2022, 'T2DM+Heart Failure', 'Drugs to AVOID in T2DM + HF', 'The following are CONTRAINDICATED or SHOULD BE AVOIDED in T2DM + Heart Failure: 1) PIOGLITAZONE — absolute contraindication (sodium retention, edema, HF exacerbation). 2) SAXAGLIPTIN — associated with increased HF hospitalizations (SAVOR-TIMI trial). 3) GLIMEPIRIDE/Sulfonylureas — hypoglycemia triggers cardiac arrhythmias; increased mortality risk in HF. Preferred: SGLT2i + Metformin (if eGFR permits) + Teneligliptin (or Sitagliptin — cardiovascular neutral).', 'A', 'Class I', '["diabetes","heart_failure"]'::JSONB, 'Drugs to avoid in concurrent T2DM and heart failure'),

('CSI', 2022, 'T2DM+Heart Failure', 'Glucose targets in HF + DM', 'In T2DM with heart failure, avoid aggressive glucose lowering. Target HbA1c 7.0-8.0%. Hypoglycemia in HF precipitates arrhythmias and acute cardiac events. Use drugs with low hypoglycemia risk: SGLT2i (very low risk), DPP4i/Teneligliptin (very low risk), Metformin (low risk). Avoid sulfonylureas and high insulin doses that may cause hypoglycemia.', 'B', 'Class IIa', '["diabetes","heart_failure","cardiovascular"]'::JSONB, 'Blood glucose targets in HF + DM overlap patient');

-- ============================================================
-- HOSPITAL CONTACTS — Apollo Chennai
-- ============================================================

INSERT INTO hospital_contacts (department, role, name, extension, notes, available, condition_tags) VALUES
('Endocrinology', 'Diabetes Educator', 'Sister Lakshmi', '3345', 'Hindi/Tamil/English speaking. Provides structured diabetes education, SMBG training, insulin technique instruction.', 'Mon-Sat 9AM-5PM', '["diabetes"]'::JSONB),
('Endocrinology', 'Dietitian', 'Ms. Priya Raman', '3350', 'South Indian diet specialist. Expert in carbohydrate counting with regional foods (idli, dosa, rice). Glycemic index counseling.', 'Mon-Fri 9AM-4PM', '["diabetes"]'::JSONB),
('Endocrinology', 'Podiatrist', 'Dr. Suresh', '3360', 'Diabetic foot examination, monofilament testing, wound care.', 'Mon/Wed/Fri', '["diabetes"]'::JSONB),
('Ophthalmology', 'Retinal Specialist', 'Dr. Iyer', '4410', 'Diabetic retinopathy screening and management. Fundus photography. Laser treatment.', 'Tue/Thu/Sat', '["diabetes"]'::JSONB),
('Nephrology', 'Nephrologist', 'Dr. Ramachandran', '4420', 'CKD management in diabetic nephropathy. Dialysis planning. ACR monitoring.', 'Mon-Fri', '["diabetes","cardiovascular","heart_failure"]'::JSONB),
('Cardiology', 'Interventional Cardiologist', 'Dr. Venkat', '4455', 'Cath lab director. Primary PCI, STEMI management, coronary angiography.', '24x7 on-call', '["cardiovascular"]'::JSONB),
('Cardiology', 'Electrophysiologist', 'Dr. Anand', '4460', 'Atrial fibrillation management, ablation, device implantation (pacemakers, ICD).', 'Mon-Fri + on-call', '["cardiovascular"]'::JSONB),
('Cardiology', 'Heart Failure Specialist', 'Dr. Meena', '4465', 'Advanced HF management, device optimization, palliative HF care.', 'Tue/Thu 10AM-3PM', '["cardiovascular","heart_failure"]'::JSONB),
('Cardiology', 'Cardiac Rehab', 'Sister Priya', '4470', 'Post-MI/post-HF exercise rehabilitation program.', 'Mon-Sat', '["cardiovascular","heart_failure"]'::JSONB),
('Cardiology', 'CCU Nurse Station', NULL, '3322', 'Coronary Care Unit — 24/7 monitoring. STEMI Code activation.', '24x7', '["cardiovascular"]'::JSONB),
('Blood Bank', 'Blood Bank', NULL, '5001', 'O-negative blood available (2 units standby). Cross-match results in 45 min.', '24x7', '["cardiovascular"]'::JSONB),
('Pharmacy', 'Hospital Pharmacy', NULL, '2200', 'Main pharmacy. Formulary queries, drug availability, generic substitution.', '24x7', '["diabetes","cardiovascular","heart_failure"]'::JSONB);

-- ============================================================
-- PATIENTS — 6 Demo Profiles
-- ============================================================

INSERT INTO patients (patient_code, display_name, scenario_label, age, gender, bmi, conditions, current_medications, allergies, labs, vitals, insurance, income_context, condition_tags) VALUES

('P1', 'Failing Metformin — 48M', 'Second-line drug selection', 48, 'M', 31.1,
 ARRAY['T2DM (3yr)', 'Hypertension (1yr)'],
 '[{"name":"Metformin","dose":"1g","frequency":"BD"},{"name":"Telmisartan","dose":"40mg","frequency":"OD"}]'::JSONB,
 '[{"drug":"Sulfonamide","reaction":"rash","severity":"moderate"}]'::JSONB,
 '{"hba1c":8.4,"fbs":168,"creatinine":0.9,"egfr":92,"total_cholesterol":220,"ldl":142,"hdl":38,"tg":280}'::JSONB,
 '{"bp":"134/86","hr":78,"spo2":null}'::JSONB,
 '{"provider":"Star Health Gold","monthly_cap_inr":5000,"notes":"Generic drugs covered. Branded drugs need pre-authorization. ₹5K/month cap."}'::JSONB,
 'middle_class_salaried',
 '["diabetes"]'::JSONB),

('P2', 'Complex T2DM + CKD — 62F', 'Insulin transition with CKD 3b', 62, 'F', 27.2,
 ARRAY['T2DM (12yr)', 'CKD Stage 3b', 'Hypertension', 'Proliferative Retinopathy', 'Diabetic Neuropathy'],
 '[{"name":"Metformin","dose":"500mg","frequency":"BD"},{"name":"Glimepiride","dose":"2mg","frequency":"OD"},{"name":"Atorvastatin","dose":"20mg","frequency":"HS"},{"name":"Telmisartan","dose":"80mg","frequency":"OD"},{"name":"Aspirin","dose":"75mg","frequency":"OD"},{"name":"Pregabalin","dose":"75mg","frequency":"BD"}]'::JSONB,
 '[{"drug":"None","reaction":"NKDA","severity":"none"}]'::JSONB,
 '{"hba1c":9.2,"creatinine":1.8,"egfr":32,"k":4.9,"urine_acr":380}'::JSONB,
 '{"bp":null,"hr":null}'::JSONB,
 '{"provider":"New India Assurance","total_cap_inr":300000,"notes":"₹3L annual cap, mostly exhausted. Very limited insurance remaining."}'::JSONB,
 'retired_elderly',
 '["diabetes"]'::JSONB),

('P3', 'Auto-Driver — 34M', 'Cost-conscious management', 34, 'M', 35.3,
 ARRAY['T2DM (2 months, newly diagnosed)', 'Obesity Class 2', 'NAFLD (fatty liver)'],
 '[{"name":"Metformin","dose":"500mg","frequency":"BD","notes":"just started"}]'::JSONB,
 '[{"drug":"None","reaction":"NKDA","severity":"none"}]'::JSONB,
 '{"hba1c":8.8,"fbs":186,"alt":68,"creatinine":0.8,"egfr":108,"tg":320,"hdl":32}'::JSONB,
 '{"bp":null,"hr":null}'::JSONB,
 '{"provider":"None","monthly_cap_inr":0,"notes":"NO insurance. Auto-rickshaw driver. Daily wage ₹800-1000/day. Cost is PRIMARY deciding factor."}'::JSONB,
 'daily_wage_worker',
 '["diabetes"]'::JSONB),

('P4', 'Acute STEMI — 52M', 'Emergency STEMI management', 52, 'M', 26.8,
 ARRAY['Acute STEMI (anterior, V1-V4)', 'Smoker 20 pack-years', 'Family history: father MI at 50'],
 '[]'::JSONB,
 '[{"drug":"Penicillin","reaction":"ANAPHYLAXIS","severity":"severe","year":2020}]'::JSONB,
 '{"troponin":12.4,"creatinine":1.0,"egfr":84,"k":4.2,"glucose":142}'::JSONB,
 '{"bp":"95/62","hr":108,"spo2":93,"rr":24,"ecg":"ST elevation V1-V4 anterior STEMI"}'::JSONB,
 '{"provider":"ESI (Employee State Insurance)","notes":"Covers emergency treatment fully."}'::JSONB,
 'working_class',
 '["cardiovascular"]'::JSONB),

('P5', 'Post-MI + New AF — 66M', 'Triple therapy dilemma', 66, 'M', 28.4,
 ARRAY['Anterior MI 3 months ago (DES to LAD)', 'T2DM', 'Hypertension', 'Newly detected Atrial Fibrillation'],
 '[{"name":"Aspirin","dose":"75mg","frequency":"OD"},{"name":"Ticagrelor","dose":"90mg","frequency":"BD"},{"name":"Atorvastatin","dose":"80mg","frequency":"OD"},{"name":"Ramipril","dose":"5mg","frequency":"OD"},{"name":"Metoprolol","dose":"25mg","frequency":"BD"},{"name":"Metformin","dose":"1g","frequency":"BD"}]'::JSONB,
 '[{"drug":"None","reaction":"NKDA","severity":"none"}]'::JSONB,
 '{"hba1c":7.4,"creatinine":1.1,"egfr":68,"k":4.4}'::JSONB,
 '{"bp":"128/78","hr":88,"rhythm":"irregularly irregular"}'::JSONB,
 '{"provider":"CGHS (Central Government Health Scheme)","notes":"Covers most drugs. Good coverage."}'::JSONB,
 'retired_government',
 '["cardiovascular","diabetes"]'::JSONB),

('P6', 'Diabetes + Heart Failure — 58F', 'Overlap: T2DM + HFrEF + CKD', 58, 'F', 30.2,
 ARRAY['T2DM (8yr)', 'Heart Failure (EF 30%, HFrEF)', 'Hypertension', 'CKD Stage 3a'],
 '[{"name":"Metformin","dose":"500mg","frequency":"BD"},{"name":"Glimepiride","dose":"1mg","frequency":"OD"},{"name":"Ramipril","dose":"10mg","frequency":"OD"},{"name":"Carvedilol","dose":"12.5mg","frequency":"BD"},{"name":"Furosemide","dose":"40mg","frequency":"BD"},{"name":"Spironolactone","dose":"25mg","frequency":"OD"},{"name":"Atorvastatin","dose":"40mg","frequency":"HS"}]'::JSONB,
 '[{"drug":"None","reaction":"NKDA","severity":"none"}]'::JSONB,
 '{"hba1c":8.6,"creatinine":1.4,"egfr":48,"k":5.1,"bnp":850,"na":134}'::JSONB,
 '{"bp":"110/68","hr":72,"spo2":94}'::JSONB,
 '{"provider":"Star Health","monthly_cap_inr":5000,"notes":"₹5K/month cap. Generic drugs preferred."}'::JSONB,
 'middle_class',
 '["diabetes","cardiovascular","heart_failure"]'::JSONB);

-- ============================================================
-- HOSPITAL FORMULARY — Apollo Chennai
-- ============================================================

INSERT INTO hospital_formulary (drug_name, in_stock, stock_level, pharmacy_notes, department, formulary_tier)
SELECT
  g.drug_name, g.in_stock, g.stock_level, g.pharmacy_notes, g.department, g.formulary_tier
FROM (VALUES
  ('Metformin', true, 'adequate', 'Generic 500mg and 1000mg available. Glycomet brand stocked.', 'Pharmacy', 'tier1_generic'),
  ('Teneligliptin', true, 'adequate', 'Teneza 20mg and Teneza-M (with metformin) stocked. NLEM drug.', 'Pharmacy', 'tier1_generic'),
  ('Glimepiride', true, 'adequate', 'Amaryl 1mg, 2mg. Generic also available.', 'Pharmacy', 'tier1_generic'),
  ('Empagliflozin', true, 'adequate', 'Jardiance 10mg and 25mg. Specialty drug — pre-auth may be needed.', 'Cardiology/Endocrine', 'tier3_specialty'),
  ('Dapagliflozin', true, 'low', 'Forxiga 10mg. Low stock — check availability.', 'Pharmacy', 'tier3_specialty'),
  ('Pioglitazone', true, 'adequate', 'Pioz 15mg generic available. Cheap.', 'Pharmacy', 'tier1_generic'),
  ('Insulin Glargine', true, 'adequate', 'Basalog (Biocon) and Lantus (Sanofi) stocked. Cold chain maintained.', 'Pharmacy', 'tier2_branded'),
  ('Aspirin', true, 'adequate', 'Ecosprin 75mg. Large stock — STEMI use.', 'Emergency/Pharmacy', 'tier1_generic'),
  ('Clopidogrel', true, 'adequate', 'Clopilet 75mg and 300mg loading dose available.', 'Emergency/Cardiology', 'tier1_generic'),
  ('Ticagrelor', true, 'adequate', 'Brilinta 90mg. Cath lab stocked. Pre-auth for chronic use.', 'Cardiology/Emergency', 'tier2_branded'),
  ('Streptokinase', true, 'adequate', '1.5MU vials available Emergency. ₹5,500 approx.', 'Emergency', 'tier2_branded'),
  ('Tenecteplase', true, 'adequate', 'Metalyse 40mg available. Weight-based bolus. ₹28,000 approx.', 'Emergency/Cardiology', 'tier3_specialty'),
  ('Heparin', true, 'adequate', 'UFH 5000 IU/mL vials. IV infusion with APTT monitoring.', 'Emergency/ICU', 'tier1_generic'),
  ('Atorvastatin', true, 'adequate', 'Atorva 10/20/40/80mg generic. Low cost.', 'Pharmacy', 'tier1_generic'),
  ('Ramipril', true, 'adequate', 'Cardace 1.25/2.5/5/10mg stocked.', 'Pharmacy', 'tier1_generic'),
  ('Metoprolol Succinate', true, 'adequate', 'Metolar XR 25/50mg. Extended release.', 'Pharmacy', 'tier1_generic'),
  ('Carvedilol', true, 'adequate', 'Carloc 6.25/12.5/25mg available.', 'Pharmacy', 'tier1_generic'),
  ('Furosemide', true, 'adequate', 'Lasix 40mg tablets and 2mL injection available.', 'Pharmacy/ICU', 'tier1_generic'),
  ('Spironolactone', true, 'adequate', 'Aldactone 25mg and 50mg available.', 'Pharmacy', 'tier1_generic'),
  ('Dabigatran', true, 'adequate', 'Pradaxa 110mg and 150mg. NLEM 2022.', 'Cardiology/Pharmacy', 'tier2_branded'),
  ('Rivaroxaban', true, 'adequate', 'Xarelto 15mg and 20mg stocked.', 'Pharmacy', 'tier2_branded'),
  ('Apixaban', true, 'low', 'Eliquis 2.5mg and 5mg. Low stock — confirm availability.', 'Pharmacy', 'tier2_branded'),
  ('Telmisartan', true, 'adequate', 'Telsartan 40/80mg generic available.', 'Pharmacy', 'tier1_generic'),
  ('Amiodarone', true, 'adequate', 'Cordarone 200mg tablets and IV injection available.', 'Cardiology/ICU', 'tier2_branded'),
  ('Digoxin', true, 'adequate', 'Lanoxin 0.25mg. Narrow therapeutic window — level monitoring.', 'Pharmacy/Cardiology', 'tier1_generic')
) AS g(drug_name, in_stock, stock_level, pharmacy_notes, department, formulary_tier);

-- Link formulary to drug IDs where possible
UPDATE hospital_formulary hf
SET drug_id = d.id
FROM drugs d
WHERE lower(trim(hf.drug_name)) = d.generic_name_normalized;
