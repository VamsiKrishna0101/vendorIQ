import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Loader2, Users, Shield, LayoutGrid, FileText, Cpu } from 'lucide-react';
import { UploadZone } from '../../components/upload/UploadZone';
import { useToast } from '../../components/common/Toast';
import api from '../../api';

export function GeneratePage() {
  const navigate = useNavigate();
  const { success, error, warning, info } = useToast();
  const [files, setFiles] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [vendors, setVendors] = useState('');
  const [customerPanel, setCustomerPanel] = useState(true);
  const [adversarialAudit, setAdversarialAudit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [buyerContext, setBuyerContext] = useState({
    companyName: '',
    industry: 'Technology',
    size: '500-5000',
    techStack: '',
    keyRequirements: '',
    region: 'Global'
  });

  const canStart = files.length > 0 && vendors.trim().length > 0;

  const handleFilesChange = (newFiles: any[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0 && newFiles.length > files.length) {
      success(
        `${newFiles[newFiles.length - 1].name} added`,
        `${newFiles.length} document${newFiles.length > 1 ? 's' : ''} ready for analysis`
      );
    }
  };

  const handleVendorBlur = () => {
    const names = vendors.split(',').map(v => v.trim()).filter(Boolean);
    if (names.length > 0) {
      info(`${names.length} vendor${names.length > 1 ? 's' : ''} configured`, names.join(' · '));
    }
  };

  const handleStart = async () => {
    if (files.length === 0) {
      error('No documents uploaded', 'Please upload at least one vendor document to proceed.');
      return;
    }
    if (!vendors.trim()) {
      warning('No vendors specified', 'Enter vendor names separated by commas to configure the debate.');
      return;
    }

    const vendorList = vendors.split(',').map(v => v.trim()).filter(Boolean);
    const totalAgents = 5 + 7 + (customerPanel ? 3 : 0) + (adversarialAudit ? 3 : 0);

    setLoading(true);
    success(
      'Initializing Executive Debate',
      `${totalAgents} AI agents · ${vendorList.length} vendors · 4 rounds`
    );

    try {
      // 1. Upload files
      const formData = new FormData();
      files.forEach(f => formData.append('files', f.file));
      
      const uploadRes = await api.post('/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Extract file paths returned by the upload endpoint
      const filePaths = uploadRes.data.data.map((r: any) => r.path);

      // 2. Start debate
      const startRes = await api.post('/debate/start', {
        file_paths: filePaths,
        vendor_names: vendorList,
        buyer_context: buyerContext
      });

      // 3. Navigate to debate UI
      navigate(`/debate?session_id=${startRes.data.session_id}`);
      
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const errorMsg = Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : (detail || err.message);
      error('Failed to start debate', errorMsg);
      setLoading(false);
    }
  };

  const decisionCount = 7;
  const customerCount = customerPanel ? 3 : 0;
  const adversarialCount = adversarialAudit ? 3 : 0;
  const analystCount = 5;
  const totalAgents = decisionCount + customerCount + adversarialCount + analystCount;

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-[#1E1E22] px-8 py-7"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1.5 h-6 bg-[#E8A930] rounded-full" />
          <h1 className="text-[26px] font-bold text-[#F0F0F0] tracking-tight">Configure Executive Debate</h1>
        </div>
        <p className="text-[14px] text-[#6B6B72] ml-4">
          Upload vendor documents · Configure your committee · Launch AI-powered evaluation
        </p>
      </motion.div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">

          {/* LEFT: Upload */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SectionCard title="Vendor Documents" icon={<FileText size={14} />}>
              <UploadZone onFilesChange={handleFilesChange} />
            </SectionCard>
          </motion.div>

          {/* RIGHT: Configuration */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col gap-5"
          >

            {/* Evaluation Setup */}
            <SectionCard title="Evaluation Setup" icon={<Cpu size={14} />}>
              <div className="flex flex-col gap-4">
                <Field label="Evaluation Title">
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Cloud Infrastructure Vendor Selection Q3"
                    className="input-field"
                  />
                </Field>
                <Field label="Vendor Names">
                  <input
                    value={vendors}
                    onChange={e => setVendors(e.target.value)}
                    onBlur={handleVendorBlur}
                    placeholder="e.g. AWS, Microsoft Azure, Google Cloud"
                    className="input-field"
                  />
                  <p className="text-[11px] text-[#374151] mt-1.5">Separate multiple vendors with commas</p>
                </Field>

                {/* Static badges */}
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <InfoBadge label="Evaluation Mode" value="Vendor Selection" />
                  <InfoBadge label="Debate Rounds" value="4 Rounds" />
                </div>
              </div>
            </SectionCard>

            {/* Buying Organization */}
            <SectionCard title="Buying Organization" icon={<Users size={14} />}>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Company Name">
                    <input
                      value={buyerContext.companyName}
                      onChange={e => setBuyerContext({...buyerContext, companyName: e.target.value})}
                      placeholder="e.g. BMW Group"
                      className="input-field"
                    />
                  </Field>
                  <Field label="Industry">
                    <select
                      value={buyerContext.industry}
                      onChange={e => setBuyerContext({...buyerContext, industry: e.target.value})}
                      className="input-field appearance-none cursor-pointer"
                    >
                      <option>Technology</option>
                      <option>Manufacturing</option>
                      <option>Financial Services</option>
                      <option>Healthcare</option>
                      <option>Retail</option>
                      <option>Logistics</option>
                      <option>Government</option>
                      <option>Other</option>
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Company Size">
                    <select
                      value={buyerContext.size}
                      onChange={e => setBuyerContext({...buyerContext, size: e.target.value})}
                      className="input-field appearance-none cursor-pointer"
                    >
                      <option>1-500</option>
                      <option>500-5000</option>
                      <option>5000-50000</option>
                      <option>50000+</option>
                    </select>
                  </Field>
                  <Field label="Regulatory Region">
                    <select
                      value={buyerContext.region}
                      onChange={e => setBuyerContext({...buyerContext, region: e.target.value})}
                      className="input-field appearance-none cursor-pointer"
                    >
                      <option>Global</option>
                      <option>US</option>
                      <option>EU/Germany</option>
                      <option>UK</option>
                      <option>APAC</option>
                    </select>
                  </Field>
                </div>

                <Field label="Current Tech Stack">
                  <input
                    value={buyerContext.techStack}
                    onChange={e => setBuyerContext({...buyerContext, techStack: e.target.value})}
                    placeholder="e.g. SAP ERP, Microsoft 365, Salesforce"
                    className="input-field"
                  />
                </Field>

                <Field label="Key Requirements">
                  <textarea
                    value={buyerContext.keyRequirements}
                    onChange={e => setBuyerContext({...buyerContext, keyRequirements: e.target.value})}
                    placeholder="e.g. Must be GDPR compliant, integrate with SAP, under €500K/year"
                    className="input-field min-h-[80px] py-3 resize-none"
                  />
                </Field>
              </div>
            </SectionCard>

            {/* Debate Configuration */}
            <SectionCard title="Committee Configuration" icon={<Users size={14} />}>
              <div className="flex flex-col gap-3">
                {/* Always-on */}
                <AlwaysOnBadge
                  label="Decision Committee"
                  description="CFO · CTO · Legal · Operations · Architect · Procurement · Digital Lead"
                  count={7}
                  color="#E8A930"
                />

                {/* Toggles */}
                <Toggle
                  label="Customer Panel"
                  description="Positive Rep · Negative Rep · Neutral Rep"
                  icon={<Users size={14} />}
                  enabled={customerPanel}
                  onChange={v => {
                    setCustomerPanel(v);
                    if (v) info('Customer Panel enabled', '3 customer representatives added to the debate');
                    else warning('Customer Panel disabled', 'Customer perspective will not be represented');
                  }}
                  color="#16A34A"
                />
                <Toggle
                  label="Adversarial Audit"
                  description="Devil's Advocate · Bias Detector · Governance Auditor"
                  icon={<Shield size={14} />}
                  enabled={adversarialAudit}
                  onChange={v => {
                    setAdversarialAudit(v);
                    if (v) info('Adversarial Audit enabled', 'Bias detection and governance review active');
                    else warning('Adversarial Audit disabled', 'No bias or governance checking will occur');
                  }}
                  color="#DC2626"
                />
              </div>
            </SectionCard>

            {/* Agent Summary */}
            <motion.div
              className="bg-[#1A1500] border border-[#E8A930]/20 rounded-xl p-4 flex items-center justify-between"
              animate={{ borderColor: canStart ? 'rgba(232,169,48,0.4)' : 'rgba(232,169,48,0.15)' }}
            >
              <div className="flex items-center gap-3">
                <LayoutGrid size={16} className="text-[#E8A930]" />
                <div>
                  <span className="text-[16px] font-bold text-[#E8A930]">{totalAgents}</span>
                  <span className="text-[13px] text-[#A0A0A8] ml-2">AI agents ready</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <AgentBadge label={`${analystCount} Analysts`} color="#A0A0A8" />
                <AgentBadge label={`${decisionCount} Decision`} color="#E8A930" />
                {customerPanel && <AgentBadge label={`${customerCount} Customer`} color="#16A34A" />}
                {adversarialAudit && <AgentBadge label={`${adversarialCount} Audit`} color="#DC2626" />}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 max-w-6xl"
        >
          <motion.button
            disabled={loading}
            whileHover={{ scale: canStart && !loading ? 1.005 : 1 }}
            whileTap={{ scale: canStart && !loading ? 0.998 : 1 }}
            onClick={handleStart}
            className={`w-full h-16 rounded-xl text-[16px] font-bold flex items-center justify-center gap-3 transition-all relative overflow-hidden ${
              canStart && !loading
                ? 'bg-[#E8A930] text-[#0A0A0B] cursor-pointer'
                : 'bg-[#1C1C21] text-[#374151] cursor-not-allowed'
            }`}
            style={canStart && !loading ? {
              boxShadow: '0 0 40px rgba(232,169,48,0.25), 0 4px 16px rgba(0,0,0,0.4)'
            } : {}}
          >
            {/* Shimmer */}
            {canStart && !loading && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
            )}
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Initializing {totalAgents} AI Agents...
              </>
            ) : (
              <>
                <Play size={20} strokeWidth={2.5} />
                Launch Executive Debate
              </>
            )}
          </motion.button>

          {!canStart && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-[12px] text-[#374151] mt-3"
            >
              {files.length === 0 && !vendors.trim()
                ? 'Upload documents and add vendor names to continue'
                : files.length === 0
                ? 'Upload at least one vendor document to continue'
                : 'Enter vendor names to continue'}
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Global input style */}
      <style>{`
        .input-field {
          width: 100%;
          background: #16161A;
          border: 1px solid #1E1E22;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          color: #F0F0F0;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-field::placeholder { color: #374151; }
        .input-field:focus { border-color: rgba(232,169,48,0.4); }
      `}</style>
    </div>
  );
}

// ── Sub-components ──────────────────────────────

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#111113] border border-[#1E1E22] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[#E8A930]">{icon}</span>
        <h3 className="text-[11px] font-bold text-[#6B6B72] uppercase tracking-widest">{title}</h3>
      </div>
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

function InfoBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#16161A] border border-[#1E1E22] rounded-lg px-3 py-2.5">
      <div className="text-[10px] text-[#6B6B72] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[13px] font-semibold text-[#E8A930]">{value}</div>
    </div>
  );
}

function AlwaysOnBadge({ label, description, count, color }: {
  label: string; description: string; count: number; color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border"
      style={{ borderColor: `${color}20`, backgroundColor: `${color}06` }}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
        style={{ backgroundColor: `${color}20`, color }}>
        {count}
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-semibold text-[#F0F0F0]">{label}</div>
        <div className="text-[10px] text-[#6B6B72] mt-0.5">{description}</div>
      </div>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded"
        style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
        ALWAYS ON
      </span>
    </div>
  );
}

function Toggle({ label, description, icon, enabled, onChange, color }: {
  label: string; description: string; icon: React.ReactNode;
  enabled: boolean; onChange: (v: boolean) => void; color: string;
}) {
  return (
    <motion.div
      onClick={() => onChange(!enabled)}
      animate={{ borderColor: enabled ? `${color}30` : '#1E1E22' }}
      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
      style={{ backgroundColor: enabled ? `${color}06` : '#16161A' }}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.998 }}
    >
      <span style={{ color: enabled ? color : '#6B6B72' }}>{icon}</span>
      <div className="flex-1">
        <div className="text-[13px] font-semibold text-[#F0F0F0]">{label}</div>
        <div className="text-[10px] text-[#6B6B72] mt-0.5">{description}</div>
      </div>
      <div className="w-10 h-5.5 rounded-full flex items-center px-0.5 transition-colors"
        style={{ backgroundColor: enabled ? color : '#1E1E22', padding: '2px' }}>
        <motion.div
          animate={{ x: enabled ? 18 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="w-4 h-4 rounded-full bg-white shadow"
        />
      </div>
    </motion.div>
  );
}

function AgentBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded font-semibold border"
      style={{ color, backgroundColor: `${color}15`, borderColor: `${color}30` }}>
      {label}
    </span>
  );
}
