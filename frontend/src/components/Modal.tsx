import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
          onClick={onClose}
        />

        {/* Modal Dialog */}
        <div
          className={`relative transform overflow-hidden rounded-xl bg-[#0b1120] border border-[#1e293b] text-left shadow-2xl transition-all sm:my-8 w-full ${maxWidthClass}`}
        >
          {/* Top Illuminated Tricolour Ribbon */}
          <div className="w-full h-[3px] bg-gradient-to-r from-[#FF9933] via-white to-[#138808] shadow-[0_0_12px_rgba(255,153,51,0.5)]" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1e293b] px-6 py-4 bg-[#070c18]">
            <div>
              <h3 className="text-base font-bold text-white font-heading tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm bg-[#FF9933] shadow-[0_0_6px_#FF9933]"></span>
                {title}
              </h3>
              {subtitle && <p className="text-xs text-[#94a3b8] font-mono mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#64748b] hover:bg-[#1e293b] hover:text-[#FF9933] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 max-h-[75vh] overflow-y-auto text-[#f8fafc]">{children}</div>
        </div>
      </div>
    </div>
  );
};
