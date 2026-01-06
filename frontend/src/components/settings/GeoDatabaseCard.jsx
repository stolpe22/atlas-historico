import React, { useEffect, useRef } from 'react';
import { Globe, RefreshCw, Database, Terminal, CheckCircle2 } from 'lucide-react';

const GeoDatabaseCard = ({ stats, syncing, logs, onSync }) => {
  const logEndRef = useRef(null);

  // Auto-scroll para o final do log quando novos registros chegam
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full transition-all">
      {/* Header do Card */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${syncing ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500' : 'bg-green-100 dark:bg-green-900/30 text-green-500'}`}>
            <Globe size={22} className={syncing ? "animate-spin" : ""} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white font-display">Geolocalização Offline</h2>
            <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Database: GeoNames.org</p>
          </div>
        </div>
        
        {/* Indicador visual de status no header */}
        {syncing && (
          <span className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-100 dark:border-blue-800 animate-pulse">
            Sincronizando...
          </span>
        )}
      </div>
      
      <div className="p-8 flex-1 flex flex-col">
        {/* Seção de Estatísticas e Botão */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-black text-slate-800 dark:text-white tabular-nums tracking-tighter">
                {stats?.total_cities?.toLocaleString() || 0}
              </p>
              {!syncing && stats?.total_cities > 0 && (
                <CheckCircle2 size={18} className="text-green-500" />
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-1">
              <Database size={16} className="text-slate-400" /> Cidades no banco local
            </p>
          </div>

          <button 
            onClick={onSync}
            disabled={syncing}
            className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95
              ${syncing 
                ? 'bg-slate-400 cursor-not-allowed opacity-70 shadow-none' 
                : 'bg-green-600 hover:bg-green-700 shadow-green-500/30'
              }`}
          >
            <RefreshCw className={syncing ? "animate-spin" : ""} size={20} />
            {syncing ? "Processando no Backend..." : "Atualizar Base de Dados"}
          </button>
        </div>

        {/* Console de Logs (Persistente após F5) */}
        {(syncing || logs.length > 0) && (
          <div className="flex-1 flex flex-col min-h-[250px] bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
            {/* Header do Console */}
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest">
                <Terminal size={14} /> geonames_worker.log
              </div>
              {syncing && (
                 <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                 </div>
              )}
            </div>

            {/* Área de Texto do Log */}
            <div className="flex-1 p-5 font-mono text-[11px] overflow-y-auto custom-scrollbar bg-slate-950/50">
              <div className="space-y-1.5">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-3 group">
                    <span className="text-slate-700 shrink-0 select-none font-bold">[{i + 1}]</span>
                    <span className={`${
                      log.includes('❌') ? 'text-red-400' : 
                      log.includes('✅') ? 'text-green-400' : 
                      log.includes('📈') ? 'text-blue-400' : 
                      'text-slate-300'
                    }`}>
                      {log}
                    </span>
                  </div>
                ))}
                {/* Referência para o scroll automático */}
                <div ref={logEndRef} />
              </div>
            </div>

            {/* Rodapé do Console */}
            <div className="bg-slate-900/50 px-4 py-2 text-[9px] text-slate-500 flex justify-between border-t border-slate-800">
              <span>Sessão restaurada via TaskID</span>
              <span>UTF-8 Engine</span>
            </div>
          </div>
        )}

        {!syncing && logs.length === 0 && (
          <div className="flex-1 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center">
            <Database size={40} className="text-slate-200 dark:text-slate-800 mb-2" />
            <p className="text-sm text-slate-400 max-w-[200px]">
              O banco local permite converter nomes de cidades em coordenadas instantaneamente.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default GeoDatabaseCard;