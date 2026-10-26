import React, { useEffect, useState } from 'react';
import { 
  Radio, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Power, 
  Info,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { SourceHealth } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { MetricCard } from '../components/MetricCard';
import { useAuth } from '../context/AuthContext';

export const SourceHealthPage: React.FC = () => {
  const [sources, setSources] = useState<SourceHealth[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const { hasRole } = useAuth();

  const fetchHealthData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.sourceHealth.getSources();
      setSources(data.sources || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve source telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  const handleHeartbeat = async (sourceId: string) => {
    try {
      await api.sourceHealth.sendHeartbeat(sourceId);
      setActionMsg(`Heartbeat refreshed for ${sourceId}. Status: ONLINE.`);
      fetchHealthData();
    } catch (err: any) {
      setError(err.message || 'Heartbeat dispatch failed.');
    }
  };

  const handleToggleStatus = async (sourceId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ONLINE' ? 'UNAVAILABLE' : 'ONLINE';
    try {
      await api.sourceHealth.toggleStatus(sourceId, nextStatus);
      setActionMsg(`Source ${sourceId} status switched to ${nextStatus}.`);
      fetchHealthData();
    } catch (err: any) {
      setError(err.message || 'Status toggle failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-wider text-[#f8fafc]">
              SOURCE HEALTH & DATA QUALITY MONITOR
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#166534] text-[#38bdf8] border border-[#1e293b] font-mono">
              TELEMETRY WATCH
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Monitoring heartbeat freshness, link degradation, and ingestion anomaly rates across demonstration feeds.
          </p>
        </div>

        <button
          onClick={fetchHealthData}
          className="px-3 py-1.5 rounded bg-[#0f172a] text-xs font-medium text-[#94a3b8] border border-[#1e293b] hover:text-[#f8fafc] hover:bg-[#1b2923] transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Critical Failure-Aware Notice Banner */}
      <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-800/60 flex items-start gap-3 text-xs text-amber-200">
        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-amber-300 font-bold uppercase tracking-wider block">
            Critical Architectural Principle: Silence is Not Tranquility
          </strong>
          <p className="leading-relaxed">
            "No report received" is fundamentally NOT equivalent to "Source checked and sector clear". 
            A silent sensor channel indicates link failure, power outage, or atmospheric jamming rather than verified peace. 
            SentinelFusion AI explicitly surfaces missing heartbeats to prevent dangerous assumptions.
          </p>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 rounded bg-emerald-950/70 border border-emerald-700/60 text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="text-emerald-400 font-bold">×</button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded bg-red-950/70 border border-red-700/60 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Telemetry Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Monitored Sources"
          value={summary?.total_sources ?? 7}
          subtitle="Configured synthetic feeds"
          icon={<Radio className="w-4 h-4 text-[#ff9933]" />}
        />
        <MetricCard
          title="Active Online Feeds"
          value={summary?.online_sources ?? 0}
          subtitle="Regular heartbeats confirmed"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          variant="success"
        />
        <MetricCard
          title="Stale Sensor Feeds"
          value={summary?.stale_sources ?? 0}
          subtitle="Heartbeat delayed past threshold"
          icon={<Clock className="w-4 h-4 text-amber-400" />}
          variant={summary && summary.stale_sources > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Deactivated Feeds"
          value={summary?.unavailable_sources ?? 0}
          subtitle="Marked unavailable / offline"
          icon={<Power className="w-4 h-4 text-rose-400" />}
          variant={summary && summary.unavailable_sources > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* Synthetic Sources Table */}
      <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] overflow-hidden">
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#f8fafc]">
            Configured Sensor Inventory & Telemetry Status
          </h2>
          <span className="text-[11px] text-[#64748b]">All items represent synthetic simulation channels</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#94a3b8]">Scanning sensor network...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f172a] text-[#94a3b8] border-b border-[#1e293b] uppercase font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-2.5">Source Identifier</th>
                  <th className="px-4 py-2.5">Channel Name & Type</th>
                  <th className="px-4 py-2.5">Fictional Sector</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Heartbeat Freshness</th>
                  <th className="px-4 py-2.5">Reports Ingested</th>
                  <th className="px-4 py-2.5 text-right">Simulation Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/50">
                {sources.map((src) => (
                  <tr key={src.source_id} className="hover:bg-[#0f172a]/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#ff9933]">{src.source_id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#f8fafc]">{src.name}</div>
                      <div className="text-[10px] text-[#64748b] font-mono">{src.source_type}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#38bdf8]">{src.fictional_zone}</td>
                    <td className="px-4 py-3">
                      <StatusBadge type="source_status" value={src.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {src.is_stale ? (
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          STALE ({src.staleness_threshold_sec}s threshold exceeded)
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#f8fafc]">{src.total_reports_count}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleHeartbeat(src.source_id)}
                        className="px-2.5 py-1 rounded bg-[#0f172a] text-[11px] text-[#94a3b8] border border-[#1e293b] hover:text-[#f8fafc] hover:border-[#ff9933]"
                        title="Simulate incoming sensor heartbeat"
                      >
                        Heartbeat
                      </button>
                      {hasRole(['Administrator']) && (
                        <button
                          onClick={() => handleToggleStatus(src.source_id, src.status)}
                          className={`px-2.5 py-1 rounded text-[11px] border ${
                            src.status === 'ONLINE'
                              ? 'bg-rose-950/40 text-rose-300 border-rose-800/40 hover:bg-rose-900/60'
                              : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/60'
                          }`}
                        >
                          {src.status === 'ONLINE' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
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
