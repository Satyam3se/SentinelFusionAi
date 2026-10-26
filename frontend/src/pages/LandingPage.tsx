import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  ArrowRight, 
  Lock, 
  FileText, 
  Layers, 
  Radio,
  History,
  HardDrive
} from 'lucide-react';
import { SyntheticBanner } from '../components/SyntheticBanner';
import { AshokaChakra } from '../components/Navbar';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent text-[#f8fafc] flex flex-col">
      <SyntheticBanner />
      {/* Top Illuminated Tricolour Ribbon */}
      <div className="tiranga-ribbon-horizontal w-full" />

      {/* Top Header */}
      <header className="px-6 py-4 border-b border-[#1e293b] bg-[#0b1120]/95 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#FF9933]/25 via-[#0b1120] to-[#138808]/25 border border-[#FF9933]/60 flex items-center justify-center shadow-[0_0_15px_rgba(255,153,51,0.3)] relative overflow-hidden">
            <Shield className="w-5 h-5 text-[#FF9933]" />
            <div className="absolute -bottom-1 w-full h-1 bg-[#138808]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wider text-[#f8fafc] uppercase font-heading">
                SENTINELFUSION <span className="text-[#FF9933]">AI</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[9px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF9933]/25 via-white/10 to-[#138808]/25 text-white border border-[#FF9933]/50 font-mono font-bold shadow-sm">
                <AshokaChakra className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" />
                <span>BHARAT DEFENCE C2 • TIRANGA</span>
              </span>
            </div>
            <span className="block text-[10px] text-[#cbd5e1] tracking-widest uppercase font-mono">
              Independent Defence Decision-Support Platform Prototype
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/documentation"
            className="text-xs text-[#cbd5e1] hover:text-[#f8fafc] transition-colors hidden sm:inline font-mono"
          >
            System Limitations
          </Link>
          <Link
            to="/login"
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#138808] to-[#046A38] text-xs font-bold text-white border border-[#138808]/60 hover:brightness-110 shadow-[0_0_12px_rgba(19,136,8,0.3)] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Sign In to Console
            <ArrowRight className="w-3.5 h-3.5 text-[#FF9933]" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-16 sm:py-24 max-w-6xl mx-auto tactical-grid-bg">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0b1120] border border-[#1e293b] text-xs text-[#ffb366] shadow-sm font-mono">
            <span className="w-2 h-2 rounded-full bg-[#ff9933] shadow-[0_0_6px_#ff9933]"></span>
            <span>Indian Defence Hackathon Evaluation Prototype</span>
            <span className="text-[#1e293b]">|</span>
            <span className="text-[#cbd5e1]">Strictly Synthetic Telemetry</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#f8fafc] leading-tight font-heading">
            Intelligence Correlation & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff9933] via-[#ffffff] to-[#138808] drop-shadow-[0_0_15px_rgba(255,153,51,0.2)]">
              Failure-Aware Decision Support
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-[#cbd5e1] leading-relaxed">
            Engineered for authorized defence analysts to organize multi-source sensor reports, eliminate duplicate submissions, 
            detect conflicting field accounts, and preserve traceable human command decisions — without uncalibrated AI black-boxes.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-gradient-to-r from-[#ff9933] to-[#ea580c] text-[#070c18] font-extrabold text-sm hover:from-[#ffa94d] hover:to-[#f97316] shadow-[0_0_20px_rgba(255,153,51,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer font-heading"
            >
              Access Evaluation Console
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/documentation"
              className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-[#0b1120] text-[#f8fafc] font-semibold text-sm border border-[#1e293b] hover:bg-[#111a2e] hover:border-[#ff9933]/50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm font-mono"
            >
              <FileText className="w-4 h-4 text-[#ff9933]" />
              Read System Architecture
            </Link>
          </div>
        </div>
      </section>

      {/* Core Architectural Differentiator: Failure-Aware Engineering */}
      <section className="px-6 py-12 max-w-6xl mx-auto border-t border-[#1e293b]">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#ff9933]">Core Innovation</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#f8fafc] mt-1">Why Failure-Aware Architecture Matters</h2>
          <p className="text-sm text-[#94a3b8] mt-2 max-w-2xl">
            Military decision-making cannot rely on black-box probabilities that present every recommendation as confident. 
            SentinelFusion AI explicitly surfaces uncertainty and data flaws.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Saffron Kesari */}
          <div className="p-5 rounded-xl bg-[#0b1120]/90 backdrop-blur-md border border-[#1e293b] border-t-4 border-t-[#FF9933] shadow-[0_4px_20px_rgba(255,153,51,0.15)] space-y-3">
            <div className="p-2 w-fit rounded-lg bg-[#070c18] text-[#ff9933] border border-[#1e293b]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#f8fafc] font-heading">Contradiction Detection</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              When an optical sensor reports an aerial target while a forward observer reports routine perimeter patrol, 
              the system flags conflicting evidence rather than silently picking one as truth.
            </p>
          </div>

          {/* Card 2: Ashoka Navy & White */}
          <div className="p-5 rounded-xl bg-[#0b1120]/90 backdrop-blur-md border border-[#1e293b] border-t-4 border-t-[#2563EB] shadow-[0_4px_20px_rgba(37,99,235,0.15)] space-y-3">
            <div className="p-2 w-fit rounded-lg bg-[#070c18] text-[#38bdf8] border border-[#1e293b]">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#f8fafc] font-heading">Duplicate Suppression</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Repeated identical radar packets are classified as duplicate evidence and never counted as independent multi-source corroboration, 
              preventing inflated threat rankings.
            </p>
          </div>

          {/* Card 3: India Green */}
          <div className="p-5 rounded-xl bg-[#0b1120]/90 backdrop-blur-md border border-[#1e293b] border-t-4 border-t-[#138808] shadow-[0_4px_20px_rgba(19,136,8,0.15)] space-y-3">
            <div className="p-2 w-fit rounded-lg bg-[#070c18] text-[#10b981] border border-[#1e293b]">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#f8fafc] font-heading">Staleness vs Tranquility</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Distinguishes between "source checked and sector clear" versus "no sensor heartbeat received". Sensor outages 
              are surfaced with explicit uncertainty warnings.
            </p>
          </div>
        </div>
      </section>

      {/* Human-in-the-Loop Command Flow */}
      <section className="px-6 py-12 max-w-6xl mx-auto border-t border-[#1e293b]">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#ff9933]">Operational Workflow</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#f8fafc] mt-1">Traceable Human-in-the-Loop Verification</h2>
          <p className="text-sm text-[#94a3b8] mt-2 max-w-2xl">
            Never autonomous engagement. The rules engine advises; authorized human officers decide, justify, and command.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[#0f172a] border border-[#1e293b] space-y-2">
            <div className="text-xs font-mono font-bold text-[#ff9933]">STEP 01</div>
            <h4 className="text-sm font-semibold text-[#f8fafc]">Multi-Source Ingestion</h4>
            <p className="text-xs text-[#94a3b8]">
              Synthetic reports validated with strict schemas; malformed rows quarantined safely without script execution.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#0f172a] border border-[#1e293b] space-y-2">
            <div className="text-xs font-mono font-bold text-[#ff9933]">STEP 02</div>
            <h4 className="text-sm font-semibold text-[#f8fafc]">Deterministic Rules Engine</h4>
            <p className="text-xs text-[#94a3b8]">
              Transparent spatial-temporal clustering calculates heuristic score components and flags contradictions.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#0f172a] border border-[#1e293b] space-y-2">
            <div className="text-xs font-mono font-bold text-[#ff9933]">STEP 03</div>
            <h4 className="text-sm font-semibold text-[#f8fafc]">Human Review & Correction</h4>
            <p className="text-xs text-[#94a3b8]">
              Reviewers accept or correct priority with mandatory recorded justifications; original recommendations preserved.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#0f172a] border border-[#1e293b] space-y-2">
            <div className="text-xs font-mono font-bold text-[#ff9933]">STEP 04</div>
            <h4 className="text-sm font-semibold text-[#f8fafc]">Append-Only Audit Trail</h4>
            <p className="text-xs text-[#94a3b8]">
              All reviews, classification updates, and situation reports saved to immutable audit logs for accountability.
            </p>
          </div>
        </div>
      </section>

      {/* Honest Prototype Notice & Footer */}
      <footer className="mt-auto border-t border-[#1e293b] bg-[#0a0f0d] px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#64748b]">
          <div className="space-y-1 text-center md:text-left">
            <p className="font-semibold text-[#94a3b8]">
              SentinelFusion AI — Defence Situational Awareness Evaluation Prototype (Version 1.0.0)
            </p>
            <p>
              Independent research software. Contains zero classified material. Strictly fictional demonstration zones.
            </p>
          </div>
          <div className="flex items-center space-x-6 text-[#94a3b8]">
            <Link to="/documentation" className="hover:text-[#f8fafc]">Architecture Docs</Link>
            <Link to="/security" className="hover:text-[#f8fafc]">Security Posture</Link>
            <Link to="/resilience" className="hover:text-[#f8fafc]">Offline Capability</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
