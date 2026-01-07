import React, { useRef, useEffect } from 'react';
import { Terminal, Square, X } from 'lucide-react';
import MinimizableModal from './MinimizableModal';
import { useETL } from '../../context/ETLContext';

const GlobalETLModal = () => {
  const { tasks, removeTask, stopTask } = useETL();
  const logsEndRef = useRef(null);

  // Encontra a primeira tarefa configurada para mostrar modal
  const modalSlug = Object.keys(tasks).find(slug => tasks[slug].showModal);
  const activeTask = tasks[modalSlug];

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTask?.logs]);

  if (!activeTask) return null;

  const { status, logs, name } = activeTask;

  return (
    <MinimizableModal 
      isOpen={true} 
      onClose={() => removeTask(modalSlug)} 
      title={status === 'completed' ? `Concluído: ${name}` : `Executando: ${name}`}
    >
      <div className="p-6 space-y-4">
        {/* Status Badge */}
        <div className={`p-4 rounded-lg flex items-center justify-between border ${
          status === 'completed' ? 'bg-green-50 border-green-200 text-green-700' :
          status === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
          'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <span className="font-bold uppercase text-sm">Status: {status}</span>
        </div>

        {/* Console */}
        <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs h-64 overflow-y-auto border border-slate-800 shadow-inner custom-scrollbar">
          <div className="text-green-500 mb-2 flex items-center gap-2 font-bold sticky top-0 bg-slate-950/90 py-1">
            <Terminal size={12} /> Console
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
          {['running', 'pending'].includes(status) ? (
            <button 
              onClick={() => stopTask(modalSlug)} 
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex justify-center items-center gap-2"
            >
              <Square size={18} fill="currentColor"/> Parar
            </button>
          ) : (
            <button 
              onClick={() => removeTask(modalSlug)} 
              className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg font-bold"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </MinimizableModal>
  );
};

export default GlobalETLModal;