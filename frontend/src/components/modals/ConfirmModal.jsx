import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-4 text-red-500">
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
            <AlertTriangle size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            {title}
          </h3>
        </div>
        
        <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
          {message}
        </p>
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark: hover:bg-slate-700 transition"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-500/30 transition"
          >
            Sim, apagar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;