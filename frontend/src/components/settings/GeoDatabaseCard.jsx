import React from 'react';
import { Globe, RefreshCw, Database, Terminal } from 'lucide-react';

const GeoDatabaseCard = ({ stats, syncing, logs, onSync }) => {
  return (
    <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe size={22} className="text-green-500" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white font-display">Geolocalização Offline</h2>
        </div>
      </div>
      
      <div className="p-8 flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <p className="text-5xl font-black text-slate-800 dark:text-white tabular-nums tracking-tighter">
              {stats.total_cities.toLocaleString()}
            </p>
            <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
              <Database size={16} /> Cidades no banco local
            </p>
          </div>
          <button 
            onClick={onSync}
            disabled={syncing}
            className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-3 transition-all shadow-lg 
              ${syncing ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-green-500/30 active:scale-95'}`}
          >
            <RefreshCw className={syncing ? "animate-spin" : ""} size={20} />
            {syncing ? "Sincronizando..." : "Sincronizar Base"}
          </button>
        </div>

        {(syncing || logs.length > 0) && (
          <div className="bg-slate-950 rounded-2xl p-5 font-mono border border-slate-800 shadow-inner flex-1 min-h-[200px]">
            <div className="text-green-500 mb-3 flex items-center gap-2 text-xs font-bold border-b border-green-950 pb-2 uppercase tracking-widest">
              <Terminal size={14} /> geonames_sync.log
            </div>
            <div className="text-slate-300 text-[11px] space-y-1 h-40 overflow-y-auto custom-scrollbar">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2 opacity-90">
                  <span className="text-slate-700 shrink-0 select-none">[{i+1}]</span>
                  <span className="break-all">{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default GeoDatabaseCard;