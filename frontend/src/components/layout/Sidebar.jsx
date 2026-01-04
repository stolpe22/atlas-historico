import React from 'react';
import { Settings, Database, Play, ChevronRight, Calendar, FileJson } from 'lucide-react';

const Sidebar = ({ 
  events = [], 
  onEventClick, 
  onRunSeed,
  onOpenPopulate,
  onOpenKaggle
}) => {
  return (
    // REMOVIDO: absolute top-0 right-0 z-[500]
    // ADICIONADO: h-full w-80 flex-none (não encolhe nem estica além de 80)
    <aside className="h-full w-80 flex-none bg-white dark:bg-slate-900 shadow-xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-300 z-20">
      
      {/* Header */}
      <div className="flex-none p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            Cronologia
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          {events.length} eventos listados
        </p>
      </div>

      {/* Lista Scrollável */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
        {events.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="mb-2">Nenhum evento aqui.</p>
            <p className="text-xs">Use os botões abaixo para popular.</p>
          </div>
        ) : (
          events.map((evt) => (
            <div 
              key={evt.id}
              onClick={() => onEventClick(evt)}
              className="group bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-lg shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 line-clamp-2">
                  {evt.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                  {evt.year_start}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide truncate max-w-[120px]">
                  {evt.continent || 'Mundo'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex-none p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-2">
        <button 
          onClick={onRunSeed}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold transition"
        >
          <FileJson size={16} className="text-orange-500" />
          Restaurar JSON
        </button>

        <button 
          onClick={onOpenPopulate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition"
        >
          <Database size={16} className="text-purple-500" />
          Gerador
        </button>
        
        <button 
          onClick={onOpenKaggle}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-md shadow-blue-500/20"
        >
          <Play size={16} />
          Importar Kaggle
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;