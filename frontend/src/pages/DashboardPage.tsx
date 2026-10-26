import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Inbox,
  Flame,
  CheckSquare,
  AlertTriangle,
  Radio,
  Activity,
  Play,
  RotateCcw,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Radar
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardMetrics, Incident } from '../types';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, incData] = await Promise.all([
        api.admin.getMetrics(),
        api.incidents.list({ limit: 6 }),
      ]);
      setMetrics(m);
      setRecentIncidents(incData.incidents || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve situational awareness data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRunCorrelation = async () => {
    setIsProcessing(true);
    try {
      const res = await api.incidents.runCorrelation();
      setNotification(`Correlation complete: ${res.reports_analyzed} reports correlated into ${res.incidents_created} candidate incidents.`);
      await fetchDashboardData();
    } catch (err: any) {
      setError(err.message || 'Correlation execution failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSeedDemo = async () => {
    setIsProcessing(true);
    try {
      const res = await api.simulation.seedDemo();
      setNotification(res.message);
      await fetchDashboardData();
    } catch (err: any) {
      setError(err.message || 'Failed to seed demo dataset.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredIncidents = recentIncidents.filter((inc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return inc.incident_id.toLowerCase().includes(q) || inc.title.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Operational Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-wider text-[#f8fafc]">
              TACTICAL SITUATIONAL DASHBOARD
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-[#ff9933]/20 via-white/10 to-[#138808]/20 text-[#ffb366] border border-[#ff9933]/40 font-mono font-semibold">
              🇮🇳 TRI-SERVICE DEFENCE C2
            </span>
          </div>
          <p className="text-xs text-[#cbd5e1] mt-1 font-mono">
            Real-time multi-source report correlation, uncertainty tracking, and human review metrics.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/tactical-map"
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#2563EB] to-[#1E3A8A] text-xs font-bold text-white border border-blue-400/40 hover:from-blue-600 hover:to-blue-800 shadow-[0_0_14px_rgba(37,99,235,0.35)] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Radar className="w-3.5 h-3.5 text-[#38bdf8] animate-pulse" />
            <span>Tactical Radar & COA</span>
          </Link>

          {hasRole(['Administrator', 'Analyst']) && (
            <button
              onClick={handleRunCorrelation}
              disabled={isProcessing}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#14532d] to-[#166534] text-xs font-semibold text-[#f8fafc] border border-[#22c55e]/40 hover:from-[#166534] hover:to-[#15803d] shadow-[0_0_12px_rgba(34,197,94,0.25)] transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-[#ff9933]" />
              <span>Run Correlation</span>
            </button>
          )}

          <button
            onClick={handleSeedDemo}
            disabled={isProcessing}
            className="px-3.5 py-1.5 rounded-lg bg-[#0b1120] text-xs font-medium text-[#cbd5e1] border border-[#1e293b] hover:text-[#f8fafc] hover:border-[#ff9933]/60 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
            title="Reload standard 14-report synthetic demonstration set"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#cbd5e1]" />
            <span>Reset Demo Data</span>
          </button>

          <Link
            to="/review"
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#ff9933] to-[#ea580c] text-xs font-extrabold text-[#070c18] hover:from-[#ffa94d] hover:to-[#f97316] shadow-[0_0_16px_rgba(255,153,51,0.35)] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Review Queue</span>
          </Link>
        </div>
      </div>

      {/* Notifications / Feedback Alert */}
      {notification && (
        <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-700/60 text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-950/70 border border-red-700/60 text-xs text-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* Dynamic Calculated Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          title="Incoming Reports"
          value={metrics?.total_incoming_reports ?? 0}
          subtitle="Total telemetry records"
          icon={<Inbox className="w-4 h-4" />}
          onClick={() => navigate('/reports')}
        />
        <MetricCard
          title="Candidate Incidents"
          value={metrics?.candidate_incident_groups ?? 0}
          subtitle="Correlated event clusters"
          icon={<Flame className="w-4 h-4 text-amber-400" />}
          variant="warning"
          onClick={() => navigate('/incidents')}
        />
        <MetricCard
          title="Awaiting Review"
          value={metrics?.reports_awaiting_verification ?? 0}
          subtitle="Pending officer action"
          icon={<CheckSquare className="w-4 h-4 text-[#ff9933]" />}
          variant={metrics && metrics.reports_awaiting_verification > 0 ? 'warning' : 'default'}
          badge="High Priority"
          onClick={() => navigate('/review')}
        />
        <MetricCard
          title="Quality Warnings"
          value={metrics?.data_quality_warnings ?? 0}
          subtitle="Stale or missing fields"
          icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
          variant={metrics && metrics.data_quality_warnings > 0 ? 'danger' : 'default'}
          onClick={() => navigate('/reports?data_quality=STALE_SOURCE')}
        />
        <MetricCard
          title="Sensor Health"
          value={metrics?.stale_or_unavailable_sources ?? 0}
          subtitle="Stale / offline sensors"
          icon={<Radio className="w-4 h-4 text-cyan-400" />}
          variant={metrics && metrics.stale_or_unavailable_sources > 0 ? 'warning' : 'success'}
          onClick={() => navigate('/source-health')}
        />
        <MetricCard
          title="Human Reviewed"
          value={metrics?.human_reviewed_incidents ?? 0}
          subtitle="Confirmed or corrected"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
          variant="success"
          onClick={() => navigate('/review')}
        />
      </div>

      {/* Middle Row: Priority Distribution & System Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saffron Box: Priority Breakdown */}
        <div className="rounded-xl bg-[#0b1120]/90 backdrop-blur-md border border-[#1e293b] border-t-4 border-t-[#FF9933] shadow-[0_4px_20px_rgba(255,153,51,0.15)] p-4">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#f8fafc] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#ff9933]" />
              Incident Priority Breakdown
            </span>
            <span className="text-[10px] text-[#ffb366] font-mono px-2 py-0.5 rounded bg-[#FF9933]/15 border border-[#FF9933]/40">KESARI / OPS</span>
          </div>
          <div className="space-y-2.5">
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => {
              const count = metrics?.priority_distribution[p] || 0;
              const total = metrics?.candidate_incident_groups || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={p} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#94a3b8] font-mono">{p}</span>
                    <span className="font-bold text-[#f8fafc]">
                      {count} <span className="text-[#64748b]">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#0f172a] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        p === 'CRITICAL'
                          ? 'bg-red-500'
                          : p === 'HIGH'
                          ? 'bg-orange-500'
                          : p === 'MEDIUM'
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ashoka Navy & White Box: Sensor Telemetry Ingestion */}
        <div className="rounded-xl bg-[#0b1120]/90 backdrop-blur-md border border-[#1e293b] border-t-4 border-t-[#2563EB] shadow-[0_4px_20px_rgba(37,99,235,0.15)] p-4">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#f8fafc] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#38bdf8]" />
              Sensor Telemetry Ingestion
            </span>
            <span className="text-[10px] text-blue-300 font-mono px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/40">CHAKRA / INTEL</span>
          </div>
          <div className="space-y-2 text-xs">
            {Object.entries(metrics?.source_distribution || {
              RADAR: 4,
              OPTICAL_CAM: 4,
              UAV_RECON: 2,
              SIGINT_BEACON: 2,
              MANUAL_REPORT: 2,
            }).map(([src, count]) => (
              <div key={src} className="flex items-center justify-between p-2 rounded bg-[#0f172a] border border-[#1e293b]/60">
                <span className="font-mono text-[#94a3b8]">{src}</span>
                <span className="font-bold font-mono text-[#f8fafc]">{count} reports</span>
              </div>
            ))}
          </div>
        </div>

        {/* India Green Box: Core System Status & Integrity */}
        <div className="rounded-xl bg-[#0b1120]/90 backdrop-blur-md border border-[#1e293b] border-t-4 border-t-[#138808] shadow-[0_4px_20px_rgba(19,136,8,0.15)] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#f8fafc] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                System Health & Resilience
              </span>
              <span className="text-[10px] text-emerald-300 font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40">GREEN / SECURE</span>
            </div>
            <div className="space-y-2 text-xs text-[#94a3b8]">
              <div className="flex justify-between">
                <span>System State:</span>
                <span className="text-emerald-400 font-bold font-mono">OPERATIONAL</span>
              </div>
              <div className="flex justify-between">
                <span>Database Engine:</span>
                <span className="text-[#f8fafc] font-mono">SQLite WAL Mode</span>
              </div>
              <div className="flex justify-between">
                <span>Decision Logic:</span>
                <span className="text-[#ff9933] font-mono">Deterministic Rules Engine</span>
              </div>
              <div className="flex justify-between">
                <span>Offline Capability:</span>
                <span className="text-[#38bdf8] font-mono">Local Standalone Ready</span>
              </div>
              <div className="flex justify-between">
                <span>Last Processed:</span>
                <span className="text-[#64748b] font-mono truncate">
                  {metrics?.last_successful_processing_time ? new Date(metrics.last_successful_processing_time).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1e293b] text-[11px] text-[#64748b]">
            Notice: No autonomous weapons or engagement decisions. All actions require officer sign-off.
          </div>
        </div>
      </div>

      {/* Incident Queue Table with Top Indian Flag Stripe */}
      <div className="rounded-xl bg-[#0b1120]/90 backdrop-blur-md border border-[#1e293b] overflow-hidden shadow-2xl relative">
        <div className="w-full h-[3px] bg-gradient-to-r from-[#FF9933] via-white to-[#138808] shadow-[0_0_12px_rgba(255,153,51,0.5)]" />
        <div className="p-4 border-b border-[#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#f8fafc]">
              Candidate Incident Clusters
            </h2>
            <p className="text-xs text-[#94a3b8]">
              Incidents formed through multi-sensor spatial-temporal rules and deduplication.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#64748b]" />
              <input
                type="text"
                placeholder="Search Incident ID / Title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded bg-[#070c18] border border-[#1e293b] text-xs text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#ff9933] w-48 sm:w-64"
              />
            </div>
            <Link
              to="/incidents"
              className="text-xs text-[#ff9933] hover:underline flex items-center gap-1 font-semibold flex-shrink-0"
            >
              View All ({metrics?.candidate_incident_groups ?? 0})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#94a3b8]">Loading operational data...</div>
        ) : filteredIncidents.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#64748b]">
            No candidate incidents found matching criteria. Click 'Run Correlation' or 'Reset Demo Data' above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f172a] text-[#94a3b8] border-b border-[#1e293b] uppercase font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-2.5">Incident ID</th>
                  <th className="px-4 py-2.5">Fictional Sector</th>
                  <th className="px-4 py-2.5">Title & Description</th>
                  <th className="px-4 py-2.5">Priority</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Heuristic Index</th>
                  <th className="px-4 py-2.5">Correlation Match</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/50">
                {filteredIncidents.map((inc) => (
                  <tr key={inc.incident_id} className="hover:bg-[#0f172a]/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#ff9933]">{inc.incident_id}</td>
                    <td className="px-4 py-3 font-mono text-[#38bdf8]">{inc.fictional_zone}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#f8fafc]">{inc.title}</div>
                      {inc.reviewer_notes && (
                        <div className="text-[11px] text-[#64748b] truncate max-w-xs">
                          Reviewer note: {inc.reviewer_notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge type="priority" value={inc.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge type="status" value={inc.status} />
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className="font-bold text-[#f8fafc]">{inc.heuristic_score}</span>
                      <span className="text-[#64748b] text-[10px]"> / 100</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge type="confidence" value={inc.correlation_confidence} />
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        to={`/incidents/${inc.incident_id}`}
                        className="px-2.5 py-1 rounded bg-[#166534] text-[11px] font-semibold text-[#f8fafc] border border-[#1e293b] hover:bg-[#15803d]"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
