import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SyntheticBanner } from '../components/SyntheticBanner';

export const LoginPage: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const isExpired = queryParams.get('expired') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setError('Please provide both username/email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await login(usernameOrEmail.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo account quick-fill helpers for evaluation
  const handleQuickFill = (u: string, p: string) => {
    setUsernameOrEmail(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-transparent text-[#f8fafc] flex flex-col justify-between tactical-grid-bg">
      <div>
        <SyntheticBanner />
        <div className="tiranga-ribbon-horizontal w-full" />
      </div>

      <div className="max-w-md w-full mx-auto px-6 py-12">
        {/* Brand Emblem */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-[#FF9933]/25 via-[#0b1120] to-[#138808]/25 border border-[#FF9933]/60 mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(255,153,51,0.3)] relative overflow-hidden mb-3">
            <Shield className="w-6 h-6 text-[#FF9933]" />
            <div className="absolute -bottom-1 w-full h-1 bg-[#138808]" />
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-wider text-[#f8fafc] uppercase">
            SENTINELFUSION <span className="text-[#FF9933]">AI</span>
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1 uppercase tracking-wider font-mono">
            🇮🇳 Secure Defence Analyst Authentication Console
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-xl bg-[#0b1120]/90 backdrop-blur-md border border-[#1e293b] p-6 shadow-2xl relative overflow-hidden">
          {/* Top Tricolour Ribbon */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FF9933] via-white to-[#138808] shadow-[0_0_12px_rgba(255,153,51,0.6)]" />

          {isExpired && (
            <div className="mb-4 p-3 rounded-lg bg-amber-950/60 border border-amber-700/50 text-xs text-amber-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Your session has expired. Please sign in again.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/70 border border-red-700/60 text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#cbd5e1] mb-1 font-mono">
                Username or Official Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748b]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="e.g. admin, analyst, reviewer"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#070c18] border border-[#1e293b] text-sm text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#ff9933] focus:ring-1 focus:ring-[#ff9933] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#cbd5e1] mb-1 font-mono">
                Access Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748b]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  required
                  className="w-full pl-9 pr-10 py-2 rounded-lg bg-[#070c18] border border-[#1e293b] text-sm text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#ff9933] focus:ring-1 focus:ring-[#ff9933] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748b] hover:text-[#f8fafc]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-lg bg-gradient-to-r from-[#ff9933] to-[#ea580c] text-sm font-extrabold text-[#070c18] hover:from-[#ffa94d] hover:to-[#f97316] shadow-[0_0_18px_rgba(255,153,51,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer font-heading tracking-wider"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>AUTHENTICATE SESSION</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Demonstration Accounts Box */}
          <div className="mt-6 pt-5 border-t border-[#1e293b]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#ffb366] font-mono block mb-2">
              🇮🇳 Evaluation Demo Accounts (Quick Fill):
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'SentinelAdminDemo#2026')}
                className="p-2.5 rounded-lg bg-[#070c18] border border-[#ff9933]/40 text-left hover:border-[#ff9933] hover:shadow-[0_0_10px_rgba(255,153,51,0.2)] transition-all group cursor-pointer"
              >
                <div className="font-bold text-[#ffb366] group-hover:text-white">admin</div>
                <div className="text-[10px] text-[#cbd5e1] font-mono">Administrator</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('analyst', 'SentinelAnalystDemo#2026')}
                className="p-2.5 rounded-lg bg-[#070c18] border border-[#10b981]/40 text-left hover:border-[#10b981] hover:shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all group cursor-pointer"
              >
                <div className="font-bold text-[#6ee7b7] group-hover:text-white">analyst</div>
                <div className="text-[10px] text-[#cbd5e1] font-mono">Intelligence Analyst</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('reviewer', 'SentinelReviewerDemo#2026')}
                className="p-2.5 rounded-lg bg-[#070c18] border border-white/30 text-left hover:border-white hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all group cursor-pointer"
              >
                <div className="font-bold text-[#f8fafc] group-hover:text-[#ff9933]">reviewer</div>
                <div className="text-[10px] text-[#cbd5e1] font-mono">Review Officer</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('observer', 'SentinelObserverDemo#2026')}
                className="p-2.5 rounded-lg bg-[#070c18] border border-blue-500/40 text-left hover:border-blue-400 hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all group cursor-pointer"
              >
                <div className="font-bold text-blue-300 group-hover:text-white">observer</div>
                <div className="text-[10px] text-[#cbd5e1] font-mono">Read-only Observer</div>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-[#64748b]">
          <Link to="/" className="hover:text-[#94a3b8] transition-colors">
            ← Return to Public Landing Page
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 border-t border-[#1e293b] text-[11px] text-[#64748b]">
        SentinelFusion AI Prototype • PBKDF2-HMAC-SHA256 • Server-Side Rate Limiting Active
      </footer>
    </div>
  );
};
