import React, { useState } from 'react';
import { 
  Database, Play, Settings, Star, ArrowDownCircle, 
  X, AlertCircle, Loader2 
} from 'lucide-react';

// Hooks
import { useETL } from '../../context/ETLContext';
import { useToast } from '../../context/ToastContext';
import { useIntegrationStatus } from '../../hooks/useIntegrationStatus';

// Serviços e Componentes
import { etlApi, settingsApi } from '../../services/api';
import IntegrationCard from '../settings/IntegrationCard';
import DynamicIntegrationModal from './DynamicIntegrationModal';
import HelpModal from './HelpModal';

const ADAPTER_UI_CONFIG = {
  kaggle: {
    title: "Importador Kaggle",
    headerTitle: "Configurar Importador Kaggle",
    ctaLabel: "Iniciar Processamento",
    icon: "https://www.kaggle.com/static/images/site-logo.svg",
    description: "Importação de datasets históricos via API",
    allowCustomInput: false, // <--- CONTROLE AQUI (False = esconde o input de texto)
    defaultParams: { kaggle_id: "" },
    presets: [
      {
        name: "Dataset Padrão World Important Events - Ancient to Modern",
        value: "saketk511/world-important-events-ancient-to-modern",
        desc: "Base completa com coordenadas e datas.",
        is_featured: true
      }
    ]
  },
  seed: {
    title: "Restaurar local (JSON)",
    headerTitle: "Restaurar local (JSON)",
    ctaLabel: "Restaurar agora",
    icon: "https://cdn-icons-png.flaticon.com/512/620/620851.png",
    description: "Importa manual_events.json",
    allowCustomInput: false,
    defaultParams: {},
    inputs: [],
    presets: [
      {
        name: "manual_events.json",
        value: "seed_local",
        desc: "Restaura os dados pré-carregados.",
        is_featured: true
      }
    ]
  },
  wikidata: {
    title: "Extração Wikidata",
    headerTitle: "Configurar Robô Wikidata",
    ctaLabel: "Iniciar Extração",
    icon: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Wikidata-logo.svg",
    description: "Busca eventos históricos diretamente da base SPARQL",
    allowCustomInput: true, // <--- Exemplo: Wikidata talvez precise de inputs customizados
    defaultParams: { start_year: 1800, end_year: 1900, continents: ["Europa"] },
    presets: []
  }
};

const ETLModal = ({ isOpen, onClose, integrationSlug = 'kaggle', onRunOverride }) => {
  const { registerTask } = useETL();
  const { addToast } = useToast();
  
  const { integration, isConnected, loading, refresh } = useIntegrationStatus(integrationSlug);

  const [isConfiguring, setIsConfiguring] = useState(false);
  const [helpSlug, setHelpSlug] = useState(null);

  const config = ADAPTER_UI_CONFIG[integrationSlug];
  
  const [params, setParams] = useState(() => {
    const featured = config?.presets?.find(p => p.is_featured);
    return featured ? { kaggle_id: featured.value } : (config?.defaultParams || {});
  });

  if (!isOpen || !config) return null;

  const handleRun = async () => {
    try {
      if (onRunOverride) { 
        await onRunOverride(params); 
        onClose(); 
        return; 
      }

      const res = await etlApi.runIntegration(integrationSlug, params);
      
      registerTask(integrationSlug, res.data.task_id, { 
        showModal: true, 
        name: config.title 
      });

      addToast({ 
        type: 'info', 
        title: 'Tarefa Iniciada', 
        message: 'O processamento começou em segundo plano.' 
      });
      
      onClose();
    } catch (e) {
      const msg = e.response?.data?.detail || e.message;
      addToast({ type: 'error', title: 'Erro ao Iniciar', message: msg });
    }
  };

  const handleConnectInternal = async (defId, credentials) => {
    try {
      await settingsApi.connectIntegration({ 
        definition_id: defId, 
        name: "Conexão via Atalho", 
        credentials 
      });
      addToast({ type: 'success', title: 'Conectado!', message: 'Credenciais salvas.' });
      setIsConfiguring(false);
      refresh();
    } catch (e) {
      addToast({ type: 'error', title: 'Erro', message: e.message });
    }
  };

  const canShowForm = integrationSlug === 'seed' || integrationSlug === 'wikidata' || isConnected;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-blue-200" />
            <h2 className="font-bold">{config.headerTitle}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-blue-500 rounded transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <p className="text-sm text-slate-400 font-medium">Verificando API...</p>
            </div>
          ) : !canShowForm ? (

            <div className="space-y-4 animate-in slide-in-from-top-2">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex gap-3">
                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm">Integração Exigida</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-500">Configure suas credenciais abaixo para liberar a importação.</p>
                </div>
              </div>

              {integration && (
                <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Serviço disponível</p>
                  <IntegrationCard 
                    integ={integration} 
                    onConnect={() => setIsConfiguring(true)} 
                    onHelp={setHelpSlug} 
                  />
                </div>
              )}
            </div>

          ) : (

            <>
              <div className="flex gap-4 items-center border-b border-slate-100 dark:border-slate-700 pb-4">
                {config.icon && <img src={config.icon} alt="" className="w-10 h-10 object-contain" />}
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    {config.title}
                    <span className="bg-green-100 text-green-600 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Pronto</span>
                  </h4>
                  <p className="text-xs text-slate-500">{config.description}</p>
                </div>
              </div>

              {config.presets && config.presets.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Star size={12} className="text-yellow-500" /> Presets de Dataset
                  </h5>
                  <div className="grid gap-2">
                    {config.presets.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => setParams({ ...params, kaggle_id: preset.value })}
                        className={`text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${
                          params.kaggle_id === preset.value
                            ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20' 
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

              {/* CORREÇÃO AQUI: Respeita a flag allowCustomInput */}
              {config.allowCustomInput && !config.presets?.some(p => p.value === params.kaggle_id) && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-3 border dark:border-slate-700">
                   <label className="block text-[10px] font-bold text-slate-500 mb-1">Dataset ID / Parâmetros</label>
                   <input 
                      type="text" 
                      className="w-full p-2 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      value={params.kaggle_id || ''}
                      onChange={(e) => setParams({...params, kaggle_id: e.target.value})}
                      placeholder="Ex: usuario/dataset"
                   />
                </div>
              )}

              <button 
                onClick={handleRun}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95"
              >
                <Play size={20} /> {config.ctaLabel}
              </button>
            </>
          )}
        </div>
      </div>

      <DynamicIntegrationModal 
        isOpen={isConfiguring} 
        onClose={() => setIsConfiguring(false)} 
        integration={integration} 
        onSave={handleConnectInternal} 
        addToast={addToast} 
      />
      <HelpModal slug={helpSlug} isOpen={!!helpSlug} onClose={() => setHelpSlug(null)} />
    </div>
  );
};

export default ETLModal;