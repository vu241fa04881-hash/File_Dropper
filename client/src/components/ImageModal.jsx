import React, { useEffect } from 'react';
import { X, Download, Copy } from 'lucide-react';
import { copyImageToClipboard } from '../utils/helpers';
import { playCopySound } from '../utils/audio';

export default function ImageModal({ isOpen, onClose, imageUrl, fileName, addToast }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleCopy = async () => {
    try {
      await copyImageToClipboard(imageUrl);
      playCopySound();
      addToast('Image copied to clipboard!', 'success');
    } catch {
      addToast('Failed to copy image. Try right-click > copy image.', 'error');
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-950/90 backdrop-blur-lg animate-in fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl max-h-[90vh] flex flex-col items-center gap-3 rounded-2xl p-2 bg-slate-900/60 border border-white/10"
      >
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-300">
          <span className="truncate max-w-sm font-medium">{fileName}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
            <a
              href={imageUrl.replace('/preview/', '/download/')}
              download={fileName}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="overflow-auto flex items-center justify-center max-h-[80vh] rounded-xl">
          <img
            src={imageUrl}
            alt={fileName}
            className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
}
