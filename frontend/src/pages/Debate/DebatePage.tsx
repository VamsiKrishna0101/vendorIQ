import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Activity, ArrowLeft } from 'lucide-react';
import { RoundTimeline, type Phase } from '../../components/debate/RoundTimeline';
import { RoundTransition } from '../../components/debate/RoundTransition';
import { AgentCardCompact } from '../../components/debate/AgentCardCompact';
import { InsightPanel } from '../../components/debate/InsightPanel';
import { StreamingText } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';

// For the UI, we still want to structure agents logically.
// The backend assigns IDs based on our graph structure.
// We'll define the expected agents here to map incoming data.
const EXPECTED_AGENTS = [
  // Decision — IDs must match backend graph exactly
  { id: 'cfo',            name: 'Chief Financial Officer',    group: 'decision',    initials: 'FI', role: 'Financial Strategy',       personality: 'Pragmatic & ROI-focused' },
  { id: 'cto',            name: 'Chief Technology Officer',   group: 'decision',    initials: 'TE', role: 'Technical Architecture',     personality: 'Innovative & Scalable' },
  { id: 'legal',          name: 'General Counsel',            group: 'decision',    initials: 'LE', role: 'Risk & Compliance',          personality: 'Cautious & Protective' },
  { id: 'operations',     name: 'VP of Operations',           group: 'decision',    initials: 'OP', role: 'Execution',                  personality: 'Efficiency-driven' },
  { id: 'enterprise_arch',name: 'Chief Architect',            group: 'decision',    initials: 'AR', role: 'System Design',              personality: 'Standards-focused' },
  { id: 'procurement',    name: 'Head of Procurement',        group: 'decision',    initials: 'PR', role: 'Vendor Relations',           personality: 'Negotiator' },
  { id: 'digital_lead',   name: 'CDO',                        group: 'decision',    initials: 'DI', role: 'Digital Transformation',     personality: 'Forward-looking' },
  // Customer
  { id: 'positive_rep',   name: 'Champion User',              group: 'customer',    initials: 'CU', role: 'Advocate',                   personality: 'Enthusiastic' },
  { id: 'negative_rep',   name: 'Detractor User',             group: 'customer',    initials: 'DU', role: 'Skeptic',                    personality: 'Critical' },
  { id: 'neutral_rep',    name: 'Average User',               group: 'customer',    initials: 'AU', role: 'Mainstream',                 personality: 'Balanced' },
  // Adversarial — IDs must match backend exactly
  { id: 'devils_advocate',name: "Devil's Advocate",           group: 'adversarial', initials: 'DA', role: 'Contrarian',                 personality: 'Challenger' },
  { id: 'bias_detector',  name: 'Bias Detector',              group: 'adversarial', initials: 'BD', role: 'Neutrality',                 personality: 'Objective' },
  { id: 'governance',     name: 'Governance Auditor',         group: 'adversarial', initials: 'GA', role: 'Policy',                     personality: 'Strict' },
];

const ANALYSTS = [
  { id: 'financial', name: 'Financial Analyst', initials: 'FA' },
  { id: 'technical', name: 'Technical Analyst', initials: 'TA' },
  { id: 'compliance', name: 'Compliance Analyst', initials: 'CA' },
  { id: 'market', name: 'Market Analyst', initials: 'MA' },
  { id: 'customer_sentiment', name: 'Customer Sentiment', initials: 'CS' },
];

const PHASES: Phase[] = ['document-intelligence', 'round1', 'round2', 'round3', 'adversarial', 'synthesis'];

export function DebatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const session_id = searchParams.get('session_id');
  const replay_id  = searchParams.get('replay');       // replay mode
  const active_id  = session_id || replay_id;          // whichever is set
  const isReplay   = !!replay_id && !session_id;
  const { token } = useAuth();

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [showTransition, setShowTransition] = useState(!isReplay); // no transition on replay
  const [elapsed, setElapsed] = useState(0);
  
  // Real-time state
  const [streamTexts, setStreamTexts] = useState<Record<string, string>>({});
  const [agentStatuses, setAgentStatuses] = useState<Record<string, 'idle' | 'thinking' | 'speaking' | 'done'>>({});
  const [analystProgress, setAnalystProgress] = useState<Record<string, number>>({});
  const [feed, setFeed] = useState<any[]>([]);
  const [biasScores, setBiasScores] = useState<Record<string, number>>({});
  const [agentPicks, setAgentPicks] = useState<Record<string, string>>({});
  
  const [verdictData, setVerdictData] = useState<any>(null);
  const [showVerdict, setShowVerdict] = useState(false);

  const phase = PHASES[phaseIdx];
  const eventSourceRef = useRef<EventSource | null>(null);

  // Timer
  useEffect(() => {
    if (showVerdict) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [showVerdict]);

  // Connect to SSE (live stream OR replay)
  useEffect(() => {
    if (!active_id || !token) return;

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Choose endpoint based on mode
    const url = isReplay
      ? `http://localhost:8000/debate/replay/${active_id}`   // replay: no token needed, instant dump
      : `http://localhost:8000/debate/stream/${active_id}?token=${token}`; // live stream

    const sse = new EventSource(url);
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleEvent(data);
      } catch (err) {
        console.error('Failed to parse SSE message', err);
      }
    };

    sse.onerror = () => {
      // SSE error — connection dropped or session not found
      sse.close();
    };

    return () => {
      sse.close();
    };
  }, [active_id, token]);

  const handleEvent = (data: any) => {
    const agentId = (data.agent_id || '').toLowerCase();

    // Helper: extract a readable string from JSON content
    const extractReadable = (content: any): string => {
      if (!content) return '';
      if (typeof content === 'string') {
        // Try to parse as JSON and extract a summary field
        try {
          const parsed = JSON.parse(content);
          // Pick the most readable field from the parsed JSON
          return parsed.strongest_argument
            || parsed.reinforced_argument
            || parsed.final_recommendation
            || parsed.recommendation
            || parsed.executive_summary
            || parsed.experience_summary
            || parsed.audit_summary
            || Object.values(parsed).find(v => typeof v === 'string' && (v as string).length > 20)
            || content.slice(0, 200);
        } catch {
          // Not JSON — return raw but clip it nicely
          return content;
        }
      }
      if (typeof content === 'object') {
        return content.strongest_argument
          || content.reinforced_argument
          || content.final_recommendation
          || content.recommendation
          || content.executive_summary
          || content.experience_summary
          || JSON.stringify(content).slice(0, 200);
      }
      return String(content);
    };

    // 1. Add to activity feed for major events
    if (data.event_type === 'agent_started' || data.event_type === 'phase_change' || data.event_type === 'agent_completed') {
      const agentDef = EXPECTED_AGENTS.find(a => a.id === agentId);
      const label = data.event_type === 'phase_change'
        ? `Phase ${data.round_number} started`
        : data.event_type === 'agent_completed'
        ? `${agentDef?.name || agentId} completed`
        : `${agentDef?.name || agentId} started analysis`;
      setFeed(prev => [{
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message: label,
        type: data.event_type === 'phase_change' ? 'system' :
              data.event_type === 'agent_completed' ? 'success' : 'analysis'
      }, ...prev].slice(0, 20));
    }

    // 2. Handle Phase changes
    if (data.event_type === 'phase_change') {
      const r = parseInt(data.round_number);
      if (!isNaN(r) && r >= 0 && r < PHASES.length) {
        setPhaseIdx(r);
        // Show transition animation for both live and replay (adds premium feel)
        setShowTransition(true);
        setAgentStatuses(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(k => next[k] = 'idle');
          return next;
        });
        // Transition auto-dismisses in 2.8s
      }
    }

    // 3. Handle agent_started — set status to thinking
    if (data.event_type === 'agent_started') {
      setAgentStatuses(prev => ({ ...prev, [agentId]: 'thinking' }));
    }

    // 4. Handle agent_thinking
    if (data.event_type === 'agent_thinking') {
      setAgentStatuses(prev => ({ ...prev, [agentId]: 'thinking' }));
      setStreamTexts(prev => ({ ...prev, [agentId]: extractReadable(data.content) }));
    }

    // 5. Handle chunk streaming — APPEND, don't replace
    if (data.event_type === 'agent_chunk') {
      setAgentStatuses(prev => ({ ...prev, [agentId]: 'speaking' }));

      const chunk = typeof data.content === 'string' ? data.content : '';

      if (data.round_number === 0) {
        // Phase 0 analyst streaming
        setStreamTexts(prev => ({ ...prev, [agentId]: (prev[agentId] || '') + chunk }));
        setAnalystProgress(prev => {
          const cur = prev[agentId] || 0;
          return { ...prev, [agentId]: Math.min(99, cur + Math.random() * 5) };
        });
      } else {
        // Debate rounds — append raw chunk for streaming feel, but show clean text
        setStreamTexts(prev => ({ ...prev, [agentId]: (prev[agentId] || '') + chunk }));
        setBiasScores(prev => ({
          ...prev,
          [agentId]: Math.max(10, Math.min(90, (prev[agentId] || 50) + (Math.random() - 0.5) * 4))
        }));
      }
    }

    // 6. Handle agent completion — extract clean summary from JSON result
    if (data.event_type === 'agent_completed') {
      setAgentStatuses(prev => ({ ...prev, [agentId]: 'done' }));

      if (data.round_number === 0) {
        setAnalystProgress(prev => ({ ...prev, [agentId]: 100 }));
        setStreamTexts(prev => ({
          ...prev,
          [agentId]: 'Extraction complete. Data structured and saved.'
        }));
      } else {
        // Extract a clean readable summary from the metadata/result
        const meta = data.metadata || {};
        const parsedOut = meta.parsed_output || {};
        const summary =
          // Decision agents
          parsedOut.reinforced_argument
          || parsedOut.strongest_argument
          || parsedOut.final_recommendation
          || parsedOut.recommendation
          // Customer agents
          || parsedOut.experience_summary
          || parsedOut.key_message_for_committee
          // Adversarial agents
          || parsedOut.governance_verdict
          || parsedOut.strongest_attack
          || parsedOut.overall_assessment
          || parsedOut.bias_evolution_summary
          // Fallback: raw_response text extraction
          || extractReadable(meta.raw_response || '');
        if (summary) {
          setStreamTexts(prev => ({ ...prev, [agentId]: summary }));
        }

        // Real-time sentiment tracking
        const pick = parsedOut.final_recommendation || parsedOut.recommendation || parsedOut.selected_vendor;
        if (pick && typeof pick === 'string' && pick.length > 2) {
          setAgentPicks(prev => ({ ...prev, [agentId]: pick }));
        }

        // Update bias score from actual confidence (only if meaningful)
        const conf = meta.confidence_score;
        if (conf !== undefined && conf !== null) {
          // Normalize: if score is 0–1 range, convert to 0–100
          const normalized = conf <= 1 ? conf * 100 : conf;
          setBiasScores(prev => ({ ...prev, [agentId]: Math.round(normalized * 10) / 10 }));
        }
      }

      // If it's the moderator completing the final synthesis, save verdict
      if (agentId === 'moderator') {
        const meta = data.metadata || {};
        const parsed = meta.parsed_output || {};
        if (parsed.final_recommendation) {
          setVerdictData({
            winner: parsed.final_recommendation,
            summary: parsed.executive_summary || '',
            confidence: Math.round((parsed.decision_confidence?.score || 0) * 100),
            dissenting_opinion: parsed.conflict_resolution?.[0]?.resolution_logic || '',
            vendor_scores: parsed.vendor_scores || {},
            rejected_vendors: parsed.rejected_vendors || [],
            risk_acknowledgement: parsed.risk_acknowledgement || [],
            risk_register: parsed.risk_register || [],
            evaluations: parsed.evaluations || [],
            supporting_agents: parsed.supporting_agents || 0
          });
          setTimeout(() => setShowVerdict(true), 3000);
        }
      }
    }

    // 7. Total debate complete
    if (data.event_type === 'debate_completed') {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (!showVerdict && verdictData) {
        setShowVerdict(true);
      }
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const decisionAgents = EXPECTED_AGENTS.filter(a => a.group === 'decision');
  const customerAgents = EXPECTED_AGENTS.filter(a => a.group === 'customer');
  const adversarialAgents = EXPECTED_AGENTS.filter(a => a.group === 'adversarial');

  // Calculate Live Sentiment
  const pickCounts: Record<string, number> = {};
  Object.values(agentPicks).forEach(p => {
    // Normalize pick name to avoid case/whitespace issues
    const normalized = p.trim();
    pickCounts[normalized] = (pickCounts[normalized] || 0) + 1;
  });

  const sortedPicks = Object.entries(pickCounts).sort((a, b) => b[1] - a[1]);
  const liveWinner = verdictData?.winner || (sortedPicks.length > 0 ? sortedPicks[0][0] : 'Analyzing...');
  const liveConfidence = verdictData?.confidence || (sortedPicks.length > 0 
    ? Math.round((sortedPicks[0][1] / decisionAgents.length) * 100) 
    : 0);
  const supportingCount = verdictData?.supporting_agents || (sortedPicks.length > 0 ? sortedPicks[0][1] : 0);

  if (showVerdict && verdictData) return <VerdictScreen navigate={navigate} verdict={verdictData} />;

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0B] overflow-hidden">
      <RoundTransition round={phaseIdx} visible={showTransition} onDone={() => setShowTransition(false)} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#0D0D0F] border-b border-[#1E1E22] flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-[#374151] hover:text-[#6B6B72] transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-[15px] font-bold text-[#F0F0F0]">Executive Debate</span>
              {isReplay ? (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#6B6B72] bg-[#1E1E22] border border-[#374151] px-2 py-0.5 rounded">
                  ⏪ REPLAY
                </span>
              ) : (
                <motion.span
                  className="flex items-center gap-1.5 text-[11px] font-bold text-[#E8A930] bg-[#E8A930]/10 border border-[#E8A930]/30 px-2 py-0.5 rounded"
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E8A930]" />
                  LIVE
                </motion.span>
              )}
            </div>
            <div className="text-[10px] font-mono text-[#374151]">sess-{active_id?.split('-')[0] || 'unknown'}</div>
          </div>
        </div>

        <div className="font-mono text-[26px] font-bold text-[#E8A930] flex items-center gap-2">
          <Timer size={18} className="opacity-60" />
          {fmt(elapsed)}
        </div>

        <div className="flex items-center gap-2 text-[13px] text-[#A0A0A8]">
          <Activity size={14} className={isReplay ? 'text-[#6B6B72]' : 'text-[#16A34A]'} />
          <span className="font-bold text-[#F0F0F0]">{isReplay ? 'Replay' : 'Live'}</span>
          {isReplay ? 'from database' : 'engine connected'}
        </div>
      </div>

      {/* ── Round Timeline ── */}
      <RoundTimeline currentPhase={phase} />

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center scroll area */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {/* Phase 0 — Analyst cards */}
            {phase === 'document-intelligence' && (
              <motion.div key="analysts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SectionLabel label="Document Intelligence" color="#A0A0A8" />
                <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3 mt-3">
                  {ANALYSTS.map((a, i) => {
                    const pct = analystProgress[a.id] ?? 0;
                    const done = pct >= 100;
                    return (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[#13131A] border rounded-xl p-4 flex flex-col gap-3"
                        style={{ borderColor: done ? 'rgba(22,163,74,0.3)' : '#1E1E22' }}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] ${done ? 'bg-[#16A34A]/20 text-[#16A34A]' : 'bg-[#1C1C21] text-[#E8A930]'}`}>
                            {done ? '✓' : '◎'}
                          </div>
                          <div>
                            <div className="text-[13px] font-bold text-[#F0F0F0]">{a.name}</div>
                            {!done && (
                              <motion.span className="text-[10px] text-[#E8A930]" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
                                ● PROCESSING
                              </motion.span>
                            )}
                            {done && <span className="text-[10px] text-[#16A34A]">Complete</span>}
                          </div>
                        </div>
                        <div className="text-[11px] font-mono text-[#6B6B72] leading-relaxed min-h-[48px] max-h-[100px] overflow-hidden">
                          {streamTexts[a.id] || 'Initializing extraction protocols...'}
                        </div>
                        <div>
                          <div className="h-1.5 bg-[#1A1A1E] rounded-full overflow-hidden">
                            <motion.div
                              animate={{ width: `${pct}%` }}
                              className="h-full rounded-full"
                              style={{ background: done ? '#16A34A' : '#E8A930' }}
                            />
                          </div>
                          <div className="text-[10px] text-[#374151] mt-1">{Math.round(pct)}%</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Rounds 1-3 + adversarial */}
            {phase !== 'document-intelligence' && phase !== 'synthesis' && (
              <motion.div key="debate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">
                
                {/* Decision agents - Hide during pure adversarial/synthesis phases */}
                {phase.startsWith('round') && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <SectionLabel label="Decision Committee" color="#E8A930" />
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-3">
                      {decisionAgents.map((a, i) => (
                        <AgentCardCompact
                          key={a.id} agent={a as any}
                          streamText={streamTexts[a.id]}
                          biasScore={biasScores[a.id] ?? 50}
                          status={agentStatuses[a.id] || 'idle'}
                          isActive={agentStatuses[a.id] === 'speaking' || agentStatuses[a.id] === 'thinking'}
                          delay={i * 0.05}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Customer agents - Hide during adversarial/synthesis */}
                {phase.startsWith('round') && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <SectionLabel label="Customer Panel" color="#16A34A" />
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {customerAgents.map((a, i) => (
                        <AgentCardCompact
                          key={a.id} agent={a as any}
                          streamText={streamTexts[a.id]}
                          biasScore={biasScores[a.id] ?? 50}
                          status={agentStatuses[a.id] || 'idle'}
                          isActive={agentStatuses[a.id] === 'speaking' || agentStatuses[a.id] === 'thinking'}
                          delay={0.2 + i * 0.07}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Adversarial agents - Show during rounds AND the dedicated adversarial phase */}
                {(phase.startsWith('round') || phase === 'adversarial') && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <SectionLabel label="Adversarial Audit" color="#DC2626" />
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {adversarialAgents.map((a, i) => (
                        <AgentCardCompact
                          key={a.id} agent={a as any}
                          streamText={streamTexts[a.id]}
                          biasScore={biasScores[a.id] ?? 50}
                          status={agentStatuses[a.id] || 'idle'}
                          isActive={agentStatuses[a.id] === 'speaking' || agentStatuses[a.id] === 'thinking'}
                          delay={0.3 + i * 0.07}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Insight Panel */}
        <InsightPanel
          phase={phase.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          round={Math.min(phaseIdx, 3)}
          progress={Math.round((phaseIdx / (PHASES.length - 1)) * 100)}
          winner={liveWinner}
          confidence={liveConfidence}
          supportingAgents={supportingCount}
          risks={{
            high: verdictData?.risk_register?.filter((r: any) => r.severity === 'HIGH').length || 0,
            medium: verdictData?.risk_register?.filter((r: any) => r.severity === 'MEDIUM').length || 0,
            low: verdictData?.risk_register?.filter((r: any) => r.severity === 'LOW').length || 0
          }}
          topFindings={verdictData?.evaluations?.map((e: any) => e.justification).slice(0, 2) || ['Extracting insights live...']}
          activityFeed={feed}
          activeAgents={Object.values(agentStatuses).filter(s => s === 'speaking' || s === 'thinking').length}
        />
      </div>

      <div className="flex items-center gap-5 px-6 py-2 bg-[#0D0D0F] border-t border-[#1E1E22] text-[11px] text-[#6B6B72] flex-shrink-0">
        <span>{isReplay ? '⏪ Replay Mode' : 'Live Engine Active'}</span>
        <span className="text-[#1E1E22]">|</span>
        <span>{isReplay ? 'Streaming from DB' : 'SSE Stream Connected'}</span>
        <span className="flex-1" />
      </div>
    </div>
  );
}

function VerdictScreen({ navigate, verdict }: { navigate: ReturnType<typeof useNavigate>, verdict: any }) {
  // Use evaluations array from new schema
  const evaluations = verdict.evaluations || [];
  
  const statusColor: Record<string, string> = {
    'Recommended': '#16A34A',
    'Strong Alternative': '#E8A930',
    'Not Recommended': '#EF4444',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}
      className="min-h-screen bg-[#0A0A0B] overflow-y-auto pb-20">
      
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[1000px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(ellipse, rgba(232,169,48,0.1) 0%, transparent 75%)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8">
        {/* Top Header */}
        <div className="py-12 border-b border-[#1E1E22] mb-12">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between items-end mb-6">
              <div>
                <h1 className="text-[42px] font-bold text-[#F0F0F0] tracking-tight leading-none mb-4">Strategic Ranking Report</h1>
                <div className="flex items-center gap-3">
                  <div className="h-1 w-20 bg-[#E8A930]" />
                  <p className="text-[14px] font-medium text-[#6B6B72] tracking-widest uppercase">Vendor Selection Intelligence</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-[#6B6B72] uppercase tracking-[0.2em] mb-1">Recommendation Status</p>
                <p className="text-[24px] font-bold text-[#16A34A]">{verdict.strategic_recommendation?.split(' ')[0]} Preferred</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12 bg-[#111113] border border-[#1E1E22] rounded-2xl p-8">
              <div className="lg:col-span-2">
                <h3 className="text-[11px] font-bold text-[#E8A930] uppercase tracking-widest mb-3">Executive Rationale</h3>
                <p className="text-[16px] text-[#F0F0F0] leading-relaxed font-light">
                  {verdict.executive_summary}
                </p>
              </div>
              <div className="border-l border-[#1E1E22] pl-8">
                <h3 className="text-[11px] font-bold text-[#6B6B72] uppercase tracking-widest mb-3">Primary Directive</h3>
                <p className="text-[15px] text-[#E8A930] leading-relaxed italic">
                  "{verdict.strategic_recommendation}"
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Detailed Rankings */}
        <div className="flex flex-col gap-10">
          {evaluations.map((v: any, i: number) => {
            const color = statusColor[v.status] || '#6B6B72';
            const isTop = v.rank === 1;

            return (
              <motion.div key={v.vendor}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.2 }}
                className={`relative overflow-hidden bg-[#111113] border rounded-[2rem] transition-all duration-500 hover:border-[#E8A930]/40 ${isTop ? 'border-[#E8A930]/30 shadow-[0_20px_80px_rgba(232,169,48,0.05)]' : 'border-[#1E1E22]'}`}>
                
                {/* Background Rank Number */}
                <div className="absolute top-[-20px] right-[-20px] text-[180px] font-black text-white/[0.02] select-none pointer-events-none">
                  {v.rank}
                </div>

                <div className="p-10">
                  <div className="flex flex-col lg:flex-row gap-10">
                    {/* Left: Identity & Justification */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-[24px] font-black ${isTop ? 'bg-[#E8A930] text-[#0D0D0F]' : 'bg-[#1E1E22] text-[#F0F0F0]'}`}>
                          {v.rank}
                        </div>
                        <div>
                          <h2 className="text-[32px] font-bold text-[#F0F0F0] tracking-tight">{v.vendor}</h2>
                          <div className="flex items-center gap-3 mt-1">
                             <span className="text-[12px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border" 
                                   style={{ color, background: `${color}10`, borderColor: `${color}30` }}>
                               {v.status}
                             </span>
                             <span className="text-[14px] text-[#6B6B72]">Confidence Score: <b className="text-[#F0F0F0]">{v.score}%</b></span>
                          </div>
                        </div>
                      </div>

                      <p className="text-[16px] text-[#A0A0A8] leading-relaxed mb-8">
                        {v.justification}
                      </p>

                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-[10px] font-bold text-[#16A34A] uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> Strategic Advantages
                          </h4>
                          <ul className="space-y-3">
                            {v.pros?.map((p: string, pi: number) => (
                              <li key={pi} className="text-[13px] text-[#F0F0F0] flex items-start gap-2">
                                <span className="text-[#16A34A] mt-0.5">✓</span> {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold text-[#EF4444] uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" /> Residual Risks
                          </h4>
                          <ul className="space-y-3">
                            {v.cons?.map((c: string, ci: number) => (
                              <li key={ci} className="text-[13px] text-[#F0F0F0] flex items-start gap-2">
                                <span className="text-[#EF4444] mt-0.5">!</span> {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Right: Fit Analysis Visualization */}
                    <div className="w-full lg:w-[320px] bg-[#0D0D0F] rounded-3xl p-8 border border-[#1E1E22]/50">
                      <h4 className="text-[11px] font-bold text-[#6B6B72] uppercase tracking-widest mb-8 text-center">Fit Analysis Matrix</h4>
                      
                      <div className="space-y-8">
                        {Object.entries(v.fit_analysis || {}).map(([key, val]: [string, any]) => (
                          <div key={key}>
                            <div className="flex justify-between text-[11px] uppercase tracking-wider mb-2">
                              <span className="text-[#6B6B72]">{key}</span>
                              <span className="text-[#F0F0F0] font-bold">{val}%</span>
                            </div>
                            <div className="h-1.5 bg-[#1A1A1E] rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }} animate={{ width: `${val}%` }} 
                                transition={{ duration: 1, delay: 0.8 }}
                                className="h-full rounded-full"
                                style={{ background: isTop ? '#E8A930' : '#4B4B50' }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-10 pt-8 border-t border-[#1E1E22] text-center">
                         <div className="text-[28px] font-black text-[#F0F0F0]">{v.score}</div>
                         <div className="text-[10px] text-[#6B6B72] uppercase tracking-[0.2em]">Aggregate Fit Score</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Global Risks & Dissent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-20">
           <div className="lg:col-span-2">
              <h2 className="text-[14px] font-bold text-[#F0F0F0] uppercase tracking-widest mb-6">Enterprise Risk Register</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {verdict.risk_register?.map((r: any, i: number) => (
                    <div key={i} className="bg-[#111113] border border-[#1E1E22] p-5 rounded-2xl">
                       <div className="flex items-center gap-2 mb-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                             r.severity === 'HIGH' ? 'bg-[#EF4444]/10 text-[#EF4444]' : 
                             r.severity === 'MEDIUM' ? 'bg-[#E8A930]/10 text-[#E8A930]' : 
                             'bg-[#16A34A]/10 text-[#16A34A]'
                          }`}>{r.severity}</span>
                          <span className="text-[12px] font-bold text-[#F0F0F0]">{r.risk}</span>
                       </div>
                       <p className="text-[12px] text-[#6B6B72]">Mitigation: <span className="text-[#A0A0A8]">{r.mitigation}</span></p>
                    </div>
                 ))}
              </div>
           </div>

           <div>
              <h2 className="text-[14px] font-bold text-[#F0F0F0] uppercase tracking-widest mb-6">Strategic Dissent</h2>
              <div className="bg-[#1A1A1E] border border-[#E8A930]/20 p-6 rounded-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                 </div>
                 <h4 className="text-[11px] font-bold text-[#E8A930] uppercase tracking-widest mb-2">
                    {verdict.minority_dissent?.agent?.replace('_', ' ')} Position
                 </h4>
                 <p className="text-[13px] text-[#F0F0F0] italic mb-4 leading-relaxed">
                    "{verdict.minority_dissent?.argument}"
                 </p>
                 <div className="pt-4 border-t border-[#1E1E22]">
                    <p className="text-[11px] text-[#6B6B72] uppercase mb-1">Mitigation Plan</p>
                    <p className="text-[12px] text-[#A0A0A8]">{verdict.minority_dissent?.mitigation_plan}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Footer actions */}
        <div className="mt-20 flex justify-center gap-6">
           <button onClick={() => navigate('/generate')} 
                   className="px-10 py-4 bg-transparent border border-[#1E1E22] text-[#6B6B72] rounded-full hover:text-[#F0F0F0] hover:border-[#F0F0F0] transition-all">
              New Simulation
           </button>
           <button onClick={() => window.print()}
                   className="px-10 py-4 bg-[#F0F0F0] text-[#0A0A0B] font-bold rounded-full hover:bg-white transition-all shadow-[0_0_30px_rgba(240,240,240,0.2)]">
              Export PDF Report
           </button>
        </div>
      </div>
    </motion.div>
  );
}


function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-1">
      <div className="w-1 h-5 rounded-full" style={{ background: color }} />
      <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
    </div>
  );
}
