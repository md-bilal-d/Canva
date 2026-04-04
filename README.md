# 🚀 Collaborative Whiteboard

A high-performance, real-time collaborative whiteboard built with **React**, **Konva**, and **Yjs**. Designed for seamless teamwork with infinite canvas support, professional-grade tools, and instant cross-device synchronization.

![Collaboration Preview](https://img.shields.io/badge/Status-Production%20Ready-success)
![Vite](https://img.shields.io/badge/Framework-Vite%20%2B%20React-646CFF?logo=vite)
![Konva](https://img.shields.io/badge/Canvas-React--Konva-0066FF)
![Yjs](https://img.shields.io/badge/Sync-Yjs%20(CRDT)-yellow)

---

## ✨ Features

- **🛡️ Real-time Collaboration**: Powered by Yjs (CRDTs), ensuring zero-conflict state synchronization even with high latency.
- **⚡ High-Performance Rendering**: Split-layer canvas architecture (Grid/Static/Active) ensuring 60fps interaction.
- **🎨 Professional Toolbar**:
  - Precision Pen tool with smooth tension.
  - Shapes (Rectangle, Circle) with live preview.
  - Sticky Notes with collaborative text editing.
  - Color picker and stroke width adjustment.
- **🖱️ Select & Manipulate**: Use the **Select Tool** to drag, resize, and re-arrange existing shapes.
- **🖼️ Image Support**: Effortlessly drag and drop images directly onto the canvas.
- **🔍 Infinite Canvas**: Seamless panning (Space + Drag) and zooming (Wheel).
- **🔄 Undo/Redo**: Full history support using Yjs UndoManager.
- **🔗 Instant Sharing**: Create private rooms by simply sharing the unique URL.
- **📦 Export**: Capture the entire whiteboard as a high-quality PNG.

---

## 🛠️ Technology Stack

### Frontend
- **React 18** + **Vite**
- **React-Konva**: Full-featured 2D canvas drawing engine.
- **Yjs**: Cross-device state synchronization via CRDTs.
- **Lucide-React**: Modern, crisp iconography.

### Backend
- **Node.js** + **Express**
- **Socket.io**: Persistent WebSocket communication.
- **Better-SQLite3**: Robust, file-based room state persistence.

---

## 🚀 Getting Started

### Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   cd server && npm install
   ```

2. **Start Backend**:
   ```bash
   cd server
   node index.js
   ```

3. **Start Frontend**:
   ```bash
   npm run dev
   ```

### Docker (Production)

Deploy the entire stack with a single command:
```bash
docker-compose up -d
```

---

## 🏗️ Architecture & Optimization

To maintain peak performance during collaborative sessions, the application implements a **Three-Layer Canvas Strategy**:

1. **Grid Layer**: A non-interactive background layer that pans and zooms without triggering expensive re-renders.
2. **Static Shapes Layer**: Stores all "finished" shapes. It is cached and only re-drawn when an item is added or deleted.
3. **Active/Interactive Layer**: Handled with high priority for current drawing, cursors, and active transformations.

---

## 👤 Author

Developed by **MOHAMMED BILAL D** ([md-bilal-d](https://github.com/md-bilal-d))

---

## 📄 License

This project is open-source and available under the MIT License.
