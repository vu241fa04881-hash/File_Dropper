import React, { useRef } from 'react';
import { 
  FileUp, 
  FileCode, 
  MessageSquarePlus, 
  Archive, 
  Clipboard, 
  Sparkles,
  Loader2
} from 'lucide-react';

export default function ActionToolbar({
  onFilesSelected,
  onOpenTextModal,
  onOpenCodeModal,
  onDownloadAllZip,
  hasFiles,
  isUploading,
  uploadProgress,
  peerActivity
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <section className="w-full mb-8">
      {/* Peer Activity Notification banner */}
      {peerActivity && (
        <div className="mb-4 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs sm:text-sm animate-pulse">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{peerActivity}</span>
        </div>
      )}

      {/* Main Glass Action Bar */}
      <div className="glass-panel p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        {/* Left Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
          />

          {/* Upload Files Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold text-sm shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Uploading {uploadProgress}%</span>
              </>
            ) : (
              <>
                <FileUp className="w-4 h-4 text-slate-950" />
                <span>Upload Files</span>
              </>
            )}
          </button>

          {/* Send Text Button */}
          <button
            onClick={onOpenTextModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 font-medium text-sm transition-all hover:scale-[1.02] active:scale-95"
          >
            <MessageSquarePlus className="w-4 h-4 text-emerald-400" />
            <span>Send Text / Link</span>
          </button>

          {/* Send Code Snippet Button */}
          <button
            onClick={onOpenCodeModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 font-medium text-sm transition-all hover:scale-[1.02] active:scale-95"
          >
            <FileCode className="w-4 h-4 text-amber-400" />
            <span>Code Snippet</span>
          </button>

          {/* Download All as ZIP (only visible when files exist) */}
          {hasFiles && (
            <button
              onClick={onDownloadAllZip}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-medium text-sm transition-all hover:scale-[1.02] active:scale-95"
              title="Download all files in this session as a single ZIP archive"
            >
              <Archive className="w-4 h-4 text-indigo-400" />
              <span>Download ZIP</span>
            </button>
          )}
        </div>

        {/* Right Clipboard Hint */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 px-3.5 py-2 rounded-xl border border-white/5">
          <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] border border-white/10">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] border border-white/10">V</kbd>
          <span>to paste images or text directly</span>
        </div>
      </div>
    </section>
  );
}
