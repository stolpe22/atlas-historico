import React, { useState, useEffect, useRef } from 'react';
import { Database, Play, Terminal, Square, Settings, Star, ArrowDownCircle } from 'lucide-react'; // Adicionei ícones novos
import { etlApi } from '../../services/api';
import MinimizableModal from './MinimizableModal';
import { useToast } from '../../context/ToastContext';

// 1. ADICIONAMOS A CHAVE "PRESETS" AQUI 👇
const ADAPTER_UI_CONFIG = {
  kaggle: {
    title: "Importador Kaggle",
    icon: "https://www.kaggle.com/static/images/site-logo.svg",
    description: "Importação de datasets históricos via API",
    defaultParams: { kaggle_id: "" }, // Começa vazio para forçar escolha ou mostrar placeholder
    inputs: [
      { key: "kaggle_id", label: "ID do Dataset (Usuário/Dataset)", type: "text", placeholder: "ex: usuario/nome-dataset" }
    ],
    // NOVOS PRESETS:
    presets: [
      {
        name: "Dataset Padrão (Recomendado)",
        value: "saketk511/world-important-events-ancient-to-modern",
        desc: "Base completa com coordenadas e datas (Antiguidade à Era Moderna).",
        is_featured: true
      },
      // Você pode adicionar outros no futuro aqui...
    ]
  },
  openai: {
    title: "Enriquecimento IA",
    icon: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    description: "Gerar descrições e coordenadas faltantes",
    defaultParams: { prompt_type: "fix_coordinates" },
    inputs: [
      { key: "prompt_type", label: "Tipo de Tarefa", type: "select", options: ["fix_coordinates", "translate"] }
    ]
  }
};

const ETLModal = ({ isOpen, onClose, integrationSlug = 'kaggle', onSuccess }) => {
  const { addToast } = useToast();
  const config = ADAPTER_UI_CONFIG[integrationSlug];
  
  const [step, setStep] = useState('ready');
  // Se tiver um preset featured, já inicia com ele, senão vazio
  const initialParams = config?.presets?.find(p => p.is_featured)?.value 
    ? { kaggle_id: config.presets.find(p => p.is_featured).value }
    : (config?.defaultParams || {});

  const [params, setParams] = useState(initialParams);
  const [taskId, setTaskId] = useState(null);
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  // ... (useEffect de Scroll e Polling MANTÉM IGUAL) ...
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    let interval;
    if (step === 'running' && taskId) {
      interval = setInterval(async () => {
        try {
          const res = await etlApi.getTaskStatus(taskId);
          if (res.data.logs) setLogs(res.data.logs);
          if (res.data.status === 'completed') {
            setStep('completed');
            addToast({ type: 'success', title: 'Concluído', message: 'Importação finalizada.' });
            onSuccess?.();
            clearInterval(interval);
          } else if (res.data.status === 'error' || res.data.status === 'cancelled') {
            setStep('ready');
            clearInterval(interval);
          }
        } catch (e) { console.error(e); }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, taskId, addToast, onSuccess]);

  // ... (handleRun e handleStop MANTÉM IGUAL) ...
  const handleRun = async () => {
    setStep('running');
    setLogs([`🚀 Iniciando ${config.title}...`]);
    try {
      const res = await etlApi.runIntegration(integrationSlug, params);
      setTaskId(res.data.task_id);
    } catch (error) {
      setLogs(p => [...p, "❌ Erro: " + error.message]);
      setStep('ready');
    }
  };

  const handleStop = async () => {
    if (taskId) try { await etlApi.stopTask(taskId); } catch (e) {}
  };

  if (!config) return null;

  // Função auxiliar para aplicar um preset
  const applyPreset = (inputValue, inputKey) => {
    setParams(prev => ({ ...prev, [inputKey]: inputValue }));
  };

  return (
    <MinimizableModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`ETL: ${config.title}`} 
      icon={Database}
    >
      <div className="p-6 space-y-6">
        
        {/* Header */}
        <div className="flex gap-4 items-center border-b border-slate-100 dark:border-slate-700 pb-4">
          <img src={config.icon} alt={config.title} className="w-10 h-10 object-contain" />
          <div>
            <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200">{config.title}</h4>
            <p className="text-sm text-slate-500">{config.description}</p>
          </div>
        </div>

        {/* ÁREA DE PRESETS (NOVIDADE) */}
        {step === 'ready' && config.presets && (
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Star size={12} className="text-yellow-500" /> Sugestões Rápidas
            </h5>
            <div className="grid gap-2">
              {config.presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(preset.value, 'kaggle_id')}
                  className={`
                    text-left p-3 rounded-lg border transition-all group flex items-start gap-3
                    ${params.kaggle_id === preset.value 
                      ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-500 ring-1 ring-blue-500' 
                      : 'bg-white border-slate-200 hover:border-blue-300 dark:bg-slate-800 dark:border-slate-700 hover:dark:bg-slate-700'
                    }
                  `}
                >
                  <div className={`mt-1 p-1 rounded-full ${params.kaggle_id === preset.value ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`}>
                    <ArrowDownCircle size={14} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${params.kaggle_id === preset.value ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {preset.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {preset.desc}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 mt-1 truncate max-w-[250px]">
                      ID: {preset.value}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Inputs Manuais */}
        {step === 'ready' && config.inputs && (
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-3 border border-slate-200 dark:border-slate-700">
             <h5 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
               <Settings size={12} /> Configuração Manual
             </h5>
             {config.inputs.map(input => (
               <div key={input.key}>
                 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{input.label}</label>
                 {input.type === 'text' ? (
                   <input 
                     type="text" 
                     placeholder={input.placeholder}
                     className="w-full p-2 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                     value={params[input.key] || ''}
                     onChange={(e) => setParams({...params, [input.key]: e.target.value})}
                   />
                 ) : (
                    <select
                        className="w-full p-2 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        value={params[input.key]}
                        onChange={(e) => setParams({...params, [input.key]: e.target.value})}
                    >
                        {input.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                 )}
               </div>
             ))}
          </div>
        )}

        {/* Console de Logs (Igual ao anterior) */}
        <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs h-40 overflow-y-auto border border-slate-800 shadow-inner custom-scrollbar relative">
          <div className="text-green-500 mb-2 flex items-center gap-2 font-bold sticky top-0 bg-slate-950/90 backdrop-blur w-full">
            <Terminal size={12} /> Console de Processamento
          </div>
          <div className="flex flex-col gap-1 text-slate-300">
            {logs.length === 0 && <span className="text-slate-600 italic">Pronto para iniciar...</span>}
            {logs.map((log, i) => (
              <div key={i} className="border-l-2 border-slate-800 pl-2 break-all">{log}</div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          {step === 'running' ? (
            <button onClick={handleStop} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 animate-pulse">
              <Square size={20} fill="currentColor" /> Parar
            </button>
          ) : (
            <button 
              onClick={handleRun}
              disabled={config.inputs && Object.values(params).some(v => !v)} // Desabilita se vazio
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition"
            >
              <Play size={20} /> {step === 'completed' ? 'Rodar Novamente' : 'Iniciar Importação'}
            </button>
          )}
        </div>
      </div>
    </MinimizableModal>
  );
};

export default ETLModal;