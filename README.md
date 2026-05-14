# 🚀 Collaborative Whiteboard

A high-performance, real-time collaborative whiteboard built with **React**, **Konva**, and **Yjs**. Designed for seamless teamwork with infinite canvas support, professional-grade tools, and instant cross-device synchronization.

![Collaboration Preview](https://img.shields.io/badge/Status-Production%20Ready-success)
![Vite](https://img.shields.io/badge/Framework-Vite%20%2B%20React-646CFF?logo=vite)
![Konva](https://img.shields.io/badge/Canvas-React--Konva-0066FF)
![Yjs](https://img.shields.io/badge/Sync-Yjs%20(CRDT)-yellow)

---

## ✨ Features

- **🛡️ Real-time Collaboration**: Powered by **Yjs (CRDTs)**, ensuring zero-conflict state synchronization even with high latency.
- **⚡ High-Performance Rendering**: Split-layer canvas architecture (Grid/Static/Active) ensuring 60fps interaction.
- **🎨 Professional Toolbar**:
  - Precision Pen tool with smooth tension and **AI Shape Recognition**.
  - Shapes (Rectangle, Circle) and **Dimension Lines** for precision design.
  - **Sticky Notes** with collaborative text editing.
- **📦 Advanced Widgets**:
  - **Kanban Board**: Manage tasks directly on the canvas.
  - **Gantt Chart**: Collaborative timeline and project planning.
  - **Interactive Charts**: Visualize data with live-updating Chart.js widgets.
  - **Web Portals**: Embed iframes and external websites.
- **🔮 Immersive Experience**:
  - **3D View**: Perspective-based canvas manipulation with tilt and depth.
  - **Portal Shapes**: Teleport across the infinite canvas.
- **🤖 AI Powered Studio**:
  - **AI Image Studio**: Generate and upscale images with AI.
  - **Magic Tidy**: Instantly arrange shapes in perfect grids or circles.
  - **AI Theme Studio**: Generate cohesive brand kits and UI themes.
- **📞 Integrated Communication**:
  - **Voice & Video Calls**: Real-time collaboration without leaving the app.
  - **Shared Soundboard**: Interactive audio triggers for the whole team.
- **🖱️ Select & Manipulate**: Resizing, rotation, and multi-select smart layouts.
- **🔄 Productivity Suite**:
  - **Shared Timer**: Collaborative countdown for workshops.
  - **Workflow Automations**: Script-based automation for board tasks.
  - **History Scrubber**: Visual timeline for undo/redo.
- **🕹️ Fun & Utilities**:
  - **Physics Engine**: Realistic gravity and collisions for shapes.
  - **Activity Heatmap**: Visualize user engagement on the board.
  - **QR Code Generator**: Instant board access via QR.
  - **Tic Tac Toe**: Interactive mini-games for breaks.

---

## 🛠️ Technology Stack

### Frontend
- **React 18** + **Vite**
- **React-Konva**: Full-featured 2D canvas drawing engine.
- **Yjs**: Cross-device state synchronization via CRDTs.
- **Framer Motion**: Smooth UI transitions and micro-animations.
- **Chart.js**: Dynamic data visualization.
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
