import React, { useState, useEffect, useRef } from 'react';
import { Database, Save, Play, Loader2, Terminal, AlertTriangle, Square } from 'lucide-react';
import { kaggleApi } from '../../services/api';
import MinimizableModal from './MinimizableModal';

const DEFAULT_DATASET = "saketk511/world-important-events-ancient-to-modern";

const KaggleModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState('loading'); // loading, config, ready, running
  const [config, setConfig] = useState({ username: '', api_key: '' });
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);
  const [taskId, setTaskId] = useState(null);

  // Verifica se já tem chave salva ao abrir
  useEffect(() => {
    if (isOpen) {
      checkExistingConfig();
    }
  }, [isOpen]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    let interval;
    if (step === 'running' && taskId) {
      interval = setInterval(async () => {
        try {
          const res = await kaggleApi.getStatus(taskId);
          
          if (res.data.logs) {
            // MUDANÇA IMPORTANTE:
            // Em vez de [...prev, ...novos], substituimos tudo
            // pois o backend já manda o histórico completo.
            setLogs(res.data.logs); 
          }
          
          if (res.data.status === 'completed') {
            setStep('ready');
            onSuccess?.();
            clearInterval(interval);
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 1000); // Polling mais rápido (1s) para ver a barra andar
    }
    return () => clearInterval(interval);
  }, [step, taskId]);

  const checkExistingConfig = async () => {
    try {
      const res = await kaggleApi.checkConfig();
      if (res.data.has_config) {
        setStep('ready');
        setLogs(["✅ Credenciais encontradas. Pronto para importar."]);
      } else {
        setStep('config');
      }
    } catch (error) {
      setStep('config');
    }
  };

  const handleSaveConfig = async () => {
    try {
      await kaggleApi.saveConfig({
        name: "Chave Principal",
        username: config.username || "admin",
        api_key: config.api_key
      });
      setStep('ready');
      setLogs(["🔐 Chave salva com sucesso!", "Pronto para iniciar."]);
    } catch (error) {
      alert("Erro ao salvar chave: " + error.message);
    }
  };

  const handleRun = async () => {
    setStep('running');
    setLogs(["🚀 Iniciando pipeline ETL...", "Conectando ao Kaggle..."]);
    try {
      const res = await kaggleApi.runImport(DEFAULT_DATASET);
      setTaskId(res.data.task_id);
    } catch (error) {
      setLogs(prev => [...prev, "❌ Erro ao iniciar: " + error.message]);
      setStep('ready');
    }
  };

  // Função para Cancelar
  const handleStop = async () => {
    if (taskId) {
      try {
        await kaggleApi.stopImport(taskId);
        setLogs(prev => [...prev, "🛑 Parada solicitada... aguarde."]);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <MinimizableModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Importar Kaggle (ETL)" 
      icon={Database}
    >
      <div className="p-6">
        {step === 'config' && (
          <div className="space-y-4 animate-in fade-in">
             <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 rounded-lg flex gap-3 text-sm text-amber-800 dark:text-amber-200">
                <AlertTriangle className="shrink-0" size={20} />
                <p>Insira seu Token. O username pode ser qualquer coisa.</p>
              </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Username (Opcional)</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                value={config.username}
                onChange={e => setConfig({...config, username: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">API Token (Key)</label>
              <input 
                type="password" 
                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono"
                placeholder="KGAT_..."
                value={config.api_key}
                onChange={e => setConfig({...config, api_key: e.target.value})}
              />
            </div>

            <button 
              onClick={handleSaveConfig}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 mt-4"
            >
              <Save size={18} /> Salvar Credenciais
            </button>
          </div>
        )}

        {(step === 'ready' || step === 'running') && (
          <div className="space-y-4 animate-in fade-in">
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex gap-4 items-center bg-slate-50 dark:bg-slate-900/50">
              <div className="bg-white p-2 rounded shadow-sm">
                <img src="https://www.kaggle.com/static/images/site-logo.svg" alt="Kaggle" className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">World Important Events</h4>
                <p className="text-xs text-slate-500">Ancient to Modern</p>
              </div>
              <div className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-bold">Verified</div>
            </div>

            <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs h-48 overflow-y-auto border border-slate-800 shadow-inner custom-scrollbar">
              <div className="text-green-500 mb-2 flex items-center gap-2 font-bold sticky top-0 bg-slate-950">
                <Terminal size={12} /> Console ETL
              </div>
              <div className="flex flex-col gap-1 text-slate-300">
                {logs.map((log, i) => (
                  <div key={i} className="border-l-2 border-slate-800 pl-2 break-all">{log}</div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>

            <div className="flex gap-3">
              {step === 'ready' ? (
                <button 
                  onClick={handleRun}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  <Play size={20} /> Iniciar Processamento
                </button>
              ) : (
                // Botão de Parar (só aparece rodando)
                <button 
                  onClick={handleStop}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 animate-pulse"
                >
                  <Square size={20} fill="currentColor" /> Parar Processo
                </button>
              )}
            </div>

            {step === 'running' && (
              <p className="text-xs text-center text-slate-500">
                Minimize esta janela para ver os pinos surgindo no mapa em tempo real.
              </p>
            )}
          </div>
        )}
      </div>
    </MinimizableModal>
  );
};

export default KaggleModal;