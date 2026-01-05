import React, { useRef, useEffect } from 'react';
import { Database, Play, Square, Terminal, Settings } from 'lucide-react';
import MinimizableModal from './MinimizableModal';
import { useETL } from '../../context/ETLContext';
// Reutilizamos a config visual que você já tinha (simplificada aqui)
const UI_CONFIG = {
  kaggle: { title: "Importador Kaggle", icon: Database },
  openai: { title: "Enriquecimento IA", icon: Database },
};

const GlobalETLModal = () => {
  const { isOpen, status, logs, closeWindow, stopETL, integrationSlug } = useETL();
  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const config = UI_CONFIG[integrationSlug] || UI_CONFIG['kaggle'];

  // Se não estiver aberto nem tiver task rodando, não renderiza nada
  if (!isOpen) return null;

  return (
    <MinimizableModal 
      isOpen={isOpen} 
      onClose={closeWindow} 
      title={status === 'completed' ? 'Processo Concluído' : `Executando: ${config.title}`} 
      icon={config.icon}
    >
      <div className="p-6 space-y-4">
        {/* Header de Status */}
        <div className={`p-4 rounded-lg flex items-center justify-between border ${
            status === 'completed' ? 'bg-green-50 border-green-200 text-green-700' :
            status === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
            'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
            <span className="font-bold uppercase text-sm">Status: {status}</span>
            {status === 'running' && <span className="animate-pulse text-xs">● Processando...</span>}
        </div>

        {/* Console */}
        <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs h-64 overflow-y-auto border border-slate-800 shadow-inner custom-scrollbar relative">
          <div className="text-green-500 mb-2 flex items-center gap-2 font-bold sticky top-0 bg-slate-950/90 backdrop-blur w-full">
            <Terminal size={12} /> Console em Tempo Real
          </div>
          <div className="flex flex-col gap-1 text-slate-300">
            {logs.map((log, i) => (
              <div key={i} className="border-l-2 border-slate-800 pl-2 break-all">{log}</div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          {status === 'running' ? (
            <button onClick={stopETL} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg animate-pulse flex justify-center items-center gap-2">
              <Square size={18} fill="currentColor"/> Parar
            </button>
          ) : (
            <button onClick={closeWindow} className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold">
              Fechar / Concluir
            </button>
          )}
        </div>
      </div>
    </MinimizableModal>
  );
};

export default GlobalETLModal;