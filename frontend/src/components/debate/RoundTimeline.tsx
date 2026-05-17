import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export type Phase = 'document-intelligence' | 'round1' | 'round2' | 'round3' | 'adversarial' | 'synthesis';

const PHASES: { id: Phase; label: string }[] = [
  { id: 'document-intelligence', label: 'Phase 0' },
  { id: 'round1', label: 'Round 1' },
  { id: 'round2', label: 'Round 2' },
  { id: 'round3', label: 'Round 3' },
  { id: 'adversarial', label: 'Adversarial' },
  { id: 'synthesis', label: 'Synthesis' },
];

interface RoundTimelineProps {
  currentPhase: Phase;
}

export function RoundTimeline({ currentPhase }: RoundTimelineProps) {
  const currentIndex = PHASES.findIndex(p => p.id === currentPhase);

  return (
    <div className="flex items-center gap-0 w-full px-6 py-4 bg-[#111113] border-b border-[#1E1E22]">
      {PHASES.map((phase, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;

        return (
          <div key={phase.id} className="flex items-center flex-1">
            {/* Node */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="relative">
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#E8A930]"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isDone
                      ? 'bg-[#E8A930] border-[#E8A930]'
                      : isActive
                      ? 'bg-[#E8A930] border-[#E8A930]'
                      : 'bg-transparent border-[#374151]'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle size={12} className="text-[#0A0A0B]" strokeWidth={3} />
                  ) : isActive ? (
                    <div className="w-2 h-2 rounded-full bg-[#0A0A0B]" />
                  ) : null}
                </div>
              </div>
              <span className={`text-[10px] font-medium uppercase tracking-wider whitespace-nowrap ${
                isDone ? 'text-[#E8A930]' : isActive ? 'text-[#E8A930]' : 'text-[#374151]'
              }`}>
                {phase.label}
              </span>
            </div>

            {/* Connector line */}
            {i < PHASES.length - 1 && (
              <div className="flex-1 h-px mx-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#1E1E22]" />
                {isDone && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="absolute inset-0 bg-[#E8A930]"
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
