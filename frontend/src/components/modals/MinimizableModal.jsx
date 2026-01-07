import React, { useState, useEffect } from 'react';
import { Minimize2, Maximize2, X } from 'lucide-react';

const MinimizableModal = ({ isOpen, onClose, title, icon: Icon, children }) => {
  // Inicializa o estado lendo do localStorage
  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem('atlas_modal_minimized') === 'true';
  });

  // Sempre que o estado mudar, salva no localStorage
  useEffect(() => {
    localStorage.setItem('atlas_modal_minimized', isMinimized);
  }, [isMinimized]);

  if (!isOpen) return null;

  const expandedClass = "fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200";
  const expandedCardClass = "bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]";

  const minimizedClass = "fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-10 duration-300";
  const minimizedCardClass = "bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-80 border border-slate-200 dark:border-slate-700 overflow-hidden";

  return (
    <div className={isMinimized ? minimizedClass : expandedClass}>
      <div className={isMinimized ? minimizedCardClass : expandedCardClass}>
        <div 
          className="bg-blue-600 p-4 text-white flex justify-between items-center cursor-pointer select-none"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {Icon && <Icon className="text-blue-200 shrink-0" size={20} />}
            <h2 className="font-bold truncate text-sm">
              {title}
            </h2>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
              className="p-1 hover:bg-blue-500 rounded text-blue-100 transition"
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }} 
              className="p-1 hover:bg-red-500 rounded text-blue-100 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default MinimizableModal;