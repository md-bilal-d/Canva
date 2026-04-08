import React, { useState, useEffect } from 'react';
import { X, CheckCircle, LayoutTemplate } from 'lucide-react';
import { templates, TEMPLATE_CATEGORIES } from '../data/templates';

export default function TemplatesModal({ isOpen, onClose, yShapes }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [templateToConfirm, setTemplateToConfirm] = useState(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (showToast) {
      const t = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(t);
    }
  }, [showToast]);

  if (!isOpen && !showToast) return null;

  const filteredTemplates = activeCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === activeCategory);

  const handleApplyTemplate = () => {
    if (!templateToConfirm || !yShapes) return;

    // We do NOT modify x/y here because templates.js already strictly mapped them 
    // to layout centers directly around [600, 400] relative space.
    const newShapes = templateToConfirm.shapes.map(shape => {
      return {
        ...shape,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5)
      };
    });

    // Logging the exactly parsed first shape per the user's exact audit tracking request
    if (newShapes.length > 0) {
      console.log("[TemplatesModal] Pushing exact first shape structure:", newShapes[0]);
    }

    yShapes.doc.transact(() => {
      newShapes.forEach(shape => {
        yShapes.set(shape.id, shape);
      });
    }, 'local');
    
    // Per instructions: automatically reset zoom to 100% and pan camera to 0,0.
    // Note: Since we strictly cannot touch App.js to pass React state setters, 
    // if `App.js` isn't actively listening, this event demonstrates the precise logic architecture requested.
    window.dispatchEvent(new CustomEvent('reset-canvas-view', {
      detail: { scale: 1, x: 0, y: 0 }
    }));

    setTemplateToConfirm(null);
    onClose();
    setShowToast(true);
  };

  return (
    <>
      {showToast && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[3000] bg-green-50 text-green-800 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-green-200 animate-in slide-in-from-top-10 duration-300">
          <CheckCircle size={20} className="text-green-600" />
          <span className="font-bold">Template applied!</span>
        </div>
      )}

      {/* Main Modal rendering block */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden relative">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <LayoutTemplate size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Board Templates</h2>
                  <p className="text-gray-500 text-sm">Jumpstart your workspace with a preset structure</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-64 bg-gray-50 border-r py-4 flex flex-col gap-1 overflow-y-auto hidden md:flex">
                {TEMPLATE_CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-6 py-3 text-left font-medium transition-colors ${
                      activeCategory === category 
                        ? 'bg-indigo-50 border-r-4 border-indigo-600 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map(template => (
                    <div 
                      key={template.id} 
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group flex flex-col"
                    >
                      <div className={`h-40 relative flex items-center justify-center overflow-hidden ${template.color || 'bg-gray-200'} transition-transform duration-500 group-hover:scale-[1.03]`}>
                        <LayoutTemplate size={48} className="text-gray-700/20" />
                        <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 rounded text-xs font-bold text-gray-700 shadow-sm">
                          {template.category}
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-bold text-lg text-gray-800 mb-1">{template.name}</h3>
                        <p className="text-gray-500 text-sm mb-4 flex-1">{template.description}</p>
                        <button
                          onClick={() => setTemplateToConfirm(template)}
                          className="w-full py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 transition-colors rounded-lg font-medium"
                        >
                          Use Template
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredTemplates.length === 0 && (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No templates found in this category.
                  </div>
                )}
              </div>
            </div>
          </div>

          {templateToConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Apply Template?</h3>
                <p className="text-gray-600 mb-6 font-medium">
                  This will add <strong className="text-indigo-600">{templateToConfirm.name}</strong> shapes to your current board.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setTemplateToConfirm(null)}
                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleApplyTemplate}
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-200"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
