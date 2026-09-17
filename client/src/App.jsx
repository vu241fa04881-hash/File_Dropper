import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { 
  Share2, 
  UploadCloud, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Trash2,
  Inbox,
  Filter,
  Layers
} from 'lucide-react';

import Header from './components/Header';
import ActionToolbar from './components/ActionToolbar';
import DropZoneOverlay from './components/DropZoneOverlay';
import ItemCard from './components/ItemCard';
import CodeModal from './components/CodeModal';
import TextModal from './components/TextModal';
import QrModal from './components/QrModal';
import ImageModal from './components/ImageModal';
import JoinModal from './components/JoinModal';
import ToastContainer from './components/ToastContainer';

import { 
  playReceiveSound, 
  playSendSound, 
  playPeerConnectSound, 
  toggleAudioMute, 
  getAudioMuted 
} from './utils/audio';

// Unique client identifier for this tab/device
const CLIENT_ID = 'client_' + Math.random().toString(36).substring(2, 9);
const CLIENT_NAME = 'Device ' + CLIENT_ID.slice(-3).toUpperCase();

export default function App() {
  // Theme & Sound state
  const [isDark, setIsDark] = useState(true);
  const [isMuted, setIsMuted] = useState(getAudioMuted());

  // Room & Connection state
  const [roomCode, setRoomCode] = useState('');
  const [roomSlug, setRoomSlug] = useState('');
  const [formattedCode, setFormattedCode] = useState('');
  const [peerCount, setPeerCount] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [peerActivity, setPeerActivity] = useState('');

  // Items stream & Filters
  const [items, setItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'files' | 'images' | 'code' | 'text'

  // Drag & Drop / Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modals state
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Socket reference
  const socketRef = useRef(null);
  const dragCounterRef = useRef(0);

  // Helper for adding toast notifications
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Switch Theme
  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light-theme');
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = toggleAudioMute();
    setIsMuted(nextMuted);
    addToast(nextMuted ? 'Sound muted' : 'Sound enabled', 'info');
  };

  // Parse room code from URL hash (e.g. #code=549201 or #room=fast-blue-falcon)
  const getCodeFromUrl = () => {
    const hash = window.location.hash;
    if (hash) {
      const match = hash.match(/#(?:code|room)=([^&]+)/i);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('code')) return params.get('code');
    if (params.get('room')) return params.get('room');
    return null;
  };

  // Join Room via Socket.IO
  const joinRoom = useCallback((code) => {
    if (!socketRef.current || !code) return;
    socketRef.current.emit('join-room', {
      roomCode: code,
      peerName: CLIENT_NAME,
      senderId: CLIENT_ID
    });
  }, []);

  // Request fresh session
  const requestNewSession = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('request-new-session');
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      const urlCode = getCodeFromUrl();
      if (urlCode) {
        joinRoom(urlCode);
      } else {
        requestNewSession();
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Room joined payload
    socket.on('room-joined', (data) => {
      setRoomCode(data.code);
      setRoomSlug(data.slug);
      setFormattedCode(data.formattedCode);
      setItems(data.items || []);
      setPeerCount(data.peerCount || 1);
      window.location.hash = `#code=${data.code}`;
    });

    // Peer joined event
    socket.on('peer-joined', (data) => {
      setPeerCount(data.peerCount);
      playPeerConnectSound();
      addToast(`🎉 Device paired! (${data.peerCount} devices active)`, 'success');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.15 }
      });
    });

    // Peer left event
    socket.on('peer-left', (data) => {
      setPeerCount(data.peerCount || 1);
      addToast(`Device disconnected (${data.peerCount} active)`, 'info');
    });

    // Session created response
    socket.on('session-created', (data) => {
      setRoomCode(data.code);
      setRoomSlug(data.slug);
      setFormattedCode(data.formattedCode);
      setItems([]);
      setPeerCount(1);
      window.location.hash = `#code=${data.code}`;
      addToast(`Fresh room generated: ${data.formattedCode}`, 'success');
    });

    // New item added in room
    socket.on('item-added', (item) => {
      setItems((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);

      // If sent by peer (not self), trigger sound & toast
      if (item.senderId !== CLIENT_ID) {
        playReceiveSound();
        const typeLabels = {
          image: 'New image received',
          code: 'New code snippet received',
          video: 'New video received',
          audio: 'New audio received',
          file: `File received: ${item.payload?.fileName || ''}`,
          text: 'New text note received'
        };
        addToast(typeLabels[item.type] || 'New item received', 'info');
      }
    });

    // Peer activity (typing / dragging)
    let peerActivityTimeout = null;
    socket.on('peer-activity', ({ activity, active }) => {
      if (active) {
        if (activity === 'dragging') {
          setPeerActivity('Peer is dropping files...');
        } else if (activity === 'typing') {
          setPeerActivity('Peer is typing...');
        }
        clearTimeout(peerActivityTimeout);
        peerActivityTimeout = setTimeout(() => setPeerActivity(''), 3000);
      } else {
        setPeerActivity('');
      }
    });

    // Listen for browser URL hash changes
    const handleHashChange = () => {
      const newCode = getCodeFromUrl();
      if (newCode && newCode !== roomCode) {
        joinRoom(newCode);
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      socket.disconnect();
    };
  }, [joinRoom, requestNewSession, addToast, roomCode]);

  // Upload files handler with progress tracking
  const uploadFiles = useCallback(async (files) => {
    if (!files || files.length === 0 || !roomCode) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('senderName', CLIENT_NAME);
    formData.append('senderId', CLIENT_ID);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/upload/${roomCode}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        setIsUploading(false);
        setUploadProgress(0);
        if (xhr.status >= 200 && xhr.status < 300) {
          playSendSound();
          addToast(`Uploaded ${files.length} item${files.length === 1 ? '' : 's'} successfully!`, 'success');
        } else {
          addToast('Failed to upload files', 'error');
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        setUploadProgress(0);
        addToast('Network error during upload', 'error');
      };

      xhr.send(formData);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
      addToast('Upload error', 'error');
    }
  }, [roomCode, addToast]);

  // Global Drag and Drop event listeners
  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current += 1;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
        if (socketRef.current && roomCode) {
          socketRef.current.emit('peer-activity', { roomCode, activity: 'dragging', active: true });
        }
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDragging(false);
        if (socketRef.current && roomCode) {
          socketRef.current.emit('peer-activity', { roomCode, activity: 'dragging', active: false });
        }
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      if (socketRef.current && roomCode) {
        socketRef.current.emit('peer-activity', { roomCode, activity: 'dragging', active: false });
      }

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        uploadFiles(Array.from(e.dataTransfer.files));
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [uploadFiles, roomCode]);

  // Global Clipboard Paste Listener (Ctrl+V anywhere)
  useEffect(() => {
    const handlePaste = async (e) => {
      // Don't intercept paste if user is typing inside an input or textarea
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea') {
        return;
      }

      const clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      if (!items || items.length === 0) return;

      // 1. Check for image files on clipboard
      const imageFiles = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            // Rename to meaningful screenshot name if generic
            const ext = file.type.split('/')[1] || 'png';
            const screenshotFile = new File([file], `screenshot-${Date.now()}.${ext}`, { type: file.type });
            imageFiles.push(screenshotFile);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        addToast('Pasting screenshot from clipboard...', 'info');
        uploadFiles(imageFiles);
        return;
      }

      // 2. Check for text or code on clipboard
      const pastedText = clipboardData.getData('text');
      if (pastedText && pastedText.trim().length > 0) {
        e.preventDefault();
        // Check if text looks like code (multiple lines with common code symbols)
        const isLikelyCode = (
          pastedText.includes('\n') && 
          (pastedText.includes('{') || pastedText.includes('function') || pastedText.includes('const ') || pastedText.includes('def ') || pastedText.includes('import ') || pastedText.includes('class '))
        );

        if (isLikelyCode && pastedText.split('\n').length >= 3) {
          // Send as code snippet
          socketRef.current?.emit('send-code', {
            roomCode,
            code: pastedText.trim(),
            language: 'javascript',
            title: 'Clipboard Code Snippet',
            senderName: CLIENT_NAME,
            senderId: CLIENT_ID
          });
          playSendSound();
          addToast('Pasted code snippet from clipboard!', 'success');
        } else {
          // Send as text / link
          socketRef.current?.emit('send-text', {
            roomCode,
            text: pastedText.trim(),
            senderName: CLIENT_NAME,
            senderId: CLIENT_ID
          });
          playSendSound();
          addToast('Pasted text from clipboard!', 'success');
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [uploadFiles, roomCode, addToast]);

  // Send Code Snippet handler
  const handleSendCode = ({ code, language, title }) => {
    if (!socketRef.current || !roomCode) return;
    socketRef.current.emit('send-code', {
      roomCode,
      code,
      language,
      title,
      senderName: CLIENT_NAME,
      senderId: CLIENT_ID
    });
    playSendSound();
    addToast('Code snippet sent to paired devices!', 'success');
  };

  // Send Text handler
  const handleSendText = (text) => {
    if (!socketRef.current || !roomCode) return;
    socketRef.current.emit('send-text', {
      roomCode,
      text,
      senderName: CLIENT_NAME,
      senderId: CLIENT_ID
    });
    playSendSound();
    addToast('Text note sent to paired devices!', 'success');
  };

  // Download All as ZIP
  const handleDownloadAllZip = () => {
    if (!roomCode) return;
    window.location.href = `/api/room/${roomCode}/zip`;
    addToast('Generating & downloading ZIP archive...', 'info');
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'files') return ['file', 'video', 'audio'].includes(item.type);
    if (activeFilter === 'images') return item.type === 'image';
    if (activeFilter === 'code') return item.type === 'code';
    if (activeFilter === 'text') return item.type === 'text';
    return true;
  });

  const hasFiles = items.some((item) => ['file', 'image', 'video', 'audio'].includes(item.type));

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-cyan-500/30">
      {/* Full-window Drag Overlay */}
      <DropZoneOverlay isDragging={isDragging} />

      {/* Main Header */}
      <Header
        roomCode={roomCode}
        roomSlug={roomSlug}
        formattedCode={formattedCode}
        peerCount={peerCount}
        onNewTransfer={requestNewSession}
        onOpenQr={() => setIsQrModalOpen(true)}
        onOpenJoinModal={() => setIsJoinModalOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        addToast={addToast}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col">
        {/* Action Toolbar */}
        <ActionToolbar
          onFilesSelected={uploadFiles}
          onOpenTextModal={() => setIsTextModalOpen(true)}
          onOpenCodeModal={() => setIsCodeModalOpen(true)}
          onDownloadAllZip={handleDownloadAllZip}
          hasFiles={hasFiles}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          peerActivity={peerActivity}
        />

        {/* Filter bar & Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 rounded-2xl border border-white/5 text-xs font-medium">
            {[
              { id: 'all', label: `All (${items.length})` },
              { id: 'images', label: `Images (${items.filter(i => i.type === 'image').length})` },
              { id: 'files', label: `Files & Media (${items.filter(i => ['file', 'video', 'audio'].includes(i.type)).length})` },
              { id: 'code', label: `Code (${items.filter(i => i.type === 'code').length})` },
              { id: 'text', label: `Notes (${items.filter(i => i.type === 'text').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeFilter === tab.id
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Transfers expire in 15m</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-log ephemeral memory</span>
            </span>
          </div>
        </div>

        {/* Transfer Items Grid / Empty State */}
        {filteredItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-white/10 bg-slate-900/20 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Room is ready for transfers</h3>
            <p className="text-slate-400 text-sm max-w-md mb-6">
              Drag and drop any files, press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs border border-white/10">Ctrl+V</kbd> to paste from your clipboard, or scan the QR code to pair your phone.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium border border-white/10 transition-colors"
              >
                Show Mobile QR
              </button>
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium border border-white/10 transition-colors"
              >
                Pair Another Code
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onOpenImageModal={(url, name) => setSelectedImage({ url, name })}
                addToast={addToast}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-4 px-6 text-center text-xs text-slate-500 glass-panel mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Dropper</span>
            <span>—</span>
            <span>Instant, Accountless P2P Sharing</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Ephemeral RAM Storage</span>
            <span>•</span>
            <span>Web Audio Chimes</span>
            <span>•</span>
            <span>Instant QR Sync</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        onSendCode={handleSendCode}
      />

      <TextModal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        onSendText={handleSendText}
      />

      <QrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        roomCode={roomCode}
        roomSlug={roomSlug}
        formattedCode={formattedCode}
        addToast={addToast}
      />

      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoinRoom={joinRoom}
        onGenerateNewRoom={requestNewSession}
      />

      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage?.url}
        fileName={selectedImage?.name}
        addToast={addToast}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
