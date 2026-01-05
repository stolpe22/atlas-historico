import React, { useState } from 'react';
import { Database, Play, Settings, Star, ArrowDownCircle, X } from 'lucide-react';
import { useETL } from '../../context/ETLContext';

const ADAPTER_UI_CONFIG = {
  kaggle: {
    title: "Importador Kaggle",
    icon: "https://www.kaggle.com/static/images/site-logo.svg",
    description: "Importação de datasets históricos via API",
    defaultParams: { kaggle_id: "" },
    inputs: [
      { key: "kaggle_id", label: "ID do Dataset (Usuário/Dataset)", type: "text", placeholder: "ex: usuario/nome-dataset" }
    ],
    presets: [
      {
        name: "Dataset Padrão (Recomendado)",
        value: "saketk511/world-important-events-ancient-to-modern",
        desc: "Base completa com coordenadas e datas (Antiguidade à Era Moderna).",
        is_featured: true
      }
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

const ETLModal = ({ isOpen, onClose, integrationSlug = 'kaggle' }) => {
  // ✅ Puxamos o startETL do contexto global
  const { startETL } = useETL();
  const config = ADAPTER_UI_CONFIG[integrationSlug];
  
  // Define parâmetros iniciais baseados nos presets
  const initialParams = config?.presets?.find(p => p.is_featured)?.value 
    ? { kaggle_id: config.presets.find(p => p.is_featured).value }
    : (config?.defaultParams || {});

  const [params, setParams] = useState(initialParams);

  if (!isOpen || !config) return null;

  const applyPreset = (inputValue, inputKey) => {
    setParams(prev => ({ ...prev, [inputKey]: inputValue }));
  };

  const handleRun = () => {
    // ✅ 1. Dispara o processo no contexto GLOBAL (que tem persistência)
    startETL(integrationSlug, params);
    // ✅ 2. Fecha este modal de configuração (o GlobalETLModal assumirá a tela)
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Personalizado */}
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-blue-200" />
            <h2 className="font-bold">Configurar {config.title}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-blue-500 rounded transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Info Header */}
          <div className="flex gap-4 items-center border-b border-slate-100 dark:border-slate-700 pb-4">
            <img src={config.icon} alt="" className="w-10 h-10 object-contain" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">{config.title}</h4>
              <p className="text-xs text-slate-500">{config.description}</p>
            </div>
          </div>

          {/* Presets */}
          {config.presets && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Star size={12} className="text-yellow-500" /> Sugestões Rápidas
              </h5>
              <div className="grid gap-2">
                {config.presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyPreset(preset.value, 'kaggle_id')}
                    className={`text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${
                      params.kaggle_id === preset.value 
                        ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-500' 
                        : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                  >
                    <ArrowDownCircle size={14} className={params.kaggle_id === preset.value ? 'text-blue-500' : 'text-slate-400'} />
                    <div>
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{preset.name}</p>
                      <p className="text-[10px] text-slate-500">{preset.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inputs Manuais */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-3 border border-slate-200 dark:border-slate-700">
            <h5 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
              <Settings size={12} /> Configuração Manual
            </h5>
            {config.inputs.map(input => (
              <div key={input.key}>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">{input.label}</label>
                <input 
                  type="text" 
                  className="w-full p-2 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none"
                  value={params[input.key] || ''}
                  onChange={(e) => setParams({...params, [input.key]: e.target.value})}
                />
              </div>
            ))}
          </div>

          <button 
            onClick={handleRun}
            disabled={!params.kaggle_id}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transition"
          >
            <Play size={20} /> Iniciar Processamento
          </button>
        </div>
      </div>
    </div>
  );
};

export default ETLModal;