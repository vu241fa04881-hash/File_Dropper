# 🚀 Dropper — High-Performance Real-Time File, Clipboard & Code Sharing

> **Frictionless, accountless, real-time transfer web application inspired by `drophere.in`.**  
> Instantly exchange screenshots, code snippets, videos, audio, files, and clipboard content between two or more devices (desktop, mobile, tablet) with zero signups and ephemeral memory.

---

## ✨ Features

- **Pairing & Transfer Lifecycle**:
  - **Dual Pairing Identifiers**: Pair via 6-digit numeric codes (e.g., `549 201`) or memorable 3-word slugs (e.g., `fast-blue-falcon`).
  - **Instant QR Code & URL Hash Sync**: One scan from a mobile camera pairs devices immediately without typing.
  - **Bi-Directional Real-Time Transfer**: All connected peers can drop, upload, and copy items simultaneously.
  - **"New Transfer" Primary Action**: Generates a fresh session code and resets the room stream instantly without reloading the page.
  - **Ephemeral Storage**: In-memory session store with an automated cleanup worker running every 60 seconds to purge transfers older than 15 minutes.

- **Global Input & Dropzone**:
  - **Whole-Window Drag & Drop**: Animated glassmorphic dropzone activates whenever files hover over the browser window.
  - **Global `Ctrl+V` Clipboard Listener**: Pressing `Ctrl+V` anywhere pastes clipboard screenshots, images, code snippets, or text immediately.

- **Rich Preview Cards**:
  - **Images**: High-resolution thumbnails, full-screen lightbox zoom view, "Copy Image to Clipboard", and direct download.
  - **Code**: Prism.js syntax highlighting with language detection (TypeScript, JavaScript, Python, HTML, CSS, JSON, SQL, Shell), title badges, "Copy Code", and "Download as File".
  - **Video & Audio**: Inline HTML5 players with duration display and direct download.
  - **Files & Documents**: File type icons, human-readable file sizes, and one-click "Download ZIP" batch download.
  - **Text & Links**: Clickable hyperlinked URLs and quick "Copy Link" / "Copy Text" actions.

- **Aesthetics & Audio**:
  - **Glassmorphism UI**: Tailwind CSS dark/light theme, high-contrast typography, and smooth micro-animations.
  - **Zero-Dependency Sound Synthesizer**: Crisp feedback chimes synthesized via the Web Audio API for transfers, peer joins, and copy actions.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Socket.IO, Multer, Archiver.
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Prism.js, QRCode.
- **Audio Engine**: Web Audio API procedural synthesizer.
- **Storage**: Ephemeral disk buffer (`uploads/temp`) with 15-minute automated TTL cleanup.

---

## 🚀 Quick Start

### 1. Installation
```bash
git clone https://github.com/vu241fa04881-hash/File_Dropper.git
cd File_Dropper
npm install
```

### 2. Build Frontend
```bash
npm run build
```

### 3. Start Production Server
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Development Mode
Run backend and Vite hot-reloading client concurrently:
```bash
npm run dev
```

---

## 📄 License
MIT License
