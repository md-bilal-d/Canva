export const TEMPLATE_CATEGORIES = ['All', 'Flowchart', 'Wireframe', 'Kanban', 'Mindmap', 'Retrospective', 'Blank'];

export const templates = [
  {
    id: 'kanban',
    name: 'Kanban Board',
    description: 'A 3-column kanban board for agile teams',
    category: 'Kanban',
    preview: 'https://images.unsplash.com/photo-1542626991-cbc4e32524cc?w=500&q=80',
    shapes: [
      { type: 'rect', x: -450, y: -300, width: 300, height: 600, fill: '#f3f4f6', stroke: '#d1d5db', strokeWidth: 2, cornerRadius: 8 },
      { type: 'text', x: -440, y: -290, text: 'To Do', fontSize: 24, fill: '#1f2937', fontFamily: 'sans-serif' },
      { type: 'rect', x: -430, y: -250, width: 260, height: 100, fill: '#fef08a', stroke: '#fbbf24', strokeWidth: 1, cornerRadius: 4 },
      
      { type: 'rect', x: -130, y: -300, width: 300, height: 600, fill: '#f3f4f6', stroke: '#d1d5db', strokeWidth: 2, cornerRadius: 8 },
      { type: 'text', x: -120, y: -290, text: 'In Progress', fontSize: 24, fill: '#1f2937', fontFamily: 'sans-serif' },
      { type: 'rect', x: -110, y: -250, width: 260, height: 100, fill: '#bfdbfe', stroke: '#60a5fa', strokeWidth: 1, cornerRadius: 4 },
      
      { type: 'rect', x: 190, y: -300, width: 300, height: 600, fill: '#f3f4f6', stroke: '#d1d5db', strokeWidth: 2, cornerRadius: 8 },
      { type: 'text', x: 200, y: -290, text: 'Done', fontSize: 24, fill: '#1f2937', fontFamily: 'sans-serif' },
      { type: 'rect', x: 210, y: -250, width: 260, height: 100, fill: '#bbf7d0', stroke: '#4ade80', strokeWidth: 1, cornerRadius: 4 }
    ]
  },
  {
    id: 'wireframe',
    name: 'Website Wireframe',
    description: 'Basic layout structure with header and sidebar',
    category: 'Wireframe',
    preview: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=500&q=80',
    shapes: [
      { type: 'rect', x: -512, y: -384, width: 1024, height: 768, fill: '#ffffff', stroke: '#9ca3af', strokeWidth: 2 },
      { type: 'rect', x: -512, y: -384, width: 1024, height: 80, fill: '#e5e7eb', stroke: '#9ca3af', strokeWidth: 1 },
      { type: 'text', x: -492, y: -359, text: 'Header / Navigation', fontSize: 24, fill: '#4b5563', fontFamily: 'sans-serif' },
      { type: 'rect', x: -512, y: -304, width: 250, height: 688, fill: '#f3f4f6', stroke: '#9ca3af', strokeWidth: 1 },
      { type: 'text', x: -492, y: -284, text: 'Sidebar', fontSize: 24, fill: '#4b5563', fontFamily: 'sans-serif' },
      { type: 'rect', x: -232, y: -274, width: 714, height: 628, fill: '#f9fafb', stroke: '#d1d5db', strokeWidth: 2 }
    ]
  },
  {
    id: 'flowchart',
    name: 'Process Flowchart',
    description: 'A simple vertical start-to-end flowchart',
    category: 'Flowchart',
    preview: 'https://images.unsplash.com/photo-1600100346142-f852fcd0c733?w=500&q=80',
    shapes: [
      { type: 'rect', x: -100, y: -250, width: 200, height: 80, fill: '#dbeafe', stroke: '#3b82f6', strokeWidth: 2, cornerRadius: 40 },
      { type: 'text', x: -30, y: -220, text: 'Start', fontSize: 20, fill: '#1e3a8a', fontFamily: 'sans-serif' },
      
      { type: 'arrow', points: [0, -170, 0, -100], stroke: '#4b5563', strokeWidth: 2, fill: '#4b5563' },
      
      { type: 'rect', x: -100, y: -100, width: 200, height: 80, fill: '#fef08a', stroke: '#eab308', strokeWidth: 2, cornerRadius: 8 },
      { type: 'text', x: -60, y: -70, text: 'Process Step', fontSize: 20, fill: '#854d0e', fontFamily: 'sans-serif' },
      
      { type: 'arrow', points: [0, -20, 0, 50], stroke: '#4b5563', strokeWidth: 2, fill: '#4b5563' },
      
      { type: 'rect', x: -100, y: 50, width: 200, height: 80, fill: '#d1fae5', stroke: '#10b981', strokeWidth: 2, cornerRadius: 40 },
      { type: 'text', x: -20, y: 80, text: 'End', fontSize: 20, fill: '#064e3b', fontFamily: 'sans-serif' }
    ]
  },
  {
    id: 'mindmap',
    name: 'Mindmap',
    description: 'Brainstorm central ideas naturally',
    category: 'Mindmap',
    preview: 'https://plus.unsplash.com/premium_photo-1661726487190-25e24c5bb2e9?w=500&q=80',
    shapes: [
      { type: 'circle', x: 0, y: 0, radius: 80, fill: '#fce7f3', stroke: '#db2777', strokeWidth: 3 },
      { type: 'text', x: -50, y: -10, text: 'Central Idea', fontSize: 18, fill: '#831843', fontFamily: 'sans-serif' },
      
      { type: 'arrow', points: [-60, -60, -180, -130], stroke: '#9ca3af', strokeWidth: 2, fill: '#9ca3af' },
      { type: 'rect', x: -330, y: -190, width: 140, height: 60, fill: '#f3f4f6', stroke: '#d1d5db', strokeWidth: 2, cornerRadius: 30 },
      { type: 'text', x: -300, y: -170, text: 'Branch 1', fontSize: 16, fill: '#4b5563', fontFamily: 'sans-serif' },
      
      { type: 'arrow', points: [60, -60, 180, -130], stroke: '#9ca3af', strokeWidth: 2, fill: '#9ca3af' },
      { type: 'rect', x: 190, y: -190, width: 140, height: 60, fill: '#f3f4f6', stroke: '#d1d5db', strokeWidth: 2, cornerRadius: 30 },
      { type: 'text', x: 220, y: -170, text: 'Branch 2', fontSize: 16, fill: '#4b5563', fontFamily: 'sans-serif' },
      
      { type: 'arrow', points: [-60, 60, -180, 130], stroke: '#9ca3af', strokeWidth: 2, fill: '#9ca3af' },
      { type: 'rect', x: -330, y: 130, width: 140, height: 60, fill: '#f3f4f6', stroke: '#d1d5db', strokeWidth: 2, cornerRadius: 30 },
      { type: 'text', x: -300, y: 150, text: 'Branch 3', fontSize: 16, fill: '#4b5563', fontFamily: 'sans-serif' },
      
      { type: 'arrow', points: [60, 60, 180, 130], stroke: '#9ca3af', strokeWidth: 2, fill: '#9ca3af' },
      { type: 'rect', x: 190, y: 130, width: 140, height: 60, fill: '#f3f4f6', stroke: '#d1d5db', strokeWidth: 2, cornerRadius: 30 },
      { type: 'text', x: 220, y: 150, text: 'Branch 4', fontSize: 16, fill: '#4b5563', fontFamily: 'sans-serif' }
    ]
  },
  {
    id: 'retro',
    name: 'Retrospective',
    description: 'Post-sprint reflection structure',
    category: 'Retrospective',
    preview: 'https://images.unsplash.com/photo-1512758684051-ce1744d0df09?w=500&q=80',
    shapes: [
      { type: 'rect', x: -470, y: -250, width: 300, height: 500, fill: '#ecfdf5', stroke: '#10b981', strokeWidth: 2, cornerRadius: 8 },
      { type: 'text', x: -450, y: -230, text: 'Went Well 😃', fontSize: 24, fill: '#065f46', fontFamily: 'sans-serif' },
      
      { type: 'rect', x: -150, y: -250, width: 300, height: 500, fill: '#fef2f2', stroke: '#ef4444', strokeWidth: 2, cornerRadius: 8 },
      { type: 'text', x: -130, y: -230, text: 'Needs Improvement', fontSize: 20, fill: '#991b1b', fontFamily: 'sans-serif' },
      
      { type: 'rect', x: 170, y: -250, width: 300, height: 500, fill: '#eff6ff', stroke: '#3b82f6', strokeWidth: 2, cornerRadius: 8 },
      { type: 'text', x: 190, y: -230, text: 'Action Items 🚀', fontSize: 24, fill: '#1e40af', fontFamily: 'sans-serif' }
    ]
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start fresh without any presets',
    category: 'Blank',
    preview: 'https://images.unsplash.com/photo-1497215848143-3cf5f8cc4257?w=500&q=80',
    shapes: []
  }
];
