import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, 
  Search, 
  Play, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  FileText, 
  Unlink, 
  HelpCircle,
  ShieldCheck,
  Activity,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { Incident } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedConfidence, setSelectedConfidence] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Separation Modal
  const [separatingIncident, setSeparatingIncident] = useState<Incident | null>(null);
  const [selectedReportToSeparate, setSelectedReportToSeparate] = useState<string>('');
  const [separateReason, setSeparateReason] = useState<string>('');

  const { hasRole } = useAuth();

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.incidents.list({
        zone: selectedZone || undefined,
        priority: selectedPriority || undefined,
        recommendation: selectedConfidence || undefined,
        search: search || undefined,
        limit: 50,
      });
      setIncidents(data.incidents || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load incident correlation data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [selectedZone, selectedPriority, selectedConfidence]);

  const handleRunCorrelation = async () => {
    setIsProcessing(true);
    try {
      const res = await api.incidents.runCorrelation();
      setSuccessMsg(`Correlation completed: ${res.reports_analyzed} reports correlated into ${res.incidents_created} incidents.`);
      fetchIncidents();
    } catch (err: any) {
      setError(err.message || 'Correlation execution failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenSeparateModal = async (inc: Incident) => {
    try {
      const fullDetail = await api.incidents.get(inc.incident_id);
      setSeparatingIncident(fullDetail);
      if (fullDetail.related_reports && fullDetail.related_reports.length > 0) {
        setSelectedReportToSeparate(fullDetail.related_reports[0].report_id);
      }
      setSeparateReason('');
    } catch (err: any) {
      setError('Could not retrieve incident details for separation.');
    }
  };

  const handleSeparateReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!separatingIncident || !selectedReportToSeparate) return;
    if (!separateReason.trim()) {
      setError('A mandatory reason is required to separate a report.');
      return;
    }

    try {
      await api.incidents.separateReport(
        separatingIncident.incident_id,
        selectedReportToSeparate,
        separateReason.trim()
      );
      setSuccessMsg(`Report ${selectedReportToSeparate} detached from ${separatingIncident.incident_id}.`);
      setSeparatingIncident(null);
      fetchIncidents();
    } catch (err: any) {
      setError(err.message || 'Failed to detach report.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-wider text-[#f8fafc]">
              INCIDENT CORRELATION & EVIDENCE
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-[#ff9933]/20 via-white/10 to-[#138808]/20 text-[#ffb366] border border-[#ff9933]/40 font-mono font-bold tracking-wider">
              🇮🇳 FAILURE-AWARE RULES
            </span>
          </div>
          <p className="text-xs text-[#cbd5e1] mt-1 font-mono">
            Spatial-temporal clustering, duplicate suppression, and explicit conflict detection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasRole(['Administrator', 'Analyst']) && (
            <button
              onClick={handleRunCorrelation}
              disabled={isProcessing}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#14532d] to-[#166534] text-xs font-semibold text-[#f8fafc] border border-[#22c55e]/50 hover:from-[#166534] hover:to-[#15803d] shadow-[0_0_12px_rgba(34,197,94,0.2)] transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-[#ff9933]" />
              <span>{isProcessing ? 'Correlating...' : 'Re-Run Rules Engine'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 rounded bg-emerald-950/70 border border-emerald-700/60 text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 font-bold">×</button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded bg-red-950/70 border border-red-700/60 text-xs text-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 font-bold">×</button>
        </div>
      )}

      {/* 5-State Evidence Taxonomy Legend */}
      <div className="p-3 rounded-lg bg-[#0b1120] border border-[#1e293b] grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div className="p-2 rounded bg-[#070c18] border border-[#1e293b] space-y-0.5">
          <StatusBadge type="confidence" value="CONFIRMED_DATA_MATCH" />
          <p className="text-[10px] text-[#64748b]">≥2 independent sensors aligned</p>
        </div>
        <div className="p-2 rounded bg-[#070c18] border border-[#1e293b] space-y-0.5">
          <StatusBadge type="confidence" value="POSSIBLE_RELATIONSHIP" />
          <p className="text-[10px] text-[#64748b]">Single source or loose timing</p>
        </div>
        <div className="p-2 rounded bg-[#070c18] border border-[#1e293b] space-y-0.5">
          <StatusBadge type="confidence" value="CONTRADICTORY_EVIDENCE" />
          <p className="text-[10px] text-[#64748b]">Conflicting physical reports</p>
        </div>
        <div className="p-2 rounded bg-[#070c18] border border-[#1e293b] space-y-0.5">
          <StatusBadge type="confidence" value="INSUFFICIENT_EVIDENCE" />
          <p className="text-[10px] text-[#64748b]">Missing fields or low confidence</p>
        </div>
        <div className="p-2 rounded bg-[#070c18] border border-[#1e293b] space-y-0.5">
          <StatusBadge type="confidence" value="DUPLICATE_RECORD" />
          <p className="text-[10px] text-[#64748b]">Suppressed from corroboration</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-lg bg-[#0b1120] border border-[#1e293b] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#64748b]" />
          <input
            type="text"
            placeholder="Filter by Incident ID or Title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded bg-[#070c18] border border-[#1e293b] text-xs text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#ff9933]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-2.5 py-1.5 rounded bg-[#070c18] border border-[#1e293b] text-xs text-[#f8fafc]"
          >
            <option value="">All Fictional Sectors</option>
            <option value="DEMO-ZONE-A">DEMO-ZONE-A (North Valley)</option>
            <option value="DEMO-ZONE-B">DEMO-ZONE-B (Arid Ridge)</option>
            <option value="DEMO-ZONE-C">DEMO-ZONE-C (Highland Basin)</option>
            <option value="DEMO-ZONE-D">DEMO-ZONE-D (Riverine)</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 rounded bg-[#070c18] border border-[#1e293b] text-xs text-[#f8fafc]"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            value={selectedConfidence}
            onChange={(e) => setSelectedConfidence(e.target.value)}
            className="px-2.5 py-1.5 rounded bg-[#070c18] border border-[#1e293b] text-xs text-[#f8fafc]"
          >
            <option value="">All Recommendations</option>
            <option value="PROCEED_VERIFICATION">PROCEED_VERIFICATION</option>
            <option value="ROUTINE_MONITORING">ROUTINE_MONITORING</option>
            <option value="INSUFFICIENT_EVIDENCE">INSUFFICIENT_EVIDENCE</option>
            <option value="CORRELATION_CONFLICT">CORRELATION_CONFLICT</option>
            <option value="DISMISS_DUPLICATE">DISMISS_DUPLICATE</option>
          </select>
        </div>
      </div>

      {/* Incidents Card Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#94a3b8]">Loading incident groupings...</div>
      ) : incidents.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#64748b] rounded-lg bg-[#0b1120] border border-[#1e293b]">
          No incidents match selected criteria. Try adjusting filters or re-running the correlation engine.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incidents.map((inc) => {
            const hasConflict = inc.conflicting_evidence && inc.conflicting_evidence.length > 0;
            const hasMissing = inc.missing_evidence && inc.missing_evidence.length > 0;

            return (
              <div
                key={inc.incident_id}
                className="rounded-lg bg-[#0b1120] border border-[#1e293b] hover:border-[#364d3f] p-4 flex flex-col justify-between transition-all"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#ff9933]">{inc.incident_id}</span>
                      <span className="font-mono text-xs text-[#38bdf8] px-1.5 py-0.5 rounded bg-[#070c18] border border-[#1e293b]">
                        {inc.fictional_zone}
                      </span>
                    </div>
                    <StatusBadge type="priority" value={inc.priority} />
                  </div>

                  <h3 className="text-sm font-bold text-[#f8fafc] mb-2">{inc.title}</h3>

                  {/* Recommendation and Match Tag */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <StatusBadge type="confidence" value={inc.correlation_confidence} />
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#0f172a] border border-[#1e293b] text-[#94a3b8]">
                      REC: {inc.recommendation}
                    </span>
                  </div>

                  {/* Heuristic Index Breakdown pill */}
                  <div className="p-2.5 rounded bg-[#070c18] border border-[#1e293b] mb-3 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[#94a3b8] font-medium">Heuristic Score Component:</span>
                      <span className="font-mono font-bold text-[#f8fafc]">{inc.heuristic_score} / 100</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-[#64748b] font-mono">
                      <span>Corroboration: +{inc.score_components?.corroboration_score ?? 0}</span>
                      <span>Confidence Wt: +{inc.score_components?.confidence_weight ?? 0}</span>
                      <span>Conflict Pen: {inc.score_components?.conflict_penalty ?? 0}</span>
                      <span>Staleness Pen: {inc.score_components?.staleness_penalty ?? 0}</span>
                    </div>
                  </div>

                  {/* Failure-Aware Warnings */}
                  {hasConflict && (
                    <div className="mb-2 p-2 rounded bg-rose-950/60 border border-rose-800/50 text-[11px] text-rose-200 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Contradiction:</span>{' '}
                        {inc.conflicting_evidence[0].explanation}
                      </div>
                    </div>
                  )}

                  {hasMissing && (
                    <div className="mb-2 p-2 rounded bg-amber-950/50 border border-amber-800/40 text-[11px] text-amber-200 flex items-start gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Data Gaps:</span> {inc.missing_evidence[0]}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#64748b]">
                    Status: <strong className="text-[#94a3b8]">{inc.status}</strong>
                  </span>
                  <div className="flex items-center space-x-2">
                    {hasRole(['Administrator', 'Analyst', 'Reviewer']) && (
                      <button
                        onClick={() => handleOpenSeparateModal(inc)}
                        className="px-2.5 py-1 rounded bg-[#0f172a] text-[11px] text-[#94a3b8] border border-[#1e293b] hover:text-[#f8fafc] hover:border-red-800/50 flex items-center gap-1"
                        title="Detach incorrectly grouped report"
                      >
                        <Unlink className="w-3 h-3" />
                        <span>Separate</span>
                      </button>
                    )}
                    <Link
                      to={`/incidents/${inc.incident_id}`}
                      className="px-3 py-1 rounded bg-[#166534] text-xs font-semibold text-[#f8fafc] border border-[#1e293b] hover:bg-[#15803d] flex items-center gap-1"
                    >
                      <span>Timeline & Evidence</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Separation Modal */}
      {separatingIncident && (
        <Modal
          isOpen={!!separatingIncident}
          onClose={() => setSeparatingIncident(null)}
          title={`Separate Report from ${separatingIncident.incident_id}`}
          subtitle="Authorized analysts/reviewers can detach incorrectly correlated reports"
          maxWidth="md"
        >
          <form onSubmit={handleSeparateReportSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-[#94a3b8] block mb-1">Select Report to Detach</label>
              <select
                value={selectedReportToSeparate}
                onChange={(e) => setSelectedReportToSeparate(e.target.value)}
                className="w-full p-2 rounded bg-[#070c18] border border-[#1e293b] text-[#f8fafc]"
              >
                {separatingIncident.related_reports?.map((r) => (
                  <option key={r.report_id} value={r.report_id}>
                    {r.report_id} ({r.source_id}) — {r.description.substring(0, 40)}...
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[#94a3b8] block mb-1">
                Mandatory Separation Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Explain why this report does not relate to the clustered incident..."
                value={separateReason}
                onChange={(e) => setSeparateReason(e.target.value)}
                className="w-full p-2 rounded bg-[#070c18] border border-[#1e293b] text-[#f8fafc]"
              />
              <span className="text-[10px] text-[#64748b]">
                This action is audited and preserved in immutable history.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => setSeparatingIncident(null)}
                className="px-3 py-1.5 rounded bg-[#0f172a] border border-[#1e293b] text-[#94a3b8]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-red-950/80 text-red-200 border border-red-800/60 font-semibold hover:bg-red-900"
              >
                Confirm Separation
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
