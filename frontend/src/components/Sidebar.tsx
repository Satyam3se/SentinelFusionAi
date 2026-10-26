import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  Flame,
  CheckSquare,
  FileText,
  Cpu,
  Radio,
  HardDrive,
  FlaskConical,
  ScrollText,
  ShieldCheck,
  Users,
  BookOpen,
  Radar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, hasRole } = useAuth();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
      isActive
        ? 'tiranga-active-tab font-bold text-white'
        : 'text-[#94a3b8] hover:bg-[#111a2e] hover:text-[#f8fafc]'
    }`;

  return (
    <aside aria-label="Operational Navigation" className="w-64 bg-[#090d18]/95 backdrop-blur-md border-r border-[#1e293b] flex flex-col flex-shrink-0 min-h-[calc(100vh-3.5rem)] shadow-2xl">
      <div className="p-3 space-y-6 flex-1 overflow-y-auto">
        {/* Tier 1: Saffron Tier (Operational Command) */}
        <div>
          <div className="flex items-center gap-1.5 px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#FF9933] font-mono">
            <span className="w-2 h-2 rounded-full bg-[#FF9933] shadow-[0_0_8px_#FF9933]"></span>
            <span>COMMAND & OPS (KESARI)</span>
          </div>
          <div className="mt-1.5 space-y-0.5">
            <NavLink to="/dashboard" className={navItemClass}>
              <LayoutDashboard className="w-4 h-4 text-[#FF9933] group-hover:scale-110 transition-transform" />
              <span>Main Dashboard</span>
            </NavLink>
            <NavLink to="/tactical-map" className={navItemClass}>
              <Radar className="w-4 h-4 text-[#FF9933] group-hover:scale-110 transition-transform" />
              <span className="flex items-center justify-between w-full">
                <span>Tactical Radar & COA</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FF9933]/25 text-[#ffb366] border border-[#FF9933]/40 font-mono font-bold">360°</span>
              </span>
            </NavLink>
            <NavLink to="/reports" className={navItemClass}>
              <Inbox className="w-4 h-4 text-[#FF9933] group-hover:scale-110 transition-transform" />
              <span>Incoming Reports</span>
            </NavLink>
            <NavLink to="/incidents" className={navItemClass}>
              <Flame className="w-4 h-4 text-[#FF9933] group-hover:scale-110 transition-transform" />
              <span>Incident Correlation</span>
            </NavLink>
            <NavLink to="/review" className={navItemClass}>
              <CheckSquare className="w-4 h-4 text-[#FF9933] group-hover:scale-110 transition-transform" />
              <span>Human Review Centre</span>
            </NavLink>
            <NavLink to="/situation-reports" className={navItemClass}>
              <FileText className="w-4 h-4 text-[#FF9933] group-hover:scale-110 transition-transform" />
              <span>Situation Reports</span>
            </NavLink>
          </div>
        </div>

        {/* Tier 2: White & Navy Tier (Analysis & Resilience) */}
        <div>
          <div className="flex items-center gap-1.5 px-3 text-[10px] font-extrabold uppercase tracking-wider text-white font-mono">
            <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white]"></span>
            <span>INTEL & RESILIENCE (WHITE)</span>
          </div>
          <div className="mt-1.5 space-y-0.5">
            <NavLink to="/analysis" className={navItemClass}>
              <Cpu className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>Explainable Analysis</span>
            </NavLink>
            <NavLink to="/source-health" className={navItemClass}>
              <Radio className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
              <span>Source Health & Data</span>
            </NavLink>
            <NavLink to="/resilience" className={navItemClass}>
              <HardDrive className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Offline Resilience</span>
            </NavLink>
            <NavLink to="/simulation" className={navItemClass}>
              <FlaskConical className="w-4 h-4 text-blue-300 group-hover:scale-110 transition-transform" />
              <span>Simulation Lab</span>
            </NavLink>
          </div>
        </div>

        {/* Tier 3: India Green Tier (Governance & Security) */}
        <div>
          <div className="flex items-center gap-1.5 px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#4ADE80] font-mono">
            <span className="w-2 h-2 rounded-full bg-[#138808] shadow-[0_0_8px_#138808]"></span>
            <span>GOVERNANCE & AUDIT (GREEN)</span>
          </div>
          <div className="mt-1.5 space-y-0.5">
            <NavLink to="/audit" className={navItemClass}>
              <ScrollText className="w-4 h-4 text-[#10b981] group-hover:scale-110 transition-transform" />
              <span>Audit Trail</span>
            </NavLink>
            <NavLink to="/security" className={navItemClass}>
              <ShieldCheck className="w-4 h-4 text-[#10b981] group-hover:scale-110 transition-transform" />
              <span>Security Centre</span>
            </NavLink>
            {hasRole(['Administrator']) && (
              <NavLink to="/admin/users" className={navItemClass}>
                <Users className="w-4 h-4 text-[#10b981] group-hover:scale-110 transition-transform" />
                <span className="flex items-center justify-between w-full">
                  <span>User Administration</span>
                  <span className="text-[9px] px-1 rounded bg-[#138808]/20 text-[#4ade80] border border-[#138808]/40 font-mono">ADMIN</span>
                </span>
              </NavLink>
            )}
            <NavLink to="/documentation" className={navItemClass}>
              <BookOpen className="w-4 h-4 text-[#10b981] group-hover:scale-110 transition-transform" />
              <span>Documentation & Limits</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Sidebar Footer with Active Role Pill */}
      {user && (
        <div className="p-3 border-t border-[#1e293b] bg-[#070c18]">
          <div className="flex items-center justify-between text-[11px] text-[#94a3b8]">
            <span className="truncate font-medium text-white">{user.username}</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#0b1120] border border-[#FF9933]/50 text-[#FFB366] font-bold">
              {user.role}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
