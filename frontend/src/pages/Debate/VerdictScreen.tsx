import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const STATUS_COLOR: Record<string, string> = {
  'Recommended': '#16A34A',
  'Strong Alternative': '#D97706',
  'Not Recommended': '#EF4444',
  'Disqualified': '#7F1D1D',
};

const SEV_CLS: Record<string, string> = {
  CRITICAL: 'bg-red-950 text-red-400 border border-red-500/30',
  HIGH:     'bg-red-900/20 text-red-400 border border-red-500/20',
  MEDIUM:   'bg-amber-900/20 text-amber-400 border border-amber-500/20',
  LOW:      'bg-green-900/20 text-green-400 border border-green-500/20',
};

const AGENT_MAP: Record<string, string> = {
  cfo: 'Chief Financial Officer',
  cto: 'Chief Technology Officer',
  legal: 'General Counsel',
  operations: 'VP of Operations',
  enterprise_arch: 'Chief Architect',
  procurement: 'Head of Procurement',
  digital_lead: 'CDO',
  devils_advocate: "Devil's Advocate",
  bias_detector: 'Bias Detector',
  governance: 'Governance Auditor',
};

function ConfidenceRing({ score }: { score: number }) {
  const r = 54, circ = 2 * Math.PI * r;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#1E1E26" strokeWidth="10"/>
      <motion.circle cx="70" cy="70" r={r} fill="none" stroke="#E8A930" strokeWidth="10"
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - score / 100) }}
        transition={{ duration: 1.6, delay: 0.4, ease: 'easeOut' }}
        style={{ transformOrigin: '70px 70px', transform: 'rotate(-90deg)' }}/>
      <text x="70" y="65" textAnchor="middle" fill="#F0F0F0" fontSize="22" fontWeight="900">{score}</text>
      <text x="70" y="82" textAnchor="middle" fill="#9494A3" fontSize="11" letterSpacing="2">SCORE</text>
    </svg>
  );
}

function RadarChart({ evaluations }: { evaluations: any[] }) {
  const sz = 280, cx = 140, cy = 135, maxR = 80;
  const COLORS = ['#E8A930','#22D3EE','#A78BFA','#F87171','#6EE7B7'];
  const axes = [
    { key: 'technical',  a: -Math.PI/2, label: 'Technical' },
    { key: 'financial',  a:  Math.PI/6, label: 'Financial' },
    { key: 'governance', a: 5*Math.PI/6, label: 'Governance'},
  ];
  const pt = (a: number, v: number) => ({
    x: cx + (v/100)*maxR*Math.cos(a),
    y: cy + (v/100)*maxR*Math.sin(a),
  });
  const poly = (fa: any) => axes.map(ax => { const p = pt(ax.a, fa?.[ax.key]??0); return `${p.x},${p.y}`; }).join(' ');
  const grid = [0.25,0.5,0.75,1].map(f =>
    axes.map(ax => { const p = pt(ax.a,f*100); return `${p.x},${p.y}`; }).join(' ')
  );
  return (
    <div className="flex flex-col items-center gap-6">
      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} className="overflow-visible">
        {grid.map((g,i) => <polygon key={i} points={g} fill="none" stroke="#222230" strokeWidth="1.5"/>)}
        {axes.map(ax => {
          const ep = pt(ax.a, 100);
          return <line key={ax.key} x1={cx} y1={cy} x2={ep.x} y2={ep.y} stroke="#2D2D3D" strokeWidth="1.5"/>;
        })}
        {evaluations.slice(0,5).map((v,i) => (
          <polygon key={v.vendor} points={poly(v.fit_analysis)} fill={COLORS[i]+'12'} stroke={COLORS[i]} strokeWidth="2" opacity={0.9}/>
        ))}
        {axes.map(ax => {
          const lp = pt(ax.a, 118);
          return (
            <text 
              key={ax.key} 
              x={lp.x} 
              y={lp.y} 
              textAnchor="middle" 
              fill="#C0C0D0" 
              fontSize="10" 
              fontWeight="600" 
              letterSpacing="1.5" 
              className="font-sans"
            >
              {ax.label.toUpperCase()}
            </text>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 justify-center">
        {evaluations.slice(0,5).map((v,i) => (
          <div key={v.vendor} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{background:COLORS[i]}}/>
            <span className="text-[12px] text-[#9494A3] font-medium">{v.vendor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VerdictScreen({ verdict }: { verdict: any }) {
  const navigate = useNavigate();
  const evals = [...(verdict.evaluations||[])].sort((a:any,b:any)=>a.rank-b.rank);
  const winner = evals[0];
  const risks  = [...(verdict.risk_register||[])].sort((a:any,b:any)=>{
    const o:any={CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3}; return (o[a.severity]??4)-(o[b.severity]??4);
  });
  const dateStr = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.5}}
      className="min-h-screen overflow-y-auto" style={{background:'#080809',fontFamily:"'Inter',system-ui,sans-serif"}}>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden border-b border-[#1E1E22]"
        style={{background:'linear-gradient(135deg,#0A0A0C 0%,#10080A 60%,#0A0A0C 100%)'}}>
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]"><defs>
          <pattern id="vg" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0L0 0 0 48" fill="none" stroke="#E8A930" strokeWidth="0.6"/>
          </pattern></defs><rect width="100%" height="100%" fill="url(#vg)"/></svg>
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 800px 400px at 40% 50%,rgba(232,169,48,0.07) 0%,transparent 70%)'}}/>

        <div className="relative z-10 max-w-7xl mx-auto px-10 py-16 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-8 bg-[#E8A930]"/>
              <span className="text-[11px] font-bold tracking-[0.35em] text-[#E8A930] uppercase">Decision Intelligence Report · VendorIQ</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] font-black tracking-widest uppercase px-3 py-1 rounded-full border"
                style={{color:'#16A34A',borderColor:'#16A34A40',background:'#16A34A0D'}}>✓ Recommended</span>
              <span className="text-[13px] text-[#9494A3]">Rank #1 · {evals.length} vendors evaluated</span>
            </div>
            <h1 className="text-[64px] lg:text-[88px] font-black text-[#F0F0F0] tracking-tight leading-none mb-5"
              style={{textShadow:'0 0 80px rgba(232,169,48,0.12)'}}>
              {winner?.vendor}
            </h1>
            <p className="text-[16px] text-[#A0A0A8] leading-relaxed max-w-xl">{verdict.executive_summary}</p>
          </div>
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <ConfidenceRing score={winner?.score??0}/>
            <div className="text-center">
              <div className="text-[11px] tracking-[0.25em] text-[#9494A3] uppercase">Debate Quality</div>
              <div className="text-[20px] font-black text-[#E8A930]">{Math.round((verdict.debate_quality_score||0)*100)}%</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-[#E8A930]/10 bg-[#E8A930]/[0.02] px-10 py-4">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <span className="text-[11px] font-bold text-[#E8A930] tracking-[0.25em] uppercase whitespace-nowrap">Board Directive</span>
            <div className="h-px flex-1 bg-[#1E1E22]"/>
            <span className="text-[15px] text-[#D0D0D8] italic">"{verdict.strategic_recommendation}"</span>
          </div>
        </div>
      </div>

      {/* ── METRICS BAR ── */}
      <div className="bg-[#0D0D0F] border-b border-[#1E1E22]">
        <div className="max-w-7xl mx-auto px-10 py-4 flex flex-wrap gap-10">
          {[
            {label:'Vendors Assessed', value:evals.length},
            {label:'Risk Signals',     value:risks.length},
            {label:'Critical Risks',   value:risks.filter((r:any)=>r.severity==='CRITICAL').length},
            {label:'Decision Score',   value:`${winner?.score}/100`},
            {label:'Report Date',      value:dateStr},
            {label:'Most Influential', value:AGENT_MAP[String(verdict.most_influential_agent).toLowerCase()] || verdict.most_influential_agent || '—'},
          ].map(m=>(
            <div key={m.label}>
              <div className="text-[11px] text-[#9494A3] uppercase tracking-widest mb-0.5">{m.label}</div>
              <div className="text-[18px] font-bold text-[#E8E8F0]">{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-10 pb-20">

        {/* ── RANKING TABLE + RADAR ── */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Table */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-[12px] font-bold text-[#9494A3] uppercase tracking-widest">Executive Ranking Matrix</h2>
              <div className="h-px flex-1 bg-[#1E1E22]"/>
            </div>
            <div className="rounded-2xl border border-[#1E1E22] overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-[#0D0D0F] border-b border-[#1E1E22]">
                    {['#','Vendor','Score','Tech','Fin','Gov','Status'].map(h=>(
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-[#9494A3] uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {evals.map((v:any,i:number)=>{
                    const c=STATUS_COLOR[v.status]||'#6B6B72';
                    return (
                      <tr key={v.vendor} className={`border-b border-[#1E1E22] ${i===0?'bg-[#E8A930]/[0.04]':'bg-[#09090B]'} hover:bg-[#111115] transition-colors`}>
                        <td className="px-4 py-3">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black ${i===0?'bg-[#E8A930] text-[#080809]':'bg-[#1A1A20] text-[#4B4B60]'}`}>{v.rank}</div>
                        </td>
                        <td className="px-4 py-3 font-bold text-[#E8E8F0]">{v.vendor}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1 bg-[#1A1A20] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{width:`${v.score}%`,background:i===0?'#E8A930':'#3A3A45'}}/>
                            </div>
                            <span className="text-[#E8E8F0] font-bold">{v.score}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#A0A0A8]">{v.fit_analysis?.technical??'—'}</td>
                        <td className="px-4 py-3 text-[#A0A0A8]">{v.fit_analysis?.financial??'—'}</td>
                        <td className="px-4 py-3 text-[#A0A0A8]">{v.fit_analysis?.governance??'—'}</td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
                            style={{color:c,borderColor:`${c}40`,background:`${c}10`}}>{v.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Radar */}
          <div className="bg-[#0D0D0F] border border-[#1E1E22] rounded-2xl p-6 flex flex-col items-center justify-center">
            <h3 className="text-[11px] font-bold text-[#9494A3] uppercase tracking-widest mb-6 text-center">Multi-Dimensional Analysis</h3>
            <RadarChart evaluations={evals}/>
          </div>
        </div>

        {/* ── VENDOR DEEP-DIVES ── */}
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-[12px] font-bold text-[#9494A3] uppercase tracking-widest">Vendor Intelligence Briefs</h2>
            <div className="h-px flex-1 bg-[#1E1E22]"/>
          </div>
          <div className="flex flex-col gap-6">
            {evals.map((v:any,i:number)=>{
              const c=STATUS_COLOR[v.status]||'#6B6B72';
              const isTop=v.rank===1;
              return (
                <motion.div key={v.vendor} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1*i}}
                  className={`rounded-2xl border ${isTop?'border-[#E8A930]/25':'border-[#1E1E22]'} bg-[#0D0D0F] overflow-hidden`}>
                  {/* Card header */}
                  <div className={`px-8 py-5 border-b border-[#1E1E22] flex items-center gap-5 ${isTop?'bg-[#E8A930]/[0.03]':''}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[16px] font-black ${isTop?'bg-[#E8A930] text-[#080809]':'bg-[#1A1A20] text-[#4B4B60]'}`}>{v.rank}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-[22px] font-black text-[#F0F0F0]">{v.vendor}</h3>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border"
                          style={{color:c,borderColor:`${c}35`,background:`${c}0D`}}>{v.status}</span>
                      </div>
                      <div className="text-[13px] text-[#C0C0C8] mt-0.5 font-medium">Decision Score: <b className="text-[#E8E8F0]">{v.score}/100</b></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      {[['Technical',v.fit_analysis?.technical],['Financial',v.fit_analysis?.financial],['Governance',v.fit_analysis?.governance]].map(([k,val])=>(
                        <div key={String(k)}>
                          <div className="text-[18px] font-black" style={{color:isTop?'#E8A930':'#6B6B72'}}>{val}</div>
                          <div className="text-[10px] text-[#9494A3] uppercase tracking-wider">{k}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Buyer Fit Banner */}
                  {v.buyer_fit_summary && (
                    <div className="px-8 py-3 bg-[#111114] border-b border-[#1E1E22]">
                       <span className="text-[10px] font-bold text-[#E8A930] uppercase tracking-[0.15em] mr-3">Buyer Alignment</span>
                       <span className="text-[13px] text-[#D1D1DB] italic font-medium">{v.buyer_fit_summary}</span>
                    </div>
                  )}
                  {/* Card body */}
                  <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                      <h4 className="text-[11px] font-bold text-[#9494A3] uppercase tracking-widest mb-3">Strategic Rationale</h4>
                      <p className="text-[14px] text-[#C0C0C8] leading-relaxed mb-4">{v.justification}</p>
                      
                      {v.key_deciding_arguments?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#1E1E22]">
                          <h5 className="text-[10px] font-bold text-[#E8A930] uppercase tracking-widest mb-3">Key Deciding Arguments</h5>
                          <ul className="space-y-2">
                            {v.key_deciding_arguments.map((arg: string, ai: number) => (
                              <li key={ai} className="text-[12px] text-[#8E8E9F] flex items-start gap-2">
                                <span className="text-[#E8A930] mt-1">•</span>{arg}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-[#16A34A] uppercase tracking-widest mb-3">Advantages</h4>
                      <ul className="space-y-2">
                        {v.pros?.slice(0,4).map((p:string,pi:number)=>(
                          <li key={pi} className="text-[13px] text-[#C0C0C8] flex items-start gap-2">
                            <span className="text-[#16A34A] mt-0.5 flex-shrink-0">✓</span>{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-[#EF4444] uppercase tracking-widest mb-3">Risk Factors</h4>
                      <ul className="space-y-2">
                        {v.cons?.slice(0,4).map((c:string,ci:number)=>(
                          <li key={ci} className="text-[13px] text-[#C0C0C8] flex items-start gap-2">
                            <span className="text-[#EF4444] mt-0.5 flex-shrink-0">!</span>{c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── RISK REGISTER ── */}
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-[12px] font-bold text-[#C0C0C8] uppercase tracking-widest">Enterprise Risk Register</h2>
            <div className="h-px flex-1 bg-[#1E1E22]"/>
            <span className="text-[11px] text-[#9494A3] font-bold">{risks.length} signals detected</span>
          </div>
          <div className="rounded-2xl border border-[#1E1E22] overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#0D0D0F] border-b border-[#1E1E22]">
                  {['Severity','Risk','Mitigation','Raised By'].map(h=>(
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-[#9494A3] uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {risks.map((r:any,i:number)=>(
                  <tr key={i} className="border-b border-[#1E1E22] bg-[#09090B] hover:bg-[#0F0F13] transition-colors">
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${SEV_CLS[r.severity]||SEV_CLS.LOW}`}>{r.severity}</span>
                    </td>
                    <td className="px-5 py-4 text-[#C0C0C8] max-w-xs">{r.risk}</td>
                    <td className="px-5 py-4 text-[#A0A0A8] max-w-xs">{r.mitigation}</td>
                    <td className="px-5 py-4 text-[#9494A3] text-[13px]">{r.raised_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── CONDITIONS + DISSENT ── */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-[12px] font-bold text-[#9494A3] uppercase tracking-widest">Conditions Before Signing</h2>
              <div className="h-px flex-1 bg-[#1E1E22]"/>
            </div>
            <div className="flex flex-col gap-3">
              {verdict.conditions_before_signing?.map((c:string,i:number)=>(
                <div key={i} className="flex items-start gap-4 bg-[#0D0D0F] border border-[#1E1E22] rounded-xl px-5 py-4">
                  <div className="w-6 h-6 rounded-full bg-[#E8A930]/10 border border-[#E8A930]/30 flex items-center justify-center text-[10px] font-black text-[#E8A930] flex-shrink-0">{i+1}</div>
                  <p className="text-[14px] text-[#C0C0C8] leading-relaxed">{c}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-[12px] font-bold text-[#9494A3] uppercase tracking-widest">Strategic Dissent</h2>
              <div className="h-px flex-1 bg-[#1E1E22]"/>
            </div>
            <div className="bg-[#0D0D0F] border border-[#E8A930]/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold text-[#E8A930] tracking-widest uppercase">⚠ Minority Position</span>
                <span className="text-[11px] text-[#9494A3]">— {verdict.minority_dissent?.agent}</span>
              </div>
              <p className="text-[14px] text-[#C0C0C8] italic mb-4 leading-relaxed">"{verdict.minority_dissent?.argument}"</p>
              <div className="border-t border-[#1E1E22] pt-4">
                <div className="text-[11px] text-[#9494A3] uppercase tracking-widest mb-1">Overruled Because</div>
                <p className="text-[13px] text-[#A0A0A8] leading-relaxed">{verdict.minority_dissent?.mitigation_plan}</p>
              </div>
            </div>
            {verdict.governance_flags?.length > 0 && (
              <div className="mt-4 bg-[#0D0D0F] border border-[#1E1E22] rounded-xl p-5">
                <div className="text-[11px] font-bold text-[#9494A3] uppercase tracking-widest mb-3">Governance Flags</div>
                {verdict.governance_flags.map((f:string,i:number)=>(
                  <div key={i} className="flex items-start gap-2 mb-2">
                    <span className="text-[#E8A930] text-[10px] flex-shrink-0">⚑</span>
                    <p className="text-[13px] text-[#A0A0A8]">{f}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── BIAS & DEBATE AUDIT ── */}
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-[12px] font-bold text-[#9494A3] uppercase tracking-widest">AI Fairness & Neutrality Audit</h2>
            <div className="h-px flex-1 bg-[#1E1E22]"/>
          </div>
          <div className="bg-[#0D0D0F] border border-[#1E1E22] rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#E8A930" strokeWidth="1">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                <path d="M12 8V12" /><path d="M12 16H12.01" />
              </svg>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              <div className="lg:col-span-1">
                <div className="text-[11px] text-[#9494A3] uppercase tracking-widest mb-2">Neutrality Engine Score</div>
                <div className="text-[48px] font-black text-[#E8A930] leading-none">{(verdict.debate_quality_score * 100).toFixed(0)}%</div>
                <p className="text-[12px] text-[#4B4B60] mt-4 leading-relaxed">
                  The moderator analyzed 32+ interaction signals to ensure adversarial voices didn't override empirical data.
                </p>
              </div>
              <div className="lg:col-span-3">
                <h4 className="text-[13px] font-bold text-[#F0F0F0] mb-3">Bias Mitigation Summary</h4>
                <p className="text-[14px] text-[#A0A0A8] leading-relaxed mb-6">
                  {verdict.bias_impact_summary}
                </p>
                <div className="flex gap-8">
                   <div>
                      <div className="text-[10px] text-[#9494A3] uppercase tracking-widest mb-1">Most Influential Vector</div>
                      <div className="text-[14px] font-bold text-[#E8E8F0]">{AGENT_MAP[String(verdict.most_influential_agent).toLowerCase()] || verdict.most_influential_agent || '—'}</div>
                   </div>
                   <div className="h-10 w-px bg-[#1E1E22]"/>
                   <div>
                      <div className="text-[10px] text-[#9494A3] uppercase tracking-widest mb-1">Dissent Impact</div>
                      <div className="text-[14px] font-bold text-[#E8E8F0]">Acknowledged & Mitigated</div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="mt-16 pt-8 border-t border-[#1E1E22] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-black text-[#E8A930] tracking-widest">VENDOR<span className="text-[#F0F0F0]">IQ</span></div>
            <div className="text-[11px] text-[#9494A3] mt-0.5">AI-powered procurement intelligence · {dateStr}</div>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>navigate('/generate')}
              className="px-6 py-2.5 border border-[#1E1E22] text-[#6B6B72] text-[12px] rounded-full hover:text-[#F0F0F0] hover:border-[#4B4B60] transition-all">
              New Simulation
            </button>
            <button onClick={()=>window.print()}
              className="px-6 py-2.5 bg-[#E8A930] text-[#080809] text-[12px] font-bold rounded-full hover:bg-[#F0B83A] transition-all shadow-[0_0_24px_rgba(232,169,48,0.25)]">
              Export PDF Report
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
