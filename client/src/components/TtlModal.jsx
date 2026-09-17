import React, { useEffect } from 'react';
import { X, Clock, Infinity as InfinityIcon, Check, ShieldAlert } from 'lucide-react';

export const TTL_OPTIONS = [
  { value: 15, label: '15 Minutes', badge: 'Default', desc: 'Ephemeral quick exchange' },
  { value: 30, label: '30 Minutes', badge: 'Standard', desc: 'Good for meetings & quick collaborations' },
  { value: 60, label: '1 Hour', badge: 'Extended', desc: 'Extended work session' },
  { value: 1440, label: '24 Hours', badge: 'Full Day', desc: 'Keeps files accessible for a full day' },
  { value: 'infinity', label: 'Infinity', badge: 'Persistent', desc: 'Never expires automatically (kept until room is reset)' },
];

export function formatTtlLabel(ttl) {
  if (ttl === 'infinity' || ttl === 0) return 'Infinity (Never)';
  if (ttl === 1440) return '24 Hours';
  if (ttl === 60) return '1 Hour';
  if (ttl === 30) return '30 Minutes';
  return `${ttl || 15} Minutes`;
}

export default function TtlModal({ isOpen, onClose, currentTtl, onSelectTtl }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl glass-panel p-6 shadow-2xl border border-white/10 flex flex-col gap-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Transfer Expiration</h3>
              <p className="text-xs text-slate-400">Choose when transfers in this room should expire</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="flex flex-col gap-2 pt-1">
          {TTL_OPTIONS.map((option) => {
            const isSelected = String(currentTtl) === String(option.value);
            const isInfinity = option.value === 'infinity';

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSelectTtl(option.value);
                  onClose();
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group active:scale-[0.98] ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-white shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/5 hover:border-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                        : 'bg-white/5 text-slate-400 border-white/5 group-hover:text-cyan-400 group-hover:border-cyan-500/30'
                    }`}
                  >
                    {isInfinity ? (
                      <InfinityIcon className="w-5 h-5" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {option.label}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                            : 'bg-white/5 text-slate-400 border-white/5'
                        }`}
                      >
                        {option.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{option.desc}</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950 shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Informative Footer */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            Changes apply to all devices paired in this session.
          </span>
        </div>
      </div>
    </div>
  );
}
