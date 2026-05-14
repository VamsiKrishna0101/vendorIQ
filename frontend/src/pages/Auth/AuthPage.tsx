import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import api from '../../api';

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
    <div className="min-h-screen bg-[#0A0A0B] dot-grid flex items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[480px] h-[480px] rounded-full bg-[#E8A930]/[0.03] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-[420px]"
      >
        {/* Card */}
        <div
          className="bg-[#111113] border border-[#1E1E22] rounded-2xl p-8 overflow-hidden relative"
          style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.6), 0 0 60px rgba(232,169,48,0.04)' }}
        >
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#E8A930] flex items-center justify-center mb-4">
              <Zap size={22} className="text-[#0A0A0B]" strokeWidth={2.5} />
            </div>
            <h1 className="text-[22px] font-bold text-[#F0F0F0] tracking-tight">VendorIQ</h1>
            <p className="text-[12px] text-[#6B6B72] mt-1 uppercase tracking-widest font-medium">
              AI Decision Intelligence
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#1E1E22] mb-8" />

          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              {!isLogin && (
                <div>
                  <label className="text-[12px] text-[#A0A0A8] font-medium block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-[#16161A] border border-[#1E1E22] rounded-lg px-3.5 py-2.5 text-[14px] text-[#F0F0F0] placeholder-[#374151] outline-none focus:border-[#E8A930]/40 transition-colors"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="text-[12px] text-[#A0A0A8] font-medium block mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@enterprise.com"
                  className="w-full bg-[#16161A] border border-[#1E1E22] rounded-lg px-3.5 py-2.5 text-[14px] text-[#F0F0F0] placeholder-[#374151] outline-none focus:border-[#E8A930]/40 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] text-[#A0A0A8] font-medium block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#16161A] border border-[#1E1E22] rounded-lg px-3.5 py-2.5 pr-10 text-[14px] text-[#F0F0F0] placeholder-[#374151] outline-none focus:border-[#E8A930]/40 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B72] hover:text-[#A0A0A8]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-[#E8A930]" />
                    <span className="text-[12px] text-[#6B6B72]">Remember me</span>
                  </label>
                  <button type="button" className="text-[12px] text-[#6B6B72] hover:text-[#E8A930] transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.01 } : {}}
                whileTap={!loading ? { scale: 0.99 } : {}}
                className="mt-2 w-full h-11 bg-[#E8A930] text-[#0A0A0B] font-semibold text-[14px] rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-80"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {isLogin ? 'Authenticating...' : 'Provisioning...'}
                  </>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          <div className="mt-6 flex flex-col items-center gap-3">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[12px] text-[#A0A0A8] hover:text-[#F0F0F0] transition-colors"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
            </button>
            <p className="text-[11px] text-[#374151] text-center">
              Enterprise access only. Actions are logged.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
