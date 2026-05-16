import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import VerdictScreen from './VerdictScreen';
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
      // Backend sends round_number 1,2,3,4 (4 = moderator/synthesis)
      // PHASES: ['document-intelligence', 'round1', 'round2', 'round3', 'adversarial', 'synthesis']
      // Map: round 1 → idx 1 (round1), round 2 → idx 2 (round2), round 3 → idx 3 (round3)
      // round 4 (moderator) → idx 5 (synthesis) — skip adversarial as a separate phase
      const phaseMap: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 5 };
      const newIdx = phaseMap[r];
      if (newIdx !== undefined) {
        setPhaseIdx(newIdx);
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

        // Moderator schema: evaluations[] sorted by rank, winner = rank 1
        const sortedEvals = [...(parsed.evaluations || [])].sort(
          (a: any, b: any) => (a.rank ?? 99) - (b.rank ?? 99)
        );
        const winner = sortedEvals[0]?.vendor;

        // Trigger verdict screen if we got a valid output
        if (winner || parsed.strategic_recommendation) {
          setVerdictData({
            winner:                   winner || 'Unknown',
            executive_summary:        parsed.executive_summary || '',
            strategic_recommendation: parsed.strategic_recommendation || '',
            // score is 0-100; debate_quality_score is 0-1
            confidence:               sortedEvals[0]?.score
                                        || Math.round((parsed.debate_quality_score || 0) * 100),
            debate_quality_score:     parsed.debate_quality_score || 0,
            minority_dissent:         parsed.minority_dissent || {},
            risk_register:            parsed.risk_register || [],
            evaluations:              sortedEvals,
            governance_flags:         parsed.governance_flags || [],
            conditions_before_signing: parsed.conditions_before_signing || [],
            supporting_agents:        sortedEvals.length,
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

  if (showVerdict && verdictData) return <VerdictScreen verdict={verdictData} />;

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
                
                {/* Decision agents */}
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

                {/* Customer agents */}
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

                {/* Adversarial agents — always shown in all round phases */}
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

            {/* ── Synthesis Phase — Moderator working ── */}
            {phase === 'synthesis' && (
              <motion.div key="synthesis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">
                
                {/* Moderator Hero Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="relative overflow-hidden rounded-2xl border p-8"
                  style={{ background: '#111116', borderColor: agentStatuses['moderator'] === 'done' ? 'rgba(232,169,48,0.4)' : 'rgba(232,169,48,0.15)' }}>
                  
                  {/* Glow background */}
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(232,169,48,0.04) 0%, transparent 70%)' }} />

                  <div className="relative flex items-start gap-6">
                    {/* Avatar */}
                    <motion.div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-[22px] font-black flex-shrink-0"
                      style={{ background: '#2A1800', color: '#E8A930' }}
                      animate={agentStatuses['moderator'] !== 'done' ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                      transition={{ duration: 2, repeat: agentStatuses['moderator'] !== 'done' ? Infinity : 0 }}
                    >
                      MO
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[20px] font-bold text-[#F0F0F0]">AI Moderator</span>
                        {agentStatuses['moderator'] === 'done' ? (
                          <span className="text-[12px] font-bold px-3 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/30">
                            ✓ Synthesis Complete
                          </span>
                        ) : (
                          <motion.span
                            className="text-[12px] font-bold px-3 py-1 rounded-full bg-[#E8A930]/10 text-[#E8A930] border border-[#E8A930]/30"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.4, repeat: Infinity }}
                          >
                            ◌ Synthesizing All Evidence...
                          </motion.span>
                        )}
                      </div>
                      <div className="text-[12px] text-[#6B6B72] mb-4">
                        Final Verdict Synthesis — Weighing all committee arguments, bias scores, and adversarial challenges
                      </div>

                      {/* Streaming output */}
                      <div className="bg-[#0D0D0F] rounded-xl p-5 border border-[#1E1E22] min-h-[100px] max-h-[260px] overflow-y-auto text-[12px] font-mono text-[#A0A0A8] leading-relaxed">
                        {!streamTexts['moderator'] ? (
                          <motion.span className="text-[#E8A930]/60" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}>
                            Awaiting moderator synthesis...
                          </motion.span>
                        ) : (
                          <span>{streamTexts['moderator'].slice(0, 800)}{(streamTexts['moderator']?.length ?? 0) > 800 ? '…' : ''}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Show previous round results for context */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <SectionLabel label="Committee Positions (Final Round)" color="#4B4B60" />
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                    {decisionAgents.map((a, i) => (
                      <AgentCardCompact
                        key={a.id} agent={a as any}
                        streamText={streamTexts[a.id]}
                        biasScore={biasScores[a.id] ?? 50}
                        status={'done'}
                        isActive={false}
                        delay={i * 0.04}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Adversarial final state */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <SectionLabel label="Adversarial Final Verdicts" color="#DC2626" />
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {adversarialAgents.map((a, i) => (
                      <AgentCardCompact
                        key={a.id} agent={a as any}
                        streamText={streamTexts[a.id]}
                        biasScore={biasScores[a.id] ?? 50}
                        status={'done'}
                        isActive={false}
                        delay={0.1 + i * 0.06}
                      />
                    ))}
                  </div>
                </motion.div>
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












function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-1">
      <div className="w-1 h-5 rounded-full" style={{ background: color }} />
      <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
    </div>
  );
}
