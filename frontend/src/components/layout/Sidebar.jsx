import React, { useState } from 'react';
import { Settings, Database, Play, ChevronRight, Calendar, FileJson, Download, ChevronDown, ChevronUp } from 'lucide-react';

const Sidebar = ({ 
  events = [], 
  onEventClick, 
  onRunSeed, 
  onOpenPopulate,
  onOpenKaggle
}) => {
  // Estado para controlar o menu "Obter Dados"
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);

  return (
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
            <p className="text-xs">Clique em "Obter Dados" abaixo.</p>
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

      {/* Footer: Menu de Importação */}
      <div className="flex-none p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-2">
        
        {/* Botão Principal */}
        <button 
          onClick={() => setIsImportMenuOpen(!isImportMenuOpen)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold transition shadow-sm border ${
            isImportMenuOpen 
              ? 'bg-blue-50 dark:bg-slate-800 border-blue-200 text-blue-600' 
              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Download size={18} />
            Obter Dados
          </div>
          {isImportMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Menu Accordion */}
        {isImportMenuOpen && (
          <div className="space-y-2 animate-in slide-in-from-bottom-2 fade-in duration-200 pt-2 pl-2 border-l-2 border-slate-200 dark:border-slate-700 ml-2">
            
            <button 
              onClick={onRunSeed}
              className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition text-sm text-left"
            >
              <FileJson size={16} className="text-orange-500" />
              <div>
                <span className="font-medium block">Restaurar Local</span>
                <span className="text-[10px] opacity-70">manual_events.json</span>
              </div>
            </button>

            <button 
              onClick={onOpenPopulate}
              className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition text-sm text-left"
            >
              <Database size={16} className="text-purple-500" />
               <div>
                <span className="font-medium block">Gerador (Wikidata)</span>
                <span className="text-[10px] opacity-70">Extração online</span>
              </div>
            </button>
            
            <button 
              onClick={onOpenKaggle}
              className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition text-sm text-left"
            >
              <Play size={16} className="text-blue-500" />
               <div>
                <span className="font-medium block">Kaggle Import</span>
                <span className="text-[10px] opacity-70">Datasets massivos</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;