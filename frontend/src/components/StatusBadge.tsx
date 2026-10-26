import React from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle, 
  Copy, 
  ShieldCheck, 
  Clock, 
  FileCheck,
  XCircle,
  Radio
} from 'lucide-react';

interface StatusBadgeProps {
  type: 'priority' | 'status' | 'confidence' | 'quality' | 'source_status';
  value: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, size = 'sm' }) => {
  const isSm = size === 'sm';
  const px = isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  // Priority Badges
  if (type === 'priority') {
    switch (value.toUpperCase()) {
      case 'CRITICAL':
        return (
          <span className={`inline-flex items-center gap-1 font-bold rounded-md bg-red-950/80 text-red-300 border border-red-600/70 shadow-[0_0_10px_rgba(239,68,68,0.25)] ${px}`}>
            <AlertCircle className="w-3 h-3 text-red-400" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className={`inline-flex items-center gap-1 font-bold rounded-md bg-[#ff9933]/15 text-[#ffb366] border border-[#ff9933]/60 shadow-[0_0_10px_rgba(255,153,51,0.25)] ${px}`}>
            <AlertTriangle className="w-3 h-3 text-[#ff9933]" />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded-md bg-amber-950/70 text-amber-300 border border-amber-600/50 ${px}`}>
            <Clock className="w-3 h-3 text-amber-400" />
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded-md bg-[#10b981]/15 text-[#6ee7b7] border border-[#10b981]/50 shadow-[0_0_8px_rgba(16,185,129,0.15)] ${px}`}>
            <ShieldCheck className="w-3 h-3 text-[#10b981]" />
            LOW
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 ${px}`}>
            <HelpCircle className="w-3 h-3 text-slate-400" />
            {value}
          </span>
        );
    }
  }

  // Incident Status Badges
  if (type === 'status') {
    switch (value.toUpperCase()) {
      case 'NEW':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded-md bg-blue-950/80 text-blue-300 border border-blue-600/70 shadow-[0_0_8px_rgba(59,130,246,0.2)] ${px}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            NEW
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded-md bg-[#ff9933]/15 text-[#ffb366] border border-[#ff9933]/60 shadow-[0_0_8px_rgba(255,153,51,0.2)] ${px}`}>
            <Clock className="w-3 h-3 text-[#ff9933]" />
            PENDING REVIEW
          </span>
        );
      case 'VERIFICATION_REQUESTED':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded-md bg-purple-950/80 text-purple-300 border border-purple-600/60 ${px}`}>
            <Radio className="w-3 h-3 text-purple-400 animate-pulse" />
            VERIFICATION REQ
          </span>
        );
      case 'REVIEWED_CONFIRMED':
        return (
          <span className={`inline-flex items-center gap-1 font-bold rounded-md bg-[#10b981]/20 text-[#6ee7b7] border border-[#10b981]/60 shadow-[0_0_10px_rgba(16,185,129,0.25)] ${px}`}>
            <CheckCircle2 className="w-3 h-3 text-[#10b981]" />
            CONFIRMED
          </span>
        );
      case 'REVIEWED_CORRECTED':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-600/60 ${px}`}>
            <FileCheck className="w-3 h-3 text-cyan-400" />
            HUMAN CORRECTED
          </span>
        );
      case 'CLOSED':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded-md bg-stone-900 text-stone-400 border border-stone-800 ${px}`}>
            <XCircle className="w-3 h-3 text-stone-500" />
            CLOSED
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-stone-800 text-stone-300 border border-stone-700 ${px}`}>
            {value}
          </span>
        );
    }
  }

  // Correlation Confidence / Outcome
  if (type === 'confidence') {
    switch (value.toUpperCase()) {
      case 'CONFIRMED_DATA_MATCH':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 ${px}`}>
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            CONFIRMED MATCH
          </span>
        );
      case 'POSSIBLE_RELATIONSHIP':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded bg-amber-950/80 text-amber-300 border border-amber-700/60 ${px}`}>
            <Clock className="w-3 h-3 text-amber-400" />
            POSSIBLE RELATION
          </span>
        );
      case 'CONTRADICTORY_EVIDENCE':
        return (
          <span className={`inline-flex items-center gap-1 font-bold rounded bg-rose-950/90 text-rose-300 border border-rose-700 ${px}`}>
            <AlertCircle className="w-3 h-3 text-rose-400" />
            CONTRADICTION
          </span>
        );
      case 'INSUFFICIENT_EVIDENCE':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded bg-slate-900 text-slate-400 border border-slate-700 ${px}`}>
            <HelpCircle className="w-3 h-3 text-slate-400" />
            INSUFFICIENT EVIDENCE
          </span>
        );
      case 'DUPLICATE_RECORD':
        return (
          <span className={`inline-flex items-center gap-1 font-medium rounded bg-stone-900 text-stone-400 border border-stone-700 ${px}`}>
            <Copy className="w-3 h-3 text-stone-400" />
            DUPLICATE RECORD
          </span>
        );
      default:
        return <span>{value}</span>;
    }
  }

  // Data Quality Status
  if (type === 'quality') {
    switch (value.toUpperCase()) {
      case 'VALID':
        return (
          <span className={`inline-flex items-center gap-1 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 ${px}`}>
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            VALID
          </span>
        );
      case 'STALE_SOURCE':
        return (
          <span className={`inline-flex items-center gap-1 rounded bg-amber-950/70 text-amber-300 border border-amber-800/50 ${px}`}>
            <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
            STALE SOURCE
          </span>
        );
      case 'MISSING_FIELDS':
        return (
          <span className={`inline-flex items-center gap-1 rounded bg-red-950/70 text-red-300 border border-red-800/50 ${px}`}>
            <AlertCircle className="w-2.5 h-2.5 text-red-400" />
            MISSING FIELDS
          </span>
        );
      case 'DUPLICATE':
        return (
          <span className={`inline-flex items-center gap-1 rounded bg-stone-900 text-stone-400 border border-stone-800 ${px}`}>
            <Copy className="w-2.5 h-2.5 text-stone-400" />
            DUPLICATE
          </span>
        );
      default:
        return <span>{value}</span>;
    }
  }

  // Source Status
  if (type === 'source_status') {
    switch (value.toUpperCase()) {
      case 'ONLINE':
        return (
          <span className={`inline-flex items-center gap-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 ${px}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            ONLINE
          </span>
        );
      case 'STALE':
        return (
          <span className={`inline-flex items-center gap-1 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 ${px}`}>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            STALE
          </span>
        );
      case 'UNAVAILABLE':
        return (
          <span className={`inline-flex items-center gap-1 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 ${px}`}>
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            UNAVAILABLE
          </span>
        );
      default:
        return <span>{value}</span>;
    }
  }

  return <span className={`rounded bg-stone-800 text-stone-300 ${px}`}>{value}</span>;
};
