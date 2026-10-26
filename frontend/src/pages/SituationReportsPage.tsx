import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const SituationReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [reportTitle, setReportTitle] = useState<string>('TACTICAL SITUATION EVALUATION SUMMARY');

  const { user } = useAuth();

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.situationReports.generate({
        title: reportTitle,
        fictional_zone: selectedZone || undefined,
        include_contradictions: true,
        include_audit_trail: true,
      });
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate situation report.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    setError(null);
    setExportSuccess(null);
    try {
      await api.situationReports.downloadCsv(selectedZone || undefined);
      setExportSuccess('SITREP CSV downloaded successfully.');
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to download SITREP CSV.');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [selectedZone]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-wider text-[#f8fafc]">
              SITUATION REPORT (SITREP) GENERATOR
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-[#ff9933]/20 via-white/10 to-[#138808]/20 text-[#ffb366] border border-[#ff9933]/40 font-mono font-bold tracking-wider">
              🇮🇳 AUDIT-TRACEABLE
            </span>
          </div>
          <p className="text-xs text-[#cbd5e1] mt-1 font-mono">
            Assembles structured intelligence summaries grounded exclusively in recorded database telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#14532d] to-[#166534] text-xs font-semibold text-[#f8fafc] border border-[#22c55e]/50 hover:from-[#166534] hover:to-[#15803d] shadow-[0_0_12px_rgba(34,197,94,0.2)] disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#ff9933]" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#ff9933] to-[#ea580c] text-xs font-bold text-[#070c18] border border-[#ff9933] hover:from-[#ffa94d] hover:to-[#f97316] shadow-[0_0_14px_rgba(255,153,51,0.3)] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print SITREP</span>
          </button>
        </div>
      </div>

      {/* Filter and Configuration */}
      <div className="p-3 rounded-lg bg-[#0b1120] border border-[#1e293b] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#94a3b8] font-medium">Filter by Sector:</span>
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
        </div>

        <button
          onClick={generateReport}
          className="px-3 py-1.5 rounded bg-[#ff9933] text-xs font-bold text-[#0a0f0d] flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Regenerate Report</span>
        </button>
      </div>

      {exportSuccess && (
        <div className="p-3 rounded bg-emerald-950/70 border border-emerald-700/60 text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{exportSuccess}</span>
          </div>
          <button onClick={() => setExportSuccess(null)} className="text-emerald-400 font-bold">×</button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded bg-red-950/70 border border-red-700/60 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Rendered SITREP Document View */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#94a3b8]">Generating situation summary...</div>
      ) : reportData ? (
        <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] p-6 space-y-6 text-xs text-[#f8fafc] shadow-2xl">
          {/* Document Header */}
          <div className="border-b-2 border-[#1e293b] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-mono text-[#ff9933] tracking-widest uppercase">
                {reportData.report_id}
              </div>
              <h2 className="text-lg font-bold font-mono text-[#f8fafc] mt-0.5">{reportData.title}</h2>
              <div className="text-[11px] text-[#94a3b8] mt-1">
                Generated: <strong>{new Date(reportData.generated_at).toUTCString()}</strong> | Officer: <strong>{reportData.author}</strong> ({reportData.author_role})
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#0f172a] text-[#38bdf8] border border-[#1e293b]">
                SECTOR: {reportData.fictional_zone}
              </span>
            </div>
          </div>

          {/* Prototype Disclaimer Alert */}
          <div className="p-3 rounded bg-[#070c18] border border-[#1e293b] text-[11px] text-[#38bdf8] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#ff9933] flex-shrink-0" />
            <span>{reportData.disclaimer}</span>
          </div>

          {/* Executive Metrics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded bg-[#0f172a] border border-[#1e293b]">
              <span className="text-[10px] text-[#64748b] block uppercase">Incidents Evaluated</span>
              <span className="text-lg font-bold font-mono text-[#f8fafc]">{reportData.metrics.total_incidents_analyzed}</span>
            </div>
            <div className="p-3 rounded bg-[#0f172a] border border-[#1e293b]">
              <span className="text-[10px] text-[#64748b] block uppercase">Human Verified</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{reportData.metrics.human_verified_incidents}</span>
            </div>
            <div className="p-3 rounded bg-[#0f172a] border border-[#1e293b]">
              <span className="text-[10px] text-[#64748b] block uppercase">Pending Review</span>
              <span className="text-lg font-bold font-mono text-amber-400">{reportData.metrics.unverified_pending_incidents}</span>
            </div>
            <div className="p-3 rounded bg-[#0f172a] border border-[#1e293b]">
              <span className="text-[10px] text-[#64748b] block uppercase">Contradictions</span>
              <span className="text-lg font-bold font-mono text-red-400">{reportData.metrics.contradictions_detected_count}</span>
            </div>
            <div className="p-3 rounded bg-[#0f172a] border border-[#1e293b]">
              <span className="text-[10px] text-[#64748b] block uppercase">Telemetry Gaps</span>
              <span className="text-lg font-bold font-mono text-[#38bdf8]">{reportData.metrics.missing_evidence_count}</span>
            </div>
          </div>

          {/* Section 1: Detailed Incident Breakdown */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#ff9933] border-b border-[#1e293b] pb-2">
              Section 1: Correlated Incidents & Supporting Telemetry
            </h3>

            <div className="space-y-4">
              {reportData.incidents.map((inc: any) => (
                <div key={inc.incident_id} className="p-4 rounded-lg bg-[#0f172a] border border-[#1e293b] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#ff9933]">{inc.incident_id}</span>
                      <span className="font-semibold text-sm text-[#f8fafc]">{inc.title}</span>
                      <span className="font-mono text-xs text-[#38bdf8] px-1.5 rounded bg-[#070c18]">
                        {inc.fictional_zone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge type="priority" value={inc.priority} />
                      <StatusBadge type="status" value={inc.status} />
                    </div>
                  </div>

                  {/* Supporting Reports Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#070c18] text-[#94a3b8] border-b border-[#1e293b] font-mono">
                        <tr>
                          <th className="p-2">Report ID</th>
                          <th className="p-2">Source</th>
                          <th className="p-2">Type</th>
                          <th className="p-2">Observation Description</th>
                          <th className="p-2">Correlation Rule</th>
                          <th className="p-2">Timestamp (UTC)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e293b]/40">
                        {inc.linked_reports.map((lr: any) => (
                          <tr key={lr.report_id}>
                            <td className="p-2 font-mono font-semibold text-[#ff9933]">{lr.report_id}</td>
                            <td className="p-2 font-mono text-[#f8fafc]">{lr.source_id}</td>
                            <td className="p-2 font-mono text-[#38bdf8]">{lr.source_type}</td>
                            <td className="p-2 text-[#94a3b8] max-w-xs truncate">{lr.description}</td>
                            <td className="p-2 font-mono text-[#64748b]">{lr.correlation_rule}</td>
                            <td className="p-2 font-mono text-[#64748b]">
                              {new Date(lr.report_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Review Decision Traceability */}
                  {inc.review_decisions.length > 0 && (
                    <div className="p-2.5 rounded bg-[#070c18] border border-[#1e293b] text-[11px] text-[#94a3b8] space-y-1">
                      <strong className="text-[#f8fafc] block">Recorded Officer Review Decision:</strong>
                      {inc.review_decisions.map((rd: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {rd.reviewer_username} committed <strong>{rd.action}</strong>
                            {rd.correction_reason && ` — Reason: "${rd.correction_reason}"`}
                          </span>
                          <span className="font-mono text-[#64748b]">{new Date(rd.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Known Limitations & Defensive Boundaries */}
          <div className="p-4 rounded-lg bg-[#070c18] border border-[#1e293b] space-y-2 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-[#d4c59a]">
              Section 2: Known Operational Constraints & Disclaimers
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[#94a3b8]">
              {reportData.known_limitations.map((lim: string, i: number) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
};
