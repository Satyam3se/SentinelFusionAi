import React from 'react';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger' | 'success' | 'info';
  badge?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  badge,
  onClick,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return 'border-t-4 border-t-red-500 border-[#1e293b] bg-[#0b1120]/90 shadow-[0_4px_20px_rgba(239,68,68,0.15)] hover:border-red-500';
      case 'warning':
        return 'border-t-4 border-t-[#FF9933] border-[#1e293b] bg-[#0b1120]/90 shadow-[0_4px_20px_rgba(255,153,51,0.2)] hover:border-[#FF9933]';
      case 'success':
        return 'border-t-4 border-t-[#138808] border-[#1e293b] bg-[#0b1120]/90 shadow-[0_4px_20px_rgba(19,136,8,0.2)] hover:border-[#10b981]';
      case 'info':
        return 'border-t-4 border-t-blue-500 border-[#1e293b] bg-[#0b1120]/90 shadow-[0_4px_20px_rgba(59,130,246,0.2)] hover:border-blue-400';
      default:
        return 'border-t-4 border-t-[#FF9933] border-[#1e293b] bg-[#0b1120]/90 shadow-[0_4px_20px_rgba(255,153,51,0.15)] hover:border-t-white';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all duration-200 relative overflow-hidden group ${getVariantStyles()} ${
        onClick ? 'cursor-pointer transform hover:-translate-y-1' : ''
      }`}
    >
      {/* 3-stripe Indian Flag Micro-Accent in the top-right corner */}
      <div className="absolute top-2 right-2 flex space-x-0.5 opacity-90">
        <span className="w-1.5 h-1.5 bg-[#FF9933] rounded-xs shadow-[0_0_4px_#FF9933]" />
        <span className="w-1.5 h-1.5 bg-white rounded-xs shadow-[0_0_4px_white]" />
        <span className="w-1.5 h-1.5 bg-[#138808] rounded-xs shadow-[0_0_4px_#138808]" />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider uppercase text-[#cbd5e1] font-mono">{title}</span>
        <div className="p-2 rounded-lg bg-[#070c18] border border-[#1e293b] text-[#FF9933] shadow-inner group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
      <div className="mt-2.5 flex items-baseline justify-between">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">{value}</span>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#070c18] border border-[#FF9933]/60 text-[#FFB366] font-mono">
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1.5 text-xs text-[#94a3b8] truncate font-mono">{subtitle}</p>}
    </div>
  );
};
