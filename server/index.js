import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const ROOM_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

// Ensure temporary uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'temp');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e8 // 100 MB max buffer size for websocket
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory data store
// rooms[normalizedCode] = { code, slug, createdAt, lastActivity, items: [], peers: Set<socketId> }
const rooms = new Map();
// files[fileId] = { fileId, originalName, storedPath, mimeType, size, createdAt, roomCode }
const filesRegistry = new Map();

// Random 3-word slug generators
const ADJECTIVES = ['fast', 'blue', 'swift', 'brave', 'cool', 'bright', 'vivid', 'cosmic', 'silent', 'golden', 'neon', 'rapid', 'atomic', 'solar', 'mystic', 'hyper', 'zenith', 'stellar'];
const COLORS = ['falcon', 'tiger', 'comet', 'phoenix', 'otter', 'dolphin', 'panther', 'eagle', 'dragon', 'rocket', 'badger', 'badger', 'sparrow', 'lynx', 'cheetah', 'condor', 'jaguar'];
const NOUNS = ['pulse', 'beacon', 'orbit', 'wave', 'signal', 'spark', 'nexus', 'vortex', 'relay', 'haven', 'matrix', 'stream', 'horizon', 'prism', 'zenith', 'breeze'];

export function generateSlug() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const col = COLORS[Math.floor(Math.random() * COLORS.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj}-${col}-${noun}`;
}

export function generate6DigitCode() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return num.toString();
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const fileId = uuidv4();
    const ext = path.extname(file.originalname) || '';
    cb(null, `${fileId}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB limit
});

// Helper to normalize room code (strip spaces, lowercase)
function normalizeCode(code) {
  if (!code) return '';
  return code.toString().trim().toLowerCase().replace(/\s+/g, '');
}

function getOrCreateRoom(codeOrSlug) {
  const normalized = normalizeCode(codeOrSlug);
  if (rooms.has(normalized)) {
    const room = rooms.get(normalized);
    room.lastActivity = Date.now();
    return room;
  }

  // Determine if it's 6-digit or slug
  const isDigits = /^\d{6}$/.test(normalized);
  const code = isDigits ? normalized : generate6DigitCode();
  const slug = isDigits ? generateSlug() : normalized;

  const room = {
    code,
    slug,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    ttlMinutes: 15, // default 15 minutes, configurable to 30, 60, 1440, or 'infinity'
    items: [],
    peers: new Set()
  };

  rooms.set(normalizeCode(code), room);
  rooms.set(normalizeCode(slug), room);
  return room;
}

// REST API Endpoints

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size / 2, activeFiles: filesRegistry.size });
});

// Generate new pairing codes
app.get('/api/rooms/new', (req, res) => {
  let code = generate6DigitCode();
  let slug = generateSlug();
  while (rooms.has(normalizeCode(code))) {
    code = generate6DigitCode();
  }
  const room = getOrCreateRoom(code);
  res.json({
    code: room.code,
    slug: room.slug,
    formattedCode: `${room.code.slice(0, 3)} ${room.code.slice(3)}`,
    ttlMinutes: room.ttlMinutes || 15
  });
});

// Upload endpoint
app.post('/api/upload/:roomCode', upload.array('files'), (req, res) => {
  const { roomCode } = req.params;
  const room = getOrCreateRoom(roomCode);
  const uploadedItems = [];

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  for (const file of req.files) {
    const fileId = path.parse(file.filename).name;
    const mime = file.mimetype || 'application/octet-stream';
    let itemType = 'file';
    if (mime.startsWith('image/')) itemType = 'image';
    else if (mime.startsWith('video/')) itemType = 'video';
    else if (mime.startsWith('audio/')) itemType = 'audio';

    const fileMeta = {
      fileId,
      originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'), // handle UTF-8 names
      storedPath: file.path,
      mimeType: mime,
      size: file.size,
      createdAt: Date.now(),
      ttlMinutes: room.ttlMinutes || 15,
      roomCode: room.code
    };

    filesRegistry.set(fileId, fileMeta);

    const item = {
      id: uuidv4(),
      type: itemType,
      sender: req.body.senderName || 'Peer',
      senderId: req.body.senderId || null,
      timestamp: new Date().toISOString(),
      payload: {
        fileId,
        fileName: fileMeta.originalName,
        fileSize: fileMeta.size,
        mimeType: mime,
        downloadUrl: `/api/download/${fileId}`,
        previewUrl: `/api/preview/${fileId}`
      }
    };

    room.items.unshift(item);
    room.lastActivity = Date.now();
    uploadedItems.push(item);

    // Broadcast item to room peers
    io.to(normalizeCode(room.code)).emit('item-added', item);
  }

  res.json({ success: true, items: uploadedItems });
});

// Direct file download
app.get('/api/download/:fileId', (req, res) => {
  const { fileId } = req.params;
  const fileMeta = filesRegistry.get(fileId);

  if (!fileMeta || !fs.existsSync(fileMeta.storedPath)) {
    return res.status(404).json({ error: 'File not found or expired' });
  }

  res.download(fileMeta.storedPath, fileMeta.originalName);
});

// Inline file preview (for image lightbox, audio/video streaming)
app.get('/api/preview/:fileId', (req, res) => {
  const { fileId } = req.params;
  const fileMeta = filesRegistry.get(fileId);

  if (!fileMeta || !fs.existsSync(fileMeta.storedPath)) {
    return res.status(404).json({ error: 'File not found or expired' });
  }

  res.setHeader('Content-Type', fileMeta.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileMeta.originalName)}"`);

  // Support range requests for video/audio seeking
  const range = req.headers.range;
  if (range && (fileMeta.mimeType.startsWith('video/') || fileMeta.mimeType.startsWith('audio/'))) {
    const stat = fs.statSync(fileMeta.storedPath);
    const total = stat.size;
    const parts = range.replace(/bytes=/, '').split('-');
    const partialStart = parts[0];
    const partialEnd = parts[1];

    const start = parseInt(partialStart, 10);
    const end = partialEnd ? parseInt(partialEnd, 10) : total - 1;
    const chunkSize = (end - start) + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': fileMeta.mimeType,
    });

    const stream = fs.createReadStream(fileMeta.storedPath, { start, end });
    stream.pipe(res);
  } else {
    fs.createReadStream(fileMeta.storedPath).pipe(res);
  }
});

// Batch download all files in room as zip
app.get('/api/room/:roomCode/zip', (req, res) => {
  const { roomCode } = req.params;
  const room = rooms.get(normalizeCode(roomCode));

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const fileItems = room.items.filter(item => ['file', 'image', 'video', 'audio'].includes(item.type));
  if (fileItems.length === 0) {
    return res.status(400).json({ error: 'No files available to download in this room' });
  }

  const archive = archiver('zip', { zlib: { level: 6 } });
  const zipFileName = `dropper-${room.code}-${Date.now()}.zip`;

  res.attachment(zipFileName);
  archive.pipe(res);

  const addedNames = new Set();
  for (const item of fileItems) {
    const meta = filesRegistry.get(item.payload.fileId);
    if (meta && fs.existsSync(meta.storedPath)) {
      let entryName = meta.originalName;
      let counter = 1;
      while (addedNames.has(entryName)) {
        const parsed = path.parse(meta.originalName);
        entryName = `${parsed.name} (${counter})${parsed.ext}`;
        counter++;
      }
      addedNames.add(entryName);
      archive.file(meta.storedPath, { name: entryName });
    }
  }

  archive.finalize();
});

// Periodic Ephemeral Storage Cleanup Worker (runs every 60s)
function cleanupExpiredTransfers() {
  const now = Date.now();
  let deletedFilesCount = 0;
  let closedRoomsCount = 0;

  // 1. Delete expired files based on their specific room TTL
  for (const [fileId, fileMeta] of filesRegistry.entries()) {
    const ttl = fileMeta.ttlMinutes ?? 15;
    if (ttl === 'infinity' || ttl === 0) {
      continue; // Infinite retention transfers do not expire automatically
    }

    const ttlMs = Number(ttl) * 60 * 1000;
    if (now - fileMeta.createdAt > ttlMs) {
      try {
        if (fs.existsSync(fileMeta.storedPath)) {
          fs.unlinkSync(fileMeta.storedPath);
        }
      } catch (err) {
        console.error(`Failed to unlink expired file ${fileId}:`, err);
      }
      filesRegistry.delete(fileId);
      deletedFilesCount++;
    }
  }

  // 2. Clear expired rooms that have no active peers and exceeded TTL
  for (const [codeKey, room] of rooms.entries()) {
    const ttl = room.ttlMinutes ?? 15;
    if (ttl === 'infinity' || ttl === 0) {
      continue;
    }

    const ttlMs = Number(ttl) * 60 * 1000;
    if (now - room.lastActivity > ttlMs && (!room.peers || room.peers.size === 0)) {
      rooms.delete(codeKey);
      closedRoomsCount++;
    }
  }

  if (deletedFilesCount > 0 || closedRoomsCount > 0) {
    console.log(`[Dropper Cleanup] Purged ${deletedFilesCount} expired files and ${closedRoomsCount} idle rooms.`);
  }
}

setInterval(cleanupExpiredTransfers, 60 * 1000);

// Socket.IO signaling logic
io.on('connection', (socket) => {
  let currentRoomCode = null;

  socket.on('join-room', ({ roomCode, peerName }) => {
    if (!roomCode) return;
    const room = getOrCreateRoom(roomCode);
    const normalized = normalizeCode(room.code);

    if (currentRoomCode && currentRoomCode !== normalized) {
      socket.leave(currentRoomCode);
      const prevRoom = rooms.get(currentRoomCode);
      if (prevRoom) {
        prevRoom.peers.delete(socket.id);
        io.to(currentRoomCode).emit('peer-left', {
          socketId: socket.id,
          peerCount: prevRoom.peers.size
        });
      }
    }

    currentRoomCode = normalized;
    socket.join(normalized);
    room.peers.add(socket.id);
    room.lastActivity = Date.now();

    // Send full room state to the newly connected peer
    socket.emit('room-joined', {
      code: room.code,
      slug: room.slug,
      formattedCode: `${room.code.slice(0, 3)} ${room.code.slice(3)}`,
      items: room.items,
      peerCount: room.peers.size,
      ttlMinutes: room.ttlMinutes || 15,
      createdAt: room.createdAt
    });

    // Notify other peers in the room
    socket.to(normalized).emit('peer-joined', {
      socketId: socket.id,
      peerName: peerName || 'A peer',
      peerCount: room.peers.size
    });
  });

  // Text message / link broadcast
  socket.on('send-text', ({ roomCode, text, senderName, senderId }) => {
    if (!text || !text.trim()) return;
    const room = getOrCreateRoom(roomCode);

    const isUrl = /^https?:\/\/[^\s]+$/i.test(text.trim());
    const item = {
      id: uuidv4(),
      type: 'text',
      sender: senderName || 'Peer',
      senderId: senderId || socket.id,
      timestamp: new Date().toISOString(),
      payload: {
        text: text.trim(),
        isUrl
      }
    };

    room.items.unshift(item);
    room.lastActivity = Date.now();
    io.to(normalizeCode(room.code)).emit('item-added', item);
  });

  // Code snippet broadcast
  socket.on('send-code', ({ roomCode, code, language, title, senderName, senderId }) => {
    if (!code || !code.trim()) return;
    const room = getOrCreateRoom(roomCode);

    const item = {
      id: uuidv4(),
      type: 'code',
      sender: senderName || 'Peer',
      senderId: senderId || socket.id,
      timestamp: new Date().toISOString(),
      payload: {
        code: code.trim(),
        language: language || 'javascript',
        title: title || 'Code Snippet'
      }
    };

    room.items.unshift(item);
    room.lastActivity = Date.now();
    io.to(normalizeCode(room.code)).emit('item-added', item);
  });

  // Peer activity indicator (dragover, typing)
  socket.on('peer-activity', ({ roomCode, activity, active }) => {
    if (!roomCode) return;
    socket.to(normalizeCode(roomCode)).emit('peer-activity', {
      socketId: socket.id,
      activity, // 'dragging' | 'typing'
      active
    });
  });

  // Peer renamed handler
  socket.on('update-peer-name', ({ roomCode, peerName }) => {
    if (!roomCode || !peerName) return;
    socket.to(normalizeCode(roomCode)).emit('peer-renamed', {
      socketId: socket.id,
      peerName: peerName.trim()
    });
  });

  // Update room TTL expiration handler
  socket.on('update-room-ttl', ({ roomCode, ttlMinutes, peerName }) => {
    if (!roomCode || ttlMinutes === undefined) return;
    const room = getOrCreateRoom(roomCode);
    room.ttlMinutes = ttlMinutes;
    room.lastActivity = Date.now();

    // Update existing files in room
    for (const [_, fileMeta] of filesRegistry.entries()) {
      if (fileMeta.roomCode === room.code) {
        fileMeta.ttlMinutes = ttlMinutes;
      }
    }

    io.to(normalizeCode(room.code)).emit('room-ttl-updated', {
      ttlMinutes,
      peerName: peerName || 'A peer'
    });
  });

  // Request new session / reset room
  socket.on('request-new-session', () => {
    let newCode = generate6DigitCode();
    while (rooms.has(normalizeCode(newCode))) {
      newCode = generate6DigitCode();
    }
    const newRoom = getOrCreateRoom(newCode);

    // Notify requesting peer of the new room info
    socket.emit('session-created', {
      code: newRoom.code,
      slug: newRoom.slug,
      formattedCode: `${newRoom.code.slice(0, 3)} ${newRoom.code.slice(3)}`
    });
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    if (currentRoomCode) {
      const room = rooms.get(currentRoomCode);
      if (room) {
        room.peers.delete(socket.id);
        io.to(currentRoomCode).emit('peer-left', {
          socketId: socket.id,
          peerCount: room.peers.size
        });
      }
    }
  });
});

// Serve frontend in production
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Dropper backend & Socket.IO server running on port ${PORT}`);
});
