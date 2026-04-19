import React, { useState } from 'react';
import { Code, Copy, Check, X } from 'lucide-react';

export default function CodeExportPanel({ isOpen, onClose, selectedShapes }) {
  const [copied, setCopied] = useState(false);

  const generateCode = () => {
    if (selectedShapes.length === 0) return "// Select some shapes to generate code";

    let code = "const DesignSystem = () => (\n  <div className=\"relative w-full h-[600px] border rounded-xl overflow-hidden bg-white\">\n";
    
    selectedShapes.forEach(shape => {
      const color = shape.color || '#6366f1';
      const label = shape.label || '';
      
      if (shape.type === 'rect') {
        code += `    <div \n      className=\"absolute border-2\" \n      style={{ \n        left: '${shape.x}px', \n        top: '${shape.y}px', \n        width: '${shape.width}px', \n        height: '${shape.height}px', \n        borderColor: '${color}',\n        backgroundColor: '${color}10'\n      }} \n    >\n      <span className=\"text-xs p-1\">${label}</span>\n    </div>\n`;
      } else if (shape.type === 'circle') {
        code += `    <div \n      className=\"absolute border-2 rounded-full\" \n      style={{ \n        left: '${shape.x - shape.radiusX}px', \n        top: '${shape.y - shape.radiusY}px', \n        width: '${shape.radiusX * 2}px', \n        height: '${shape.radiusY * 2}px', \n        borderColor: '${color}',\n        backgroundColor: '${color}10'\n      }} \n    />\n`;
      }
    });

    code += "  </div>\n);";
    return code;
  };

  const code = generateCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-24 left-6 w-96 bg-gray-900 border border-gray-700 rounded-2xl shadow-3xl z-[100] flex flex-col overflow-hidden animate-in slide-in-from-left-8 duration-500">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
        <h3 className="text-white font-bold flex items-center gap-2 text-sm">
          <Code size={18} className="text-blue-400" />
          Export to React + Tailwind
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-full text-gray-400">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 bg-gray-950 font-mono text-xs text-blue-300 overflow-auto max-h-[400px]">
        <pre>{code}</pre>
      </div>

      <div className="p-4 bg-gray-800 border-t border-gray-700 flex gap-2">
        <button 
          onClick={handleCopy}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy Snippet"}
        </button>
      </div>
    </div>
  );
}
