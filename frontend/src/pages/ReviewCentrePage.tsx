import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckSquare, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  XCircle, 
  Radio, 
  Clock, 
  ArrowRight, 
  History,
  ShieldCheck,
  User,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Incident } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const ReviewCentrePage: React.FC = () => {
  const [queue, setQueue] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected Incident for Active Review
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);

  // Decision Form State
  const [action, setAction] = useState<string>('ACCEPT_RECOMMENDATION');
  const [resultingPriority, setResultingPriority] = useState<string>('HIGH');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [reviewerNotes, setReviewerNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { user, hasRole } = useAuth();

  const fetchReviewQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.review.getQueue();
      setQueue(data.pending_incidents || []);
      if (data.pending_incidents && data.pending_incidents.length > 0 && !activeIncident) {
        setActiveIncident(data.pending_incidents[0]);
        setResultingPriority(data.pending_incidents[0].priority);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve review queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewQueue();
  }, []);

  const handleSelectIncident = (inc: Incident) => {
    setActiveIncident(inc);
    setResultingPriority(inc.priority);
    setCorrectionReason('');
    setReviewerNotes('');
    setError(null);
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIncident) return;

    // Client-side validation: Mandatory reason for corrections
    if (['CORRECT_PRIORITY', 'CORRECT_CLASSIFICATION'].includes(action)) {
      if (!correctionReason.trim() || correctionReason.trim().length < 5) {
        setError('A mandatory recorded reason (at least 5 characters) is required when correcting system recommendations.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.review.decide(activeIncident.incident_id, {
        action,
        resulting_priority: resultingPriority,
        correction_reason: correctionReason.trim() || undefined,
        reviewer_notes: reviewerNotes.trim() || undefined,
      });

      setSuccessMsg(`Decision recorded for ${activeIncident.incident_id}: ${action} (Resulting: ${res.resulting_status})`);
      setActiveIncident(null);
      setCorrectionReason('');
      setReviewerNotes('');
      await fetchReviewQueue();
    } catch (err: any) {
      setError(err.message || 'Failed to record review decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-wider text-[#f8fafc]">
              HUMAN REVIEW CENTRE
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-[#ff9933]/20 via-white/10 to-[#138808]/20 text-[#ffb366] border border-[#ff9933]/40 font-mono font-bold tracking-wider">
              🇮🇳 COMMAND OVERSIGHT
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#ff9933] to-[#ea580c] text-[#070c18] font-extrabold font-mono shadow-[0_0_8px_rgba(255,153,51,0.3)]">
              PENDING: {queue.length}
            </span>
          </div>
          <p className="text-xs text-[#cbd5e1] mt-1 font-mono">
            Human-in-the-loop decision console. All priority corrections mandate a recorded justification.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#64748b] font-mono">Active Reviewer:</span>
          <span className="font-semibold text-[#f8fafc] font-mono px-2.5 py-1 rounded-lg bg-[#0b1120] border border-[#ff9933]/40 text-[#ffb366]">
            {user?.full_name || 'Authorized Officer'}
          </span>
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

      {/* Review Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Review Queue (Oldest / Highest Priority First) */}
        <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] p-4 flex flex-col h-[750px]">
          <div className="border-b border-[#1e293b] pb-3 mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#f8fafc] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#ff9933]" />
              Pending Review Queue ({queue.length})
            </span>
            <span className="text-[10px] text-[#64748b] font-mono">FIFO SORTED</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#94a3b8]">Loading queue...</div>
            ) : queue.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748b] rounded bg-[#070c18] border border-[#1e293b]">
                Review queue empty. Zero unreviewed incidents.
              </div>
            ) : (
              queue.map((inc) => {
                const isSelected = activeIncident?.incident_id === inc.incident_id;
                return (
                  <div
                    key={inc.incident_id}
                    onClick={() => handleSelectIncident(inc)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1b2923] border-[#ff9933] shadow-md'
                        : 'bg-[#0f172a] border-[#1e293b] hover:border-[#364d3f]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-[#ff9933]">{inc.incident_id}</span>
                      <StatusBadge type="priority" value={inc.priority} />
                    </div>
                    <div className="font-semibold text-[#f8fafc] truncate mb-1">{inc.title}</div>
                    <div className="flex items-center justify-between text-[11px] text-[#94a3b8] font-mono">
                      <span>{inc.fictional_zone}</span>
                      <span>Score: {inc.heuristic_score}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Incident Review Workbench */}
        <div className="lg:col-span-2 rounded-lg bg-[#0b1120] border border-[#1e293b] p-6 flex flex-col justify-between">
          {activeIncident ? (
            <div className="space-y-6">
              {/* Incident Header Overview */}
              <div className="border-b border-[#1e293b] pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-[#ff9933]">
                      {activeIncident.incident_id}
                    </span>
                    <span className="font-mono text-xs text-[#38bdf8] px-2 py-0.5 rounded bg-[#070c18] border border-[#1e293b]">
                      {activeIncident.fictional_zone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge type="confidence" value={activeIncident.correlation_confidence} />
                    <Link
                      to={`/incidents/${activeIncident.incident_id}`}
                      className="text-xs text-[#ff9933] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Full Timeline</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-[#f8fafc]">{activeIncident.title}</h2>

                {/* Recommendation Summary */}
                <div className="mt-3 p-3 rounded bg-[#070c18] border border-[#1e293b] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#64748b] block text-[10px]">ORIGINAL RULE RECOMMENDATION</span>
                    <strong className="text-[#ff9933] font-mono text-sm">{activeIncident.recommendation}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[#64748b] block text-[10px]">CURRENT PRIORITY</span>
                    <StatusBadge type="priority" value={activeIncident.priority} />
                  </div>
                </div>
              </div>

              {/* Review Decision Form */}
              <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="text-[#94a3b8] font-semibold block mb-1.5 uppercase tracking-wider">
                    Select Human Officer Action
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'ACCEPT_RECOMMENDATION', label: 'Accept Recommendation', desc: 'Confirm system priority' },
                      { id: 'CORRECT_PRIORITY', label: 'Correct Priority', desc: 'Escalate or downgrade' },
                      { id: 'REQUEST_VERIFICATION', label: 'Request Verification', desc: 'Task secondary sensor' },
                      { id: 'MARK_REVIEWED', label: 'Mark Reviewed', desc: 'Officer sign-off' },
                      { id: 'CLOSE_INCIDENT', label: 'Close Incident', desc: 'Resolve & archive' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAction(opt.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          action === opt.id
                            ? 'bg-[#1b2923] border-[#ff9933] text-[#f8fafc]'
                            : 'bg-[#0f172a] border-[#1e293b] text-[#94a3b8] hover:border-[#364d3f]'
                        }`}
                      >
                        <div className="font-bold text-xs">{opt.label}</div>
                        <div className="text-[10px] text-[#64748b] mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resulting Priority Selector (if correcting priority) */}
                {action === 'CORRECT_PRIORITY' && (
                  <div className="p-3 rounded bg-[#0f172a] border border-[#1e293b] space-y-2">
                    <label className="text-[#f8fafc] font-semibold block">
                      New Corrected Priority:
                    </label>
                    <div className="flex gap-2">
                      {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setResultingPriority(p)}
                          className={`px-3 py-1.5 rounded font-mono text-xs font-bold border transition-colors ${
                            resultingPriority === p
                              ? 'bg-[#166534] text-[#ff9933] border-[#ff9933]'
                              : 'bg-[#070c18] text-[#94a3b8] border-[#1e293b]'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mandatory Correction Justification */}
                {['CORRECT_PRIORITY', 'CORRECT_CLASSIFICATION'].includes(action) && (
                  <div className="space-y-1">
                    <label className="text-red-300 font-semibold block flex items-center gap-1">
                      <span>Mandatory Correction Justification</span>
                      <span className="text-red-500">* (Required)</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Explain operational rationale for altering system recommendation (e.g. Tactical terrain vulnerability, impending weather degradation, or intelligence cross-check)..."
                      value={correctionReason}
                      onChange={(e) => setCorrectionReason(e.target.value)}
                      className="w-full p-2.5 rounded bg-[#070c18] border border-red-800/60 text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-red-500"
                    />
                    <p className="text-[10px] text-[#64748b]">
                      This explanation is permanently committed to the immutable audit trail.
                    </p>
                  </div>
                )}

                {/* Reviewer Notes (Optional) */}
                <div className="space-y-1">
                  <label className="text-[#94a3b8] block">Reviewer Command Notes (Optional):</label>
                  <textarea
                    rows={2}
                    placeholder="Supplementary observations or tasking instructions..."
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    className="w-full p-2 rounded bg-[#070c18] border border-[#1e293b] text-[#f8fafc] placeholder-[#64748b]"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-[#1e293b] flex items-center justify-between">
                  <span className="text-[11px] text-[#64748b]">
                    Recorded as: <strong>{user?.username}</strong> ({user?.role})
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded bg-[#ff9933] text-[#0a0f0d] font-bold text-xs hover:bg-[#ffa94d] transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Recording Decision...</span>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" />
                        <span>Commit Human Decision</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[#64748b]">
              Select an incident from the pending queue to begin human review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
