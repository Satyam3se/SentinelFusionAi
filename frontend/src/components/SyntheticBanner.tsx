import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const SyntheticBanner: React.FC = () => {
  return (
    <aside aria-label="Synthetic Prototype Disclaimer" className="bg-[#0b1120]/95 backdrop-blur-md border-b border-[#1e293b] px-4 py-1.5 text-xs text-[#cbd5e1] flex items-center justify-between shadow-inner">
      <div className="flex items-center space-x-2 overflow-hidden">
        {/* Tricolour Tri-Pulse Indicator (Kesari, White, Green) */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#FF9933] shadow-[0_0_8px_#FF9933] animate-pulse"></span>
          <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white] animate-pulse delay-75"></span>
          <span className="w-2 h-2 rounded-full bg-[#138808] shadow-[0_0_8px_#138808] animate-pulse delay-150"></span>
        </div>
        <span className="font-bold tracking-wider text-[#FFB366] font-mono uppercase flex items-center gap-1.5 flex-shrink-0">
          <ShieldAlert className="w-3.5 h-3.5 text-[#FF9933]" />
          DEFENCE PROTOTYPE:
        </span>
        <span className="truncate text-xs text-[#cbd5e1]">
          Strictly Synthetic Demonstration Telemetry & Fictional Sectors. Independent Architecture for Indian Army / MoD Evaluation.
        </span>
      </div>
      <div className="hidden md:flex items-center space-x-3 text-[11px] text-[#64748b] font-mono flex-shrink-0">
        <span className="flex items-center gap-1 text-[#10b981] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
          AIR-GAPPED READY
        </span>
        <span className="text-[#334155]">|</span>
        <span className="text-[#FF9933] font-semibold">FAIL-SAFE TRIAGE: ACTIVE</span>
      </div>
    </aside>
  );
};
