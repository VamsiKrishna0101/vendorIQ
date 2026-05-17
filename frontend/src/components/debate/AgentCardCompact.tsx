import { motion } from 'framer-motion';
import { StreamingText, BiasBar } from '../common';
import type { Agent } from '../../data/mockData';

interface AgentCardCompactProps {
  agent: Agent;
  streamText?: string;
  biasScore?: number;
  status?: 'idle' | 'thinking' | 'speaking' | 'done';
  stance?: string;
  isActive?: boolean;
  delay?: number;
}

const GROUP = {
  decision:    { bg: '#2A1800', text: '#E8A930', border: 'rgba(232,169,48,0.5)', glow: 'rgba(232,169,48,0.08)' },
  customer:    { bg: '#0A2010', text: '#16A34A', border: 'rgba(22,163,74,0.5)',  glow: 'rgba(22,163,74,0.08)'  },
  adversarial: { bg: '#1A0808', text: '#DC2626', border: 'rgba(220,38,38,0.5)',  glow: 'rgba(220,38,38,0.08)'  },
  analyst:     { bg: '#0A0A1A', text: '#A0A0A8', border: 'rgba(160,160,168,0.3)', glow: 'transparent' },
};

export function AgentCardCompact({
  agent, streamText, biasScore = 25, status = 'idle', stance, isActive, delay = 0
}: AgentCardCompactProps) {
  const c = GROUP[agent.group];
  const speaking = status === 'speaking' || status === 'thinking';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="relative flex flex-col gap-3 rounded-xl p-4 border transition-all duration-400"
      style={{
        background: '#13131A',
        borderColor: isActive ? c.border : '#1E1E22',
        boxShadow: isActive
          ? `0 0 0 1px ${c.border}, 0 8px 32px ${c.glow}`
          : '0 1px 4px rgba(0,0,0,0.4)',
      }}
    >
      {/* Active ring pulse */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ border: `1px solid ${c.border}` }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      )}

      {/* Header row */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <motion.div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 overflow-hidden border"
          style={{ 
            background: c.bg, 
            color: c.text,
            borderColor: isActive ? c.border : 'rgba(255,255,255,0.05)'
          }}
          animate={isActive ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {agent.avatar ? (
            <img 
              src={agent.avatar} 
              alt={agent.name} 
              className={`w-full h-full object-cover transition-all duration-700 ${!isActive ? 'grayscale contrast-125 brightness-75 opacity-50' : 'grayscale-0 contrast-100 brightness-100 opacity-100'}`}
            />
          ) : (
            agent.initials
          )}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold truncate" style={{ color: isActive ? c.text : '#F0F0F0' }}>
              {agent.name}
            </span>
            {/* Live indicator */}
            {speaking && (
              <motion.div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: c.text }}
                animate={{ opacity: [1, 0.2, 1], scale: [1, 0.8, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
            {status === 'done' && (
              <span className="text-[#16A34A] text-[13px] flex-shrink-0">✓</span>
            )}
          </div>
          <div className="text-[11px] text-[#6B6B72] truncate">{agent.role}</div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] px-2 py-0.5 rounded border border-[#1E1E22] text-[#6B6B72]">
          {agent.personality}
        </span>
        {stance && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#1C1C21] text-[#A0A0A8]">
            {stance}
          </span>
        )}
      </div>

      {/* Bias bar */}
      <BiasBar score={biasScore} />

      {/* Stream text area — always visible */}
      <div
        className="text-[11px] leading-relaxed text-[#A0A0A8] bg-[#0D0D0F] rounded-lg p-3 min-h-[72px] max-h-[120px] overflow-y-auto border border-[#1A1A1E]"
        style={{ scrollbarWidth: 'thin', fontFamily: 'inherit' }}
      >
        {/* idle with no content yet */}
        {status === 'idle' && !streamText && (
          <span className="opacity-40 italic">Waiting for round to begin...</span>
        )}
        {/* idle but has content from previous completion — keep showing it */}
        {status === 'idle' && streamText && (
          <span className="opacity-70">{streamText.slice(0, 280)}{streamText.length > 280 ? '…' : ''}</span>
        )}
        {status === 'thinking' && !streamText && (
          <motion.span
            className="text-[#E8A930] opacity-70"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            ◌ Analyzing intelligence...
          </motion.span>
        )}
        {(status === 'speaking' || status === 'thinking') && streamText && (
          <StreamingText text={streamText.slice(-400)} speed={8} />
        )}
        {status === 'done' && streamText && (
          <span className="opacity-80">{streamText.slice(0, 280)}{streamText.length > 280 ? '…' : ''}</span>
        )}
      </div>
    </motion.div>
  );
}
