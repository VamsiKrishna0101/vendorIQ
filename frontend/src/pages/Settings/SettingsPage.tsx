import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Activity, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import api from '../../api';

export function SettingsPage() {
  const { user, token, login } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [rounds, setRounds] = useState(3);
  const [streamSpeed, setStreamSpeed] = useState(18);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', {
        name,
        email,
        role
      });

      if (token) {
        login(token, res.data);
      }
      
      success('Profile Updated', 'Your settings have been successfully saved to the database.');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      error('Update Failed', err.response?.data?.detail || 'Could not update profile information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      <div className="border-b border-[#1E1E22] px-8 py-6">
        <h1 className="text-[22px] font-bold text-[#F0F0F0]">Settings</h1>
        <p className="text-[13px] text-[#6B6B72] mt-1">Configure your VendorIQ platform preferences.</p>
      </div>

      <div className="p-8 flex flex-col gap-6 max-w-2xl">

        {/* Profile */}
        <SettingSection title="Profile">
          <div className="flex flex-col gap-4">
            <Field label="Full Name">
              <input value={name} onChange={e => setName(e.target.value)}
                className="input-style" />
            </Field>
            <Field label="Email Address">
              <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                className="input-style" />
            </Field>
            <Field label="Role">
              <input value={role} onChange={e => setRole(e.target.value)}
                className="input-style" />
            </Field>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 self-start bg-[#E8A930] text-[#0A0A0B] font-semibold px-5 py-2.5 rounded-lg text-[13px] transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </SettingSection>

        {/* Debate Defaults */}
        <SettingSection title="Debate Defaults">
          <div className="flex flex-col gap-4">
            <Field label="Default Rounds">
              <div className="flex gap-2">
                {[1, 2, 3].map(r => (
                  <button key={r} onClick={() => setRounds(r)}
                    className={`flex-1 h-9 rounded-lg text-[13px] font-medium border transition-all ${
                      rounds === r ? 'bg-[#E8A930] text-[#0A0A0B] border-[#E8A930]' : 'bg-[#16161A] text-[#A0A0A8] border-[#1E1E22]'
                    }`}>
                    {r}
                  </button>
                ))}
              </div>
            </Field>

            <div className="flex flex-col gap-2">
              {[
                { label: 'Customer Panel', desc: 'Include customer representatives by default' },
                { label: 'Adversarial Audit', desc: 'Include adversarial auditors by default' },
                { label: 'Decision Committee', desc: 'Enable all 7 decision agents' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-center justify-between p-3 bg-[#16161A] border border-[#1E1E22] rounded-lg">
                  <div>
                    <div className="text-[13px] font-medium text-[#F0F0F0]">{label}</div>
                    <div className="text-[11px] text-[#6B6B72]">{desc}</div>
                  </div>
                  <div className="w-9 h-5 rounded-full bg-[#E8A930] flex items-center px-0.5 cursor-pointer">
                    <motion.div className="w-4 h-4 rounded-full bg-white" animate={{ x: 16 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SettingSection>

        {/* Streaming */}
        <SettingSection title="Streaming">
          <Field label={`Streaming Speed — ${streamSpeed}ms / character`}>
            <input
              type="range" min={5} max={50} value={streamSpeed}
              onChange={e => setStreamSpeed(Number(e.target.value))}
              className="w-full accent-[#E8A930]"
            />
            <div className="flex justify-between text-[11px] text-[#6B6B72] mt-1">
              <span>Fastest</span><span>Slowest</span>
            </div>
          </Field>
        </SettingSection>

        {/* API Status */}
        <SettingSection title="API Status">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 bg-[#16161A] border border-[#1E1E22] rounded-lg">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-[#16A34A]" />
                <span className="text-[13px] text-[#F0F0F0]">Gemini 2.0 Flash</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                <span className="text-[12px] text-[#16A34A] font-medium">Online</span>
              </div>
            </div>
            {[
              { label: 'Response Latency', value: '1.2s avg' },
              { label: 'Model Version', value: 'gemini-2.0-flash' },
              { label: 'Request Quota', value: '94% remaining' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center text-[13px]">
                <span className="text-[#6B6B72]">{label}</span>
                <span className="text-[#F0F0F0] font-medium">{value}</span>
              </div>
            ))}
          </div>
        </SettingSection>

        {/* System */}
        <SettingSection title="System">
          <div className="flex flex-col gap-2">
            {[
              { label: 'Export All Debates', cls: 'text-[#A0A0A8] border-[#1E1E22] hover:border-[#2E2E32]' },
              { label: 'Clear Session Data', cls: 'text-[#DC2626] border-[#DC2626]/20 hover:bg-[#DC2626]/5' },
            ].map(({ label, cls }) => (
              <button key={label} className={`border px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left ${cls}`}>
                {label}
              </button>
            ))}
            <div className="text-[11px] text-[#374151] mt-2">VendorIQ v1.0.0 · Enterprise Edition</div>
          </div>
        </SettingSection>
      </div>
    </div>
  );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111113] border border-[#1E1E22] rounded-xl p-5">
      <h3 className="text-[11px] font-semibold text-[#6B6B72] uppercase tracking-wider mb-5">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[12px] text-[#A0A0A8] font-medium block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
