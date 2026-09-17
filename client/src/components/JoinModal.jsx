import React, { useState, useEffect } from 'react';
import { X, ArrowRight, KeyRound, Sparkles } from 'lucide-react';

export default function JoinModal({ isOpen, onClose, onJoinRoom, onGenerateNewRoom }) {
  const [inputCode, setInputCode] = useState('');

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
    if (!inputCode.trim()) return;
    onJoinRoom(inputCode.trim());
    setInputCode('');
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl glass-panel p-6 sm:p-8 shadow-2xl border border-white/10 flex flex-col gap-6"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white">Join Transfer Session</h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Enter the 6-digit code or 3-word slug displayed on your other device.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Code or Slug
            </label>
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="e.g. 549 201 or fast-blue-falcon"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white font-mono text-base focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!inputCode.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            <span>Connect & Pair</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-xs uppercase font-semibold text-slate-500">Or</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        {/* Generate New */}
        <button
          onClick={() => {
            onGenerateNewRoom();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium border border-white/10 transition-colors"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Generate Fresh Session Code</span>
        </button>
      </div>
    </div>
  );
}
