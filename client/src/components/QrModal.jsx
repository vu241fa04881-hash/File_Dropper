import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, QrCode as QrIcon, Copy, Check, Smartphone, ExternalLink } from 'lucide-react';
import { copyToClipboard } from '../utils/helpers';
import { playCopySound } from '../utils/audio';

export default function QrModal({ isOpen, onClose, roomCode, roomSlug, formattedCode, addToast }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const directUrl = `${window.location.origin}/#code=${roomCode}`;

  useEffect(() => {
    if (isOpen && canvasRef.current && roomCode) {
      QRCode.toCanvas(
        canvasRef.current,
        directUrl,
        {
          width: 260,
          margin: 2,
          color: {
            dark: '#030712',
            light: '#ffffff'
          }
        },
        (error) => {
          if (error) console.error('QR code generation error:', error);
        }
      );
    }
  }, [isOpen, roomCode, directUrl]);

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

  const handleCopyLink = async () => {
    try {
      await copyToClipboard(directUrl);
      playCopySound();
      setCopied(true);
      addToast('Direct link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl glass-panel p-6 shadow-2xl border border-white/10 flex flex-col items-center gap-4 text-center"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex flex-col items-center gap-1 mt-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-1">
            <Smartphone className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white">Connect Mobile Device</h3>
          <p className="text-xs text-slate-400">Scan with your phone's camera to pair instantly</p>
        </div>

        {/* QR Canvas */}
        <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-cyan-500/20">
          <canvas ref={canvasRef} className="rounded-lg" />
        </div>

        {/* Room identifiers */}
        <div className="w-full bg-slate-900/80 p-3 rounded-2xl border border-white/5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Room Code:</span>
            <span className="font-mono font-bold text-white text-sm tracking-wider">{formattedCode}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Slug:</span>
            <span className="font-mono text-cyan-300 font-medium">{roomSlug}</span>
          </div>
        </div>

        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold text-xs border border-cyan-500/30 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Link Copied!' : 'Copy Direct Share Link'}</span>
        </button>
      </div>
    </div>
  );
}
