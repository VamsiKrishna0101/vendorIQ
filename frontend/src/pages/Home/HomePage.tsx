import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BarChart3, CheckCircle2, TrendingUp, AlertTriangle, Play, RotateCcw, Loader2 } from 'lucide-react';
import { MetricCard, StatusBadge, ConfidenceScore } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import api from '../../api';

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error } = useToast();
  
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get('/debate/list');
        setSessions(res.data.data);
      } catch (err: any) {
        error('Failed to load dashboard data', err.response?.data?.detail || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const completed = sessions.filter(s => s.status === 'completed').length;
  const confSessions = sessions.filter(s => s.confidence > 0);
  const avgConf = confSessions.length > 0 
    ? Math.round(confSessions.reduce((a, s) => a + s.confidence, 0) / confSessions.length)
    : 0;

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col">
      {/* Page header */}
      <div className="border-b border-[#1E1E22] px-8 py-6 flex items-start justify-between bg-[#0A0A0B]">
        <div>
          <h1 className="text-[26px] font-bold text-[#F0F0F0] leading-tight">
            Good {now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-[14px] text-[#6B6B72] mt-1">Your AI decision intelligence platform is ready.</p>
        </div>
        <div className="text-right">
          <div className="text-[14px] font-medium text-[#A0A0A8]">{timeStr}</div>
          <div className="text-[12px] text-[#6B6B72]">{dateStr}</div>
        </div>
      </div>

      <div className="flex-1 flex gap-0">
        {/* Main content */}
        <div className="flex-1 p-8 flex flex-col gap-8 overflow-auto">

          {/* Metric cards */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <MetricCard icon={<BarChart3 size={18} />} label="Total Debates" value={sessions.length} delta="All time" />
            <MetricCard icon={<CheckCircle2 size={18} />} label="Completed" value={completed} delta="Finished" />
            <MetricCard icon={<TrendingUp size={18} />} label="Avg. Confidence" value={`${avgConf}%`} delta="Platform wide" />
            <MetricCard icon={<AlertTriangle size={18} />} label="Risk Alerts" value={0} danger delta="Requires attention" />
          </motion.div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate('/generate')}
              className="flex items-center gap-2 bg-[#E8A930] text-[#0A0A0B] font-semibold px-5 py-2.5 rounded-lg text-[13px] transition-all"
            >
              <Play size={14} strokeWidth={2.5} />
              Start New Debate
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate('/sessions')}
              className="flex items-center gap-2 border border-[#1E1E22] text-[#A0A0A8] hover:text-[#F0F0F0] hover:border-[#2E2E32] font-medium px-5 py-2.5 rounded-lg text-[13px] transition-all"
            >
              <RotateCcw size={14} />
              View Sessions
            </motion.button>
          </div>

          {/* Recent Debates */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-[#F0F0F0]">Recent Debates</h2>
              <button onClick={() => navigate('/sessions')} className="text-[12px] text-[#E8A930] hover:underline">
                View all →
              </button>
            </div>
            
            {loading ? (
              <div className="py-12 flex justify-center text-[#E8A930]">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : sessions.length === 0 ? (
              <div className="bg-[#111113] border border-[#1E1E22] rounded-xl p-8 text-center">
                <p className="text-[#6B6B72] text-[13px]">No debates generated yet.</p>
                <button onClick={() => navigate('/generate')} className="text-[#E8A930] text-[13px] mt-2 font-medium">Start your first debate</button>
              </div>
            ) : (
              <div className="bg-[#111113] border border-[#1E1E22] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1E1E22]">
                      {['Session', 'Vendors', 'Rounds', 'Confidence', 'Status', 'Date', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#6B6B72] uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(0, 5).map((session, i) => (
                      <motion.tr
                        key={session.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.06 }}
                        className="border-b border-[#1E1E22] last:border-0 hover:bg-[#16161A] transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3.5">
                          <div className="text-[13px] font-medium text-[#F0F0F0] max-w-[200px] truncate">{session.title}</div>
                          <div className="text-[11px] text-[#6B6B72]">{session.duration}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {session.vendors.slice(0, 2).map((v: string) => (
                              <span key={v} className="text-[10px] px-1.5 py-0.5 bg-[#1C1C21] border border-[#1E1E22] rounded text-[#A0A0A8]">{v}</span>
                            ))}
                            {session.vendors.length > 2 && (
                              <span className="text-[10px] text-[#6B6B72]">+{session.vendors.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-[13px] text-[#A0A0A8]">{session.rounds}</td>
                        <td className="px-4 py-3.5 min-w-[100px]">
                          {session.confidence > 0 ? (
                            <ConfidenceScore score={session.confidence} />
                          ) : (
                            <span className="text-[#374151] text-[12px]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={session.status} />
                        </td>
                        <td className="px-4 py-3.5 text-[12px] text-[#6B6B72]">{session.date}</td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => navigate(session.status === 'running' ? `/debate?session_id=${session.id}` : `/debate?replay=${session.id}`)}
                            className="text-[11px] text-[#6B6B72] group-hover:text-[#E8A930] border border-[#1E1E22] group-hover:border-[#E8A930]/30 px-2.5 py-1 rounded transition-all"
                          >
                            {session.status === 'running' ? 'Watch Live' : 'Replay'}
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right system status panel */}
        <div className="w-72 flex-shrink-0 border-l border-[#1E1E22] p-6 flex flex-col gap-6 bg-[#0D0D0F]">
          <div>
            <h3 className="text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider mb-4">AI System Status</h3>
            <div className="flex flex-col gap-3">
              <StatusRow label="Gemini Model" value="Online" dot="green" />
              <StatusRow label="Active Sessions" value={sessions.filter(s => s.status === 'running').length.toString()} />
              <StatusRow label="Avg. Latency" value="1.2s" />
              <StatusRow label="System Health" value="Optimal" dot="green" />
            </div>
          </div>

          <div className="h-px bg-[#1E1E22]" />

          <div>
            <h3 className="text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider mb-3">Model Info</h3>
            <div className="bg-[#16161A] border border-[#1E1E22] rounded-lg p-3 flex flex-col gap-1.5">
              <div className="text-[12px] font-medium text-[#F0F0F0]">Gemini 2.0 Flash</div>
              <div className="text-[11px] text-[#6B6B72]">13 orchestrated agents</div>
              <div className="text-[11px] text-[#6B6B72]">Multi-round debate engine</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value, dot }: { label: string; value: string; dot?: 'green' | 'amber' | 'red' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-[#6B6B72]">{label}</span>
      <div className="flex items-center gap-1.5">
        {dot && (
          <span className={`w-1.5 h-1.5 rounded-full ${
            dot === 'green' ? 'bg-[#16A34A]' : dot === 'amber' ? 'bg-[#E8A930]' : 'bg-[#DC2626]'
          }`} />
        )}
        <span className="text-[12px] font-medium text-[#F0F0F0]">{value}</span>
      </div>
    </div>
  );
}
