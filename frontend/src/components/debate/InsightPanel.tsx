import { motion } from 'framer-motion';
import type { ActivityEvent } from '../../data/mockData';
import { RiskIndicator, ConfidenceScore } from '../common';

interface InsightPanelProps {
  phase: string;
  round: number;
  progress: number;
  winner: string;
  confidence: number;
  supportingAgents: number;
  risks: { high: number; medium: number; low: number };
  topFindings: string[];
  activityFeed: ActivityEvent[];
  activeAgents: number;
}

export function InsightPanel({
  phase, round, progress, winner, confidence, supportingAgents,
  risks, topFindings, activityFeed, activeAgents
}: InsightPanelProps) {
  return (
    <div className="w-80 flex-shrink-0 flex flex-col gap-px bg-[#1E1E22] border-l border-[#1E1E22]">
      <div className="flex flex-col gap-0 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

        {/* Current Phase */}
        <Section title="Current Phase">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#F0F0F0]">{phase}</span>
            <span className="text-[11px] text-[#6B6B72]">Round {round}</span>
          </div>
          <div className="mt-2 h-1 bg-[#1E1E22] rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-[#E8A930] rounded-full"
            />
          </div>
          <div className="text-[11px] text-[#6B6B72] mt-1">{progress}% complete</div>
        </Section>

        {/* Leading Recommendation */}
        <Section title="Leading Recommendation">
          <div className="text-[18px] font-bold text-[#E8A930]">{winner}</div>
          <ConfidenceScore score={confidence} />
          <div className="text-[11px] text-[#6B6B72] mt-1">{supportingAgents} agents in agreement</div>
        </Section>

        {/* Risk Dashboard */}
        <Section title="Risk Dashboard">
          <RiskIndicator high={risks.high} medium={risks.medium} low={risks.low} />
        </Section>

        {/* Top Findings */}
        <Section title="Top Findings">
          <div className="flex flex-col gap-2">
            {topFindings.map((finding, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#E8A930] mt-0.5 flex-shrink-0 text-[10px]">◆</span>
                <span className="text-[12px] text-[#A0A0A8] leading-relaxed">{finding}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Active Agents */}
        <Section title="Active Agents">
          <div className="flex items-center gap-3">
            <div className="text-[28px] font-bold text-[#F0F0F0]">{activeAgents}</div>
            <div className="text-[11px] text-[#6B6B72] leading-relaxed">
              agents currently<br />processing
            </div>
          </div>
        </Section>

        {/* Activity Feed */}
        <Section title="Live Activity Feed" className="flex-1">
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {activityFeed.length === 0 && (
              <span className="text-[11px] text-[#374151] italic">Waiting for agents...</span>
            )}
            {activityFeed.map((event: any, i: number) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-start gap-2"
              >
                <span className="text-[10px] font-mono text-[#374151] flex-shrink-0 mt-0.5">{event.timestamp}</span>
                <span className={`text-[11px] leading-relaxed ${
                  event.type === 'error' ? 'text-[#DC2626]' :
                  event.type === 'warning' ? 'text-[#D97706]' :
                  event.type === 'success' ? 'text-[#16A34A]' :
                  event.type === 'system' ? 'text-[#E8A930]' :
                  'text-[#A0A0A8]'
                }`}>{event.message}</span>
              </motion.div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#111113] p-4 border-b border-[#1E1E22] ${className}`}>
      <div className="text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider mb-3">{title}</div>
      {children}
    </div>
  );
}
