import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Flame, 
  ArrowLeft, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  ShieldCheck, 
  FileText, 
  Radio, 
  History, 
  User, 
  Send,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { Incident } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Verification Request Modal
  const [isVerifModalOpen, setIsVerifModalOpen] = useState<boolean>(false);
  const [verifTarget, setVerifTarget] = useState<string>('UAV_RECON');
  const [verifQuestions, setVerifQuestions] = useState<string>('');
  const [verifPriority, setVerifPriority] = useState<string>('HIGH');
  const [verifSuccess, setVerifSuccess] = useState<string | null>(null);

  const { hasRole } = useAuth();

  const fetchIncidentDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [inc, decs] = await Promise.all([
        api.incidents.get(id),
        api.review.getDecisions(id),
      ]);
      setIncident(inc);
      setDecisions(decs || []);
    } catch (err: any) {
      setError(err.message || `Failed to load details for incident ${id}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentDetail();
  }, [id]);

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident) return;
    if (verifQuestions.trim().length < 10) {
      setError('Specific verification inquiries must be at least 10 characters.');
      return;
    }

    try {
      await api.review.requestVerification(incident.incident_id, {
        target_source_type: verifTarget,
        fictional_zone: incident.fictional_zone,
        specific_questions: verifQuestions.trim(),
        priority: verifPriority,
      });
      setVerifSuccess('Verification request dispatched to tactical sensor control.');
      setIsVerifModalOpen(false);
      setVerifQuestions('');
      fetchIncidentDetail();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch verification request.');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-[#94a3b8]">Loading incident timeline and telemetry...</div>;
  }

  if (error || !incident) {
    return (
      <div className="p-8 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-200 space-y-3">
        <div className="font-bold">Error Loading Incident</div>
        <div>{error || 'Incident record not found.'}</div>
        <Link to="/incidents" className="text-[#ff9933] underline">
          ← Back to Incident Correlation List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation and Title */}
      <div className="border-b border-[#1e293b] pb-4">
        <Link
          to="/incidents"
          className="inline-flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-[#f8fafc] transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Incidents</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-[#f8fafc]">
                {incident.incident_id}: {incident.title}
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#0f172a] text-[#38bdf8] border border-[#1e293b]">
                {incident.fictional_zone}
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] mt-1">
              Deterministic correlation timeline and multi-source corroboration breakdown.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge type="priority" value={incident.priority} size="md" />
            <StatusBadge type="status" value={incident.status} size="md" />
            {hasRole(['Administrator', 'Reviewer', 'Analyst']) && (
              <button
                onClick={() => setIsVerifModalOpen(true)}
                className="px-3 py-1.5 rounded bg-[#0f172a] text-xs font-medium text-[#94a3b8] border border-[#1e293b] hover:text-[#f8fafc] hover:border-[#ff9933] transition-colors flex items-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5 text-[#ff9933]" />
                <span>Request Verification</span>
              </button>
            )}
            <Link
              to={`/review`}
              className="px-3 py-1.5 rounded bg-[#ff9933] text-xs font-bold text-[#0a0f0d] hover:bg-[#ffa94d] transition-colors flex items-center gap-1.5"
            >
              <span>Review Incident</span>
            </Link>
          </div>
        </div>
      </div>

      {verifSuccess && (
        <div className="p-3 rounded bg-emerald-950/70 border border-emerald-700/60 text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{verifSuccess}</span>
          </div>
          <button onClick={() => setVerifSuccess(null)} className="text-emerald-400 font-bold">×</button>
        </div>
      )}

      {/* Grid: Left Column (Timeline) & Right Column (Score Breakdown & Review History) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Chronological Event History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Failure-Aware Banner */}
          {(incident.conflicting_evidence.length > 0 || incident.missing_evidence.length > 0) && (
            <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-800/50 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>FAILURE-AWARE ANOMALIES DETECTED</span>
              </div>
              {incident.conflicting_evidence.map((c, i) => (
                <div key={i} className="p-2 rounded bg-[#070c18] border border-amber-900/40 text-amber-200 text-[11px]">
                  <strong>Contradictory Observation:</strong> {c.explanation}
                </div>
              ))}
              {incident.missing_evidence.map((m, i) => (
                <div key={i} className="p-2 rounded bg-[#070c18] border border-amber-900/40 text-amber-200 text-[11px]">
                  <strong>Missing Telemetry Gap:</strong> {m}
                </div>
              ))}
            </div>
          )}

          {/* Chronological Timeline */}
          <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] p-5">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#f8fafc] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#ff9933]" />
                Chronological Report Timeline ({incident.related_reports?.length ?? 0} Observations)
              </h3>
              <span className="text-[10px] text-[#64748b] font-mono">OLDEST TO NEWEST</span>
            </div>

            <div className="relative pl-6 border-l-2 border-[#1e293b] space-y-6">
              {incident.related_reports && incident.related_reports.length > 0 ? (
                incident.related_reports.map((rep, idx) => (
                  <div key={rep.report_id} className="relative group">
                    {/* Timeline Node Point */}
                    <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#166534] border-2 border-[#ff9933]" />

                    <div className="p-3.5 rounded-lg bg-[#0f172a] border border-[#1e293b] group-hover:border-[#364d3f] transition-all space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#ff9933]">{rep.report_id}</span>
                          <span className="font-mono text-[#f8fafc]">{rep.source_id}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#070c18] text-[#38bdf8] font-mono">
                            {rep.source_type}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-[#94a3b8]">
                          {new Date(rep.report_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
                        </span>
                      </div>

                      <p className="text-xs text-[#f8fafc] leading-relaxed">
                        {rep.description}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1e293b]/60 text-[11px] text-[#94a3b8]">
                        <div className="flex items-center gap-2">
                          <span>Rule: <strong className="font-mono text-[#38bdf8]">{rep.correlation_rule}</strong></span>
                          <span>Confidence: <strong className="font-mono text-[#f8fafc]">{Math.round(rep.confidence_score * 100)}%</strong></span>
                        </div>
                        {rep.is_duplicate && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-stone-900 text-stone-400 border border-stone-800">
                            DUPLICATE (Suppressed from Corroboration)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#64748b]">No linked reports available.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Rule Engine Heuristic Breakdown & Review Decisions */}
        <div className="space-y-6">
          {/* Heuristic Index Breakdown Card */}
          <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] p-5 space-y-4">
            <div className="border-b border-[#1e293b] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#ff9933] block">
                Explainable Analysis Engine
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold font-mono text-[#f8fafc]">{incident.heuristic_score}</span>
                <span className="text-xs text-[#64748b] font-mono">INDEX (0 - 100)</span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                Deterministic rule-based composite priority index. Not a calibrated threat probability.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded bg-[#070c18] border border-[#1e293b]">
                <span className="text-[#94a3b8]">Fictional Zone Base Risk:</span>
                <span className="font-mono font-bold text-[#f8fafc]">+{incident.score_components?.zone_risk_score ?? 0}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-[#070c18] border border-[#1e293b]">
                <span className="text-[#94a3b8]">Independent Corroboration:</span>
                <span className="font-mono font-bold text-emerald-400">+{incident.score_components?.corroboration_score ?? 0}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-[#070c18] border border-[#1e293b]">
                <span className="text-[#94a3b8]">Confidence Weight:</span>
                <span className="font-mono font-bold text-[#f8fafc]">+{incident.score_components?.confidence_weight ?? 0}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-[#070c18] border border-[#1e293b]">
                <span className="text-[#94a3b8]">Temporal Density:</span>
                <span className="font-mono font-bold text-[#f8fafc]">+{incident.score_components?.density_weight ?? 0}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-[#070c18] border border-[#1e293b]">
                <span className="text-[#94a3b8]">Contradiction Penalty:</span>
                <span className="font-mono font-bold text-red-400">{incident.score_components?.conflict_penalty ?? 0}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-[#070c18] border border-[#1e293b]">
                <span className="text-[#94a3b8]">Stale Sensor Penalty:</span>
                <span className="font-mono font-bold text-red-400">{incident.score_components?.staleness_penalty ?? 0}</span>
              </div>
            </div>

            <div className="p-3 rounded bg-[#0f172a] border border-[#1e293b] text-[11px] text-[#94a3b8]">
              <strong className="text-[#d4c59a] block mb-1">Recommendation:</strong>
              <code className="text-[#ff9933] font-bold">{incident.recommendation}</code>
              <p className="mt-1 text-[#64748b]">
                Recommendation generated based on explicit rule thresholds without external API calls.
              </p>
            </div>
          </div>

          {/* Traceable Review Decision History */}
          <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] p-5 space-y-4">
            <div className="border-b border-[#1e293b] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#f8fafc] flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#38bdf8]" />
                Traceable Review History ({decisions.length})
              </span>
              <p className="text-[11px] text-[#64748b] mt-1">
                Preserves reviewer identity, mandatory reasons, and original recommendations.
              </p>
            </div>

            {decisions.length === 0 ? (
              <div className="text-xs text-[#64748b] p-3 rounded bg-[#070c18] border border-[#1e293b] text-center">
                Awaiting human review. No officer decisions recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {decisions.map((dec) => (
                  <div key={dec.id} className="p-3 rounded bg-[#0f172a] border border-[#1e293b] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#f8fafc]">{dec.action}</span>
                      <span className="text-[10px] font-mono text-[#64748b]">
                        {new Date(dec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#94a3b8]">
                      Officer: <strong>{dec.reviewer_username}</strong> ({dec.reviewer_role})
                    </div>
                    {dec.correction_reason && (
                      <div className="p-2 rounded bg-[#070c18] border border-[#1e293b] text-[11px] text-[#38bdf8]">
                        <strong>Mandatory Reason:</strong> {dec.correction_reason}
                      </div>
                    )}
                    {dec.notes && (
                      <div className="text-[11px] text-[#94a3b8]">
                        Notes: {dec.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification Request Modal */}
      <Modal
        isOpen={isVerifModalOpen}
        onClose={() => setIsVerifModalOpen(false)}
        title={`Request Verification for ${incident.incident_id}`}
        subtitle="Task secondary sensors or request human forward confirmation"
        maxWidth="md"
      >
        <form onSubmit={handleVerificationSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[#94a3b8] block mb-1">Target Secondary Sensor Type</label>
            <select
              value={verifTarget}
              onChange={(e) => setVerifTarget(e.target.value)}
              className="w-full p-2 rounded bg-[#070c18] border border-[#1e293b] text-[#f8fafc]"
            >
              <option value="UAV_RECON">UAV_RECON (Synthetic Aerial Reconnaissance)</option>
              <option value="OPTICAL_CAM">OPTICAL_CAM (Synthetic Long-Range Thermal Camera)</option>
              <option value="RADAR">RADAR (Synthetic Perimeter Doppler Radar)</option>
              <option value="MANUAL_REPORT">MANUAL_REPORT (Forward Post Physical Observer)</option>
            </select>
          </div>

          <div>
            <label className="text-[#94a3b8] block mb-1">Verification Priority</label>
            <select
              value={verifPriority}
              onChange={(e) => setVerifPriority(e.target.value)}
              className="w-full p-2 rounded bg-[#070c18] border border-[#1e293b] text-[#f8fafc]"
            >
              <option value="CRITICAL">CRITICAL (Immediate Dispatch)</option>
              <option value="HIGH">HIGH (Next Scheduled Sweep)</option>
              <option value="MEDIUM">MEDIUM (Routine Patrol Check)</option>
            </select>
          </div>

          <div>
            <label className="text-[#94a3b8] block mb-1">
              Specific Verification Questions <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Confirm whether target is a civilian grazing flock or low-flying UAV..."
              value={verifQuestions}
              onChange={(e) => setVerifQuestions(e.target.value)}
              className="w-full p-2 rounded bg-[#070c18] border border-[#1e293b] text-[#f8fafc]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={() => setIsVerifModalOpen(false)}
              className="px-3 py-1.5 rounded bg-[#0f172a] border border-[#1e293b] text-[#94a3b8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-[#166534] text-[#f8fafc] font-semibold border border-[#1e293b] hover:bg-[#15803d]"
            >
              Dispatch Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
