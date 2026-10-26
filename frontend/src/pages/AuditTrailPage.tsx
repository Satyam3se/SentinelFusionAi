import React, { useEffect, useState } from 'react';
import { 
  ScrollText, 
  Search, 
  Filter, 
  ShieldCheck, 
  Clock, 
  User, 
  Lock, 
  Eye, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import { AuditEvent } from '../types';
import { Modal } from '../components/Modal';

export const AuditTrailPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [actionFilter, setActionFilter] = useState<string>('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('');
  const [actorFilter, setActorFilter] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const limit = 25;

  // Selected Event Modal
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const fetchAuditEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.audit.list({
        action: actionFilter || undefined,
        target_type: targetTypeFilter || undefined,
        actor: actorFilter || undefined,
        limit,
        offset: page * limit,
      });
      setEvents(data.events || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve immutable audit records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEvents();
  }, [page, actionFilter, targetTypeFilter, actorFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-wider text-[#f8fafc]">
              IMMUTABLE AUDIT TRAIL
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#166534] text-[#38bdf8] border border-[#1e293b] font-mono">
              APPEND-ONLY LOG
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Complete cryptographic accountability. Modification and deletion prohibited at application level.
          </p>
        </div>

        <button
          onClick={fetchAuditEvents}
          className="px-3 py-1.5 rounded bg-[#0f172a] text-xs font-medium text-[#94a3b8] border border-[#1e293b] hover:text-[#f8fafc] transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Audit Log</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-950/70 border border-red-700/60 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-3 rounded-lg bg-[#0b1120] border border-[#1e293b] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#64748b]" />
          <input
            type="text"
            placeholder="Filter by Actor Username..."
            value={actorFilter}
            onChange={(e) => { setActorFilter(e.target.value); setPage(0); }}
            className="w-full px-3 py-1.5 rounded bg-[#070c18] border border-[#1e293b] text-xs text-[#f8fafc] placeholder-[#64748b] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={targetTypeFilter}
            onChange={(e) => { setTargetTypeFilter(e.target.value); setPage(0); }}
            className="px-2.5 py-1.5 rounded bg-[#070c18] border border-[#1e293b] text-xs text-[#f8fafc]"
          >
            <option value="">All Target Types</option>
            <option value="USER">USER</option>
            <option value="REPORT">REPORT</option>
            <option value="INCIDENT">INCIDENT</option>
            <option value="SOURCE">SOURCE</option>
            <option value="SITREP">SITREP</option>
            <option value="SIMULATION">SIMULATION</option>
            <option value="SYSTEM">SYSTEM</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
            className="px-2.5 py-1.5 rounded bg-[#070c18] border border-[#1e293b] text-xs text-[#f8fafc]"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="REPORT">REPORT</option>
            <option value="INCIDENT">INCIDENT</option>
            <option value="REVIEW">REVIEW</option>
            <option value="USER">USER</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#94a3b8]">Loading audit trail...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#64748b]">
            No audit records found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f172a] text-[#94a3b8] border-b border-[#1e293b] uppercase font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-2.5">Audit ID</th>
                  <th className="px-4 py-2.5">Timestamp (UTC)</th>
                  <th className="px-4 py-2.5">Actor</th>
                  <th className="px-4 py-2.5">Role</th>
                  <th className="px-4 py-2.5">Action Executed</th>
                  <th className="px-4 py-2.5">Target</th>
                  <th className="px-4 py-2.5">Details Summary</th>
                  <th className="px-4 py-2.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/50">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#0f172a]/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#ff9933]">#{ev.id}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#94a3b8]">
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-[#f8fafc]">{ev.actor_username}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#070c18] text-[#38bdf8]">
                        {ev.actor_role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-[#f8fafc]">{ev.action}</td>
                    <td className="px-4 py-3 font-mono text-[#38bdf8] text-[11px]">
                      {ev.target_type}: {ev.target_id}
                    </td>
                    <td className="px-4 py-3 text-[#94a3b8] max-w-xs truncate">{ev.details || 'N/A'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedEvent(ev)}
                        className="px-2.5 py-1 rounded bg-[#0f172a] text-[11px] text-[#94a3b8] border border-[#1e293b] hover:text-[#f8fafc]"
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
            Showing {events.length > 0 ? page * limit + 1 : 0} to {Math.min((page + 1) * limit, total)} of {total} records
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

      {/* Selected Audit Detail Modal */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={`Audit Record #${selectedEvent.id}`}
          subtitle={`Action: ${selectedEvent.action} by ${selectedEvent.actor_username}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded bg-[#070c18] border border-[#1e293b]">
              <div>
                <span className="text-[#64748b] block">Timestamp (UTC)</span>
                <span className="font-mono font-bold text-[#f8fafc]">{selectedEvent.timestamp}</span>
              </div>
              <div>
                <span className="text-[#64748b] block">Client Host / IP</span>
                <span className="font-mono text-[#38bdf8]">{selectedEvent.ip_address || '127.0.0.1'}</span>
              </div>
              <div>
                <span className="text-[#64748b] block">Actor</span>
                <span className="font-mono font-semibold text-[#f8fafc]">{selectedEvent.actor_username} ({selectedEvent.actor_role})</span>
              </div>
              <div>
                <span className="text-[#64748b] block">Target Record</span>
                <span className="font-mono text-[#ff9933]">{selectedEvent.target_type}: {selectedEvent.target_id}</span>
              </div>
            </div>

            {selectedEvent.previous_state && (
              <div>
                <span className="text-[#64748b] block mb-1">Previous State</span>
                <pre className="p-3 rounded bg-[#070c18] border border-[#1e293b] text-[11px] font-mono text-amber-300 overflow-x-auto">
                  {selectedEvent.previous_state}
                </pre>
              </div>
            )}

            {selectedEvent.resulting_state && (
              <div>
                <span className="text-[#64748b] block mb-1">Resulting State</span>
                <pre className="p-3 rounded bg-[#070c18] border border-[#1e293b] text-[11px] font-mono text-emerald-300 overflow-x-auto">
                  {selectedEvent.resulting_state}
                </pre>
              </div>
            )}

            <div>
              <span className="text-[#64748b] block mb-1">Audit Details / Rationale</span>
              <p className="p-3 rounded bg-[#0f172a] border border-[#1e293b] text-[#f8fafc] leading-relaxed font-mono text-[11px]">
                {selectedEvent.details || 'None specified'}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
