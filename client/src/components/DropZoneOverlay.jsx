import React from 'react';
import { UploadCloud, Sparkles } from 'lucide-react';

export default function DropZoneOverlay({ isDragging }) {
  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md transition-all duration-300 animate-in fade-in">
      <div className="relative flex flex-col items-center justify-center w-full max-w-2xl p-12 rounded-3xl border-2 border-dashed border-cyan-400 bg-slate-900/90 shadow-2xl shadow-cyan-500/30 animate-drop-pulse text-center">
        {/* Ambient Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-3xl blur-xl opacity-30"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 animate-bounce">
            <UploadCloud className="w-10 h-10" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
            <span>Drop Files Anywhere</span>
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </h3>

          <p className="text-slate-300 text-sm sm:text-base max-w-md">
            Release to instantly upload & broadcast to all devices paired in this room.
          </p>

          <div className="mt-6 flex items-center gap-3 text-xs text-slate-400 font-mono bg-slate-800/80 px-4 py-2 rounded-xl border border-white/5">
            <span>Images</span>
            <span>•</span>
            <span>Videos</span>
            <span>•</span>
            <span>Documents</span>
            <span>•</span>
            <span>Any Size</span>
          </div>
        </div>
      </div>
    </div>
  );
}
