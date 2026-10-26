import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Clock, 
  ShieldAlert, 
  FileCheck,
  EyeOff,
  Activity
} from 'lucide-react';
import { api } from '../services/api';
import { SecurityPosture } from '../types';
import { MetricCard } from '../components/MetricCard';

export const SecurityCentrePage: React.FC = () => {
  const [securityData, setSecurityData] = useState<SecurityPosture | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSecurityStatus = async () => {
      setLoading(true);
      try {
        const data = await api.security.getStatus();
        setSecurityData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve defensive security status.');
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityStatus();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-xs text-[#94a3b8]">Scanning security configuration...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-wider text-[#f8fafc]">
            DEFENSIVE CYBERSECURITY CENTRE
          </h1>
          <span className="text-[11px] px-2 py-0.5 rounded bg-[#166534] text-[#38bdf8] border border-[#1e293b] font-mono">
            VERIFIED CONTROLS
          </span>
        </div>
        <p className="text-xs text-[#94a3b8] mt-1">
          Defensive posture inspection, authentication telemetry, rate limiting counters, and session parameters.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-950/70 border border-red-700/60 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Honest Boundary Notice */}
      <div className="p-4 rounded-lg bg-[#0b1120] border border-[#1e293b] flex items-start gap-3 text-xs text-[#94a3b8]">
        <ShieldAlert className="w-5 h-5 text-[#ff9933] flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-[#f8fafc] font-bold uppercase tracking-wider block">
            Scope & Honest Security Declarations
          </strong>
          <p className="leading-relaxed">
            This dashboard displays implemented defensive application controls. It is NOT a claim of formal military certification, 
            Common Criteria evaluation, or DRDO accreditation. Production institutional deployment requires hardened HSMs, 
            air-gapped infrastructure, and independent third-party penetration audits.
          </p>
        </div>
      </div>

      {/* Security Telemetry Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Active Session TTL"
          value={`${securityData?.session_information.session_ttl_minutes ?? 480} mins`}
          subtitle={`User: ${securityData?.session_information.authenticated_user}`}
          icon={<Clock className="w-4 h-4 text-cyan-400" />}
        />
        <MetricCard
          title="Failed Login Events"
          value={securityData?.telemetry_metrics.total_failed_logins_recorded ?? 0}
          subtitle="Cumulative rate-limit telemetry"
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
          variant={securityData && securityData.telemetry_metrics.total_failed_logins_recorded > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Currently Locked Accounts"
          value={securityData?.telemetry_metrics.currently_locked_accounts ?? 0}
          subtitle="Active temporary lockouts"
          icon={<Lock className="w-4 h-4 text-emerald-400" />}
          variant={securityData && securityData.telemetry_metrics.currently_locked_accounts > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Active Session & Effective RBAC Permissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] p-5 space-y-4">
          <div className="border-b border-[#1e293b] pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff9933] block">
              Session Profile
            </span>
            <div className="font-mono text-sm font-bold text-[#f8fafc] mt-1">
              {securityData?.session_information.full_name}
            </div>
            <div className="text-[11px] text-[#38bdf8] font-mono">
              Assigned Role: {securityData?.session_information.assigned_role}
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-[#94a3b8]">
            <span className="font-semibold text-[#f8fafc] block">Server-Enforced Permissions:</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {securityData?.session_information.effective_permissions.map((perm, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-[#0f172a] border border-[#1e293b] font-mono text-[11px] text-[#d4c59a]"
                >
                  {perm}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Security Audit Events */}
        <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] p-5 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#f8fafc] flex items-center gap-1.5 border-b border-[#1e293b] pb-2">
            <Activity className="w-3.5 h-3.5 text-[#ff9933]" />
            Recent Authentication & Security Events
          </span>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {securityData?.recent_security_events.map((ev: any) => (
              <div key={ev.id} className="p-2 rounded bg-[#070c18] border border-[#1e293b] flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-[#f8fafc]">{ev.action}</span>
                  <span className="text-[11px] text-[#64748b] ml-2">by {ev.actor_username}</span>
                </div>
                <span className="text-[10px] text-[#64748b] font-mono">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Defensive Security Controls Verification Table */}
      <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] overflow-hidden">
        <div className="p-4 border-b border-[#1e293b]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#f8fafc]">
            Active Defensive Controls Audit Table
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0f172a] text-[#94a3b8] border-b border-[#1e293b] uppercase font-mono text-[11px]">
              <tr>
                <th className="px-4 py-2.5">Security Control</th>
                <th className="px-4 py-2.5">Architecture & Cryptography Implementation</th>
                <th className="px-4 py-2.5">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/50">
              {securityData?.defensive_security_controls.map((ctrl, i) => (
                <tr key={i} className="hover:bg-[#0f172a]/60">
                  <td className="px-4 py-3 font-semibold text-[#f8fafc]">{ctrl.control}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#94a3b8]">{ctrl.implementation}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                      <CheckCircle2 className="w-3 h-3" />
                      {ctrl.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
