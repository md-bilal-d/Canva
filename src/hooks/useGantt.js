import { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';

const DEFAULT_TASKS = [
  { id: 'task-1', name: 'Market Research', start: new Date().toISOString(), end: new Date(Date.now() + 86400000 * 2).toISOString(), progress: 60, color: '#6366f1' },
  { id: 'task-2', name: 'UI/UX Design', start: new Date(Date.now() + 86400000 * 1).toISOString(), end: new Date(Date.now() + 86400000 * 4).toISOString(), progress: 30, color: '#ec4899' },
  { id: 'task-3', name: 'Frontend Dev', start: new Date(Date.now() + 86400000 * 3).toISOString(), end: new Date(Date.now() + 86400000 * 7).toISOString(), progress: 10, color: '#10b981' },
];

export default function useGantt(ydoc, shapeId) {
  const [tasks, setTasks] = useState([]);
  const yGanttRef = useRef(null);

  useEffect(() => {
    if (!ydoc || !shapeId) return;

    // Use a unique key for each Gantt widget's data
    const yGantt = ydoc.getMap(`gantt-${shapeId}`);
    yGanttRef.current = yGantt;

    // Initialize default tasks if empty
    if (!yGantt.has('tasks')) {
      ydoc.transact(() => {
        const yTasks = new Y.Array();
        DEFAULT_TASKS.forEach((task) => yTasks.push([task]));
        yGantt.set('tasks', yTasks);
      }, 'local');
    }

    const observe = () => {
      const yTasks = yGantt.get('tasks');
      if (yTasks && typeof yTasks.toArray === 'function') {
        setTasks(yTasks.toArray());
      }
    };

    yGantt.observeDeep(observe);
    observe();

    return () => {
      yGantt.unobserveDeep(observe);
    };
  }, [ydoc, shapeId]);

  const addTask = useCallback((taskData = {}) => {
    const yGantt = yGanttRef.current;
    if (!yGantt) return;

    const id = 'task-' + Date.now();
    const newTask = {
      id,
      name: taskData.name || 'New Task',
      start: taskData.start || new Date().toISOString(),
      end: taskData.end || new Date(Date.now() + 86400000 * 2).toISOString(),
      progress: taskData.progress || 0,
      color: taskData.color || '#6366f1',
    };

    yGantt.doc.transact(() => {
      const yTasks = yGantt.get('tasks');
      yTasks.push([newTask]);
    }, 'local');

    return id;
  }, []);

  const updateTask = useCallback((taskId, updates) => {
    const yGantt = yGanttRef.current;
    if (!yGantt) return;

    yGantt.doc.transact(() => {
      const yTasks = yGantt.get('tasks');
      const items = yTasks.toArray();
      const idx = items.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        yTasks.delete(idx, 1);
        yTasks.insert(idx, [{ ...items[idx], ...updates }]);
      }
    }, 'local');
  }, []);

  const deleteTask = useCallback((taskId) => {
    const yGantt = yGanttRef.current;
    if (!yGantt) return;

    yGantt.doc.transact(() => {
      const yTasks = yGantt.get('tasks');
      const items = yTasks.toArray();
      const idx = items.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        yTasks.delete(idx, 1);
      }
    }, 'local');
  }, []);

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
  };
}
