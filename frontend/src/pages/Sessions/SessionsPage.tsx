import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Play, Plus, Loader2 } from 'lucide-react';
import { StatusBadge, ConfidenceScore, EmptyState } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import api from '../../api';

type FilterStatus = 'all' | 'completed' | 'processing' | 'failed' | 'running';
type SortKey = 'date' | 'confidence' | 'vendor';

interface Session {
  id: string;
  title: string;
  vendors: string[];
  status: string;
  rounds: number;
  confidence: number;
  date: string;
  duration: string;
  winner: string;
}

export function SessionsPage() {
  const navigate = useNavigate();
  const { error } = useToast();
  
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [sort, setSort] = useState<SortKey>('date');
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get('/debate/list');
        setSessions(res.data.data);
      } catch (err: any) {
        error('Failed to load debates', err.response?.data?.detail || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const filtered = sessions
    .filter(s => filter === 'all' || s.status === filter)
    .filter(s => s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.vendors.some(v => v.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => {
      if (sort === 'confidence') return b.confidence - a.confidence;
      if (sort === 'vendor') return a.vendors[0].localeCompare(b.vendors[0]);
      return b.date.localeCompare(a.date);
    });

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Header */}
      <div className="border-b border-[#1E1E22] px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold text-[#F0F0F0]">Previous Debates</h1>
          <span className="text-[11px] font-medium bg-[#1C1C21] border border-[#1E1E22] text-[#A0A0A8] px-2.5 py-0.5 rounded-full">
            {sessions.length} sessions
          </span>
        </div>
        <button
          onClick={() => navigate('/generate')}
          className="flex items-center gap-2 bg-[#E8A930] text-[#0A0A0B] font-semibold px-4 py-2.5 rounded-lg text-[13px]"
        >
          <Plus size={14} strokeWidth={2.5} />
          New Debate
        </button>
      </div>

      {/* Filters */}
      <div className="px-8 py-4 border-b border-[#1E1E22] flex items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B72]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sessions..."
            className="w-full pl-9 pr-3 py-2 bg-[#16161A] border border-[#1E1E22] rounded-lg text-[13px] text-[#F0F0F0] placeholder-[#374151] outline-none focus:border-[#E8A930]/40 transition-colors"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-[#111113] border border-[#1E1E22] rounded-lg p-1">
          {(['all', 'completed', 'running', 'failed'] as FilterStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-[12px] font-medium capitalize transition-all ${
                filter === f ? 'bg-[#E8A930] text-[#0A0A0B]' : 'text-[#6B6B72] hover:text-[#F0F0F0]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="bg-[#16161A] border border-[#1E1E22] rounded-lg px-3 py-2 text-[12px] text-[#A0A0A8] outline-none"
        >
          <option value="date">Sort: Recent</option>
          <option value="confidence">Sort: Confidence</option>
          <option value="vendor">Sort: Vendor</option>
        </select>
      </div>

      {/* Sessions Grid */}
      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center p-20 text-[#E8A930]">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No debates found"
            subtitle="Try adjusting your search or filters"
            action={
              <button
                onClick={() => navigate('/generate')}
                className="bg-[#E8A930] text-[#0A0A0B] font-semibold px-5 py-2.5 rounded-lg text-[13px]"
              >
                Start First Debate
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-[#111113] border border-[#1E1E22] rounded-xl p-5 hover:border-[#2E2E32] transition-all cursor-pointer group"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                onClick={() => navigate(`/debate?replay=${session.id}`)}
              >
                {/* Top */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-[#F0F0F0] leading-snug mb-1 line-clamp-2">
                      {session.title}
                    </h3>
                    <div className="text-[11px] text-[#6B6B72]">{session.date} · {session.duration}</div>
                  </div>
                  <StatusBadge status={session.status as any} className="flex-shrink-0" />
                </div>

                {/* Vendor tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {session.vendors.map(v => (
                    <span key={v} className="text-[11px] px-2 py-0.5 bg-[#1C1C21] border border-[#1E1E22] rounded text-[#A0A0A8]">
                      {v}
                    </span>
                  ))}
                </div>

                {/* Metrics row */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-[11px] text-[#6B6B72]">
                    <span className="text-[#F0F0F0] font-medium">{session.rounds}</span> rounds
                  </div>
                  {session.confidence > 0 && (
                    <div className="flex-1">
                      <ConfidenceScore score={session.confidence} />
                    </div>
                  )}
                </div>

                {/* Winner */}
                {session.winner !== 'N/A' && (
                  <div className="flex items-center gap-2 mb-4 p-2.5 bg-[#E8A930]/5 border border-[#E8A930]/15 rounded-lg">
                    <span className="text-[10px] text-[#6B6B72] uppercase tracking-wider">Recommendation</span>
                    <span className="text-[12px] font-bold text-[#E8A930]">{session.winner}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(session.status === 'running' ? `/debate?session_id=${session.id}` : `/debate?replay=${session.id}`)}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-[#E8A930] border border-[#E8A930]/30 px-3 py-1.5 rounded-lg hover:bg-[#E8A930]/10 transition-colors"
                  >
                    <Play size={12} />
                    {session.status === 'running' ? 'Watch Live' : 'Replay'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
