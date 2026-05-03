// utility to handle inserting templates into Yjs given natural language or intent

/**
 * Creates a shape based on an AI prompt request.
 */
export function insertDesignFromAI(ydoc, currentViewPos, scale, intent, params) {
  const yShapes = ydoc.getMap('shapes');
  const yNotes = ydoc.getMap('stickyNotes');
  
  if (!yShapes || !yNotes) return;

  const centerX = currentViewPos.x;
  const centerY = currentViewPos.y;

  ydoc.transact(() => {
    switch (intent) {
      case 'mindmap': {
          // Create core node
          const coreId = 'shape-' + Date.now() + '1';
          yShapes.set(coreId, {
              id: coreId,
              type: 'circle',
              x: centerX,
              y: centerY,
              radiusX: 80,
              radiusY: 50,
              color: '#3b82f6',
              strokeWidth: 2,
              label: params.topic || 'Core Idea'
          });

          // Create branches
          const branches = params.branches || ['Branch 1', 'Branch 2', 'Branch 3'];
          branches.forEach((branch, index) => {
              const angle = (index / branches.length) * Math.PI * 2;
              const dist = 200;
              const bx = centerX + Math.cos(angle) * dist;
              const by = centerY + Math.sin(angle) * dist;
              
              const branchId = 'shape-' + Date.now() + 'branch' + index;
              yShapes.set(branchId, {
                  id: branchId,
                  type: 'rect',
                  x: bx - 60,
                  y: by - 30,
                  width: 120,
                  height: 60,
                  color: '#10b981',
                  strokeWidth: 2,
                  label: branch
              });
          });
          break;
      }
      case 'flowchart': {
          let currentY = centerY - 200;
          const steps = params.steps || ['Start', 'Process', 'End'];
          
          steps.forEach((step, index) => {
              const id = 'shape-' + Date.now() + 'flow' + index;
              yShapes.set(id, {
                  id,
                  type: index === 0 || index === steps.length - 1 ? 'circle' : 'rect',
                  x: index === 0 || index === steps.length - 1 ? centerX : centerX - 75,
                  y: currentY,
                  radiusX: 75,
                  radiusY: 40,
                  width: 150,
                  height: 80,
                  color: index === 0 ? '#10b981' : index === steps.length - 1 ? '#ef4444' : '#6366f1',
                  strokeWidth: 2,
                  label: step
              });
              currentY += 160;
          });
          break;
      }
      case 'moodboard': {
          // Just place a few colorful notes around
          const colors = ['#fef08a', '#fda4af', '#93c5fd', '#86efac'];
          for(let i = 0; i < 4; i++) {
              const id = 'note-' + Date.now() + 'mood' + i;
              const noteMap = new window.Y.Map(); // Assuming Y is available globally or we pass it
              // Yjs imports can be tricky here, better to pass map
              noteMap.set('id', id);
              noteMap.set('x', centerX - 250 + (i % 2) * 250);
              noteMap.set('y', centerY - 200 + Math.floor(i / 2) * 200);
              noteMap.set('backgroundColor', colors[i % colors.length]);
              const yText = new window.Y.Text();
              yText.insert(0, params.keywords ? params.keywords[i % params.keywords.length] : 'Mood Idea');
              noteMap.set('textContent', yText);
              yNotes.set(id, noteMap);
          }
          break;
      }
      case 'clear': {
          yShapes.clear();
          yNotes.clear();
          break;
      }
      case 'smartAlign': {
          // Align all shapes in a grid based on their current average position
          const shapes = [];
          yShapes.forEach((val, key) => shapes.push({ id: key, ...val }));
          if (shapes.length === 0) break;

          const cols = Math.ceil(Math.sqrt(shapes.length));
          const spacing = 250;
          const startX = centerX - (cols * spacing) / 2;
          const startY = centerY - (Math.ceil(shapes.length / cols) * spacing) / 2;

          shapes.sort((a, b) => (a.x + a.y) - (b.x + b.y)).forEach((shape, i) => {
              const row = Math.floor(i / cols);
              const col = i % cols;
              yShapes.set(shape.id, {
                  ...shape,
                  x: startX + col * spacing,
                  y: startY + row * spacing
              });
          });
          break;
      }
      case 'clusterStickyNotes': {
          // Group sticky notes by their background color or content similarity (mock)
          const notes = [];
          yNotes.forEach((val, key) => notes.push({ id: key, map: val }));
          if (notes.length === 0) break;

          const groups = {};
          notes.forEach(note => {
              const color = note.map.get('backgroundColor') || 'default';
              if (!groups[color]) groups[color] = [];
              groups[color].push(note);
          });

          let groupIndex = 0;
          Object.values(groups).forEach(group => {
              const startX = centerX - 400 + (groupIndex % 2) * 450;
              const startY = centerY - 300 + Math.floor(groupIndex / 2) * 350;
              
              group.forEach((note, i) => {
                  note.map.set('x', startX + (i % 3) * 210);
                  note.map.set('y', startY + Math.floor(i / 3) * 160);
              });
              groupIndex++;
          });
          break;
      }
      case 'clusterByContent': {
          // Intelligently group sticky notes by their text content keywords
          const notes = [];
          yNotes.forEach((val, key) => notes.push({ id: key, map: val, text: val.get('textContent').toString().toLowerCase() }));
          if (notes.length === 0) break;

          const topics = {
            'design': ['ux', 'ui', 'color', 'font', 'layout', 'style', 'brand', 'mockup'],
            'dev': ['code', 'api', 'bug', 'fix', 'feat', 'git', 'deploy', 'react', 'node'],
            'biz': ['cost', 'price', 'market', 'user', 'growth', 'sales', 'revenue'],
            'misc': []
          };

          const groups = { design: [], dev: [], biz: [], misc: [] };
          notes.forEach(note => {
              let assigned = false;
              for (const [topic, keywords] of Object.entries(topics)) {
                  if (keywords.some(k => note.text.includes(k))) {
                      groups[topic].push(note);
                      assigned = true;
                      break;
                  }
              }
              if (!assigned) groups.misc.push(note);
          });

          let groupIndex = 0;
          const activeGroups = Object.entries(groups).filter(([_, items]) => items.length > 0);
          
          activeGroups.forEach(([topic, items]) => {
              const startX = centerX - (activeGroups.length * 200) + (groupIndex * 450);
              const startY = centerY - 100;
              
              // Draw a "Zone" label
              const zoneId = 'shape-zone-' + topic + '-' + Date.now();
              yShapes.set(zoneId, {
                  id: zoneId,
                  type: 'rect',
                  x: startX - 20,
                  y: startY - 60,
                  width: 420,
                  height: 400,
                  color: 'rgba(99, 102, 241, 0.05)',
                  strokeWidth: 1,
                  label: `ZONE: ${topic.toUpperCase()}`,
                  isLocked: true
              });

              items.forEach((note, i) => {
                  note.map.set('x', startX + (i % 2) * 210);
                  note.map.set('y', startY + Math.floor(i / 2) * 160);
              });
              groupIndex++;
          });
          break;
      }
      case 'image': {
          const id = 'shape-' + Date.now();
          yShapes.set(id, {
              id,
              type: 'image',
              src: params.src,
              x: centerX - 200,
              y: centerY - 150,
              width: 400,
              height: 300,
              prompt: params.prompt
          });
          break;
      }
      case 'summarize': {
          const shapes = [];
          yShapes.forEach((val, key) => shapes.push(val));
          const notes = [];
          yNotes.forEach((val, key) => notes.push(val.get('textContent').toString()));
          
          const summaryId = 'note-' + Date.now() + '-summary';
          const summaryNote = new window.Y.Map();
          summaryNote.set('id', summaryId);
          summaryNote.set('x', centerX - 200);
          summaryNote.set('y', centerY - 150);
          summaryNote.set('backgroundColor', '#e0e7ff'); // Indigo background for AI summary
          const summaryText = new window.Y.Text();
          
          let contentStr = `🤖 AI BOARD SUMMARY\n\n`;
          contentStr += `Elements: ${shapes.length} shapes, ${notes.length} notes.\n`;
          if (notes.length > 0) {
              contentStr += `\nKey Notes:\n- ${notes.slice(0, 3).join('\n- ')}`;
          }
          contentStr += `\n\nInsights: The board appears to focus on ${params.prompt || 'creative brainstorming'}. Recommended next steps: Detail branch paths and establish priority vectors.`;
          
          summaryText.insert(0, contentStr);
          summaryNote.set('textContent', summaryText);
          yNotes.set(summaryId, summaryNote);
          break;
      }
      case 'expand': {
          // Find an image on the board to "expand"
          let targetId = null;
          yShapes.forEach((val, key) => {
              if (val.type === 'image') targetId = key;
          });

          if (targetId) {
              const existing = yShapes.get(targetId);
              yShapes.set(targetId, {
                  ...existing,
                  width: existing.width * 1.5,
                  height: existing.height * 1.5,
                  prompt: `Expanded: ${params.prompt || existing.prompt}`
              });
          }
          break;
      }
      case 'outpaint': {
          let targetId = params.targetId;
          if (!targetId) {
             yShapes.forEach((val, key) => {
                 if (val.type === 'image') targetId = key;
             });
          }

          if (targetId) {
              const existing = yShapes.get(targetId);
              const newWidth = existing.width * 1.5;
              const newHeight = existing.height * 1.5;
              const newX = existing.x - (newWidth - existing.width) / 2;
              const newY = existing.y - (newHeight - existing.height) / 2;

              const outpaintId = 'shape-' + Date.now() + '-outpaint';
              yShapes.set(outpaintId, {
                  id: outpaintId,
                  type: 'image',
                  src: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=${Math.round(newWidth)}&h=${Math.round(newHeight)}&auto=format&fit=crop`,
                  x: newX,
                  y: newY,
                  width: newWidth,
                  height: newHeight,
                  prompt: `Outpainted: ${params.prompt || existing.prompt || 'background'}`
              });
              
              yShapes.delete(targetId);
              yShapes.set(targetId, existing);
          }
          break;
      }
      case 'vibe': {
          const yBrand = ydoc.getMap('brandKit');
          const vibes = {
              'cyberpunk': ['#00f2ff', '#ff00ff', '#1e1b4b'],
              'minimalist': ['#f8fafc', '#1e293b', '#64748b'],
              'retro 80s': ['#ff71ce', '#01cdfe', '#05ffa1'],
              'nature': ['#10b981', '#064e3b', '#fef3c7'],
              'corporate': ['#2563eb', '#1e40af', '#f1f5f9']
          };
          const selectedVibe = vibes[params.prompt.toLowerCase()] || vibes['minimalist'];
          yBrand.set('colors', selectedVibe);
          break;
      }
      case 'applyBrandKit': {
          const yBrand = ydoc.getMap('brandKit');
          const colors = yBrand.get('colors') || ['#6366f1', '#ec4899', '#f59e0b'];
          
          yShapes.forEach((val, key) => {
              // Apply colors to shapes (circles, rects, etc.)
              if (val.type === 'rect' || val.type === 'circle') {
                  yShapes.set(key, {
                      ...val,
                      color: colors[Math.floor(Math.random() * colors.length)]
                  });
              }
          });
          
          yNotes.forEach((val, key) => {
              val.set('backgroundColor', colors[Math.floor(Math.random() * colors.length)]);
          });
          break;
      }
      default:
        console.warn('Unknown AI intent:', intent);
    }
  }, 'local');
}
