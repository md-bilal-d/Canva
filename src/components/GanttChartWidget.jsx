import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Calendar, ChevronLeft, ChevronRight, Settings, X, Edit3, Check, BarChart2 } from 'lucide-react';
import useGantt from '../hooks/useGantt';

export default function GanttChartWidget({ shapeId, ydoc }) {
  const { tasks, addTask, updateTask, deleteTask } = useGantt(ydoc, shapeId);
  const [viewMode, setViewMode] = useState('days'); // 'days' or 'weeks'
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Timeline configuration
  const startDate = useMemo(() => {
    if (tasks.length === 0) return new Date();
    return new Date(Math.min(...tasks.map(t => new Date(t.start))));
  }, [tasks]);

  const daysToShow = 21;
  const timelineDates = useMemo(() => {
    const dates = [];
    const start = new Date(startDate);
    start.setDate(start.getDate() - 2); // Buffer
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [startDate]);

  const getTaskStyle = (task) => {
    const start = new Date(task.start);
    const end = new Date(task.end);
    const timelineStart = timelineDates[0];
    
    const diffStart = (start - timelineStart) / (1000 * 60 * 60 * 24);
    const duration = (end - start) / (1000 * 60 * 60 * 24);
    
    return {
      left: `${(diffStart / daysToShow) * 100}%`,
      width: `${(duration / daysToShow) * 100}%`,
      backgroundColor: task.color || '#6366f1'
    };
  };

  const handleEditTask = (task) => {
    setEditingTaskId(task.id);
    setEditForm({ ...task });
  };

  const saveEdit = () => {
    updateTask(editingTaskId, editForm);
    setEditingTaskId(null);
  };

  return (
    <div 
      className="w-full h-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden font-sans"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-600 to-indigo-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
            <BarChart2 size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-tight uppercase">Gantt Timeline</h3>
            <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">Collaborative Planning</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => addTask()}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition backdrop-blur-md"
                title="Add Task"
            >
                <Plus size={18} />
            </button>
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-gray-200 rounded-lg transition text-gray-400">
            <ChevronLeft size={16} />
          </button>
          <span className="text-[11px] font-black text-gray-500 uppercase px-2 tracking-tighter">
            {timelineDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {timelineDates[timelineDates.length-1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <button className="p-1.5 hover:bg-gray-200 rounded-lg transition text-gray-400">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex bg-gray-200/50 p-1 rounded-xl">
           <button 
             onClick={() => setViewMode('days')}
             className={`px-3 py-1 text-[10px] font-bold rounded-lg transition ${viewMode === 'days' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
             Days
           </button>
           <button 
             onClick={() => setViewMode('weeks')}
             className={`px-3 py-1 text-[10px] font-bold rounded-lg transition ${viewMode === 'weeks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
             Weeks
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Task List */}
        <div className="w-48 border-r border-gray-100 flex flex-col shrink-0 bg-white">
          <div className="h-10 border-b border-gray-100 bg-gray-50/30 flex items-center px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Task Name
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {tasks.map(task => (
              <div 
                key={task.id} 
                className={`h-12 border-b border-gray-50 flex items-center px-4 justify-between group transition ${editingTaskId === task.id ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
              >
                <span className="text-[11px] font-bold text-gray-700 truncate mr-2">{task.name}</span>
                <div className="flex opacity-0 group-hover:opacity-100 transition shrink-0 gap-1">
                  <button onClick={() => handleEditTask(task)} className="p-1 text-gray-400 hover:text-indigo-600 transition">
                    <Edit3 size={12} />
                  </button>
                  <button onClick={() => deleteTask(task.id)} className="p-1 text-gray-400 hover:text-red-500 transition">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Timeline Header */}
          <div className="h-10 border-b border-gray-100 flex bg-gray-50/30">
            {timelineDates.map((date, i) => (
              <div 
                key={i} 
                className={`flex-1 flex flex-col items-center justify-center border-r border-gray-50 ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-100/30' : ''}`}
              >
                <span className="text-[8px] font-bold text-gray-400 uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className="text-[10px] font-black text-gray-700">{date.getDate()}</span>
              </div>
            ))}
          </div>

          {/* Grid Rows & Bars */}
          <div className="flex-1 overflow-y-auto relative">
            {/* Background Grid */}
            <div className="absolute inset-0 flex">
              {timelineDates.map((_, i) => (
                <div key={i} className="flex-1 border-r border-gray-50 h-full" />
              ))}
            </div>

            {/* Task Bars */}
            <div className="relative z-10">
              {tasks.map(task => (
                <div key={task.id} className="h-12 border-b border-gray-50 flex items-center relative group">
                  <motion.div 
                    layoutId={`task-${task.id}`}
                    className="absolute h-8 rounded-full shadow-lg flex items-center px-3 group/bar cursor-move"
                    style={getTaskStyle(task)}
                    initial={false}
                  >
                    <span className="text-[9px] font-black text-white truncate drop-shadow-md">
                      {task.progress}%
                    </span>
                    {/* Progress Bar inside */}
                    <div 
                        className="absolute bottom-1 left-3 right-3 h-1 bg-white/30 rounded-full overflow-hidden"
                    >
                        <div 
                            className="h-full bg-white" 
                            style={{ width: `${task.progress}%` }} 
                        />
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task Edit Overlay */}
      <AnimatePresence>
        {editingTaskId && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-x-4 bottom-4 bg-white rounded-2xl shadow-2xl border border-indigo-100 p-4 z-50 flex flex-col gap-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Edit Task</span>
              <button onClick={() => setEditingTaskId(null)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-gray-500">TASK NAME</label>
                <input 
                  type="text" 
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-gray-500">PROGRESS (%)</label>
                <input 
                  type="number" 
                  value={editForm.progress} 
                  min="0" max="100"
                  onChange={e => setEditForm({...editForm, progress: parseInt(e.target.value) || 0})}
                  className="p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-gray-500">START DATE</label>
                <input 
                  type="date" 
                  value={editForm.start?.split('T')[0]} 
                  onChange={e => setEditForm({...editForm, start: new Date(e.target.value).toISOString()})}
                  className="p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-gray-500">END DATE</label>
                <input 
                  type="date" 
                  value={editForm.end?.split('T')[0]} 
                  onChange={e => setEditForm({...editForm, end: new Date(e.target.value).toISOString()})}
                  className="p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <button 
              onClick={saveEdit}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              <Check size={16} /> Save Task Details
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
