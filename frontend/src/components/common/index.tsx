import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface StreamingTextProps {
  text: string;
  speed?: number; // ms per character
  className?: string;
  onComplete?: () => void;
}

export function StreamingText({ text, speed = 8, className = '', onComplete }: StreamingTextProps) {
  const [displayed, setDisplayed] = useState('');
  const prevTextRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!text.startsWith(prevTextRef.current) && prevTextRef.current.length > 0) {
      // Text was reset — jump to new text immediately
      prevTextRef.current = text;
      setDisplayed(text);
      return;
    }

    prevTextRef.current = text;

    let i = displayed.length;
    const tick = () => {
      if (i < text.length) {
        i++;
        setDisplayed(text.slice(0, i));
        timerRef.current = setTimeout(tick, speed);
      } else {
        onComplete?.();
      }
    };

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(tick, speed);

    return () => clearTimeout(timerRef.current);
  }, [text]);

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && (
        <span className="animate-pulse opacity-70">▌</span>
      )}
    </span>
  );
}


// ── Skeleton loader
interface SkeletonProps {
  className?: string;
}
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

// ── Status Badge
interface StatusBadgeProps {
  status: 'completed' | 'processing' | 'failed' | 'live' | 'pending';
  className?: string;
}
export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const map = {
    completed: { label: 'Completed', cls: 'text-[#16A34A] bg-[#16A34A]/10 border-[#16A34A]/20' },
    processing: { label: 'Processing', cls: 'text-[#E8A930] bg-[#E8A930]/10 border-[#E8A930]/20' },
    failed: { label: 'Failed', cls: 'text-[#DC2626] bg-[#DC2626]/10 border-[#DC2626]/20' },
    live: { label: 'LIVE', cls: 'text-[#E8A930] bg-[#E8A930]/10 border-[#E8A930]/30' },
    pending: { label: 'Pending', cls: 'text-[#6B6B72] bg-[#1E1E22] border-[#1E1E22]' },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${cls} ${className}`}>
      {status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-[#E8A930] animate-pulse" />}
      {status === 'processing' && <span className="w-1.5 h-1.5 rounded-full bg-[#E8A930] animate-pulse" />}
      {label}
    </span>
  );
}

// ── Metric Card
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  delta?: string;
  danger?: boolean;
}
export function MetricCard({ icon, label, value, delta, danger }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#16161A] border border-[#1E1E22] rounded-lg p-5 flex flex-col gap-3"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[#E8A930]">{icon}</span>
        {delta && (
          <span className={`text-[11px] font-medium ${danger ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
            {delta}
          </span>
        )}
      </div>
      <div>
        <div className={`text-3xl font-bold ${danger && Number(value) > 0 ? 'text-[#DC2626]' : 'text-[#F0F0F0]'}`}>
          {value}
        </div>
        <div className="text-[12px] text-[#6B6B72] mt-1 font-medium uppercase tracking-wider">{label}</div>
      </div>
    </motion.div>
  );
}

// ── Confidence Score display
interface ConfidenceScoreProps {
  score: number;
  size?: 'sm' | 'lg';
}
export function ConfidenceScore({ score, size = 'sm' }: ConfidenceScoreProps) {
  const color = score >= 80 ? '#16A34A' : score >= 60 ? '#E8A930' : '#DC2626';
  return (
    <div className="flex items-center gap-2">
      <span className={`font-bold ${size === 'lg' ? 'text-2xl' : 'text-sm'}`} style={{ color }}>
        {score}%
      </span>
      <div className="flex-1 min-w-[60px] h-1 bg-[#1E1E22] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Risk Indicator
interface RiskIndicatorProps {
  high: number;
  medium: number;
  low: number;
}
export function RiskIndicator({ high, medium, low }: RiskIndicatorProps) {
  return (
    <div className="flex gap-3 text-[12px]">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
        <span className="text-[#DC2626] font-medium">{high} High</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#D97706]" />
        <span className="text-[#D97706] font-medium">{medium} Med</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
        <span className="text-[#16A34A] font-medium">{low} Low</span>
      </div>
    </div>
  );
}

// ── Loading State
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-[#6B6B72]">
      <div className="w-8 h-8 border-2 border-[#1E1E22] border-t-[#E8A930] rounded-full animate-spin" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── Empty State
export function EmptyState({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-[#16161A] border border-[#1E1E22] flex items-center justify-center">
        <span className="text-2xl text-[#374151]">◈</span>
      </div>
      <div>
        <p className="text-[#F0F0F0] font-medium mb-1">{title}</p>
        {subtitle && <p className="text-sm text-[#6B6B72]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Bias Bar
interface BiasBarProps {
  score: number; // 0–100
}
export function BiasBar({ score }: BiasBarProps) {
  const rounded = Math.round(score * 10) / 10;
  const color = rounded < 30 ? '#16A34A' : rounded < 60 ? '#D97706' : '#DC2626';
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-[#6B6B72] uppercase tracking-wider">Bias Score</span>
        <span className="text-[11px] font-medium" style={{ color }}>{rounded.toFixed(1)}%</span>
      </div>
      <div className="h-1 bg-[#1E1E22] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${rounded}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}
