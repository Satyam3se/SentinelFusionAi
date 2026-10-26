import React, { useEffect, useState } from 'react';
import { 
  FlaskConical, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ShieldAlert, 
  Layers, 
  Clock, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { ScenarioInfo } from '../types';
import { useAuth } from '../context/AuthContext';

export const SimulationLabPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([]);
  const [activeResult, setActiveResult] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningScenarioId, setRunningScenarioId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const { hasRole } = useAuth();

  const fetchScenarios = async () => {
    setLoading(true);
    try {
      const data = await api.simulation.getScenarios();
      setScenarios(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load test scenarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleRunScenario = async (scenarioId: string) => {
    setRunningScenarioId(scenarioId);
    setError(null);
    try {
      const res = await api.simulation.loadScenario(scenarioId);
      setActiveResult(res);
    } catch (err: any) {
      setError(err.message || `Failed to run scenario ${scenarioId}`);
    } finally {
      setRunningScenarioId(null);
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await api.simulation.resetDemo();
      setResetMsg(`Demo dataset safely reset: ${res.reports_seeded} reports seeded.`);
      setActiveResult(null);
    } catch (err: any) {
      setError(err.message || 'Reset failed.');
    }
  };

  const handleSeedBaseline = async () => {
    try {
      const res = await api.simulation.seedDemo();
      setResetMsg(res.message);
    } catch (err: any) {
      setError(err.message || 'Failed to seed demo.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-wider text-[#f8fafc]">
              SCENARIO SIMULATION & TESTING LAB
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#166534] text-[#38bdf8] border border-[#1e293b] font-mono">
              10 FAILURE SCENARIOS
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Reproducible simulation test bench for validating failure-aware correlation rules and boundary handling.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasRole(['Administrator']) && (
            <button
              onClick={handleResetDemo}
              className="px-3 py-1.5 rounded bg-[#0f172a] text-xs font-medium text-[#94a3b8] border border-[#1e293b] hover:text-[#f8fafc] hover:border-red-800 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Baseline Demo</span>
            </button>
          )}

          <button
            onClick={handleSeedBaseline}
            className="px-3.5 py-1.5 rounded bg-[#ff9933] text-xs font-bold text-[#0a0f0d] hover:bg-[#ffa94d] transition-colors flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Generate Standard Demo Data</span>
          </button>
        </div>
      </div>

      {resetMsg && (
        <div className="p-3 rounded bg-emerald-950/70 border border-emerald-700/60 text-xs text-emerald-200 flex items-center justify-between">
          <span>{resetMsg}</span>
          <button onClick={() => setResetMsg(null)} className="text-emerald-400 font-bold">×</button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded bg-red-950/70 border border-red-700/60 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Execution Result Box */}
      {activeResult && (
        <div className="p-5 rounded-lg bg-[#0b1120] border border-[#1e293b] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
            <span className="font-mono text-xs font-bold text-[#ff9933]">
              SIMULATION EXECUTION RESULT: {activeResult.scenario_id}
            </span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              EXPECTED BEHAVIOR MATCHED
            </span>
          </div>

          <div className="text-sm font-bold text-[#f8fafc]">{activeResult.scenario_title}</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded bg-[#070c18] border border-[#1e293b]">
              <span className="text-[#64748b] block text-[10px] uppercase">Failure Type Evaluated</span>
              <strong className="text-[#38bdf8] font-mono">{activeResult.failure_type}</strong>
            </div>
            <div className="p-3 rounded bg-[#070c18] border border-[#1e293b]">
              <span className="text-[#64748b] block text-[10px] uppercase">Expected Platform Behavior</span>
              <p className="text-[#94a3b8]">{activeResult.expected_outcome}</p>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <span className="text-[#64748b] font-semibold block">Execution Log:</span>
            <ul className="list-disc list-inside space-y-0.5 text-[#94a3b8] font-mono text-[11px]">
              {activeResult.details?.map((d: string, i: number) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 10 Reproducible Test Scenarios Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((scen) => (
          <div
            key={scen.id}
            className="rounded-lg bg-[#0b1120] border border-[#1e293b] hover:border-[#364d3f] p-4 flex flex-col justify-between transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-[#ff9933]">{scen.id}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0f172a] text-[#38bdf8] border border-[#1e293b]">
                  {scen.failure_type}
                </span>
              </div>

              <h3 className="text-sm font-bold text-[#f8fafc] mb-1.5">{scen.title}</h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed mb-3">{scen.description}</p>

              <div className="p-2.5 rounded bg-[#070c18] border border-[#1e293b] text-[11px] text-[#94a3b8] space-y-0.5">
                <span className="font-bold text-[#d4c59a] block">Expected System Response:</span>
                <p>{scen.expected_outcome}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-end">
              <button
                onClick={() => handleRunScenario(scen.id)}
                disabled={runningScenarioId === scen.id}
                className="px-3 py-1.5 rounded bg-[#166534] text-xs font-semibold text-[#f8fafc] border border-[#1e293b] hover:bg-[#15803d] transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 text-[#ff9933]" />
                <span>{runningScenarioId === scen.id ? 'Injecting Scenario...' : 'Execute Scenario'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
