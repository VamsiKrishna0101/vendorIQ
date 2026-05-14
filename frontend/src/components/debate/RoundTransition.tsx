import { motion, AnimatePresence } from 'framer-motion';

interface RoundTransitionProps {
  round: number;
  visible: boolean;
  onDone: () => void;
}

export function RoundTransition({ round, visible, onDone }: RoundTransitionProps) {
  const labels: Record<number, string> = {
    0: 'Document Intelligence',
    1: 'Round 1 — Initial Positions',
    2: 'Round 2 — Cross-Examination',
    3: 'Round 3 — Final Arguments',
    4: 'Adversarial Review',
    5: 'Moderator Synthesis',
  };

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key={round}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0B]"
        >
          {/* Scan line */}
          <motion.div
            className="absolute inset-x-0 h-px bg-[#E8A930]/30"
            animate={{ y: ['-50vh', '150vh'] }}
            transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
          />

          {/* Amber glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              className="w-[600px] h-[600px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(232,169,48,0.06) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-6 text-center px-8">
            {/* Round number */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#E8A930] mb-2"
            >
              Initiating
            </motion.div>

            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-[48px] font-bold text-[#F0F0F0] tracking-tight leading-none"
              style={{ textShadow: '0 0 40px rgba(232,169,48,0.3)' }}
            >
              {labels[round]}
            </motion.h1>

            {/* Divider */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 120 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="h-0.5 bg-[#E8A930]"
            />

            {/* Status text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-[15px] text-[#6B6B72]"
            >
              {round === 0
                ? 'Extracting intelligence from vendor documents…'
                : round <= 3
                ? `${13} AI agents preparing positions…`
                : round === 4
                ? 'Adversarial agents auditing committee decisions…'
                : 'Synthesizing final executive recommendation…'}
            </motion.p>

            {/* Progress dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex gap-2 mt-2"
            >
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#E8A930]"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.25 }}
                />
              ))}
            </motion.div>
          </div>

          {/* Auto-dismiss after 2.8s */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2.6, delay: 0.3, ease: 'linear' }}
            onAnimationComplete={onDone}
            className="absolute bottom-0 left-0 h-0.5 bg-[#E8A930] origin-left"
            style={{ width: '100%' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
