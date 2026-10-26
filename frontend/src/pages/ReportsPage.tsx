import React, { useEffect, useState } from 'react';
import { 
  Inbox, 
  Upload, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Eye, 
  X,
  Radio,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { Report, ReportCreate } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedSourceType, setSelectedSourceType] = useState<string>('');
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const limit = 20;

  // Selected Report Detail Modal
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // CSV Import Modal
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  // New Report Modal
  const [isNewReportModalOpen, setIsNewReportModalOpen] = useState<boolean>(false);
  const [newReport, setNewReport] = useState<ReportCreate>({
    source_id: 'RADAR-SYNTH-01',
    source_type: 'RADAR',
    fictional_zone: 'DEMO-ZONE-A',
    event_type: 'AERIAL_TRACK',
    description: '',
    confidence_score: 0.8,
    report_timestamp: new Date().toISOString(),
    is_synthetic: true,
  });

  const [isExporting, setIsExporting] = useState<boolean>(false);

  const { hasRole } = useAuth();

  const handleExportCsv = async () => {
    setIsExporting(true);
    setError(null);
    try {
      await api.reports.downloadCsv(selectedZone || undefined, selectedSourceType || undefined);
      setSuccessMsg('Sensor reports CSV exported successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to download sensor reports CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.reports.list({
        zone: selectedZone || undefined,
        source_type: selectedSourceType || undefined,
        data_quality: selectedQuality || undefined,
        search: search || undefined,
        limit,
        offset: page * limit,
      });
      setReports(data.reports || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch incoming reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, selectedZone, selectedSourceType, selectedQuality]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchReports();
  };

  const handleUploadCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const res = await api.reports.uploadCsv(formData);
      setImportResult(res);
      setSuccessMsg(`CSV processed: ${res.imported_count} imported, ${res.rejected_count} quarantined.`);
      fetchReports();
    } catch (err: any) {
      setError(err.message || 'CSV processing failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.reports.create(newReport);
      setSuccessMsg('Synthetic report created successfully.');
      setIsNewReportModalOpen(false);
      setNewReport({
        source_id: 'RADAR-SYNTH-01',
        source_type: 'RADAR',
        fictional_zone: 'DEMO-ZONE-A',
        event_type: 'AERIAL_TRACK',
        description: '',
        confidence_score: 0.8,
        report_timestamp: new Date().toISOString(),
        is_synthetic: true,
      });
      fetchReports();
    } catch (err: any) {
      setError(err.message || 'Failed to create report.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-wider text-[#f8fafc]">
              INCOMING SENSOR REPORTS
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-[#ff9933]/20 via-white/10 to-[#138808]/20 text-[#ffb366] border border-[#ff9933]/40 font-mono font-bold">
              TOTAL: {total} TELEMETRY RECORDS
            </span>
          </div>
          <p className="text-xs text-[#cbd5e1] mt-1 font-mono">
            Raw incoming multi-sensor telemetry, data quality validation, and safe CSV ingestion.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#14532d] to-[#166534] text-xs font-semibold text-[#f8fafc] border border-[#22c55e]/50 hover:from-[#166534] hover:to-[#15803d] shadow-[0_0_12px_rgba(34,197,94,0.2)] disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#ff9933]" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
          {hasRole(['Administrator', 'Analyst']) && (
            <>
              <button
                onClick={() => setIsCsvModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-[#0b1120] text-xs font-medium text-[#cbd5e1] border border-[#1e293b] hover:text-[#f8fafc] hover:border-[#ff9933]/60 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-[#ff9933]" />
                <span>Import CSV</span>
              </button>
              <button
                onClick={() => setIsNewReportModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#ff9933] to-[#ea580c] text-xs font-extrabold text-[#070c18] border border-[#ff9933] hover:from-[#ffa94d] hover:to-[#f97316] shadow-[0_0_14px_rgba(255,153,51,0.3)] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Synthetic Report</span>
              </button>
            </>
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

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-lg bg-[#0b1120] border border-[#1e293b] flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search by Report ID, Description, or Event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded bg-[#070c18] border border-[#1e293b] text-xs text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#ff9933]"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded bg-[#166534] text-xs font-semibold text-[#f8fafc] border border-[#1e293b]"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Fictional Zone Filter */}
          <select
            value={selectedZone}
            onChange={(e) => { setSelectedZone(e.target.value); setPage(0); }}
            className="px-2.5 py-1.5 rounded bg-[#070c18] border border-[#1e293b] text-xs text-[#f8fafc] focus:outline-none"
          >
            <option value="">All Fictional Sectors</option>
            <option value="DEMO-ZONE-A">DEMO-ZONE-A (North Valley)</option>
            <option value="DEMO-ZONE-B">DEMO-ZONE-B (Arid Ridge)</option>
            <option value="DEMO-ZONE-C">DEMO-ZONE-C (Highland Basin)</option>
            <option value="DEMO-ZONE-D">DEMO-ZONE-D (Riverine)</option>
          </select>

          {/* Source Type Filter */}
          <select
            value={selectedSourceType}
            onChange={(e) => { setSelectedSourceType(e.target.value); setPage(0); }}
            className="px-2.5 py-1.5 rounded bg-[#070c18] border border-[#1e293b] text-xs text-[#f8fafc] focus:outline-none"
          >
            <option value="">All Source Types</option>
            <option value="RADAR">RADAR</option>
            <option value="OPTICAL_CAM">OPTICAL_CAM</option>
            <option value="UAV_RECON">UAV_RECON</option>
            <option value="SIGINT_BEACON">SIGINT_BEACON</option>
            <option value="MANUAL_REPORT">MANUAL_REPORT</option>
          </select>

          {/* Data Quality Filter */}
          <select
            value={selectedQuality}
            onChange={(e) => { setSelectedQuality(e.target.value); setPage(0); }}
            className="px-2.5 py-1.5 rounded bg-[#070c18] border border-[#1e293b] text-xs text-[#f8fafc] focus:outline-none"
          >
            <option value="">All Data Quality</option>
            <option value="VALID">VALID</option>
            <option value="STALE_SOURCE">STALE SOURCE</option>
            <option value="MISSING_FIELDS">MISSING FIELDS</option>
            <option value="DUPLICATE">DUPLICATE</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#94a3b8]">Loading incoming reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#64748b]">
            No reports match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f172a] text-[#94a3b8] border-b border-[#1e293b] uppercase font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-2.5">Report ID</th>
                  <th className="px-4 py-2.5">Source & Type</th>
                  <th className="px-4 py-2.5">Fictional Sector</th>
                  <th className="px-4 py-2.5">Event Description</th>
                  <th className="px-4 py-2.5">Sensor Confidence</th>
                  <th className="px-4 py-2.5">Quality Status</th>
                  <th className="px-4 py-2.5">Timestamp (UTC)</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/50">
                {reports.map((rep) => (
                  <tr key={rep.report_id} className="hover:bg-[#0f172a]/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#ff9933]">{rep.report_id}</td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[#f8fafc] font-medium">{rep.source_id}</div>
                      <div className="text-[10px] text-[#64748b] uppercase">{rep.source_type}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#38bdf8]">{rep.fictional_zone}</td>
                    <td className="px-4 py-3 max-w-sm">
                      <div className="font-medium text-[#f8fafc] truncate">{rep.description}</div>
                      <div className="text-[10px] text-[#64748b] font-mono">{rep.event_type}</div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className="font-semibold text-[#f8fafc]">
                        {Math.round(rep.confidence_score * 100)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge type="quality" value={rep.data_quality_status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[#94a3b8] text-[11px]">
                      {new Date(rep.report_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedReport(rep)}
                        className="px-2.5 py-1 rounded bg-[#0f172a] text-[11px] text-[#94a3b8] border border-[#1e293b] hover:text-[#f8fafc] hover:border-[#1e293b]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-3 border-t border-[#1e293b] bg-[#0a0f0d] flex items-center justify-between text-xs text-[#94a3b8]">
          <span>
            Showing {reports.length > 0 ? page * limit + 1 : 0} to {Math.min((page + 1) * limit, total)} of {total} records
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-2.5 py-1 rounded bg-[#0f172a] border border-[#1e293b] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-mono">Page {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * limit >= total}
              className="px-2.5 py-1 rounded bg-[#0f172a] border border-[#1e293b] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={`Report Inspection: ${selectedReport.report_id}`}
          subtitle={`Telemetry from ${selectedReport.source_id} in ${selectedReport.fictional_zone}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded bg-[#070c18] border border-[#1e293b]">
              <div>
                <span className="text-[#64748b] block">Source Identifier</span>
                <span className="font-mono font-bold text-[#f8fafc]">{selectedReport.source_id}</span>
              </div>
              <div>
                <span className="text-[#64748b] block">Source Type</span>
                <span className="font-mono text-[#38bdf8]">{selectedReport.source_type}</span>
              </div>
              <div>
                <span className="text-[#64748b] block">Fictional Sector</span>
                <span className="font-mono font-semibold text-[#f8fafc]">{selectedReport.fictional_zone}</span>
              </div>
              <div>
                <span className="text-[#64748b] block">Quality Status</span>
                <StatusBadge type="quality" value={selectedReport.data_quality_status} />
              </div>
            </div>

            <div>
              <span className="text-[#64748b] block mb-1">Description</span>
              <p className="p-3 rounded bg-[#0f172a] border border-[#1e293b] text-[#f8fafc] leading-relaxed">
                {selectedReport.description}
              </p>
            </div>

            {selectedReport.missing_fields && selectedReport.missing_fields.length > 0 && (
              <div className="p-3 rounded bg-red-950/50 border border-red-800/40 text-red-200">
                <span className="font-semibold block mb-1">Missing Telemetry Fields:</span>
                <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px]">
                  {selectedReport.missing_fields.map((mf, i) => (
                    <li key={i}>{mf}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-[11px] text-[#94a3b8] pt-2 border-t border-[#1e293b]">
              <div>
                <span className="text-[#64748b] block">Report Timestamp:</span>
                <span className="font-mono">{selectedReport.report_timestamp}</span>
              </div>
              <div>
                <span className="text-[#64748b] block">Ingestion Received:</span>
                <span className="font-mono">{selectedReport.received_timestamp}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* CSV Import Modal */}
      <Modal
        isOpen={isCsvModalOpen}
        onClose={() => { setIsCsvModalOpen(false); setImportResult(null); }}
        title="Import Reports via CSV"
        subtitle="Upload validated synthetic batches with error isolation"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <form onSubmit={handleUploadCsv} className="space-y-4">
            <div className="p-4 rounded border border-dashed border-[#1e293b] bg-[#070c18] text-center">
              <FileSpreadsheet className="w-8 h-8 mx-auto text-[#ff9933] mb-2" />
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="text-xs text-[#94a3b8] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-[#1e293b] file:bg-[#166534] file:text-xs file:text-[#f8fafc] hover:file:bg-[#15803d]"
              />
              <p className="text-[11px] text-[#64748b] mt-2">
                Maximum file size: 2MB. Maximum batch limit: 500 rows.
              </p>
            </div>

            <div className="p-3 rounded bg-[#0f172a] border border-[#1e293b] text-[11px] text-[#94a3b8]">
              <span className="font-semibold text-[#f8fafc] block mb-1">Mandatory CSV Columns:</span>
              <code className="text-[#38bdf8]">source_id, source_type, fictional_zone, event_type, description, confidence_score, report_timestamp</code>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-3 py-1.5 rounded bg-[#0f172a] border border-[#1e293b] text-[#94a3b8]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!csvFile || isUploading}
                className="px-4 py-1.5 rounded bg-[#ff9933] text-[#0a0f0d] font-bold disabled:opacity-50"
              >
                {isUploading ? 'Validating & Importing...' : 'Upload & Ingest'}
              </button>
            </div>
          </form>

          {/* Import Quarantine Error Results */}
          {importResult && importResult.rejected_errors.length > 0 && (
            <div className="mt-4 p-3 rounded bg-red-950/50 border border-red-800/40 text-red-200 space-y-2">
              <span className="font-bold block">Quarantined Rejected Rows ({importResult.rejected_count}):</span>
              <div className="max-h-40 overflow-y-auto space-y-1 text-[11px] font-mono">
                {importResult.rejected_errors.map((err: any, i: number) => (
                  <div key={i} className="p-1 rounded bg-[#070c18] border border-red-900/40">
                    <span className="text-red-400 font-bold">Row {err.row_number}:</span> {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Manual Report Modal */}
      <Modal
        isOpen={isNewReportModalOpen}
        onClose={() => setIsNewReportModalOpen(false)}
        title="Submit New Synthetic Report"
        subtitle="Manually register demonstration telemetry"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateReportSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#94a3b8] block mb-1">Source ID</label>
              <input
                type="text"
                value={newReport.source_id}
                onChange={(e) => setNewReport({ ...newReport, source_id: e.target.value })}
                required
                className="w-full p-2 rounded bg-[#070c18] border border-[#1e293b] text-[#f8fafc]"
              />
            </div>
            <div>
              <label className="text-[#94a3b8] block mb-1">Source Type</label>
              <select
                value={newReport.source_type}
                onChange={(e) => setNewReport({ ...newReport, source_type: e.target.value })}
                className="w-full p-2 rounded bg-[#070c18] border border-[#1e293b] text-[#f8fafc]"
              >
                <option value="RADAR">RADAR</option>
                <option value="OPTICAL_CAM">OPTICAL_CAM</option>
                <option value="UAV_RECON">UAV_RECON</option>
                <option value="SIGINT_BEACON">SIGINT_BEACON</option>
                <option value="MANUAL_REPORT">MANUAL_REPORT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#94a3b8] block mb-1">Fictional Sector</label>
              <select
                value={newReport.fictional_zone}
                onChange={(e) => setNewReport({ ...newReport, fictional_zone: e.target.value })}
                className="w-full p-2 rounded bg-[#070c18] border border-[#1e293b] text-[#f8fafc]"
              >
                <option value="DEMO-ZONE-A">DEMO-ZONE-A (North Valley)</option>
                <option value="DEMO-ZONE-B">DEMO-ZONE-B (Arid Ridge)</option>
                <option value="DEMO-ZONE-C">DEMO-ZONE-C (Highland Basin)</option>
                <option value="DEMO-ZONE-D">DEMO-ZONE-D (Riverine)</option>
              </select>
            </div>
            <div>
              <label className="text-[#94a3b8] block mb-1">Event Type</label>
              <input
                type="text"
                value={newReport.event_type}
                onChange={(e) => setNewReport({ ...newReport, event_type: e.target.value })}
                required
                className="w-full p-2 rounded bg-[#070c18] border border-[#1e293b] text-[#f8fafc]"
              />
            </div>
          </div>

          <div>
            <label className="text-[#94a3b8] block mb-1">Event Description</label>
            <textarea
              rows={3}
              value={newReport.description}
              onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
              placeholder="Detailed synthetic physical observation..."
              required
              className="w-full p-2 rounded bg-[#070c18] border border-[#1e293b] text-[#f8fafc]"
            />
          </div>

          <div>
            <label className="text-[#94a3b8] block mb-1">Confidence Score (0.0 to 1.0)</label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="1.0"
              value={newReport.confidence_score}
              onChange={(e) => setNewReport({ ...newReport, confidence_score: parseFloat(e.target.value) })}
              className="w-full p-2 rounded bg-[#070c18] border border-[#1e293b] text-[#f8fafc]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={() => setIsNewReportModalOpen(false)}
              className="px-3 py-1.5 rounded bg-[#0f172a] border border-[#1e293b] text-[#94a3b8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-[#166534] text-[#f8fafc] font-semibold border border-[#1e293b] hover:bg-[#15803d]"
            >
              Submit Report
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
