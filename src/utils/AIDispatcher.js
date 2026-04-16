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
      default:
        console.warn('Unknown AI intent:', intent);
    }
  }, 'local');
}
