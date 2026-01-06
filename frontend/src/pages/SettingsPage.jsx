import React, { useState, useEffect } from 'react';
import { Settings, Server, Wrench } from 'lucide-react';
import { settingsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

// Importação dos sub-componentes e modais
import IntegrationCard from '../components/settings/IntegrationCard';
import GeoDatabaseCard from '../components/settings/GeoDatabaseCard';
import HelpModal from '../components/modals/HelpModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import DynamicIntegrationModal from '../components/modals/DynamicIntegrationModal';

const SettingsPage = () => {
  const { addToast } = useToast();
  
  // Estados de Dados
  const [integrationsList, setIntegrationsList] = useState([]);
  const [geoStats, setGeoStats] = useState({ total_cities: 0 });
  const [syncLogs, setSyncLogs] = useState([]);
  
  // Estados de UI/Modais
  const [loading, setLoading] = useState(true);
  const [selectedInteg, setSelectedInteg] = useState(null);
  const [helpSlug, setHelpSlug] = useState(null);
  const [deleteData, setDeleteData] = useState(null);

  const GEONAMES_TASK_KEY = 'atlas_geonames_task_id';

  const [taskId, setTaskId] = useState(() => localStorage.getItem(GEONAMES_TASK_KEY));
  const [syncing, setSyncing] = useState(() => !!localStorage.getItem(GEONAMES_TASK_KEY));
  
  useEffect(() => {
    if (taskId) {
      localStorage.setItem(GEONAMES_TASK_KEY, taskId);
    } else {
      localStorage.removeItem(GEONAMES_TASK_KEY);
    }
  }, [taskId]);

  useEffect(() => { loadData(); }, []);

  // Polling para Sincronização do GeoNames
  useEffect(() => {
    let interval;
    if (syncing && taskId) {
      interval = setInterval(async () => {
        try {
          const res = await settingsApi.getTaskStatus(taskId);
          if (res.data.logs) setSyncLogs(res.data.logs);

          if (res.data.status === 'completed') {
            setSyncing(false);
            setTaskId(null); // Isso vai disparar o efeito acima e remover do localStorage
            addToast({ type: 'success', title: 'Sucesso', message: 'Geonames atualizado!' });
            loadData();
            clearInterval(interval);
          } else if (['error', 'cancelled'].includes(res.data.status)) {
            setSyncing(false);
            setTaskId(null);
            clearInterval(interval);
          }
        } catch (error) {
          // Se a task sumiu do back (ex: reiniciou o server), limpa o front
          if (error.response?.status === 404) {
             setSyncing(false);
             setTaskId(null);
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [syncing, taskId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [intRes, geoRes] = await Promise.all([settingsApi.getIntegrations(), settingsApi.getGeonamesStats()]);
      setIntegrationsList(intRes.data);
      setGeoStats(geoRes.data);
    } catch (e) { addToast({ type: 'error', title: 'Erro de Carga', message: e.message }); }
    finally { setLoading(false); }
  };

  const handleConnect = async (defId, credentials) => {
    try {
      await settingsApi.connectIntegration({ definition_id: defId, name: "Conexão Principal", credentials });
      setSelectedInteg(null); loadData();
      addToast({ type: 'success', title: 'Conectado!', message: 'Integração ativa.' });
    } catch (e) { addToast({ type: 'error', title: 'Falha ao conectar', message: e.message }); }
  };

  const handleSyncGeonames = async () => {
    try {
      setSyncing(true); setSyncLogs(["🚀 Iniciando..."]);
      const res = await settingsApi.syncGeonames();
      setTaskId(res.data.task_id);
    } catch (e) { setSyncing(false); addToast({ type: 'error', message: 'Falha na sincronização.' }); }
  };

  return (
    <div className="p-4 md:p-8 w-full h-full overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/30 transition-colors">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-10 border-b border-slate-200 dark:border-slate-700 pb-8">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 text-blue-500">
          <Settings size={36} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight font-display">Painel de Controle</h1>
          <p className="text-slate-500 font-medium">Configurações de API, Dados e Sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
        
        {/* Lado Esquerdo: Integrações */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex items-center gap-3">
            <Server size={22} className="text-blue-500" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Conexões Externas</h2>
          </div>
          <div className="p-6 space-y-4 flex-1">
            {loading ? (
              <div className="flex flex-col gap-4 animate-pulse">
                {[1, 2].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-700 rounded-2xl" />)}
              </div>
            ) : integrationsList.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
                <Wrench className="mx-auto text-slate-300 mb-4" size={48} />
                <button onClick={() => settingsApi.initDefinitions().then(loadData)} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all">
                  Instalar Definições Padrão
                </button>
              </div>
            ) : (
              integrationsList.map(integ => (
                <IntegrationCard 
                  key={integ.id} 
                  integ={integ} 
                  onConnect={setSelectedInteg} 
                  onDelete={setDeleteData}
                  onHelp={setHelpSlug} 
                />
              ))
            )}
          </div>
        </section>

        {/* Lado Direito: GeoNames Database */}
        <GeoDatabaseCard 
          stats={geoStats} 
          syncing={syncing} 
          logs={syncLogs} 
          onSync={handleSyncGeonames} 
        />

      </div>

      {/* Modais Gerenciados via Estado */}
      <HelpModal slug={helpSlug} isOpen={!!helpSlug} onClose={() => setHelpSlug(null)} />
      
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
        onConfirm={async () => {
          await settingsApi.deleteIntegration(deleteData.id);
          setDeleteData(null); loadData();
          addToast({ type: 'info', title: 'Desconectado', message: 'Conexão removida.' });
        }}
        title="Remover Integração?"
        message={`Deseja desconectar "${deleteData?.name}"?`}
      />
    </div>
  );
};

export default SettingsPage;