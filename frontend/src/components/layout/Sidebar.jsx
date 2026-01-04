import React, { useState, useRef } from 'react';
import { Settings, Database, Download, Plus } from 'lucide-react';

const MenuButton = ({ onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-left transition"
  >
    {icon} {label}
  </button>
);

const Sidebar = ({ 
  events, 
  onEventClick, 
  onRunSeed, 
  onOpenPopulate 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef(null);

  return (
    <aside className="w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h2 className="font-bold text-lg">Cronologia</h2>
        
        <div className="relative">
          <button 
            onClick={() => setShowMenu(! showMenu)} 
            className="p-2 hover:bg-slate-100 dark: hover:bg-slate-700 rounded-lg transition"
          >
            <Settings size={20} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 w-64 bg-white dark:bg-slate-700 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-600 p-2 flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <MenuButton 
                onClick={() => { onRunSeed(); setShowMenu(false); }}
                icon={<Database size={16} className="text-purple-500" />}
                label="Inserir Dados Padrão (Seed)"
              />
              
              <div className="h-px bg-slate-100 dark:bg-slate-600 my-1" />

              <MenuButton 
                onClick={() => { onOpenPopulate(); setShowMenu(false); }}
                icon={<Download size={16} className="text-blue-500" />}
                label="Extrair da Wikidata (Robô)"
              />

              <div className="h-px bg-slate-100 dark:bg-slate-600 my-1" />

              <MenuButton 
                onClick={() => fileInputRef.current?.click()}
                icon={<Plus size={16} className="text-green-500" />}
                label="Importar Arquivo JSON"
              />
              
              <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={() => {}}
              />
            </div>
          )}
        </div>
      </div>

      {/* Event List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {events.map((evt) => (
          <div 
            key={evt.id}
            onClick={() => onEventClick(evt)}
            className="group bg-white dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-brand-500 cursor-pointer transition shadow-sm relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-brand-500 transition-colors" />
            <div className="pl-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600">
                {evt.name}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-bold bg-brand-50 text-brand-600 px-2 py-0.5 rounded">
                  {evt.year_start}
                </span>
                <span className="text-xs text-slate-400 uppercase">
                  {evt.continent}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;