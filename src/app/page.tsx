'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { SafetyAlert } from '@/lib/types';
import { useAuth } from '@/lib/useAuth';

function ECGBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const ecgPts = (x0:number,y:number,w:number):[number,number][] => [
      [0,0],[0.08,0],[0.10,-0.08],[0.13,0],[0.16,0],
      [0.18,0.04],[0.19,-0.35],[0.20,1],[0.21,-0.25],[0.22,0],[0.25,0],
      [0.28,-0.12],[0.34,-0.12],[0.38,0],[0.5,0],[1,0],
    ].map(([rx,ry])=>[x0+rx*w, y+ry*55]);
    const traces=[
      {y:0.22,spd:0.6,col:'rgba(61,139,255,0.20)',off:0,w:420},
      {y:0.55,spd:0.4,col:'rgba(93,255,195,0.12)',off:180,w:480},
      {y:0.78,spd:0.5,col:'rgba(61,139,255,0.14)',off:90,w:390},
      {y:0.38,spd:0.3,col:'rgba(93,255,195,0.08)',off:320,w:510},
    ];
    let t=0,id:number;
    const draw=()=>{
      ctx.clearRect(0,0,c.width,c.height); t+=0.5;
      for(const tr of traces){
        const ty=c.height*tr.y;
        for(let sx=-tr.w+((t*tr.spd+tr.off)%tr.w)-tr.w;sx<c.width+tr.w;sx+=tr.w){
          const pts=ecgPts(sx,ty,tr.w);
          ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
          for(let i=1;i<pts.length;i++){
            if(i<pts.length-1){const mx=(pts[i][0]+pts[i+1][0])/2,my=(pts[i][1]+pts[i+1][1])/2;ctx.quadraticCurveTo(pts[i][0],pts[i][1],mx,my);}
            else ctx.lineTo(pts[i][0],pts[i][1]);
          }
          ctx.strokeStyle=tr.col;ctx.lineWidth=1.5;ctx.shadowColor=tr.col.replace(/[\d.]+\)$/,'0.8)');ctx.shadowBlur=8;ctx.stroke();ctx.shadowBlur=0;
        }
      }
      id=requestAnimationFrame(draw);
    };
    draw();
    return()=>{cancelAnimationFrame(id);window.removeEventListener('resize',resize);};
  },[]);
  return <canvas ref={ref} id="ecg-canvas"/>;
}

function Logo() {
  return(
    <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#3d8bff"/><stop offset="100%" stopColor="#6366f1"/></linearGradient>
        <linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#5dffc3"/><stop offset="100%" stopColor="#3d8bff"/></linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="36" height="36" rx="10" fill="url(#lg1)" opacity="0.9"/>
      <rect width="36" height="36" rx="10" fill="none" stroke="rgba(120,180,255,0.35)" strokeWidth="0.8"/>
      <text x="5.5" y="22" fontSize="17" fontWeight="800" fontFamily="DM Sans,sans-serif" fill="white">B</text>
      <circle cx="24" cy="7" r="1.8" fill="none" stroke="url(#lg2)" strokeWidth="1.2"/>
      <circle cx="30" cy="7" r="1.8" fill="none" stroke="url(#lg2)" strokeWidth="1.2"/>
      <path d="M24 8.8C24 12,22 13,22 16C22 19.5,24.5 21,27 21C29.5 21,32 19.5,32 16C32 13,30 12,30 8.8" fill="none" stroke="url(#lg2)" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="27" cy="21.5" r="3" fill="none" stroke="url(#lg2)" strokeWidth="1.3"/>
      <circle cx="27" cy="21.5" r="1.2" fill="url(#lg2)" opacity="0.7"/>
      <path d="M4 30L8 30L9.5 27L11 33L12.5 26L14 30L18 30" fill="none" stroke="url(#lg2)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)"/>
      <rect x="3" y="3" width="30" height="1" rx="0.5" fill="rgba(255,255,255,0.15)"/>
    </svg>
  );
}

type LabStatus = 'ok'|'warn'|'high'|'critical';
interface PatientType {
  code: string; tag: string; icon: string; name: string;
  age: number; gender: string; label: string;
  conditions: string[];
  keyLabs: {label:string;value:string;status:LabStatus}[];
  alert: string; scenario: string; defaultQuery: string;
  isAdhoc?: boolean; adhocData?: any; starred?: boolean;
}

const INITIAL_PATIENTS: PatientType[] = [
  { code:'P1',tag:'diabetes',icon:'🩸',name:'Rajesh Kumar',age:48,gender:'M',label:'Failing Metformin',
    conditions:['T2DM (3yr)','Hypertension'],
    keyLabs:[{label:'HbA1c',value:'8.4%',status:'high'},{label:'eGFR',value:'92',status:'ok'},{label:'BMI',value:'31.1',status:'warn'}],
    alert:'Sulfonamide allergy · ₹5K/month cap',scenario:'Second-line drug selection',
    defaultQuery:'Which second-line anti-diabetic drug should I add? Consider his insurance cap and allergy.' },
  { code:'P2',tag:'diabetes',icon:'🩸',name:'Meena Iyer',age:62,gender:'F',label:'Complex CKD',
    conditions:['T2DM (12yr)','CKD Stage 3b','HTN','Retinopathy','Neuropathy'],
    keyLabs:[{label:'HbA1c',value:'9.2%',status:'critical'},{label:'eGFR',value:'32',status:'critical'},{label:'K+',value:'4.9',status:'warn'}],
    alert:'Insurance mostly exhausted',scenario:'Insulin transition with CKD 3b',
    defaultQuery:'She is on Metformin and Glimepiride with eGFR 32. Should I change her diabetes medications?' },
  { code:'P3',tag:'diabetes',icon:'🩸',name:'Ravi (Auto-Driver)',age:34,gender:'M',label:'Cost-Constrained',
    conditions:['T2DM (2 months)','Obesity','NAFLD'],
    keyLabs:[{label:'HbA1c',value:'8.8%',status:'high'},{label:'eGFR',value:'108',status:'ok'},{label:'BMI',value:'35.3',status:'critical'}],
    alert:'NO insurance · Daily wage ₹800-1000',scenario:'Affordable management',
    defaultQuery:'Daily-wage auto-driver, no insurance. Most affordable and effective diabetes treatment?' },
  { code:'P4',tag:'cardiac',icon:'❤️',name:'Suresh Nair',age:52,gender:'M',label:'Acute STEMI',
    conditions:['Anterior STEMI (V1-V4)','Smoker 20pk-yr','Family Hx MI'],
    keyLabs:[{label:'BP',value:'95/62',status:'critical'},{label:'HR',value:'108',status:'high'},{label:'Troponin',value:'12.4↑',status:'critical'}],
    alert:'🚨 Penicillin ANAPHYLAXIS',scenario:'Emergency STEMI protocol',
    defaultQuery:'Acute anterior STEMI. Immediate management protocol minute by minute. Cath lab available.' },
  { code:'P5',tag:'cardiac',icon:'❤️',name:'Prakash Rao',age:66,gender:'M',label:'Post-MI + New AF',
    conditions:['Anterior MI 3mo ago (DES-LAD)','T2DM','HTN','New AF'],
    keyLabs:[{label:'eGFR',value:'68',status:'warn'},{label:'K+',value:'4.4',status:'ok'},{label:'HbA1c',value:'7.4%',status:'ok'}],
    alert:'On DAPT · New AF → Triple therapy?',scenario:'Triple therapy dilemma',
    defaultQuery:'3 months post-MI on Aspirin + Ticagrelor, now new AF. Add anticoagulation?' },
  { code:'P6',tag:'overlap',icon:'⭐',name:'Lakshmi Devi',age:58,gender:'F',label:'DM + Heart Failure',
    conditions:['T2DM (8yr)','HFrEF (EF 30%)','HTN','CKD 3a'],
    keyLabs:[{label:'K+',value:'5.1 ⚠️',status:'critical'},{label:'eGFR',value:'48',status:'warn'},{label:'BNP',value:'850',status:'critical'}],
    alert:'⭐ Overlap — MONEY demo',scenario:'DM + HF + Hyperkalemia',
    defaultQuery:'T2DM + HF (EF 30%) + CKD 3a, K+ 5.1. Review medications and recommend diabetes management.' },
];

interface ContextMenuProps {
  patient: PatientType;
  anchorRect: DOMRect;
  onStar: () => void;
  onRename: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  onClose: () => void;
}
function ContextMenu({ patient, anchorRect, onStar, onRename, onUpdate, onDelete, onClose }: ContextMenuProps) {
  const top   = anchorRect.bottom + 6;
  const right = window.innerWidth - anchorRect.right;
  const itemCls = "flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left rounded-lg transition-colors hover:bg-white/8";

  return (
    <div style={{
      position:'fixed', top, right, zIndex:9999, width:'176px',
      borderRadius:'12px', overflow:'hidden',
      background:'rgba(8,16,34,0.98)',
      border:'1px solid rgba(61,139,255,0.28)',
      backdropFilter:'blur(20px)',
      boxShadow:'0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(61,139,255,0.08)',
    }}>
      <div style={{padding:'4px'}}>
        <button className={itemCls} style={{color:'#fbbf24'}} onClick={()=>{onStar();onClose();}}>
          <span>{patient.starred?'★':'☆'}</span>
          <span>{patient.starred?'Unstar':'Mark as Star'}</span>
        </button>
        <button className={itemCls} style={{color:'#a5c8ff'}} onClick={()=>{onRename();onClose();}}>
          <span>✏️</span><span>Rename</span>
        </button>
        <button className={itemCls} style={{color:'#6ee7b7'}} onClick={()=>{onUpdate();onClose();}}>
          <span>📝</span><span>Update Info</span>
        </button>
        <div style={{height:'1px',background:'rgba(61,139,255,0.12)',margin:'3px 6px'}}/>
        <button className={itemCls} style={{color:'#f87171'}} onClick={()=>{onDelete();onClose();}}>
          <span>🗑️</span><span>Delete Patient</span>
        </button>
      </div>
    </div>
  );
}

const CONDITIONS_PRESETS = [
  'T2DM','Hypertension','CKD Stage 3a','CKD Stage 3b','Heart Failure (HFrEF)',
  'Atrial Fibrillation','NAFLD','Obesity','CAD','Post-MI','Hypothyroidism',
  'Gout','Rheumatic Heart Disease',
];

interface AddPatientFormProps {
  onAdd: (p: PatientType) => void;
  onClose: () => void;
  nextCode: string;
  initialData?: PatientType;  // for editing
}

function AddPatientForm({ onAdd, onClose, nextCode, initialData }: AddPatientFormProps) {
  const isEdit = !!initialData;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: initialData?.name || '',
    age: initialData?.age?.toString() || '',
    gender: (initialData?.gender || 'M') as 'M'|'F'|'Other',
    bmi: '',
    conditions: initialData?.conditions || [] as string[],
    condInput: '',
    meds: [] as {name:string;dose:string;freq:string}[],
    medName:'', medDose:'', medFreq:'OD',
    allergies: [] as {drug:string;reaction:string;severity:string}[],
    allergyDrug:'', allergyRxn:'', allergySev:'moderate',
    hba1c:'', egfr:'', creatinine:'', k:'', bnp:'', troponin:'', bp:'', hr:'',
    insuranceProvider:'', insuranceCap:'', insuranceNotes:'',
    incomeContext: 'middle_class_salaried',
    conditionTags: ['diabetes'] as string[],
    query: initialData?.defaultQuery || '',
  });

  const set = (k:string,v:any) => setForm(f=>({...f,[k]:v}));
  const addCondition = (c:string) => { if(c.trim()&&!form.conditions.includes(c.trim())) set('conditions',[...form.conditions,c.trim()]); set('condInput',''); };
  const addMed = () => { if(form.medName.trim()){ set('meds',[...form.meds,{name:form.medName,dose:form.medDose,freq:form.medFreq}]); set('medName',''); set('medDose',''); set('medFreq','OD'); }};
  const addAllergy = () => { if(form.allergyDrug.trim()){ set('allergies',[...form.allergies,{drug:form.allergyDrug,reaction:form.allergyRxn||'rash',severity:form.allergySev}]); set('allergyDrug',''); set('allergyRxn',''); }};

  const submit = () => {
    const hasDiabetes = form.conditions.some(c=>c.toLowerCase().includes('dm')||c.toLowerCase().includes('diab'));
    const hasCardiac  = form.conditions.some(c=>['stemi','mi','af','heart failure','cad','cardiac'].some(k=>c.toLowerCase().includes(k)));
    const tags = [...new Set([...(hasDiabetes?['diabetes']:[]),...(hasCardiac?['cardiovascular']:[]),...(hasDiabetes&&hasCardiac?['heart_failure']:[])])];
    const finalTags = tags.length ? tags : ['diabetes'];

    const adhocData = {
      id: initialData?.adhocData?.id || crypto.randomUUID(),
      patient_code: nextCode,
      display_name:`${form.name||'New Patient'} — ${form.age}${form.gender}`,
      age:parseInt(form.age)||40, gender:form.gender, bmi:parseFloat(form.bmi)||null,
      conditions:form.conditions,
      current_medications:form.meds.map(m=>({name:m.name,dose:m.dose,frequency:m.freq})),
      allergies:form.allergies.length?form.allergies.map(a=>({drug:a.drug,reaction:a.reaction,severity:a.severity})):[{drug:'None',reaction:'NKDA',severity:'none'}],
      labs:{
        ...(form.hba1c      && {hba1c:      parseFloat(form.hba1c)}),
        ...(form.egfr       && {egfr:        parseFloat(form.egfr)}),
        ...(form.creatinine && {creatinine:  parseFloat(form.creatinine)}),
        ...(form.k          && {k:           parseFloat(form.k)}),
        ...(form.bnp        && {bnp:         parseFloat(form.bnp)}),
        ...(form.troponin   && {troponin:    parseFloat(form.troponin)}),
      },
      vitals:{
        ...(form.bp && {bp: form.bp}),
        ...(form.hr && {hr: parseInt(form.hr)}),
      },
      insurance:{provider:form.insuranceProvider||'None',monthly_cap_inr:parseInt(form.insuranceCap)||0,notes:form.insuranceNotes},
      income_context:form.incomeContext,
      condition_tags:finalTags,
    };

    const uiPatient: PatientType = {
      code: nextCode,
      tag: finalTags.includes('cardiovascular')&&finalTags.includes('diabetes')?'overlap':finalTags.includes('cardiovascular')?'cardiac':'diabetes',
      icon: finalTags.includes('cardiovascular')&&finalTags.includes('diabetes')?'⭐':finalTags.includes('cardiovascular')?'❤️':'🩸',
      name: form.name||'New Patient',
      age: parseInt(form.age)||40, gender:form.gender,
      label:`${form.name||'New Patient'}`,
      conditions:form.conditions,
      keyLabs:[
        ...(form.hba1c?[{label:'HbA1c',value:`${form.hba1c}%`,status:(parseFloat(form.hba1c)>9?'critical':parseFloat(form.hba1c)>7.5?'high':'ok') as LabStatus}]:[]),
        ...(form.egfr?[{label:'eGFR',value:form.egfr,status:(parseInt(form.egfr)<30?'critical':parseInt(form.egfr)<60?'warn':'ok') as LabStatus}]:[]),
        ...(form.k?[{label:'K+',value:form.k,status:(parseFloat(form.k)>5.5?'critical':parseFloat(form.k)>5.0?'warn':'ok') as LabStatus}]:[]),
        ...(form.bp?[{label:'BP',value:form.bp,status:'warn' as LabStatus}]:[]),
      ].slice(0,3),
      alert:form.allergies.length?form.allergies.map(a=>`${a.drug}(${a.reaction})`).join(', '):'No known allergies',
      scenario:'Surprise test patient',
      defaultQuery:form.query||'Please assess this patient and provide India-specific management guidance.',
      isAdhoc:true, adhocData,
      starred: initialData?.starred,
    };
    onAdd(uiPatient);
    onClose();
  };

  const inputSt: React.CSSProperties = {background:'rgba(8,16,32,0.9)',border:'1px solid rgba(61,139,255,0.25)',color:'#dce8ff',fontFamily:'inherit'};
  const inputCls = "w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition-all";
  const steps = ['Patient Info','Conditions & Meds','Labs & Vitals','Insurance & Query'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.78)',backdropFilter:'blur(6px)'}}>
      <div className="glass rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col animate-in"
        style={{borderColor:'rgba(61,139,255,0.3)',boxShadow:'0 0 60px rgba(30,80,200,0.28)'}}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:'1px solid rgba(61,139,255,0.12)'}}>
          <div>
            <h2 className="text-base font-bold text-white">{isEdit ? `Update: ${initialData?.name}` : `Add Patient (${nextCode})`}</h2>
            <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>
              {isEdit ? 'Edit patient information' : 'For surprise test scenarios — no SQL needed'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:bg-white/10 transition-colors" style={{color:'var(--text-muted)'}}>×</button>
        </div>

        {/* Steps */}
        <div className="flex px-5 pt-4 gap-2">
          {steps.map((s,i)=>(
            <div key={s} className="flex-1 cursor-pointer" onClick={()=>i<step&&setStep(i)}>
              <div className={`h-1 rounded-full transition-all ${i<=step?'bg-blue-500':'bg-white/10'}`}/>
              <p className={`text-[10px] mt-1 mono ${i===step?'text-blue-400':'text-[var(--text-muted)]'}`}>{s}</p>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Step 0 */}
          {step===0&&(<>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] mb-1 block" style={{color:'var(--text-muted)'}}>Patient Name</label>
                <input className={inputCls} style={inputSt} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Arjun Sharma"/></div>
              <div><label className="text-[11px] mb-1 block" style={{color:'var(--text-muted)'}}>Age</label>
                <input className={inputCls} style={inputSt} type="number" value={form.age} onChange={e=>set('age',e.target.value)} placeholder="45"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] mb-1 block" style={{color:'var(--text-muted)'}}>Gender</label>
                <select className={inputCls} style={inputSt} value={form.gender} onChange={e=>set('gender',e.target.value)}>
                  <option value="M">Male</option><option value="F">Female</option><option value="Other">Other</option>
                </select></div>
              <div><label className="text-[11px] mb-1 block" style={{color:'var(--text-muted)'}}>BMI</label>
                <input className={inputCls} style={inputSt} type="number" step="0.1" value={form.bmi} onChange={e=>set('bmi',e.target.value)} placeholder="28.5"/></div>
            </div>
            <div><label className="text-[11px] mb-1 block" style={{color:'var(--text-muted)'}}>Income Context</label>
              <select className={inputCls} style={inputSt} value={form.incomeContext} onChange={e=>set('incomeContext',e.target.value)}>
                <option value="middle_class_salaried">Middle class salaried</option>
                <option value="daily_wage_worker">Daily wage worker</option>
                <option value="retired_government">Retired government employee</option>
                <option value="working_class">Working class</option>
              </select></div>
          </>)}

          {/* Step 1 */}
          {step===1&&(<>
            <div>
              <label className="text-[11px] mb-2 block" style={{color:'var(--text-muted)'}}>Conditions</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {CONDITIONS_PRESETS.map(c=>(
                  <button key={c} onClick={()=>addCondition(c)}
                    className={`text-[11px] px-2 py-1 rounded-lg border transition-all ${form.conditions.includes(c)?'border-blue-400/50 bg-blue-500/15 text-blue-300':'border-white/10 text-[var(--text-muted)] hover:border-white/25 hover:text-slate-300'}`}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input className={`${inputCls} flex-1`} style={inputSt} value={form.condInput} onChange={e=>set('condInput',e.target.value)} placeholder="Custom condition..." onKeyDown={e=>e.key==='Enter'&&addCondition(form.condInput)}/>
                <button onClick={()=>addCondition(form.condInput)} className="px-3 py-2 rounded-lg text-sm text-blue-400 border border-blue-400/30 hover:bg-blue-500/10 transition-colors">+</button>
              </div>
              {form.conditions.length>0&&(
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.conditions.map(c=>(
                    <span key={c} className="text-[11px] px-2 py-1 rounded-lg flex items-center gap-1 badge-diabetes">
                      {c}<button onClick={()=>set('conditions',form.conditions.filter(x=>x!==c))} className="opacity-60 hover:opacity-100 ml-0.5">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{borderTop:'1px solid rgba(61,139,255,0.1)',paddingTop:'12px'}}>
              <label className="text-[11px] mb-2 block" style={{color:'var(--text-muted)'}}>Medications</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input className={inputCls} style={inputSt} value={form.medName} onChange={e=>set('medName',e.target.value)} placeholder="Drug name"/>
                <input className={inputCls} style={inputSt} value={form.medDose} onChange={e=>set('medDose',e.target.value)} placeholder="Dose"/>
                <div className="flex gap-1">
                  <select className={`${inputCls} flex-1`} style={inputSt} value={form.medFreq} onChange={e=>set('medFreq',e.target.value)}>
                    <option>OD</option><option>BD</option><option>TDS</option><option>QID</option><option>HS</option><option>PRN</option>
                  </select>
                  <button onClick={addMed} className="px-2 rounded-lg text-blue-400 border border-blue-400/30 hover:bg-blue-500/10 text-sm">+</button>
                </div>
              </div>
              {form.meds.map((m,i)=>(
                <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg mb-1" style={{background:'rgba(255,255,255,0.03)'}}>
                  <span className="text-slate-300">{m.name} {m.dose} {m.freq}</span>
                  <button onClick={()=>set('meds',form.meds.filter((_,j)=>j!==i))} className="hover:text-red-400" style={{color:'var(--text-muted)'}}>×</button>
                </div>
              ))}
            </div>
            <div style={{borderTop:'1px solid rgba(61,139,255,0.1)',paddingTop:'12px'}}>
              <label className="text-[11px] mb-2 block" style={{color:'var(--text-muted)'}}>Allergies</label>
              <div className="grid grid-cols-3 gap-2 mb-1">
                <input className={inputCls} style={inputSt} value={form.allergyDrug} onChange={e=>set('allergyDrug',e.target.value)} placeholder="Drug"/>
                <input className={inputCls} style={inputSt} value={form.allergyRxn} onChange={e=>set('allergyRxn',e.target.value)} placeholder="Reaction"/>
                <div className="flex gap-1">
                  <select className={`${inputCls} flex-1`} style={inputSt} value={form.allergySev} onChange={e=>set('allergySev',e.target.value)}>
                    <option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">ANAPHYLAXIS</option>
                  </select>
                  <button onClick={addAllergy} className="px-2 rounded-lg text-rose-400 border border-rose-400/30 hover:bg-rose-500/10 text-sm">+</button>
                </div>
              </div>
              {form.allergies.map((a,i)=>(
                <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg mb-1" style={{background:'rgba(244,63,94,0.06)'}}>
                  <span className="text-rose-300">{a.drug} — {a.reaction} ({a.severity})</span>
                  <button onClick={()=>set('allergies',form.allergies.filter((_,j)=>j!==i))} className="hover:text-red-400" style={{color:'var(--text-muted)'}}>×</button>
                </div>
              ))}
            </div>
          </>)}

          {/* Step 2 */}
          {step===2&&(<>
            <p className="text-[11px]" style={{color:'var(--text-muted)'}}>Fill available labs — leave blank if not tested</p>
            <div className="grid grid-cols-2 gap-3">
              {[{l:'HbA1c (%)',k:'hba1c',p:'8.4'},{l:'eGFR (mL/min)',k:'egfr',p:'92'},{l:'Creatinine',k:'creatinine',p:'0.9'},
                {l:'K+ (mEq/L)',k:'k',p:'4.2'},{l:'BNP',k:'bnp',p:'850'},{l:'Troponin',k:'troponin',p:'12.4'}].map(f=>(
                <div key={f.k}><label className="text-[11px] mb-1 block" style={{color:'var(--text-muted)'}}>{f.l}</label>
                  <input className={inputCls} style={inputSt} type="number" step="0.01" value={(form as any)[f.k]} onChange={e=>set(f.k,e.target.value)} placeholder={f.p}/></div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] mb-1 block" style={{color:'var(--text-muted)'}}>BP (e.g. 130/80)</label>
                <input className={inputCls} style={inputSt} value={form.bp} onChange={e=>set('bp',e.target.value)} placeholder="130/80"/></div>
              <div><label className="text-[11px] mb-1 block" style={{color:'var(--text-muted)'}}>Heart Rate</label>
                <input className={inputCls} style={inputSt} type="number" value={form.hr} onChange={e=>set('hr',e.target.value)} placeholder="78"/></div>
            </div>
          </>)}

          {/* Step 3 */}
          {step===3&&(<>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] mb-1 block" style={{color:'var(--text-muted)'}}>Insurance Provider</label>
                <input className={inputCls} style={inputSt} value={form.insuranceProvider} onChange={e=>set('insuranceProvider',e.target.value)} placeholder="Star Health / CGHS / None"/></div>
              <div><label className="text-[11px] mb-1 block" style={{color:'var(--text-muted)'}}>Monthly Cap (₹)</label>
                <input className={inputCls} style={inputSt} type="number" value={form.insuranceCap} onChange={e=>set('insuranceCap',e.target.value)} placeholder="5000"/></div>
            </div>
            <div><label className="text-[11px] mb-1 block" style={{color:'var(--text-muted)'}}>Clinical Question</label>
              <textarea className={inputCls} style={{...inputSt,resize:'none'}} rows={3} value={form.query} onChange={e=>set('query',e.target.value)} placeholder="What management would you recommend?"/></div>
            <div className="rounded-xl p-3 text-xs space-y-1" style={{background:'rgba(61,139,255,0.06)',border:'1px solid rgba(61,139,255,0.15)'}}>
              <p className="text-blue-400 font-semibold mb-1">Summary — {nextCode}</p>
              <p style={{color:'var(--text-secondary)'}}><strong>Name:</strong> {form.name||'—'} · <strong>Age:</strong> {form.age||'—'}{form.gender} · <strong>BMI:</strong> {form.bmi||'—'}</p>
              <p style={{color:'var(--text-secondary)'}}><strong>Conditions:</strong> {form.conditions.join(', ')||'—'}</p>
              <p style={{color:'var(--text-secondary)'}}><strong>Meds:</strong> {form.meds.map(m=>`${m.name} ${m.dose}`).join(', ')||'None'}</p>
              {form.allergies.length>0&&<p className="text-rose-300"><strong>Allergies:</strong> {form.allergies.map(a=>`${a.drug}(${a.reaction})`).join(', ')}</p>}
            </div>
          </>)}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4" style={{borderTop:'1px solid rgba(61,139,255,0.1)'}}>
          <button onClick={()=>step>0?setStep(s=>s-1):onClose()} className="px-4 py-2 rounded-lg text-sm transition-colors" style={{color:'var(--text-muted)',border:'1px solid rgba(255,255,255,0.08)'}}>
            {step===0?'Cancel':'← Back'}
          </button>
          {step<3
            ?<button onClick={()=>setStep(s=>s+1)} className="px-5 py-2 rounded-lg text-sm font-semibold text-white" style={{background:'linear-gradient(135deg,#1d4ed8,#3d8bff)'}}>Next →</button>
            :<button onClick={submit} className="px-5 py-2 rounded-lg text-sm font-bold text-white" style={{background:'linear-gradient(135deg,#059669,#10b981)',boxShadow:'0 0 20px rgba(16,185,129,0.3)'}}>
              {isEdit ? '✓ Save Changes' : '✓ Add Patient'}
            </button>
          }
        </div>
      </div>
    </div>
  );
}

const SC: Record<string,string> = {ok:'status-ok',warn:'status-warn',high:'status-high',critical:'status-critical'};
const SCFG: Record<string,{bar:string,bg:string,text:string,icon:string}> = {
  critical:{bar:'bg-rose-500',bg:'bg-rose-500/8 border-rose-500/25',text:'text-rose-300',icon:'🚨'},
  high:    {bar:'bg-orange-400',bg:'bg-orange-500/8 border-orange-400/25',text:'text-orange-300',icon:'⚠️'},
  moderate:{bar:'bg-amber-400',bg:'bg-amber-400/8 border-amber-400/20',text:'text-amber-300',icon:'📋'},
  low:     {bar:'bg-blue-400',bg:'bg-blue-400/8 border-blue-400/20',text:'text-blue-300',icon:'ℹ️'},
};
function fmt(t:string){
  return t.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/^###\s(.+)$/gm,'<h4 class="text-sm font-semibold text-slate-200 mt-4 mb-1.5">$1</h4>')
    .replace(/^##\s(.+)$/gm,'<h3 class="font-bold text-slate-100 mt-5 mb-2">$1</h3>')
    .replace(/^-\s(.+)$/gm,'<li class="flex gap-2 text-sm text-slate-300 leading-relaxed my-0.5"><span class="text-blue-400 shrink-0">›</span><span>$1</span></li>')
    .replace(/\n{2,}/g,'</p><p class="mt-2 text-sm text-slate-300 leading-relaxed">').replace(/\n/g,'<br/>');
}
interface APIResult {
  generic_response:string;option_c_response:string;safety_alerts:SafetyAlert[];
  guideline_sources:string[];context_injected:{guidelines_count:number;drugs_count:number;interactions_count:number};
  safety_summary:{ckd_stage?:string;egfr?:number;cha2ds2_vasc?:number;hyperkalemia_risk?:string;critical_alerts_count:number};
}

export default function BrahmoApp() {
  const { user, loading: authLoading, signOut, displayName, initials } = useAuth();

  const [patients, setPatients] = useState<PatientType[]>(INITIAL_PATIENTS);
  const [nextNum,  setNextNum]  = useState(7);
  const [active,   setActive]   = useState<PatientType>(INITIAL_PATIENTS[5]);
  const [query,    setQuery]    = useState(INITIAL_PATIENTS[5].defaultQuery);
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<APIResult|null>(null);
  const [error,     setError]     = useState<string|null>(null);
  const [view,      setView]      = useState<'comparison'|'alerts'|'context'>('comparison');
  const [openAlert, setOpenAlert] = useState<number|null>(null);
  const [activeDx,  setActiveDx]  = useState<string|null>(null);
  const [dxResult,  setDxResult]  = useState<string|null>(null);
  const [dxLoading, setDxLoading] = useState(false);
  const [showAdd,   setShowAdd]   = useState(false);
  const [editTarget,setEditTarget]= useState<PatientType|null>(null);
  const [renameTarget, setRenameTarget] = useState<string|null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [activeMenu, setActiveMenu] = useState<{key:string; rect:DOMRect}|null>(null);
  const [sideOpen,  setSideOpen]  = useState(false);

  useEffect(() => {
    try {
      const savedRaw    = localStorage.getItem('brahmo_patients');
      const savedNum    = localStorage.getItem('brahmo_next_num');
      const savedKey    = localStorage.getItem('brahmo_active_key');
      let allPatients   = INITIAL_PATIENTS;
      if (savedRaw) {
        const adhoc = (JSON.parse(savedRaw) as PatientType[]).filter(p => p.isAdhoc);
        if (adhoc.length > 0) {
          allPatients = [...INITIAL_PATIENTS, ...adhoc];
          setPatients(allPatients);
        }
      }
      if (savedNum) setNextNum(parseInt(savedNum));
      if (savedKey) {
        const found = allPatients.find(p => patientKey(p) === savedKey);
        if (found) { setActive(found); setQuery(found.defaultQuery); }
      }
    } catch {}
  }, []); // run once after mount

  useEffect(() => {
    try {
      const adhocOnly = patients.filter(p => p.isAdhoc);
      localStorage.setItem('brahmo_patients', JSON.stringify(adhocOnly));
    } catch {}
  }, [patients]);
  useEffect(() => {
    try { localStorage.setItem('brahmo_next_num', String(nextNum)); } catch {}
  }, [nextNum]);
  useEffect(() => {
    try { localStorage.setItem('brahmo_active_key', patientKey(active)); } catch {}
  }, [active]);

  const patientKey = (p:PatientType) => p.code + p.name;

  const pickPatient = useCallback((p:PatientType)=>{
    setActive(p); setQuery(p.defaultQuery);
    setResult(null); setError(null);
    setActiveDx(null); setDxResult(null);
    setActiveMenu(null); setSideOpen(false);

  },[]);

  const handleAdd = useCallback((p:PatientType)=>{
    setPatients(ps=>[...ps,p]);
    setNextNum(n=>n+1);
    pickPatient(p);
  },[pickPatient]);

  const handleEdit = useCallback((updated:PatientType)=>{
    setPatients(ps=>ps.map(p=>patientKey(p)===patientKey(editTarget!)?updated:p));
    if(patientKey(active)===patientKey(editTarget!)) { setActive(updated); setQuery(updated.defaultQuery); }
    setEditTarget(null);
  },[editTarget, active]);

  const toggleStar = useCallback((key:string)=>{
    setPatients(ps=>ps.map(p=>patientKey(p)===key?{...p,starred:!p.starred}:p));
    if(patientKey(active)===key) setActive(a=>({...a,starred:!a.starred}));
  },[active]);

  const deletePatient = useCallback((key:string)=>{
    setPatients(ps=>{
      const next = ps.filter(p=>patientKey(p)!==key);
      if(patientKey(active)===key && next.length>0) pickPatient(next[0]);
      return next;
    });
  },[active, pickPatient]);

  const confirmRename = useCallback((key:string)=>{
    if(!renameVal.trim()){setRenameTarget(null);return;}
    setPatients(ps=>ps.map(p=>patientKey(p)===key?{...p,name:renameVal,label:renameVal}:p));
    if(patientKey(active)===key) setActive(a=>({...a,name:renameVal,label:renameVal}));
    setRenameTarget(null); setRenameVal('');
  },[renameVal, active]);

  const run = useCallback(async()=>{
    setLoading(true);setError(null);setResult(null);setView('comparison');
    try{
      const isAdhoc=(active as any).isAdhoc;
      const r=await fetch(isAdhoc?'/api/claude-adhoc':'/api/claude',{method:'POST',headers:{'Content-Type':'application/json'},
        body:isAdhoc?JSON.stringify({patient:(active as any).adhocData,query}):JSON.stringify({patient_code:active.code,query})});
      if(!r.ok) throw new Error((await r.json()).error||`HTTP ${r.status}`);
      setResult(await r.json());
    }catch(e){setError(e instanceof Error?e.message:'Request failed');}
    finally{setLoading(false);}
  },[active,query]);

  const deepDive = useCallback(async(dx:string)=>{
    setActiveDx(dx);setDxLoading(true);setDxResult(null);
    const q=`Focused India-specific deep-dive for: "${dx}". Include: 1) Status/severity, 2) RSSDI/CSI guidelines, 3) Indian drugs ₹+NLEM, 4) Monitoring, 5) Escalation.`;
    try{
      const isAdhoc=(active as any).isAdhoc;
      const r=await fetch(isAdhoc?'/api/claude-adhoc':'/api/claude',{method:'POST',headers:{'Content-Type':'application/json'},
        body:isAdhoc?JSON.stringify({patient:(active as any).adhocData,query:q}):JSON.stringify({patient_code:active.code,query:q})});
      const d=await r.json();setDxResult(d.option_c_response);
    }catch{setDxResult('Error loading analysis.');}
    finally{setDxLoading(false);}
  },[active]);

  const critCount=result?.safety_alerts.filter(a=>a.severity==='critical').length||0;
  const nextCode=`P${nextNum}`;
  const inputStyle:React.CSSProperties={background:'rgba(255,255,255,0.03)',border:'1px solid rgba(61,139,255,0.2)',color:'var(--text-primary)',fontFamily:'inherit'};

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background:'#04080f'}}>
        <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"/>
      </div>
    );
  }

  const sortedPatients = [...patients].sort((a,b)=>(b.starred?1:0)-(a.starred?1:0));

  const SidebarContent = () => (
    <div className="h-full overflow-y-auto flex flex-col gap-2">
      <p className="text-[10px] mono uppercase tracking-widest px-1 shrink-0" style={{color:'var(--text-muted)'}}>
        {patients.length} Patient{patients.length!==1?'s':''}
        {patients.filter(p=>p.starred).length>0&&<span className="text-amber-400 ml-1">· {patients.filter(p=>p.starred).length} ★</span>}
      </p>

      {sortedPatients.map(p=>{
        const key=patientKey(p);
        const isSel=patientKey(active)===key;
        const isMenuOpen=activeMenu?.key===key;
        const isRenaming=renameTarget===key;

        return(
          <div key={key} className={`glass relative rounded-xl transition-all duration-200 ${isSel?'glass-active':''} ${p.starred?'border-amber-500/25':''}`}
            style={isSel?{background:'rgba(20,45,100,0.55)'}:p.starred?{background:'rgba(251,191,36,0.04)'}:{}}>

            <button className="w-full text-left p-3 pr-8" onClick={()=>pickPatient(p)}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{p.starred?'★':p.icon}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full mono font-semibold ${
                  p.tag==='diabetes'?'badge-diabetes':p.tag==='cardiac'?'badge-cardiac':'badge-overlap'
                }`}>{p.code}</span>
                {isRenaming?(
                  <input autoFocus className="flex-1 text-[11px] bg-transparent border-b border-blue-400/50 text-white outline-none px-0.5"
                    value={renameVal} onChange={e=>setRenameVal(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter')confirmRename(key);if(e.key==='Escape'){setRenameTarget(null);setRenameVal('');}}}
                    onBlur={()=>confirmRename(key)} onClick={e=>e.stopPropagation()}/>
                ):(
                  <span className="text-[11px] font-semibold truncate" style={{color:'var(--text-primary)'}}>{p.name}</span>
                )}
              </div>
              <p className="text-[10px] leading-snug" style={{color:'var(--text-secondary)'}}>{p.age}{p.gender} · {p.scenario}</p>
              <div className="flex gap-2 mt-1.5">
                {p.keyLabs.slice(0,2).map(l=>(
                  <span key={l.label} className={`text-[10px] mono font-semibold ${SC[l.status]}`}>{l.label}: {l.value}</span>
                ))}
              </div>
              {isSel&&<div className="mt-2 h-px rounded-full" style={{background:'linear-gradient(90deg,#3d8bff,#5dffc3)'}}/>}
            </button>

            {/* 3-dot button */}
            <button
              className="absolute top-2.5 right-2 w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-white/12"
              style={{color:'var(--text-muted)'}}
              onClick={e=>{
                e.stopPropagation();
                const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                setActiveMenu(isMenuOpen ? null : {key, rect});
              }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <circle cx="7" cy="2.5" r="1.2"/><circle cx="7" cy="7" r="1.2"/><circle cx="7" cy="11.5" r="1.2"/>
              </svg>
            </button>
          </div>
        );
      })}

      {/* Add card */}
      <button onClick={()=>setShowAdd(true)}
        className="glass w-full rounded-xl p-3 transition-all hover:border-blue-400/40 flex items-center justify-center gap-2 shrink-0"
        style={{borderStyle:'dashed',borderColor:'rgba(61,139,255,0.2)',background:'rgba(61,139,255,0.03)'}}>
        <span className="text-xl text-blue-400 font-light leading-none">+</span>
        <div className="text-left">
          <p className="text-[11px] font-semibold text-blue-400">Add Patient</p>
          <p className="text-[10px]" style={{color:'var(--text-muted)'}}>Surprise test · No SQL needed</p>
        </div>
      </button>

      {/* User profile card */}
      <div className="glass rounded-xl p-3 shrink-0" style={{borderColor:'rgba(61,139,255,0.18)'}}>
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{background:'linear-gradient(135deg,#3d8bff,#6366f1)'}}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{color:'var(--text-primary)'}}>{displayName}</p>
            <p className="text-[10px] truncate" style={{color:'var(--text-muted)'}}>Apollo Chennai</p>
          </div>
          {/* Logout */}
          <button onClick={signOut} title="Sign out"
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
            style={{color:'var(--text-muted)',border:'1px solid rgba(61,139,255,0.15)'}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return(
    <div id="app-root">
      <ECGBackground/>

      {/* Fullscreen overlay — closes context menu when clicking outside */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-[9990]"
          onClick={()=>setActiveMenu(null)}
        />
      )}

      {/* Active context menu — rendered at top level, above all cards */}
      {activeMenu && (() => {
        const p = sortedPatients.find(p => patientKey(p) === activeMenu.key);
        if (!p) return null;
        const key = patientKey(p);
        return (
          <ContextMenu
            patient={p}
            anchorRect={activeMenu.rect}
            onStar={()=>toggleStar(key)}
            onRename={()=>{setRenameTarget(key);setRenameVal(p.name);setActiveMenu(null);}}
            onUpdate={()=>{setEditTarget(p);setActiveMenu(null);}}
            onDelete={()=>{deletePatient(key);setActiveMenu(null);}}
            onClose={()=>setActiveMenu(null)}
          />
        );
      })()}
      {editTarget&&<AddPatientForm onAdd={handleEdit} onClose={()=>setEditTarget(null)} nextCode={editTarget.code} initialData={editTarget}/>}

      {/* Modals */}
      {showAdd&&<AddPatientForm onAdd={handleAdd} onClose={()=>setShowAdd(false)} nextCode={nextCode}/>}
      <nav className="glass sticky top-0 z-50" style={{borderBottom:'1px solid rgba(61,139,255,0.15)'}}>
        <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <button className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors mr-1"
              style={{color:'var(--text-secondary)'}} onClick={e=>{e.stopPropagation();setSideOpen(o=>!o);}}>
              <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor">
                <rect width="18" height="2" rx="1"/><rect y="6" width="18" height="2" rx="1"/><rect y="12" width="18" height="2" rx="1"/>
              </svg>
            </button>
            <Logo/>
            <div>
              <span className="text-sm md:text-base font-bold text-white tracking-tight">BRAHMO</span>
              <span className="hidden sm:inline text-[11px] mono ml-2" style={{color:'var(--text-muted)'}}>India Clinical AI</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 flex-wrap justify-end">
            {[{t:'Apollo Chennai',c:'border-emerald-500/30 text-emerald-400 bg-emerald-500/8'},
              {t:'RSSDI 2022',c:'border-blue-500/30 text-blue-400 bg-blue-500/8'},
              {t:'CSI',c:'border-blue-500/30 text-blue-400 bg-blue-500/8'},
              {t:'NLEM 2022',c:'border-amber-500/30 text-amber-400 bg-amber-500/8'},
            ].map(b=><span key={b.t} className={`text-[10px] px-2 py-0.5 rounded-full border mono ${b.c}`}>{b.t}</span>)}
          </div>
        </div>
      </nav>

      {/* Mobile sidebar drawer */}
      {sideOpen&&(
        <div className="fixed inset-0 z-40 md:hidden" onClick={()=>setSideOpen(false)}>
          <div className="absolute inset-0" style={{background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)'}}/>
          <div className="absolute left-0 top-0 bottom-0 w-72 p-4 glass animate-in" style={{borderRight:'1px solid rgba(61,139,255,0.2)'}} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">Patients</p>
              <button onClick={()=>setSideOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-lg hover:bg-white/10" style={{color:'var(--text-muted)'}}>×</button>
            </div>
            {SidebarContent()}
          </div>
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="max-w-screen-2xl mx-auto px-3 md:px-5 py-4 md:py-5 flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-5">
        <aside className="hidden md:block md:col-span-3 h-[calc(100vh-80px)] sticky top-[72px]">{SidebarContent()}</aside>
        <main className="md:col-span-9 space-y-3 md:space-y-4 min-w-0">

          {/* Patient header */}
          <div className="glass rounded-2xl p-3 md:p-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl">{active.starred?'★':active.icon}</span>
                  <h2 className="text-base md:text-lg font-bold text-white truncate">{active.name}</h2>
                  <span className="text-xs" style={{color:'var(--text-secondary)'}}>{active.age}{active.gender}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full mono hidden sm:inline ${
                    active.tag==='diabetes'?'badge-diabetes':active.tag==='cardiac'?'badge-cardiac':'badge-overlap'
                  }`}>{active.scenario}</span>
                </div>
                <p className="text-[11px] mt-1 font-medium" style={{color:'var(--accent3)'}}>{active.alert}</p>
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap">
                {active.keyLabs.map(l=>(
                  <div key={l.label} className="glass rounded-xl px-2.5 md:px-3 py-1.5 md:py-2 text-center min-w-[54px]"
                    style={{borderColor:l.status==='critical'?'rgba(244,63,94,0.3)':l.status==='warn'?'rgba(251,191,36,0.2)':'rgba(61,139,255,0.15)'}}>
                    <div className={`text-sm md:text-lg font-bold mono ${SC[l.status]}`}>{l.value}</div>
                    <div className="text-[9px] md:text-[10px]" style={{color:'var(--text-muted)'}}>{l.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 pt-3" style={{borderTop:'1px solid rgba(61,139,255,0.1)'}}>
              <p className="text-[10px] mono uppercase tracking-widest mb-2" style={{color:'var(--text-muted)'}}>Click diagnosis for deep-dive →</p>
              <div className="flex flex-wrap gap-1.5">
                {active.conditions.map(c=>(
                  <button key={c} onClick={()=>deepDive(c)}
                    className={`text-[11px] md:text-xs px-2.5 py-1 md:py-1.5 rounded-lg border font-medium transition-all ${
                      activeDx===c?'border-blue-400/50 text-blue-200':'border-[var(--border)] text-[var(--text-secondary)] hover:border-blue-400/35 hover:text-blue-300'
                    }`}
                    style={activeDx===c?{background:'rgba(61,139,255,0.12)'}:{background:'rgba(255,255,255,0.02)'}}>
                    {activeDx===c&&dxLoading?'⟳ ':''}{c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Deep-dive */}
          {activeDx&&(
            <div className="glass rounded-2xl overflow-hidden animate-in" style={{borderColor:'rgba(61,139,255,0.3)'}}>
              <div className="flex items-center justify-between px-4 py-3" style={{borderBottom:'1px solid rgba(61,139,255,0.15)',background:'rgba(20,45,100,0.3)'}}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0"/>
                  <span className="text-xs md:text-sm font-semibold text-blue-200 truncate">Deep-Dive: {activeDx}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full mono border border-blue-400/25 bg-blue-500/10 text-blue-400 hidden sm:inline">RSSDI · CSI · ₹</span>
                </div>
                <button onClick={()=>{setActiveDx(null);setDxResult(null);}} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 shrink-0" style={{color:'var(--text-muted)'}}>×</button>
              </div>
              <div className="p-4 max-h-56 md:max-h-64 overflow-y-auto">
                {dxLoading?(<div className="space-y-2">{[...Array(5)].map((_,i)=><div key={i} className={`h-2.5 shimmer ${i%3===2?'w-2/3':'w-full'}`}/>)}</div>)
                  :dxResult?(<div className="response-prose text-sm text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{__html:`<p>${fmt(dxResult)}</p>`}}/>):null}
              </div>
            </div>
          )}

          {/* Query */}
          <div className="glass rounded-2xl p-3 md:p-4">
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <textarea value={query} onChange={e=>setQuery(e.target.value)} rows={2}
                className="flex-1 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-sm resize-none focus:outline-none transition-all"
                style={inputStyle}
                onFocus={e=>{e.target.style.borderColor='rgba(61,139,255,0.5)';e.target.style.boxShadow='0 0 0 3px rgba(61,139,255,0.08)';}}
                onBlur={e=>{e.target.style.borderColor='rgba(61,139,255,0.2)';e.target.style.boxShadow='none';}}
                placeholder="Ask a clinical question..."/>
              <button onClick={run} disabled={loading||!query.trim()}
                className="sm:self-stretch px-5 md:px-7 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2 shrink-0"
                style={{background:loading?'rgba(30,60,140,0.6)':'linear-gradient(135deg,#1d4ed8,#3d8bff)',boxShadow:loading?'none':'0 0 24px rgba(61,139,255,0.35)'}}>
                {loading?(<><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Running...</>):'▶ Run'}
              </button>
            </div>
            <p className="mt-2 text-[11px]" style={{color:'var(--text-muted)'}}>Injects RSSDI/CSI + Indian drugs (₹) + safety checks before Claude responds</p>
          </div>

          {error&&<div className="rounded-xl px-4 py-3 text-sm text-rose-400" style={{background:'rgba(244,63,94,0.08)',border:'1px solid rgba(244,63,94,0.25)'}}>⚠ {error}</div>}

          {result&&(
            <div className="space-y-3 animate-in">
              <div className="flex gap-1 w-full sm:w-fit rounded-xl p-1 glass overflow-x-auto">
                {[{id:'comparison',label:'Side-by-Side'},{id:'alerts',label:`Alerts${critCount>0?` (${critCount}🚨)`:''}`},{id:'context',label:'Context'}].map(tab=>(
                  <button key={tab.id} onClick={()=>setView(tab.id as typeof view)}
                    className="px-3 md:px-4 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                    style={view===tab.id?{background:'rgba(61,139,255,0.15)',color:'#a5c8ff',border:'1px solid rgba(61,139,255,0.3)'}:{color:'var(--text-muted)'}}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {view==='comparison'&&(
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {[{label:'Generic AI',resp:result.generic_response,isOC:false},{label:'BRAHMO',resp:result.option_c_response,isOC:true}].map(({label,resp,isOC})=>(
                    <div key={label} className="glass rounded-2xl overflow-hidden" style={isOC?{borderColor:'rgba(61,139,255,0.3)',boxShadow:'0 0 35px rgba(30,80,200,0.12)'}:{}}>
                      <div className="flex items-center gap-2 px-4 py-2.5" style={{borderBottom:`1px solid ${isOC?'rgba(61,139,255,0.15)':'rgba(255,255,255,0.05)'}`,background:isOC?'rgba(20,50,120,0.25)':'rgba(255,255,255,0.02)'}}>
                        <div className={`w-2 h-2 rounded-full ${isOC?'bg-blue-400':'bg-slate-600'}`} style={isOC?{boxShadow:'0 0 8px #3d8bff'}:{}}/>
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${isOC?'text-blue-400':''}`} style={!isOC?{color:'var(--text-muted)'}:{}}>{label}</span>
                        {isOC&&<div className="ml-auto flex gap-1">{result.guideline_sources.slice(0,2).map(s=><span key={s} className="text-[10px] px-1.5 py-0.5 rounded mono text-blue-400 border border-blue-400/20 bg-blue-500/10">{s}</span>)}</div>}
                        {!isOC&&<span className="ml-auto text-[10px] mono" style={{color:'var(--text-muted)'}}>No Indian context</span>}
                      </div>
                      <div className="p-4 max-h-[420px] md:max-h-[500px] overflow-y-auto response-prose">
                        <div className={`text-sm leading-relaxed ${isOC?'text-slate-200':'text-slate-400'}`} dangerouslySetInnerHTML={{__html:`<p>${fmt(resp)}</p>`}}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {view==='alerts'&&(
                <div className="space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-3">
                    {[{label:'CKD Stage',val:result.safety_summary.ckd_stage||'—',c:'text-orange-400'},
                      {label:'eGFR',val:result.safety_summary.egfr?.toString()||'—',c:'text-blue-400'},
                      {label:'CHA₂DS₂-VASc',val:result.safety_summary.cha2ds2_vasc?.toString()||'—',c:'text-purple-400'},
                      {label:'K⁺ Risk',val:result.safety_summary.hyperkalemia_risk||'low',c:['critical','high'].includes(result.safety_summary.hyperkalemia_risk||'')?'text-rose-400':'text-emerald-400'},
                    ].map(m=>(
                      <div key={m.label} className="glass rounded-xl p-2.5 md:p-3 text-center">
                        <div className={`text-base md:text-xl font-bold mono ${m.c}`}>{m.val}</div>
                        <div className="text-[10px] mt-0.5" style={{color:'var(--text-muted)'}}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                  {result.safety_alerts.map((a,i)=>{
                    const s=SCFG[a.severity]||SCFG.low;const open=openAlert===i;
                    return(
                      <div key={i} className={`rounded-xl border overflow-hidden ${s.bg} ${a.severity==='critical'?'pulse-danger':''}`}>
                        <button className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 text-left" onClick={()=>setOpenAlert(open?null:i)}>
                          <div className={`w-1 self-stretch rounded-full shrink-0 ${s.bar}`}/><span className="text-sm md:text-base">{s.icon}</span>
                          <span className={`flex-1 text-[11px] md:text-xs font-semibold ${s.text}`}>{a.title}</span>
                          <span style={{color:'var(--text-muted)'}} className="ml-1 text-sm">{open?'−':'+'}</span>
                        </button>
                        {open&&<div className="px-4 pb-3 pl-8 md:pl-11 animate-in">
                          <p className={`text-xs mb-2 opacity-80 ${s.text}`}>{a.detail}</p>
                          <div className={`text-xs font-medium rounded-lg px-3 py-2 bg-black/20 border border-current border-opacity-15 ${s.text}`}>→ {a.action}</div>
                        </div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {view==='context'&&(
                <div className="glass rounded-2xl p-4 md:p-5 space-y-3 md:space-y-4">
                  <p className="text-[10px] mono uppercase tracking-widest" style={{color:'var(--text-muted)'}}>Context injected before LLM responded</p>
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    {[{label:'Guidelines',val:result.context_injected.guidelines_count,icon:'📋',c:'text-blue-400'},
                      {label:'Indian drugs (₹)',val:result.context_injected.drugs_count,icon:'💊',c:'text-emerald-400'},
                      {label:'Interactions',val:result.context_injected.interactions_count,icon:'⚠️',c:'text-amber-400'},
                    ].map(m=>(
                      <div key={m.label} className="glass rounded-xl p-3 md:p-4 text-center">
                        <div className="text-xl md:text-2xl mb-1">{m.icon}</div>
                        <div className={`text-xl md:text-3xl font-bold mono ${m.c}`}>{m.val}</div>
                        <div className="text-[9px] md:text-[11px] mt-1" style={{color:'var(--text-muted)'}}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.guideline_sources.map(s=><span key={s} className="text-xs px-2.5 py-1 rounded-full mono border border-blue-400/20 bg-blue-500/8 text-blue-400">{s}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {loading&&!result&&(
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {['Generic AI','BRAHMO'].map(l=>(
                <div key={l} className="glass rounded-2xl p-4">
                  <div className="text-[11px] mb-3" style={{color:'var(--text-muted)'}}>{l}</div>
                  <div className="space-y-2">{[...Array(7)].map((_,i)=><div key={i} className={`h-2.5 shimmer ${i%3===2?'w-2/3':'w-full'}`}/>)}</div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
