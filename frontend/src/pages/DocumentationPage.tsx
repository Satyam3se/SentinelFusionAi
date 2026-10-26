import React from 'react';
import { 
  BookOpen, 
  ShieldAlert, 
  Layers, 
  Cpu, 
  Lock, 
  Terminal, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export const DocumentationPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-wider text-[#f8fafc]">
            SYSTEM DOCUMENTATION & LIMITATIONS
          </h1>
          <span className="text-[11px] px-2 py-0.5 rounded bg-[#166534] text-[#38bdf8] border border-[#1e293b] font-mono">
            EVALUATION SPEC V1.0
          </span>
        </div>
        <p className="text-xs text-[#94a3b8] mt-1">
          Technical specifications, data flow architectures, failure-aware rules, and institutional deployment prerequisites.
        </p>
      </div>

      {/* Mandatory Scope & Non-Affiliation Declaration */}
      <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>SCOPE & NON-AFFILIATION NOTICE</span>
        </div>
        <p className="leading-relaxed">
          SentinelFusion AI is an independent software prototype designed for hackathon demonstration and academic/defence-software evaluation. 
          It is NOT an official Indian Army, Ministry of Defence (MoD), or DRDO deployment. All operational sectors (DEMO-ZONE-A, etc.) 
          and sensor telemetry records (REP-001, etc.) are strictly synthetic. No classified intelligence, live border coordinates, or real 
          military sensors are involved.
        </p>
      </div>

      {/* Section 1: System Architecture & Data Flow */}
      <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#ff9933] flex items-center gap-2">
          <Layers className="w-4 h-4" />
          1. System Architecture & End-to-End Data Flow
        </h2>

        <div className="p-4 rounded bg-[#070c18] border border-[#1e293b] font-mono text-xs text-[#d4c59a] space-y-2 overflow-x-auto">
          <div>[Synthetic Sensor Feeds] (Radar, Thermal Cam, UAV Recon, RF Beacon)</div>
          <div className="pl-4 text-[#94a3b8]">↓ Ingestion: Strict Schema Validation & CSV Quarantine</div>
          <div>[Ingested Reports Database] (SQLite with WAL Mode & Append-Only Audit)</div>
          <div className="pl-4 text-[#94a3b8]">↓ Deterministic Correlation Cycle</div>
          <div>[Candidate Incident Grouping] (Deduplication + Spatio-Temporal Clustering + Contradiction Detection)</div>
          <div className="pl-4 text-[#94a3b8]">↓ Transparent Heuristic Scoring Engine</div>
          <div>[Human Review Workbench] (Mandatory Officer Justifications for Corrections)</div>
          <div className="pl-4 text-[#94a3b8]">↓ Audit Logging & Export</div>
          <div>[Audit-Traceable SITREP Generator] (Structured JSON & Downloadable CSV)</div>
        </div>

        <p className="text-xs text-[#94a3b8] leading-relaxed">
          The architecture isolates incoming raw telemetry from operator decisions. Incoming records are strictly immutable. 
          When an analyst or reviewer alters a priority or detaches an incorrectly grouped record, the original data is preserved 
          and a formal decision record is permanently appended.
        </p>
      </div>

      {/* Section 2: Failure-Aware Decision Support Rules */}
      <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#ff9933] flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          2. The Failure-Aware Rules Engine
        </h2>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded bg-[#0f172a] border border-[#1e293b] space-y-1">
            <strong className="text-[#f8fafc] block">Rule 1: Deduplication Suppression</strong>
            <p className="text-[#94a3b8]">
              Identical event descriptions or repeated identical source emissions within 30 seconds are suppressed from 
              independent corroboration counts to prevent false confidence amplification.
            </p>
          </div>

          <div className="p-3 rounded bg-[#0f172a] border border-[#1e293b] space-y-1">
            <strong className="text-[#f8fafc] block">Rule 2: Multi-Source Corroboration</strong>
            <p className="text-[#94a3b8]">
              When 2 or more distinct physical sensor classes (e.g. Radar + Electro-Optical) report in the same zone within 3 hours, 
              correlation confidence is designated CONFIRMED_DATA_MATCH.
            </p>
          </div>

          <div className="p-3 rounded bg-[#0f172a] border border-[#1e293b] space-y-1">
            <strong className="text-[#f8fafc] block">Rule 3: Contradiction Flagging</strong>
            <p className="text-[#94a3b8]">
              If concurrent reports in the same zone conflict (e.g. aerial infiltration drone vs peaceful cattle herd), 
              the engine tags CONTRADICTORY_EVIDENCE and subtracts a -25 point penalty rather than silently discarding either account.
            </p>
          </div>

          <div className="p-3 rounded bg-[#0f172a] border border-[#1e293b] space-y-1">
            <strong className="text-[#f8fafc] block">Rule 4: Explicit "Insufficient Evidence"</strong>
            <p className="text-[#94a3b8]">
              Solitary low-confidence reports (&lt;60%) produce an explicit INSUFFICIENT_EVIDENCE outcome, preventing operator alert fatigue.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Defensive Cybersecurity Controls */}
      <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#ff9933] flex items-center gap-2">
          <Lock className="w-4 h-4" />
          3. Implemented Security Controls
        </h2>

        <ul className="list-disc list-inside space-y-2 text-xs text-[#94a3b8]">
          <li><strong className="text-[#f8fafc]">Password Storage:</strong> PBKDF2-HMAC-SHA256 with 600,000 iterations and per-user 32-byte cryptographic salts.</li>
          <li><strong className="text-[#f8fafc]">SQL Injection Prevention:</strong> Strictly parameterized queries across all database operations.</li>
          <li><strong className="text-[#f8fafc]">Brute-Force Rate Limiting:</strong> Lockout after 5 failed login attempts per account/IP.</li>
          <li><strong className="text-[#f8fafc]">Defensive HTTP Headers:</strong> Strict CSP, nosniff, DENY, and synthetic disclaimer metadata headers.</li>
          <li><strong className="text-[#f8fafc]">Server-Enforced RBAC:</strong> Endpoints check user JWT tokens server-side (Administrator, Analyst, Reviewer, Observer).</li>
        </ul>
      </div>

      {/* Section 4: Institutional Deployment Roadmap */}
      <div className="rounded-lg bg-[#0b1120] border border-[#1e293b] p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#ff9933] flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          4. Prerequisites for Institutional Defence Deployment
        </h2>

        <p className="text-xs text-[#94a3b8] leading-relaxed">
          Before transitioning this evaluation prototype to any operational or institutional military setting, the following 
          steps are strictly required:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded bg-[#070c18] border border-[#1e293b] space-y-1">
            <strong className="text-[#f8fafc]">1. Hardware Security Module (HSM)</strong>
            <p className="text-[#64748b]">Replace software-based JWT secrets with FIPS 140-3 Level 3 cryptographic hardware tokens.</p>
          </div>
          <div className="p-3 rounded bg-[#070c18] border border-[#1e293b] space-y-1">
            <strong className="text-[#f8fafc]">2. PKI Smart-Card Integration</strong>
            <p className="text-[#64748b]">Mandate mutual TLS and defence PKI card authentication for all operator sign-ins.</p>
          </div>
          <div className="p-3 rounded bg-[#070c18] border border-[#1e293b] space-y-1">
            <strong className="text-[#f8fafc]">3. Air-Gapped Network Enclave</strong>
            <p className="text-[#64748b]">Deploy in isolated, physical air-gapped server racks with unidirectional optical data diodes.</p>
          </div>
          <div className="p-3 rounded bg-[#070c18] border border-[#1e293b] space-y-1">
            <strong className="text-[#f8fafc]">4. Independent CERT-In Security Audit</strong>
            <p className="text-[#64748b]">Undergo formal vulnerability assessment and penetration testing (VAPT) certification.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
