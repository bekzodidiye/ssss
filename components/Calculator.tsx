
import React, { useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { X, Minus, Plus, Divide, Hash, Delete } from 'lucide-react';
import { t, Language } from '../translations';

interface CalculatorProps {
  onClose: () => void;
  language: Language;
}

const Calculator: React.FC<CalculatorProps> = ({ onClose, language }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const dragControls = useDragControls();

  const handleNumber = (num: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    if (display === 'Error') return;
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    if (!equation || display === 'Error') return;
    try {
      const parts = equation.split(' ');
      const num1 = parseFloat(parts[0]);
      const op = parts[1];
      const num2 = parseFloat(display);
      
      if (isNaN(num1) || isNaN(num2)) return;

      let result = 0;
      switch (op) {
        case '+': result = num1 + num2; break;
        case '-': result = num1 - num2; break;
        case '*': result = num1 * num2; break;
        case '/': 
          if (num2 === 0) {
            setDisplay('Error');
            return;
          }
          result = num1 / num2; 
          break;
      }
      
      const finalResult = Number(result.toFixed(8)).toString();
      setDisplay(finalResult);
      setEquation('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  const handleDelete = () => {
    if (display === 'Error' || display.length === 1) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      
      if (/[0-9.]/.test(key)) {
        handleNumber(key);
      } else if (['+', '-', '*', '/'].includes(key)) {
        handleOperator(key);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault(); // Prevent form submission if inside a form
        calculate();
      } else if (key === 'Backspace') {
        handleDelete();
      } else if (key === 'Escape') {
        clear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [display, equation]); // Dependencies are important here so state is fresh

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragListener={false}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed top-24 right-8 z-[2000] w-72 theme-blue-box backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
    >
      <div 
        className="p-4 bg-brand-gold/10 border-b border-white/5 flex items-center justify-between cursor-move"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="w-6 h-6 bg-brand-gold/20 rounded-lg flex items-center justify-center">
            <Hash className="w-3 h-3 text-brand-gold" />
          </div>
          <span className="text-[10px] font-black text-brand-gold uppercase tracking-widest">{t(language, 'calculator')}</span>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-brand-gold transition-colors cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6">
        <div className="mb-6 text-right bg-black/20 p-4 rounded-2xl border border-white/5">
          <div className="text-[10px] font-bold text-white/50 h-4 mb-1 font-mono">{equation}</div>
          <div className="text-3xl font-black text-white tracking-tighter truncate font-mono">{display}</div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button onClick={clear} className="p-4 bg-red-500/10 text-red-500 rounded-2xl font-black text-xs hover:bg-red-500/20 transition-all uppercase cursor-pointer">C</button>
          <button onClick={handleDelete} className="p-4 bg-white/5 text-white/80 rounded-2xl font-black text-xs hover:bg-white/10 transition-all cursor-pointer"><Delete className="w-4 h-4 mx-auto" /></button>
          <button onClick={() => handleOperator('/')} className="p-4 bg-white/5 text-brand-gold rounded-2xl font-black text-xs hover:bg-white/10 transition-all cursor-pointer"><Divide className="w-4 h-4 mx-auto" /></button>
          <button onClick={() => handleOperator('*')} className="p-4 bg-white/5 text-brand-gold rounded-2xl font-black text-xs hover:bg-white/10 transition-all cursor-pointer"><X className="w-4 h-4 mx-auto" /></button>

          {[7, 8, 9].map(n => (
            <button key={n} onClick={() => handleNumber(n.toString())} className="p-4 bg-white/5 text-white rounded-2xl font-black text-sm hover:bg-white/10 transition-all cursor-pointer">{n}</button>
          ))}
          <button onClick={() => handleOperator('-')} className="p-4 bg-white/5 text-brand-gold rounded-2xl font-black text-xs hover:bg-white/10 transition-all cursor-pointer"><Minus className="w-4 h-4 mx-auto" /></button>

          {[4, 5, 6].map(n => (
            <button key={n} onClick={() => handleNumber(n.toString())} className="p-4 bg-white/5 text-white rounded-2xl font-black text-sm hover:bg-white/10 transition-all cursor-pointer">{n}</button>
          ))}
          <button onClick={() => handleOperator('+')} className="p-4 bg-white/5 text-brand-gold rounded-2xl font-black text-xs hover:bg-white/10 transition-all cursor-pointer"><Plus className="w-4 h-4 mx-auto" /></button>

          {[1, 2, 3].map(n => (
            <button key={n} onClick={() => handleNumber(n.toString())} className="p-4 bg-white/5 text-white rounded-2xl font-black text-sm hover:bg-white/10 transition-all cursor-pointer">{n}</button>
          ))}
          <button onClick={calculate} className="row-span-2 p-4 bg-brand-gold text-brand-black rounded-2xl font-black text-sm hover:scale-105 transition-all cursor-pointer">=</button>

          <button onClick={() => handleNumber('0')} className="col-span-2 p-4 bg-white/5 text-white rounded-2xl font-black text-sm hover:bg-white/10 transition-all cursor-pointer">0</button>
          <button onClick={() => handleNumber('.')} className="p-4 bg-white/5 text-white rounded-2xl font-black text-sm hover:bg-white/10 transition-all cursor-pointer">.</button>
        </div>
      </div>
    </motion.div>
  );
};

export default Calculator;
