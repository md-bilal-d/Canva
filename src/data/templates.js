export const TEMPLATE_CATEGORIES = ['All', 'Flowchart', 'Wireframe', 'Kanban', 'Mindmap', 'Retrospective', 'Analysis', 'Blank'];

export const templates = [
  {
    id: 'kanban',
    name: 'Kanban Board',
    description: 'A 3-column kanban board for agile teams',
    category: 'Kanban',
    color: 'bg-yellow-100',
    shapes: [
      { type: 'rect', x: 100, y: 100, width: 250, height: 600, color: '#f3f4f6', strokeWidth: 2, label: 'TO DO' },
      { type: 'rect', x: 110, y: 160, width: 230, height: 80, color: '#ffffff', strokeWidth: 1, label: 'Task 1' },
      { type: 'rect', x: 110, y: 250, width: 230, height: 80, color: '#ffffff', strokeWidth: 1, label: 'Task 2' },
      
      { type: 'rect', x: 375, y: 100, width: 250, height: 600, color: '#f3f4f6', strokeWidth: 2, label: 'IN PROGRESS' },
      { type: 'rect', x: 385, y: 160, width: 230, height: 80, color: '#ffffff', strokeWidth: 1, label: 'Task 3' },
      
      { type: 'rect', x: 650, y: 100, width: 250, height: 600, color: '#f3f4f6', strokeWidth: 2, label: 'DONE' },
      { type: 'rect', x: 660, y: 160, width: 230, height: 80, color: '#ffffff', strokeWidth: 1, label: 'Task 4' }
    ]
  },
  {
    id: 'wireframe',
    name: 'Website Wireframe',
    description: 'Basic layout structure with header and sidebar',
    category: 'Wireframe',
    color: 'bg-indigo-100',
    shapes: [
      { type: 'rect', x: 100, y: 100, width: 800, height: 60, color: '#4b5563', strokeWidth: 1, label: 'Navigation Bar' },
      { type: 'rect', x: 100, y: 160, width: 180, height: 540, color: '#d1d5db', strokeWidth: 1, label: 'Sidebar' },
      { type: 'rect', x: 280, y: 160, width: 620, height: 540, color: '#9ca3af', strokeWidth: 2, label: 'Main Content' },
      { type: 'rect', x: 300, y: 220, width: 580, height: 150, color: '#e5e7eb', strokeWidth: 1, label: 'Hero Section' }
    ]
  },
  {
    id: 'flowchart',
    name: 'Process Flowchart',
    description: 'A simple vertical start-to-end flowchart',
    category: 'Flowchart',
    color: 'bg-blue-100',
    shapes: [
      { type: 'circle', x: 500, y: 100, radiusX: 80, radiusY: 30, color: '#3b82f6', strokeWidth: 2, label: 'START' },
      { type: 'line', points: [500, 130, 500, 180], color: '#9ca3af', strokeWidth: 2 },
      { type: 'rect', x: 425, y: 180, width: 150, height: 60, color: '#eab308', strokeWidth: 2, label: 'Step 1' },
      { type: 'line', points: [500, 240, 500, 290], color: '#9ca3af', strokeWidth: 2 },
      { type: 'rect', x: 425, y: 290, width: 150, height: 60, color: '#eab308', strokeWidth: 2, label: 'Step 2' },
      { type: 'line', points: [500, 350, 500, 400], color: '#9ca3af', strokeWidth: 2 },
      { type: 'circle', x: 500, y: 430, radiusX: 80, radiusY: 30, color: '#10b981', strokeWidth: 2, label: 'END' }
    ]
  },
  {
    id: 'mindmap',
    name: 'Mindmap',
    description: 'Brainstorm central ideas naturally',
    category: 'Mindmap',
    color: 'bg-pink-100',
    shapes: [
      { type: 'circle', x: 500, y: 400, radiusX: 70, radiusY: 70, color: '#db2777', strokeWidth: 3, label: 'Main Idea' },
      { type: 'line', points: [500, 330, 500, 200], color: '#9ca3af', strokeWidth: 2 },
      { type: 'circle', x: 500, y: 200, radiusX: 50, radiusY: 50, color: '#f472b6', strokeWidth: 2, label: 'Idea 1' },
      { type: 'line', points: [500, 470, 500, 600], color: '#9ca3af', strokeWidth: 2 },
      { type: 'circle', x: 500, y: 600, radiusX: 50, radiusY: 50, color: '#f472b6', strokeWidth: 2, label: 'Idea 2' }
    ]
  },
  {
    id: 'retro',
    name: 'Retrospective',
    description: 'Post-sprint reflection structure',
    category: 'Retrospective',
    color: 'bg-green-100',
    shapes: [
      { type: 'rect', x: 100, y: 100, width: 250, height: 600, color: '#dcfce7', strokeWidth: 2, label: 'What Went Well' },
      { type: 'rect', x: 110, y: 160, width: 230, height: 80, color: '#ffffff', strokeWidth: 1, label: 'Teamwork' },
      { type: 'rect', x: 375, y: 100, width: 250, height: 600, color: '#fefce8', strokeWidth: 2, label: 'Improvement' },
      { type: 'rect', x: 650, y: 100, width: 250, height: 600, color: '#fef2f2', strokeWidth: 2, label: 'Action Items' }
    ]
  },
  {
    id: 'storymap',
    name: 'User Story Map',
    description: 'Map out epics and stories for features',
    category: 'Analysis',
    color: 'bg-purple-100',
    shapes: [
      { type: 'rect', x: 100, y: 100, width: 250, height: 100, color: '#9333ea', strokeWidth: 2, label: 'Epic 1' },
      { type: 'rect', x: 110, y: 210, width: 230, height: 80, color: '#f3e8ff', strokeWidth: 1, label: 'Story A' },
      { type: 'rect', x: 375, y: 100, width: 250, height: 100, color: '#9333ea', strokeWidth: 2, label: 'Epic 2' }
    ]
  },
  {
    id: 'swot',
    name: 'SWOT Analysis',
    description: 'Evaluate Strengths, Weaknesses, Opportunities, and Threats',
    category: 'Analysis',
    color: 'bg-orange-100',
    shapes: [
      { type: 'rect', x: 100, y: 100, width: 400, height: 300, color: '#dcfce7', strokeWidth: 2, label: 'Strengths' },
      { type: 'rect', x: 500, y: 100, width: 400, height: 300, color: '#fef2f2', strokeWidth: 2, label: 'Weaknesses' },
      { type: 'rect', x: 100, y: 400, width: 400, height: 300, color: '#eff6ff', strokeWidth: 2, label: 'Opportunities' },
      { type: 'rect', x: 500, y: 400, width: 400, height: 300, color: '#fff7ed', strokeWidth: 2, label: 'Threats' }
    ]
  },
  {
    id: 'standup',
    name: 'Daily Standup',
    description: 'Stay synced with your team daily',
    category: 'Analysis',
    color: 'bg-cyan-100',
    shapes: [
      { type: 'rect', x: 100, y: 100, width: 250, height: 600, color: '#f3f4f6', strokeWidth: 2, label: 'Yesterday' },
      { type: 'rect', x: 375, y: 100, width: 250, height: 600, color: '#f3f4f6', strokeWidth: 2, label: 'Today' },
      { type: 'rect', x: 650, y: 100, width: 250, height: 600, color: '#fef2f2', strokeWidth: 2, label: 'Blockers' }
    ]
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start fresh without any presets',
    category: 'Blank',
    color: 'bg-gray-100',
    shapes: []
  }
];
