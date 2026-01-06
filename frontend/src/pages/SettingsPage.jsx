import React, { useState, useEffect } from 'react';
import { Settings, Database, Trash2, RefreshCw, Server, Terminal, Globe, Plus, X, Key, CheckCircle, Wrench, HelpCircle } from 'lucide-react';
import { settingsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/modals/ConfirmModal';
import HelpModal from '../components/modals/HelpModal';

// --- MODAL DINÂMICO (CORRIGIDO: Recebe addToast via props) ---
const DynamicIntegrationModal = ({ isOpen, onClose, integration, onSave, addToast }) => {
  const [formData, setFormData] = useState({});

  if (!isOpen || !integration) return null;

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const missing = integration.form_schema.filter(f => f.required && !formData[f.key]);
    if (missing.length > 0) {
      addToast({
        type: 'warning',
        title: 'Campos Obrigatórios',
        message: `Preencha o campo: ${missing[0].label}`
      });
      return;
    }
    onSave(integration.id, formData);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4 text-slate-800 dark:text-white">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Key className="text-blue-500" size={20} /> 
            Conectar {integration.name}
          </h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        
        <div className="space-y-4">
          {integration.form_schema.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              <input 
                type={field.type === 'password' ? 'password' : 'text'}
                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={field.placeholder || ''}
                value={formData[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
              />
            </div>
          ))}

          <button 
            onClick={handleSubmit}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold mt-2 transition-colors shadow-lg shadow-blue-500/30"
          >
            Salvar Conexão
          </button>
        </div>
      </div>
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---
const SettingsPage = () => {
  const { addToast } = useToast();

  const [integrationsList, setIntegrationsList] = useState([]);
  const [selectedInteg, setSelectedInteg] = useState(null);
  const [geoStats, setGeoStats] = useState({ total_cities: 0 });
  const [loading, setLoading] = useState(true);
  const [deleteData, setDeleteData] = useState(null);
  
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState([]);
  const [taskId, setTaskId] = useState(null);

  const [helpSlug, setHelpSlug] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let interval;
    if (syncing && taskId) {
      interval = setInterval(async () => {
        try {
          const res = await settingsApi.getTaskStatus(taskId);
          if (res.data.logs) setSyncLogs(res.data.logs);
          
          if (res.data.status === 'completed') {
            setSyncing(false);
            setTaskId(null);
            addToast({ type: 'success', title: 'Sucesso', message: 'Base de dados offline atualizada!' });
            loadData();
            clearInterval(interval);
          } else if (res.data.status === 'error' || res.data.status === 'cancelled') {
            setSyncing(false);
            setTaskId(null);
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Erro no polling:", error);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [syncing, taskId, addToast]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [intRes, geoRes] = await Promise.all([
        settingsApi.getIntegrations(),
        settingsApi.getGeonamesStats()
      ]);
      setIntegrationsList(intRes.data);
      setGeoStats(geoRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeSystem = async () => {
    try {
      await settingsApi.initDefinitions();
      addToast({ type: 'success', title: 'Sistema Inicializado', message: 'Definições padrão carregadas.' });
      loadData();
    } catch (e) {
      addToast({ type: 'error', title: 'Erro', message: e.message });
    }
  };

  const handleConnect = async (defId, credentials) => {
    try {
      await settingsApi.connectIntegration({
        definition_id: defId,
        name: "Conexão Principal",
        credentials: credentials
      });
      setSelectedInteg(null);
      loadData();
      addToast({ type: 'success', title: 'Conectado!', message: 'Integração ativa.' });
    } catch (e) {
      addToast({ type: 'error', title: 'Falha ao conectar', message: e.message });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteData) return;
    try {
      await settingsApi.deleteIntegration(deleteData.id);
      loadData();
      addToast({ type: 'info', title: 'Desconectado', message: 'A integração foi removida.' });
    } catch (e) {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível remover.' });
    } finally {
      setDeleteData(null);
    }
  };

  const handleSyncGeonames = async () => {
    try {
      setSyncing(true);
      setSyncLogs(["🚀 Iniciando sincronização..."]);
      const res = await settingsApi.syncGeonames();
      setTaskId(res.data.task_id);
    } catch (e) {
      setSyncing(false);
      addToast({ type: 'error', title: 'Erro', message: 'Falha ao iniciar sincronização.' });
    }
  };

  return (
    <div className="p-4 md:p-8 w-full h-full overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/30">
      
      {/* Header Expandido */}
      <div className="flex items-center gap-4 mb-8 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-blue-500">
          <Settings size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Configurações</h1>
          <p className="text-slate-500 font-medium">Gerencie integrações e base de geolocalização</p>
        </div>
      </div>

      {/* Grid de Layout Fluido */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        
        {/* Card Integrações */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex items-center gap-3">
            <Server size={22} className="text-blue-500" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Conexões Externas</h2>
          </div>
          
          <div className="p-6">
            {loading ? (
              <p className="text-slate-400 animate-pulse">Carregando integrações...</p>
            ) : integrationsList.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                <Wrench className="mx-auto text-slate-300 mb-4" size={40} />
                <button onClick={handleInitializeSystem} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30">
                  Inicializar Definições
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {integrationsList.map(integ => (
                  <div key={integ.id} className="flex items-center justify-between p-4 border rounded-2xl dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white dark:bg-slate-700 p-1.5 rounded-xl border dark:border-slate-600">
                        <img src={integ.logo_url} className="w-full h-full object-contain" alt="" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          {integ.name}
                          {integ.is_connected && <CheckCircle size={14} className="text-green-500" />}

                          {/* BOTÃO DE HELP ADICIONADO AQUI */}
                          <button 
                            onClick={() => setHelpSlug(integ.slug)}
                            className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-full transition-colors"
                            title="Como configurar?"
                          >
                            <HelpCircle size={16} />
                          </button>
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-1">{integ.description}</p>
                      </div>
                    </div>
                    {integ.is_connected ? (
                      <button onClick={() => setDeleteData({ id: integ.connected_id, name: integ.name })} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={20} />
                      </button>
                    ) : (
                      <button onClick={() => setSelectedInteg(integ)} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold transition-all">
                        Conectar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Card Banco Offline */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe size={22} className="text-green-500" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Base de Geolocalização</h2>
            </div>
          </div>
          
          <div className="p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
              <div>
                <p className="text-5xl font-black text-slate-800 dark:text-white tabular-nums">
                  {geoStats.total_cities.toLocaleString()}
                </p>
                <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                  <Database size={16} /> Cidades carregadas
                </p>
              </div>
              <button 
                onClick={handleSyncGeonames}
                disabled={syncing}
                className={`w-full sm:w-auto px-8 py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg 
                  ${syncing ? 'bg-slate-400' : 'bg-green-600 hover:bg-green-700 shadow-green-500/30'}`}
              >
                {syncing ? <RefreshCw className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                {syncing ? "Sincronizando..." : "Sincronizar Base"}
              </button>
            </div>

            {(syncing || syncLogs.length > 0) && (
              <div className="bg-slate-950 rounded-2xl p-5 font-mono border border-slate-800 shadow-inner">
                <div className="text-green-500 mb-3 flex items-center gap-2 text-xs font-bold border-b border-green-950 pb-2">
                  <Terminal size={14} /> logs_sincronizacao.sh
                </div>
                <div className="text-slate-300 text-[11px] space-y-1 h-48 overflow-y-auto custom-scrollbar">
                  {syncLogs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-slate-700 shrink-0 select-none">{i+1}</span>
                      <span className="break-all">{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

      </div>

      <HelpModal 
        slug={helpSlug} 
        isOpen={!!helpSlug} 
        onClose={() => setHelpSlug(null)} 
      />

      {/* Modais de Gerenciamento */}
      <DynamicIntegrationModal 
        isOpen={!!selectedInteg}
        onClose={() => setSelectedInteg(null)}
        integration={selectedInteg}
        onSave={handleConnect}
        addToast={addToast}
      />
      
      <ConfirmModal 
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={handleConfirmDelete}
        title="Remover Integração?"
        message={`Você deseja desconectar "${deleteData?.name}"? Isso pode afetar a importação de novos dados.`}
      />
    </div>
  );
};

export default SettingsPage;