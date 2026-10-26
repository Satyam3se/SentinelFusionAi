import React, { useState } from 'react';
import { 
  Cpu, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Layers, 
  ShieldCheck, 
  Info,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const AnalysisPage: React.FC = () => {
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { hasRole } = useAuth();

  const handleRunAnalysis = async () => {
    setIsExecuting(true);
    setError(null);
    try {
      const res = await api.incidents.runCorrelation();
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Analysis cycle execution failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-wider text-[#f8fafc]">
              EXPLAINABLE RULES & ANALYSIS ENGINE
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#166534] text-[#38bdf8] border border-[#1e293b] font-mono">
              ZERO BLACK-BOX
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Deterministic, rule-based correlation logic with transparent inputs, component scoring, and explicit failure surfacing.
          </p>
        </div>

        <div>
          {hasRole(['Administrator', 'Analyst']) && (
            <button
              onClick={handleRunAnalysis}
              disabled={isExecuting}
              className="px-4 py-2 rounded bg-[#ff9933] text-xs font-bold text-[#0a0f0d] hover:bg-[#ffa94d] transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isExecuting ? 'Executing Engine Cycle...' : 'Execute Full Analysis Cycle'}</span>
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-700/50 text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Analysis execution finished at {new Date(result.execution_timestamp).toLocaleTimeString()}:{' '}
              {result.reports_analyzed} reports parsed, {result.incidents_created} candidate incidents updated.
            </span>
          </div>
          <button onClick={() => setResult(null)} className="text-emerald-400 font-bold">×</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-950/60 border border-red-700/50 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Transparent Rules Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rule 1: Exact Duplicate Detection */}
        <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#ff9933]">RULE 01: DEDUPLICATION</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#0f172a] text-[#38bdf8] font-mono">DETERMINISTIC</span>
          </div>
          <h3 className="text-base font-bold text-[#f8fafc]">Exact Duplicate Ingestion Suppression</h3>
          <p className="text-xs text-[#94a3b8] leading-relaxed">
            Identifies multiple transmissions with identical description hashes or identical source IDs emitting 
            matching event classifications within a 30-second window.
          </p>
          <div className="p-3 rounded bg-[#070c18] border border-[#1e293b] space-y-1 text-xs">
            <div className="text-[#64748b]">Failure-Aware Principle:</div>
            <div className="text-[#f8fafc] font-semibold">
              Duplicates are flagged as DUPLICATE_RECORD and suppressed from corroboration count.
            </div>
          </div>
        </div>

        {/* Rule 2: Multi-Source Independent Corroboration */}
        <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#ff9933]">RULE 02: CORROBORATION</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#0f172a] text-[#38bdf8] font-mono">SPATIO-TEMPORAL</span>
          </div>
          <h3 className="text-base font-bold text-[#f8fafc]">Independent Cross-Sensor Alignment</h3>
          <p className="text-xs text-[#94a3b8] leading-relaxed">
            Correlates observations from distinct physical source types (e.g. Radar + Optical Camera + UAV feed) 
            reporting compatible events in the same fictional sector within a 3-hour operational cluster.
          </p>
          <div className="p-3 rounded bg-[#070c18] border border-[#1e293b] space-y-1 text-xs">
            <div className="text-[#64748b]">Heuristic Contribution:</div>
            <div className="text-emerald-400 font-semibold font-mono">
              +10.0 pts per unique independent sensor (capped at +30.0 pts max).
            </div>
          </div>
        </div>

        {/* Rule 3: Contradictory Evidence Detection */}
        <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#ff9933]">RULE 03: CONTRADICTION</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#0f172a] text-[#38bdf8] font-mono">CONFLICT DETECTOR</span>
          </div>
          <h3 className="text-base font-bold text-[#f8fafc]">Conflicting Field Observation Flag</h3>
          <p className="text-xs text-[#94a3b8] leading-relaxed">
            Evaluates concurrent reports in the same zone for physical and tactical conflicts (e.g. Hostile Drone Sighting vs 
            Stationary Agricultural Activity / Routine Perimeter Patrol).
          </p>
          <div className="p-3 rounded bg-[#070c18] border border-[#1e293b] space-y-1 text-xs">
            <div className="text-[#64748b]">Failure-Aware Principle:</div>
            <div className="text-red-400 font-semibold font-mono">
              Never picks a winner. Applies -25.0 pt penalty and flags for mandatory human verification.
            </div>
          </div>
        </div>

        {/* Rule 4: Insufficient Evidence Outcome */}
        <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#ff9933]">RULE 04: UNCERTAINTY</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#0f172a] text-[#38bdf8] font-mono">ZERO-HALLUCINATION</span>
          </div>
          <h3 className="text-base font-bold text-[#f8fafc]">Explicit "Insufficient Evidence" State</h3>
          <p className="text-xs text-[#94a3b8] leading-relaxed">
            When only a single uncorroborated report exists with sensor confidence below 60%, or when mandatory telemetry 
            is missing, the system outputs INSUFFICIENT_EVIDENCE rather than generating false alarms.
          </p>
          <div className="p-3 rounded bg-[#070c18] border border-[#1e293b] space-y-1 text-xs">
            <div className="text-[#64748b]">Operational Outcome:</div>
            <div className="text-[#38bdf8] font-semibold">
              Prevents alert fatigue; designates cluster for background monitoring only.
            </div>
          </div>
        </div>
      </div>

      {/* Transparent Heuristic Formula Explanation Card */}
      <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#f8fafc] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#ff9933]" />
          Heuristic Scoring Formula & Limitations
        </h3>

        <div className="p-4 rounded bg-[#070c18] border border-[#1e293b] font-mono text-xs text-[#d4c59a] leading-relaxed">
          Heuristic Score = ZoneBaseRisk (0-25) + CorroborationScore (0-30) + ConfidenceWeight (0-20) + DensityWeight (0-15) - ConflictPenalty (-25) - StalenessPenalty (-15) - MissingFieldsPenalty (-10)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#94a3b8]">
          <div className="space-y-1.5">
            <span className="font-bold text-[#f8fafc] block">What the Heuristic Score Represents:</span>
            <p>
              A relative priority indexing value (scaled from 5 to 95) designed to sort queues for human review, 
              giving priority to multi-source corroborated incidents in vulnerable terrain.
            </p>
          </div>
          <div className="space-y-1.5">
            <span className="font-bold text-red-300 block">What the Heuristic Score Does NOT Represent:</span>
            <p>
              It is NOT a calibrated probability of real-world physical threat, enemy hostile intent, or likelihood of military engagement. 
              Presenting heuristic scores as true statistical probabilities is prohibited.
            </p>
          </div>
        </div>

        <div className="p-3 rounded bg-[#0f172a] border border-[#1e293b] text-[11px] text-[#64748b]">
          Future external AI/LLM integration notice: An optional LLM summary generator can be configured via environment variables, 
          but is intentionally disabled by default to guarantee 100% offline standalone operation.
        </div>
      </div>
    </div>
  );
};
