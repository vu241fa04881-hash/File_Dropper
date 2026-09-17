import React, { useState, useEffect } from 'react';
import { X, User, Check, Laptop, Smartphone, Tablet, Monitor } from 'lucide-react';

const PRESETS = [
  { label: 'Laptop', icon: Laptop },
  { label: 'My Phone', icon: Smartphone },
  { label: 'Desktop PC', icon: Monitor },
  { label: 'Tablet', icon: Tablet },
];

export default function RenameUserModal({ isOpen, onClose, currentName, onSaveName }) {
  const [name, setName] = useState(currentName || '');

  useEffect(() => {
    setName(currentName || '');
  }, [currentName, isOpen]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSaveName(name.trim());
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl glass-panel p-6 sm:p-7 shadow-2xl border border-white/10 flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Rename Your Device</h3>
              <p className="text-xs text-slate-400">This name appears on items you send to other devices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Device / User Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Yaswanth's Laptop"
              maxLength={30}
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white font-medium text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Quick preset chips */}
          <div>
            <span className="block text-xs text-slate-500 mb-2 font-medium">Quick Suggestions:</span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => {
                const IconComponent = preset.icon;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setName(preset.label)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 text-xs font-medium transition-colors active:scale-95"
                  >
                    <IconComponent className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Save Name</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
