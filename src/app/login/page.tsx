'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function ECGLine() {
  return (
    <svg className="absolute bottom-0 left-0 right-0 opacity-20" height="80" viewBox="0 0 1200 80" preserveAspectRatio="none">
      <path d="M0 50 L100 50 L120 50 L130 30 L140 70 L150 10 L160 65 L170 50 L200 50 L220 50 L230 35 L240 65 L250 20 L260 60 L270 50 L300 50 L320 50 L330 30 L340 70 L350 10 L360 65 L370 50 L400 50 L420 50 L430 35 L440 65 L450 20 L460 60 L470 50 L500 50 L520 50 L530 30 L540 70 L550 10 L560 65 L570 50 L600 50 L620 50 L630 35 L640 65 L650 20 L660 60 L670 50 L700 50 L720 50 L730 30 L740 70 L750 10 L760 65 L770 50 L800 50 L820 50 L830 35 L840 65 L850 20 L860 60 L870 50 L900 50 L920 50 L930 30 L940 70 L950 10 L960 65 L970 50 L1000 50 L1020 50 L1030 35 L1040 65 L1050 20 L1060 60 L1070 50 L1100 50 L1120 50 L1130 30 L1140 70 L1150 10 L1160 65 L1170 50 L1200 50"
        fill="none" stroke="rgba(61,139,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode,     setMode]     = useState<'signin'|'signup'>('signin');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase().auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/');
      else setChecking(false);
    });
  }, [router]);

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      if (mode === 'signup') {
        const { error: e } = await supabase().auth.signUp({
          email, password,
          options: { data: { full_name: name } },
        });
        if (e) throw e;
        setError('✅ Account created! Check your email to confirm, then sign in.');
        setMode('signin'); setLoading(false); return;
      } else {
        const { error: e } = await supabase().auth.signInWithPassword({ email, password });
        if (e) throw e;
        router.replace('/');
        return;
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background:'#04080f'}}>
        <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"/>
      </div>
    );
  }

  const inputSt: React.CSSProperties = {
    width:'100%', padding:'11px 14px', borderRadius:'10px',
    background:'rgba(255,255,255,0.04)', border:'1px solid rgba(61,139,255,0.2)',
    color:'#dce8ff', fontSize:'14px', outline:'none', fontFamily:'DM Sans,sans-serif',
    transition:'border-color .2s',
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{background:'linear-gradient(160deg,#04080f 0%,#060c1a 50%,#04080f 100%)'}}>

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(30,70,180,0.15) 0%, transparent 70%)'
      }}/>
      <ECGLine/>

      {/* Star dots */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage:'radial-gradient(1px 1px at 15% 20%, rgba(255,255,255,0.3) 0%,transparent 100%), radial-gradient(1px 1px at 75% 15%, rgba(180,210,255,0.25) 0%,transparent 100%), radial-gradient(1.5px 1.5px at 40% 70%, rgba(255,255,255,0.2) 0%,transparent 100%), radial-gradient(1px 1px at 85% 65%, rgba(180,210,255,0.2) 0%,transparent 100%), radial-gradient(1px 1px at 25% 85%, rgba(255,255,255,0.15) 0%,transparent 100%)'
      }}/>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm mx-4" style={{
        background:'rgba(10,18,35,0.85)', backdropFilter:'blur(20px)',
        border:'1px solid rgba(61,139,255,0.2)', borderRadius:'20px',
        boxShadow:'0 0 60px rgba(30,80,200,0.2), 0 24px 48px rgba(0,0,0,0.5)',
        overflow:'hidden',
      }}>
        {/* Top edge shine */}
        <div style={{height:'1px',background:'linear-gradient(90deg,transparent,rgba(120,180,255,0.4),transparent)'}}/>

        <div style={{padding:'36px 32px 32px'}}>
          {/* Logo + brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-3 mb-2">
              <svg width="40" height="40" viewBox="0 0 36 36" fill="none">
                <defs>
                  <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#3d8bff"/><stop offset="100%" stopColor="#6366f1"/></linearGradient>
                  <linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#5dffc3"/><stop offset="100%" stopColor="#3d8bff"/></linearGradient>
                  <filter id="glow2"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                </defs>
                <rect width="36" height="36" rx="10" fill="url(#lg1)" opacity="0.9"/>
                <rect width="36" height="36" rx="10" fill="none" stroke="rgba(120,180,255,0.35)" strokeWidth="0.8"/>
                <text x="5.5" y="22" fontSize="17" fontWeight="800" fontFamily="DM Sans,sans-serif" fill="white">B</text>
                <circle cx="24" cy="7" r="1.8" fill="none" stroke="url(#lg2)" strokeWidth="1.2"/>
                <circle cx="30" cy="7" r="1.8" fill="none" stroke="url(#lg2)" strokeWidth="1.2"/>
                <path d="M24 8.8C24 12,22 13,22 16C22 19.5,24.5 21,27 21C29.5 21,32 19.5,32 16C32 13,30 12,30 8.8" fill="none" stroke="url(#lg2)" strokeWidth="1.3" strokeLinecap="round"/>
                <circle cx="27" cy="21.5" r="3" fill="none" stroke="url(#lg2)" strokeWidth="1.3"/>
                <circle cx="27" cy="21.5" r="1.2" fill="url(#lg2)" opacity="0.7"/>
                <path d="M4 30L8 30L9.5 27L11 33L12.5 26L14 30L18 30" fill="none" stroke="url(#lg2)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow2)"/>
              </svg>
              <div>
                <h1 style={{color:'white',fontSize:'22px',fontWeight:'800',letterSpacing:'-0.5px',lineHeight:1}}>BRAHMO</h1>
                <p style={{color:'rgba(100,140,200,0.8)',fontSize:'11px',fontFamily:'JetBrains Mono,monospace',marginTop:'2px'}}>India Clinical AI</p>
              </div>
            </div>
            <p style={{color:'rgba(100,130,180,0.7)',fontSize:'12px',marginTop:'4px'}}>
              {mode==='signin' ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex mb-6 rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(61,139,255,0.12)'}}>
            {(['signin','signup'] as const).map(m => (
              <button key={m} onClick={()=>{setMode(m);setError('');}}
                className="flex-1 py-2.5 text-xs font-semibold transition-all"
                style={mode===m
                  ?{background:'rgba(61,139,255,0.2)',color:'#7eb8ff',borderBottom:'2px solid #3d8bff'}
                  :{color:'rgba(100,130,180,0.6)',borderBottom:'2px solid transparent'}}>
                {m==='signin'?'Sign In':'Sign Up'}
              </button>
            ))}
          </div>

          {/* Form */}
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {mode==='signup' && (
              <div>
                <label style={{color:'rgba(100,140,200,0.7)',fontSize:'11px',display:'block',marginBottom:'5px'}}>Full Name</label>
                <input style={inputSt} value={name} onChange={e=>setName(e.target.value)}
                  placeholder="Dr. Animesh Tiwari"
                  onFocus={e=>{e.target.style.borderColor='rgba(61,139,255,0.5)';e.target.style.boxShadow='0 0 0 3px rgba(61,139,255,0.08)';}}
                  onBlur={e=>{e.target.style.borderColor='rgba(61,139,255,0.2)';e.target.style.boxShadow='none';}}/>
              </div>
            )}
            <div>
              <label style={{color:'rgba(100,140,200,0.7)',fontSize:'11px',display:'block',marginBottom:'5px'}}>Email</label>
              <input style={inputSt} type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="doctor@apollo.com"
                onFocus={e=>{e.target.style.borderColor='rgba(61,139,255,0.5)';e.target.style.boxShadow='0 0 0 3px rgba(61,139,255,0.08)';}}
                onBlur={e=>{e.target.style.borderColor='rgba(61,139,255,0.2)';e.target.style.boxShadow='none';}}
                onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
            </div>
            <div>
              <label style={{color:'rgba(100,140,200,0.7)',fontSize:'11px',display:'block',marginBottom:'5px'}}>Password</label>
              <input style={inputSt} type="password" value={password} onChange={e=>setPassword(e.target.value)}
                placeholder="••••••••"
                onFocus={e=>{e.target.style.borderColor='rgba(61,139,255,0.5)';e.target.style.boxShadow='0 0 0 3px rgba(61,139,255,0.08)';}}
                onBlur={e=>{e.target.style.borderColor='rgba(61,139,255,0.2)';e.target.style.boxShadow='none';}}
                onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
            </div>
          </div>

          {/* Error / success */}
          {error && (
            <div style={{
              marginTop:'12px', padding:'10px 12px', borderRadius:'10px', fontSize:'12px',
              background: error.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
              border: `1px solid ${error.startsWith('✅') ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`,
              color: error.startsWith('✅') ? '#34d399' : '#f87171',
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading||!email||!password}
            style={{
              width:'100%', marginTop:'20px', padding:'12px', borderRadius:'12px',
              background: loading ? 'rgba(30,60,140,0.6)' : 'linear-gradient(135deg,#1d4ed8,#3d8bff)',
              boxShadow: loading ? 'none' : '0 0 24px rgba(61,139,255,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
              color:'white', fontWeight:'700', fontSize:'14px', border:'none', cursor:'pointer',
              opacity: (!email||!password) ? 0.5 : 1, transition:'all .2s',
              fontFamily:'DM Sans,sans-serif',
            }}>
            {loading ? (
              <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                <svg style={{animation:'spin 1s linear infinite',width:'16px',height:'16px'}} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25"/>
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                </svg>
                {mode==='signin' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (mode==='signin' ? 'Sign In →' : 'Create Account →')}
          </button>

          {/* Footer */}
          <div style={{marginTop:'20px',textAlign:'center'}}>
            <p style={{fontSize:'11px',color:'rgba(80,110,160,0.5)'}}>© 2026 Animesh Tiwari</p>
          </div>
        </div>

        {/* Bottom ECG */}
        <div style={{height:'3px',background:'linear-gradient(90deg,transparent,rgba(61,139,255,0.3),rgba(93,255,195,0.3),transparent)'}}/>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
      `}</style>
    </div>
  );
}
