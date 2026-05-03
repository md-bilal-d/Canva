import React, { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, X, AlertCircle, Play } from 'lucide-react';

export default function AutomationPanel({ isOpen, onClose, ydoc, shapes }) {
  const [automations, setAutomations] = useState([]);
  const [newRule, setNewRule] = useState({
    trigger: 'enter_region',
    shapeType: 'rect',
    action: 'change_color',
    value: '#ef4444'
  });

  const yAuto = ydoc?.getMap('automations');

  useEffect(() => {
    if (!yAuto) return;
    const observe = () => {
      const list = [];
      yAuto.forEach((val, key) => list.push(val));
      setAutomations(list);
    };
    yAuto.observe(observe);
    observe();
    return () => yAuto.unobserve(observe);
  }, [yAuto]);

  if (!isOpen) return null;

  const handleAddRule = () => {
    const id = 'rule-' + Date.now();
    const rule = { id, ...newRule, active: true };
    yAuto.set(id, rule);
  };

  const handleDeleteRule = (id) => {
    yAuto.delete(id);
  };

  return (
    <div className="absolute left-6 top-24 w-80 bg-white/95 backdrop-blur-xl border border-indigo-100 rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden animate-in slide-in-from-left-8 duration-300">
      <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-600 flex justify-between items-center">
        <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
          <Zap size={16} fill="white" />
          Workflow Automations
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-white transition">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-800 leading-tight">
                Create rules to automate your board. Rules run in real-time as collaborators move objects.
            </p>
        </div>

        {/* New Rule Form */}
        <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Trigger</label>
                <select 
                    className="text-xs p-2 rounded-lg border border-gray-200"
                    value={newRule.trigger}
                    onChange={e => setNewRule({...newRule, trigger: e.target.value})}
                >
                    <option value="enter_region">Object enters region</option>
                    <option value="color_change">Color is changed to...</option>
                    <option value="label_contains">Label contains text...</option>
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Action</label>
                <select 
                    className="text-xs p-2 rounded-lg border border-gray-200"
                    value={newRule.action}
                    onChange={e => setNewRule({...newRule, action: e.target.value})}
                >
                    <option value="change_color">Change color to...</option>
                    <option value="lock_object">Lock the object</option>
                    <option value="notify_all">Notify all collaborators</option>
                </select>
            </div>

            <button 
                onClick={handleAddRule}
                className="w-full py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition shadow-md flex items-center justify-center gap-2"
            >
                <Plus size={14} /> Add Automation
            </button>
        </div>

        {/* Rules List */}
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Rules ({automations.length})</span>
            {automations.map(rule => (
                <div key={rule.id} className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm flex justify-between items-center group">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-[11px] font-bold text-gray-700">{rule.trigger.replace('_', ' ')}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">Action: {rule.action.replace('_', ' ')}</span>
                    </div>
                    <button 
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            {automations.length === 0 && (
                <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-xl">
                    <span className="text-[10px] text-gray-300 font-medium">No rules active</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
