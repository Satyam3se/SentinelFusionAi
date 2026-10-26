import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  LogOut, 
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AshokaChakra: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor">
    <circle cx="50" cy="50" r="46" strokeWidth="4" />
    <circle cx="50" cy="50" r="8" fill="currentColor" />
    {Array.from({ length: 24 }).map((_, i) => {
      const angle = (i * 360) / 24;
      const rad = (angle * Math.PI) / 180;
      const x2 = 50 + 44 * Math.cos(rad);
      const y2 = 50 + 44 * Math.sin(rad);
      return <line key={i} x1="50" y1="50" x2={x2} y2={y2} strokeWidth="2.5" />;
    })}
  </svg>
);

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isBackendReachable } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-[#0b1120]/95 backdrop-blur-md border-b border-[#1e293b] shadow-xl">
      {/* Official 3-Stripe Indian Flag Horizontal Ribbon */}
      <div className="tiranga-ribbon-horizontal w-full" />

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo & Brand with True Indian Flag Identity */}
          <div className="flex items-center space-x-3">
            <Link to="/dashboard" className="flex items-center space-x-2.5 group">
              {/* Emblem with 3-Stripe Indian Flag Accent */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#FF9933]/25 via-[#0b1120] to-[#138808]/25 border border-[#FF9933]/60 flex items-center justify-center shadow-[0_0_15px_rgba(255,153,51,0.3)] group-hover:shadow-[0_0_20px_rgba(255,153,51,0.5)] transition-all relative overflow-hidden">
                <Shield className="w-5 h-5 text-[#FF9933]" />
                <div className="absolute -bottom-1 w-full h-1 bg-[#138808]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-wider text-white font-heading">
                    SENTINELFUSION <span className="text-[#FF9933]">AI</span>
                  </span>
                  {/* Indian National Flag Badge */}
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF9933]/30 via-white/10 to-[#138808]/30 text-white border border-[#FF9933]/50 font-mono font-bold shadow-sm">
                    <AshokaChakra className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" />
                    <span>BHARAT DEFENCE C2</span>
                  </span>
                </div>
                <span className="text-[10px] tracking-widest text-[#94a3b8] uppercase font-mono">
                  Defence Intelligence & Multi-Sensor Correlation
                </span>
              </div>
            </Link>
          </div>

          {/* Right Navigation & User Controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* System Connectivity Indicator */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#070c18] border border-[#1e293b] text-xs">
              {isBackendReachable ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981] animate-pulse"></span>
                  <span className="text-[#cbd5e1] font-mono text-[11px]">CORE: <span className="text-emerald-400 font-bold">ONLINE</span></span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
                  <span className="text-[#f59e0b] font-mono text-[11px]">LOCAL OFFLINE</span>
                </>
              )}
            </div>

            {/* Quick Link to Documentation */}
            <Link
              to="/documentation"
              className="p-1.5 rounded text-[#94a3b8] hover:text-white hover:bg-[#1e293b] transition-colors"
              title="System Documentation & Limitations"
            >
              <HelpCircle className="w-4 h-4" />
            </Link>

            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                {/* User Role Tag */}
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white leading-none">{user.full_name}</span>
                  <span className="text-[10px] text-[#FF9933] font-mono mt-0.5 uppercase tracking-wide font-bold">
                    {user.role}
                  </span>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={logout}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium text-[#94a3b8] hover:text-red-300 hover:bg-red-950/40 border border-[#1e293b] hover:border-red-800/50 transition-colors cursor-pointer"
                  title="Sign out of SentinelFusion"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1 rounded bg-gradient-to-r from-[#138808] to-[#046A38] text-xs font-semibold text-white border border-[#138808]/50 hover:brightness-110 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
