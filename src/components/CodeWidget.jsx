import React, { useState, useEffect, useRef } from 'react';
import { Group, Rect, Text } from 'react-konva';
import { Html } from 'react-konva-utils';
import { X, Code, Copy, Check } from 'lucide-react';
import * as Y from 'yjs';

export default function CodeWidget({ id, shapeMap, onDelete }) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);
  
  const x = shapeMap.get('x') || 0;
  const y = shapeMap.get('y') || 0;
  const width = shapeMap.get('width') || 400;
  const height = shapeMap.get('height') || 300;

  useEffect(() => {
    if (!shapeMap) return;

    const yText = shapeMap.get('code');
    if (yText instanceof Y.Text) {
      setCode(yText.toString());
      
      const observeText = () => {
        setCode(yText.toString());
      };
      yText.observe(observeText);

      const observeMap = () => {
        setLanguage(shapeMap.get('language') || 'javascript');
      };
      shapeMap.observe(observeMap);
      observeMap();

      return () => {
        yText.unobserve(observeText);
        shapeMap.unobserve(observeMap);
      };
    }
  }, [shapeMap]);

  const handleInput = (e) => {
    const val = e.target.value;
    const yText = shapeMap.get('code');
    if (yText instanceof Y.Text) {
      const oldText = yText.toString();
      // Simple diff-based update for Y.Text
      shapeMap.doc.transact(() => {
        if (val !== oldText) {
          yText.delete(0, oldText.length);
          yText.insert(0, val);
        }
      }, 'local');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Group x={x} y={y} draggable onDragEnd={(e) => {
        shapeMap.doc.transact(() => {
            shapeMap.set('x', e.target.x());
            shapeMap.set('y', e.target.y());
        }, 'local');
    }}>
      <Rect
        width={width}
        height={height}
        fill="#1e1e1e"
        cornerRadius={12}
        shadowBlur={20}
        shadowOpacity={0.3}
        shadowOffset={{ x: 0, y: 10 }}
      />
      
      <Html divProps={{ style: { width, height, pointerEvents: 'none' } }}>
        <div className="flex flex-col w-full h-full text-white font-sans overflow-hidden rounded-xl border border-white/10">
          <div className="h-10 flex items-center justify-between px-4 bg-[#2d2d2d] pointer-events-auto">
            <div className="flex items-center gap-2">
              <Code size={14} className="text-blue-400" />
              <select 
                value={language} 
                onChange={(e) => {
                    const l = e.target.value;
                    shapeMap.doc.transact(() => shapeMap.set('language', l), 'local');
                }}
                className="bg-transparent text-[11px] font-bold text-gray-400 uppercase tracking-wider border-none outline-none cursor-pointer hover:text-white transition"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCopy}
                className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
              <button 
                onClick={() => onDelete(id)}
                className="p-1.5 hover:bg-red-500/20 rounded-md text-gray-400 hover:text-red-400 transition"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 relative bg-[#1e1e1e] pointer-events-auto">
            <textarea
              ref={textareaRef}
              className="w-full h-full bg-transparent text-[#d4d4d4] p-4 font-mono text-xs resize-none outline-none border-none scrollbar-hide"
              value={code}
              onInput={handleInput}
              spellCheck={false}
              placeholder="// Paste or write code here..."
            />
          </div>
        </div>
      </Html>
    </Group>
  );
}
