import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Eye, EyeOff, Loader2, ShieldCheck, Globe, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import api from '../../api';

// Background image from the brain directory
import authBg from '../../assets/auth_bg.png';

export function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { error: toastError, success } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.post('/auth/login', { email, password });
        login(res.data.access_token, res.data.user);
        success('Authentication successful', `Welcome back, ${res.data.user.name}`);
        navigate('/');
      } else {
        const res = await api.post('/auth/register', { email, password, name });
        login(res.data.access_token, res.data.user);
        success('Account provisioned', `Welcome to VendorIQ, ${res.data.user.name}`);
        navigate('/');
      }
    } catch (err: any) {
      toastError(
        isLogin ? 'Authentication Failed' : 'Registration Failed',
        err.response?.data?.detail || 'An unexpected error occurred.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] split-layout overflow-hidden">
      
      {/* LEFT SIDE: Visual Anchor (Hidden on mobile) */}
      <div className="hidden lg:relative lg:flex flex-col justify-between p-16 overflow-hidden border-r border-[#1E1E22]">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={authBg} 
            alt="Enterprise AI" 
            className="w-full h-full object-cover opacity-60 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0A0A0B] via-[#0A0A0B]/80 to-transparent" />
        </div>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#E8A930] flex items-center justify-center">
              <Zap size={20} className="text-[#0A0A0B]" strokeWidth={2.5} />
            </div>
            <span className="text-[20px] font-bold text-[#F0F0F0] tracking-tight">VendorIQ</span>
          </div>

          <h2 className="text-[48px] font-bold text-white leading-[1.1] tracking-tight max-w-md mb-6">
            Defensible Intelligence through <span className="text-gradient-gold">Agentic Debates</span>
          </h2>
          <p className="text-[16px] text-[#A0A0A8] max-w-sm leading-relaxed mb-12">
            The world's first multi-agent debate engine designed for high-stakes enterprise vendor evaluation.
          </p>

          <div className="flex flex-col gap-6">
            <ValueProp icon={<ShieldCheck size={18} />} title="Audit-Ready" description="Every decision backed by a full adversarial audit trail." />
            <ValueProp icon={<Globe size={18} />} title="Global Compliance" description="Native support for GDPR, SOC2, and localized regulations." />
            <ValueProp icon={<Lock size={18} />} title="Executive Privacy" description="Military-grade encryption for all procurement documents." />
          </div>
        </motion.div>

        <div className="relative z-10 flex items-center gap-6 text-[11px] text-[#374151] uppercase tracking-[0.2em] font-bold">
          <span>SYSTEM VERSION 2.4.0</span>
          <span className="w-1 h-1 rounded-full bg-[#1E1E22]" />
          <span>ENCRYPTED_TLS_1.3</span>
        </div>
      </div>

      {/* RIGHT SIDE: Auth Form */}
      <div className="flex flex-col items-center justify-center p-8 lg:p-20 relative">
        {/* Background Gradients for Mobile */}
        <div className="lg:hidden absolute inset-0 bg-[#0A0A0B] dot-grid opacity-20" />
        <div className="lg:hidden absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#E8A930]/[0.05] blur-[100px] rounded-full" />

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[400px] relative z-10"
        >
          {/* Mobile Branding */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="w-12 h-12 rounded-xl bg-[#E8A930] flex items-center justify-center mb-4">
              <Zap size={22} className="text-[#0A0A0B]" strokeWidth={2.5} />
            </div>
            <h1 className="text-[24px] font-bold text-[#F0F0F0]">VendorIQ</h1>
          </div>

          <div className="mb-10">
            <h2 className="text-[28px] font-bold text-[#F0F0F0] mb-2">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </h2>
            <p className="text-[14px] text-[#6B6B72]">
              {isLogin 
                ? 'Welcome back. Enter your credentials to access the intelligence dashboard.' 
                : 'Configure your enterprise workspace to start orchestrating vendor evaluations.'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <label className="text-[11px] text-[#A0A0A8] uppercase tracking-wider font-bold block mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Marcus Reed"
                    className="w-full bg-[#111113] border border-[#1E1E22] rounded-xl px-4 py-3 text-[14px] text-[#F0F0F0] placeholder-[#374151] focus:border-[#E8A930]/40 focus:ring-1 focus:ring-[#E8A930]/20 transition-all outline-none"
                    required={!isLogin}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-[11px] text-[#A0A0A8] uppercase tracking-wider font-bold block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="executive@company.com"
                className="w-full bg-[#111113] border border-[#1E1E22] rounded-xl px-4 py-3 text-[14px] text-[#F0F0F0] placeholder-[#374151] focus:border-[#E8A930]/40 focus:ring-1 focus:ring-[#E8A930]/20 transition-all outline-none"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] text-[#A0A0A8] uppercase tracking-wider font-bold">Password</label>
                {isLogin && (
                  <button type="button" className="text-[11px] text-[#E8A930] hover:underline font-bold cursor-pointer">Forgot password?</button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#111113] border border-[#1E1E22] rounded-xl px-4 py-3 pr-12 text-[14px] text-[#F0F0F0] placeholder-[#374151] focus:border-[#E8A930]/40 focus:ring-1 focus:ring-[#E8A930]/20 transition-all outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#374151] hover:text-[#6B6B72] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full h-12 bg-[#F0F0F0] text-[#0A0A0B] font-bold text-[14px] rounded-xl flex items-center justify-center gap-2 hover:bg-[#E8A930] transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Sign Up'}
                  <ChevronRight size={16} />
                </>
              )}
            </button>

          </form>

          <div className="mt-12 pt-8 border-t border-[#1E1E22] flex flex-col items-center gap-4">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[13px] text-[#6B6B72] hover:text-[#F0F0F0] transition-colors cursor-pointer"
            >
              {isLogin 
                ? "Don't have an account? Sign Up" 
                : "Already have an account? Sign In"
              }
            </button>
            <p className="text-[10px] text-[#374151] text-center leading-relaxed">
              By continuing, you agree to the VendorIQ Enterprise Master Services Agreement.<br/>
              Access is monitored by Corporate Compliance protocols.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ValueProp({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 w-8 h-8 rounded-lg bg-[#111113] border border-[#1E1E22] flex items-center justify-center text-[#E8A930]">
        {icon}
      </div>
      <div>
        <h4 className="text-[14px] font-bold text-[#F0F0F0] mb-0.5">{title}</h4>
        <p className="text-[13px] text-[#6B6B72] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
