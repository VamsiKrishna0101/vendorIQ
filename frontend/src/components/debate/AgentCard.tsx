import { motion } from 'framer-motion';
import { StreamingText, BiasBar } from '../common';
import type { Agent } from '../../data/mockData';

interface AgentCardProps {
  agent: Agent;
  streamText?: string;
  biasScore?: number;
  status?: 'idle' | 'thinking' | 'speaking' | 'done';
  stance?: string;
  isActive?: boolean;
  delay?: number;
}

const GROUP_COLORS = {
  decision: { bg: '#2A1A00', text: '#E8A930', border: 'rgba(232,169,48,0.4)' },
  customer: { bg: '#0A2010', text: '#16A34A', border: 'rgba(22,163,74,0.4)' },
  adversarial: { bg: '#1A0A0A', text: '#DC2626', border: 'rgba(220,38,38,0.4)' },
  analyst: { bg: '#0A0A2A', text: '#A0A0A8', border: 'rgba(160,160,168,0.3)' },
};

export function AgentCard({ agent, streamText, biasScore = 25, status = 'idle', stance, isActive, delay = 0 }: AgentCardProps) {
  const colors = GROUP_COLORS[agent.group];
  const isTyping = status === 'thinking' || status === 'speaking';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="relative flex flex-col gap-3 bg-[#16161A] rounded-lg p-4 border transition-all duration-300"
      style={{
        borderColor: isActive ? colors.border : '#1E1E22',
        boxShadow: isActive ? `0 0 24px ${colors.bg}80, 0 1px 3px rgba(0,0,0,0.4)` : '0 1px 3px rgba(0,0,0,0.4)',
      }}
    >
      {/* Active pulse ring */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ border: `1px solid ${colors.border}`, borderRadius: 8 }}
        />
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {agent.initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[13px] font-semibold truncate ${isActive ? '' : 'text-[#F0F0F0]'}`}
              style={{ color: isActive ? colors.text : '#F0F0F0' }}
            >
              {agent.name}
            </span>
            {/* Status indicator */}
            <div className="flex-shrink-0">
              {status === 'done' && <span className="text-[#16A34A]">✓</span>}
              {isTyping && (
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors.text }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
            </div>
          </div>
          <div className="text-[11px] text-[#6B6B72] truncate">{agent.role}</div>
        </div>
      </div>

      {/* Personality + Stance */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[10px] px-2 py-0.5 rounded border border-[#1E1E22] text-[#6B6B72]">
          {agent.personality}
        </span>
        {stance && (
          <span className="text-[10px] px-2 py-0.5 rounded text-[#A0A0A8] bg-[#1C1C21]">
            {stance}
          </span>
        )}
      </div>

      {/* Bias Bar */}
      <BiasBar score={biasScore} />

      {/* Streaming text */}
      {streamText && (
        <div
          className="text-[11px] leading-relaxed font-mono text-[#A0A0A8] bg-[#111113] rounded-lg p-3 min-h-[64px] max-h-[120px] overflow-y-auto"
          style={{ scrollbarWidth: 'thin' }}
        >
          {isTyping ? (
            <StreamingText text={streamText} speed={14} />
          ) : (
            <span>{streamText}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Agent Avatar — for compact group displays
export function AgentAvatar({ agent, size = 'md' }: { agent: Agent; size?: 'sm' | 'md' }) {
  const colors = GROUP_COLORS[agent.group];
  const dim = size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-[11px]';
  return (
    <div
      title={agent.name}
      className={`${dim} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {agent.initials}
    </div>
  );
}
