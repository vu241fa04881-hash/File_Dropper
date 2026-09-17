import React, { useEffect } from 'react';
import { X, Users, Smartphone, Laptop, Tablet, Monitor, QrCode, Sparkles } from 'lucide-react';

function getDeviceIcon(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('phone') || lower.includes('iphone') || lower.includes('android')) return Smartphone;
  if (lower.includes('tablet') || lower.includes('ipad')) return Tablet;
  if (lower.includes('desktop') || lower.includes('pc')) return Monitor;
  return Laptop;
}

export default function ConnectedDevicesModal({
  isOpen,
  onClose,
  peers,
  currentClientId,
  onOpenQr
}) {
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
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Connected Devices</h3>
              <p className="text-xs text-slate-400">
                {peers.length} active device{peers.length === 1 ? '' : 's'} paired in this room
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Peers List */}
        <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto py-1">
          {peers.map((peer, idx) => {
            const isSelf = currentClientId && peer.senderId === currentClientId;
            const Icon = getDeviceIcon(peer.peerName);

            return (
              <div
                key={peer.socketId || idx}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isSelf
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-slate-900/60 border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isSelf
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-white/5 text-cyan-400 border-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate max-w-[170px]">
                        {peer.peerName || 'Device'}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          This Device
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-[11px] text-emerald-400 font-medium">Online & Synced</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {isSelf ? 'Sender / Receiver' : 'Paired Peer'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action: Pair Mobile / Another device */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenQr) onOpenQr();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 transition-colors active:scale-95"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Pair Another Device via QR</span>
          </button>
        </div>
      </div>
    </div>
  );
}
