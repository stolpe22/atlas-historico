import React from 'react';
import { Monitor, Square } from 'lucide-react';

const PopulateIndicator = ({ lastLog, onMaximize, onStop }) => {
  return (
    <div className="absolute bottom-6 right-6 z-[2000] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs py-2 px-3 rounded-lg shadow-2xl border border-slate-700 flex flex-col gap-2 min-w-[300px] max-w-[350px]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
          <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider">
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-400 border-t-transparent" />
            Extraindo Dados
          </div>
          <div className="flex gap-1">
            <button 
              onClick={onMaximize} 
              title="Maximizar" 
              className="p-1 hover:bg-slate-700 rounded"
            >
              <Monitor size={14} />
            </button>
            <button 
              onClick={onStop} 
              title="Parar" 
              className="p-1 hover:bg-red-900/50 text-red-400 rounded"
            >
              <Square size={14} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Last Log */}
        <div className="font-mono text-slate-300 truncate">
          {lastLog || "Aguardando resposta..."}
        </div>
      </div>
    </div>
  );
};

export default PopulateIndicator;