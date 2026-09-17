import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  Code, 
  Image as ImageIcon, 
  Film, 
  Music, 
  Maximize2, 
  User, 
  Clock,
  Sparkles
} from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import { formatBytes, formatTime, copyToClipboard, copyImageToClipboard } from '../utils/helpers';
import { playCopySound } from '../utils/audio';

export default function ItemCard({ item, currentClientId, onOpenImageModal, addToast }) {
  const [copied, setCopied] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const codeRef = useRef(null);

  useEffect(() => {
    if (item.type === 'code' && codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [item]);

  const handleCopyText = async (text, label = 'Text') => {
    try {
      await copyToClipboard(text);
      playCopySound();
      setCopied(true);
      addToast(`${label} copied to clipboard!`, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  const handleCopyImage = async (url) => {
    try {
      setIsCopyingImage(true);
      await copyImageToClipboard(url);
      playCopySound();
      addToast('Image copied to clipboard!', 'success');
    } catch {
      addToast('Failed to copy image to clipboard. Try right-clicking to copy.', 'error');
    } finally {
      setIsCopyingImage(false);
    }
  };

  const handleDownloadCode = () => {
    const extMap = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      html: 'html',
      css: 'css',
      json: 'json',
      sql: 'sql',
      bash: 'sh'
    };
    const ext = extMap[item.payload.language] || 'txt';
    const blob = new Blob([item.payload.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snippet-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Code downloaded as file!', 'success');
  };

  const isSelf = currentClientId && item.senderId === currentClientId;

  return (
    <article className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col justify-between overflow-hidden group">
      {/* Header Info: Sender, Time & Type Badge */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/5 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate max-w-[120px]">{item.sender || 'Peer'}</span>
            {isSelf && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-cyan-500/15 text-cyan-300 rounded border border-cyan-500/30">
                You
              </span>
            )}
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatTime(item.timestamp)}</span>
          </div>
        </div>

        {/* Type Badge */}
        <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/5 text-slate-300 border border-white/5">
          {item.type}
        </span>
      </div>

      {/* Content Body Based on Type */}
      <div className="flex-1 py-1">
        {/* 1. IMAGE */}
        {item.type === 'image' && (
          <div className="flex flex-col gap-3">
            <div 
              onClick={() => onOpenImageModal(item.payload.previewUrl, item.payload.fileName)}
              className="relative group/img overflow-hidden rounded-xl bg-slate-900 border border-white/10 cursor-zoom-in max-h-72 flex items-center justify-center"
            >
              <img
                src={item.payload.previewUrl}
                alt={item.payload.fileName || 'Shared Image'}
                className="w-full h-full object-contain max-h-72 transition-transform duration-300 group-hover/img:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                <Maximize2 className="w-6 h-6 text-white drop-shadow-md" />
                <span className="text-xs font-semibold">Click to Zoom</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="truncate max-w-[200px]" title={item.payload.fileName}>
                {item.payload.fileName}
              </span>
              <span>{formatBytes(item.payload.fileSize)}</span>
            </div>

            {/* Image Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleCopyImage(item.payload.previewUrl)}
                disabled={isCopyingImage}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium border border-white/10 transition-colors"
                title="Copy image to clipboard"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isCopyingImage ? 'Copying...' : 'Copy Image'}</span>
              </button>
              <a
                href={item.payload.downloadUrl}
                download={item.payload.fileName}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          </div>
        )}

        {/* 2. CODE SNIPPET */}
        {item.type === 'code' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold flex items-center gap-1.5 text-cyan-300">
                <Code className="w-4 h-4 text-amber-400" />
                {item.payload.title || 'Code Snippet'}
              </span>
              <span className="uppercase text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-cyan-500/20">
                {item.payload.language || 'javascript'}
              </span>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-white/10 max-h-64 overflow-y-auto">
              <pre className="!bg-transparent !m-0 !p-3 text-xs">
                <code ref={codeRef} className={`language-${item.payload.language || 'javascript'}`}>
                  {item.payload.code}
                </code>
              </pre>
            </div>

            {/* Code Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleCopyText(item.payload.code, 'Code')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium border border-white/10 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
              <button
                onClick={handleDownloadCode}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download as File</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. VIDEO */}
        {item.type === 'video' && (
          <div className="flex flex-col gap-3">
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-white/10">
              <video
                src={item.payload.previewUrl}
                controls
                className="w-full max-h-64 rounded-xl object-contain bg-black"
                preload="metadata"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="truncate max-w-[200px]" title={item.payload.fileName}>
                {item.payload.fileName}
              </span>
              <span>{formatBytes(item.payload.fileSize)}</span>
            </div>

            <a
              href={item.payload.downloadUrl}
              download={item.payload.fileName}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Video</span>
            </a>
          </div>
        )}

        {/* 4. AUDIO */}
        {item.type === 'audio' && (
          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-white/10 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <Music className="w-4 h-4" />
                <span className="text-xs font-medium text-slate-200 truncate">{item.payload.fileName}</span>
              </div>
              <audio
                src={item.payload.previewUrl}
                controls
                className="w-full h-9"
                preload="metadata"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{formatBytes(item.payload.fileSize)}</span>
              <a
                href={item.payload.downloadUrl}
                download={item.payload.fileName}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          </div>
        )}

        {/* 5. GENERIC FILE / DOCUMENT */}
        {item.type === 'file' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white truncate" title={item.payload.fileName}>
                  {item.payload.fileName}
                </h4>
                <p className="text-xs text-slate-400">{formatBytes(item.payload.fileSize)}</p>
              </div>
            </div>

            <a
              href={item.payload.downloadUrl}
              download={item.payload.fileName}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </a>
          </div>
        )}

        {/* 6. PLAIN TEXT / LINK */}
        {item.type === 'text' && (
          <div className="flex flex-col gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 text-sm text-slate-200 break-words whitespace-pre-wrap select-text">
              {item.payload.isUrl ? (
                <a
                  href={item.payload.text}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 break-all"
                >
                  <span>{item.payload.text}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 inline" />
                </a>
              ) : (
                <span>{item.payload.text}</span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => handleCopyText(item.payload.text, item.payload.isUrl ? 'Link' : 'Text')}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium border border-white/10 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{copied ? 'Copied' : item.payload.isUrl ? 'Copy Link' : 'Copy Text'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
