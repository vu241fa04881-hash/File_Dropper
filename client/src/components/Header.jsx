import React, { useState } from 'react';
import { 
  Share2, 
  QrCode, 
  Copy, 
  Check, 
  PlusCircle, 
  Users, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  RefreshCw,
  Sparkles,
  ArrowRightLeft,
  User,
  Pencil,
  Clock
} from 'lucide-react';
import { copyToClipboard } from '../utils/helpers';
import { playCopySound } from '../utils/audio';

export default function Header({
  roomCode,
  roomSlug,
  formattedCode,
  peerCount,
  userName,
  onOpenRenameModal,
  ttlMinutes,
  onOpenTtlModal,
  onNewTransfer,
  onOpenQr,
  onOpenJoinModal,
  isMuted,
  onToggleMute,
  isDark,
  onToggleTheme,
  addToast
}) {
  const [copiedType, setCopiedType] = useState(null);
  const [showSlugInstead, setShowSlugInstead] = useState(false);

  const handleCopyCode = async () => {
    const textToCopy = showSlugInstead ? roomSlug : roomCode;
    try {
      await copyToClipboard(textToCopy);
      playCopySound();
      setCopiedType('code');
      addToast(`Copied ${showSlugInstead ? 'slug' : 'code'} "${textToCopy}" to clipboard`, 'success');
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  const handleCopyLink = async () => {
    const directUrl = `${window.location.origin}/#code=${roomCode}`;
    try {
      await copyToClipboard(directUrl);
      playCopySound();
      setCopiedType('link');
      addToast('Direct share link copied to clipboard!', 'success');
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      addToast('Failed to copy link', 'error');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 glass-panel px-4 py-3 backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/25">
            <Share2 className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight gradient-text">Dropper</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20">
                P2P Live
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Zero-setup instant transfer</p>
          </div>
        </div>

        {/* Room Code & Connection pill */}
        {roomCode ? (
          <div className="flex items-center gap-2 bg-slate-900/80 dark:bg-slate-900/80 border border-white/10 rounded-2xl p-1.5 shadow-inner">
            {/* Peer count badge */}
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 text-xs font-medium text-slate-300 border border-white/5"
              title={`${peerCount} active device${peerCount === 1 ? '' : 's'} connected in this room`}
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>{peerCount} {peerCount === 1 ? 'device' : 'devices'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>

            {/* Room Identifier Display */}
            <div className="flex items-center gap-1.5 px-3 py-1">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold hidden md:inline">
                {showSlugInstead ? 'Room Slug:' : 'Code:'}
              </span>
              <span className="font-mono text-sm sm:text-base font-bold tracking-wider text-white select-all">
                {showSlugInstead ? roomSlug : formattedCode}
              </span>

              {/* Toggle 6-digit vs slug */}
              <button
                onClick={() => setShowSlugInstead(!showSlugInstead)}
                title="Toggle between 6-digit code and 3-word slug"
                className="p-1 text-slate-400 hover:text-cyan-400 transition-colors rounded-lg hover:bg-white/5 ml-1"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Copy code button */}
            <button
              onClick={handleCopyCode}
              title="Copy code"
              className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-all border border-transparent hover:border-cyan-500/30 active:scale-95"
            >
              {copiedType === 'code' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {/* QR Code button */}
            <button
              onClick={onOpenQr}
              title="Show QR Code for mobile pairing"
              className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-all border border-transparent hover:border-cyan-500/30 active:scale-95"
            >
              <QrCode className="w-4 h-4" />
            </button>

            {/* Expiration Timer button */}
            <button
              onClick={onOpenTtlModal}
              title="Change transfer expiration time (15m, 30m, 1h, 24h, Infinity)"
              className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 transition-all border border-transparent hover:border-amber-500/30 active:scale-95"
            >
              <Clock className="w-4 h-4" />
            </button>

            {/* Join other room button */}
            <button
              onClick={onOpenJoinModal}
              title="Switch or join another room"
              className="hidden lg:flex items-center gap-1 px-3 py-1.5 text-xs text-slate-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              Switch
            </button>
          </div>
        ) : null}

        {/* Global Controls & Primary New Transfer CTA */}
        <div className="flex items-center gap-2">
          {/* User Display Name Pill */}
          {userName && (
            <button
              onClick={onOpenRenameModal}
              title={`Your display name is "${userName}". Click to rename.`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-white/5 hover:border-cyan-500/30 text-xs font-medium transition-all group active:scale-95 shadow-inner"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span className="truncate max-w-[85px] sm:max-w-[120px]">{userName}</span>
              <Pencil className="w-3 h-3 text-slate-400 group-hover:text-cyan-400 transition-colors ml-0.5" />
            </button>
          )}

          {/* Audio Mute Toggle */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/5 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/5 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* New Transfer Primary Action */}
          <button
            onClick={onNewTransfer}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all duration-200 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Transfer</span>
          </button>
        </div>
      </div>
    </header>
  );
}
