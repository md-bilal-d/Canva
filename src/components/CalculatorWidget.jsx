import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Delete, RotateCcw, X, Hash } from 'lucide-react';

export default function CalculatorWidget({ shapeId, ydoc }) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  useEffect(() => {
    if (!ydoc) return;
    const yCalculators = ydoc.getMap('calculators');
    
    const updateHandler = () => {
      const data = yCalculators.get(shapeId);
      if (data) {
        setDisplay(data.display || '0');
        setEquation(data.equation || '');
      }
    };

    yCalculators.observeDeep(updateHandler);
    updateHandler();

    return () => yCalculators.unobserveDeep(updateHandler);
  }, [ydoc, shapeId]);

  const updateYjs = (newDisplay, newEquation) => {
    const yCalculators = ydoc.getMap('calculators');
    ydoc.transact(() => {
      yCalculators.set(shapeId, { display: newDisplay, equation: newEquation });
    }, 'local');
  };

  const handleInput = (val) => {
    let nextDisplay = display;
    let nextEquation = equation;

    if (val === 'C') {
      nextDisplay = '0';
      nextEquation = '';
    } else if (val === '=') {
      try {
        // eslint-disable-next-line no-eval
        const result = eval(equation + display);
        nextDisplay = String(result);
        nextEquation = '';
      } catch (e) {
        nextDisplay = 'Error';
        nextEquation = '';
      }
    } else if (['+', '-', '*', '/'].includes(val)) {
      nextEquation = display + ' ' + val + ' ';
      nextDisplay = '0';
    } else {
      nextDisplay = display === '0' ? val : display + val;
    }

    updateYjs(nextDisplay, nextEquation);
  };

  const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '=', '+',
    'C'
  ];

  return (
    <div className="w-full h-full bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden font-mono p-4 select-none">
      <div className="flex items-center gap-2 mb-4 px-2 border-b border-slate-800 pb-2">
        <Calculator size={16} className="text-indigo-400" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Shared Calculator</span>
      </div>

      <div className="bg-slate-800/50 rounded-2xl p-4 mb-4 text-right overflow-hidden">
        <div className="text-[10px] text-slate-500 h-4 mb-1 truncate">{equation}</div>
        <div className="text-2xl text-white font-bold truncate">{display}</div>
      </div>

      <div className="grid grid-cols-4 gap-2 flex-1">
        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() => handleInput(btn)}
            className={`flex items-center justify-center rounded-xl font-bold transition-all ${
              btn === '=' 
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 col-span-1' 
                : btn === 'C'
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}
