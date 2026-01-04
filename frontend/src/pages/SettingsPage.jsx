import React, { useState, useEffect } from 'react';
import { Settings, Database, Trash2, RefreshCw, Server, Terminal, Globe } from 'lucide-react';
import { settingsApi, kaggleApi } from '../services/api';

const SettingsPage = () => {
  const [integrations, setIntegrations] = useState([]);
  const [geoStats, setGeoStats] = useState({ total_cities: 0 });
  const [loading, setLoading] = useState(true);
  
  // Estado do Sync
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState([]);
  const [taskId, setTaskId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [intRes, geoRes] = await Promise.all([
        settingsApi.getIntegrations(),
        settingsApi.getGeonamesStats()
      ]);
      setIntegrations(intRes.data);
      setGeoStats(geoRes.data);
    } catch (error) {
      console.error("Erro ao carregar settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!confirm("Tem certeza que deseja remover esta integração?")) return;
    try {
      await settingsApi.deleteIntegration(id);
      loadData(); 
    } catch (e) {
      alert("Erro ao deletar");
    }
  };

  const handleSyncGeonames = async () => {
    try {
      setSyncing(true);
      setSyncLogs(["🚀 Iniciando solicitação de atualização..."]);
      const res = await settingsApi.syncGeonames();
      setTaskId(res.data.task_id);
    } catch (e) {
      setSyncLogs(p => [...p, "❌ Erro ao iniciar: " + e.message]);
      setSyncing(false);
    }
  };

  useEffect(() => {
    let interval;
    if (syncing && taskId) {
      interval = setInterval(async () => {
        try {
          const res = await kaggleApi.getStatus(taskId);
          if (res.data.logs) setSyncLogs(res.data.logs);
          
          if (res.data.status === 'completed' || res.data.status === 'error') {
            setSyncing(false);
            setTaskId(null);
            loadData();
          }
        } catch (e) {
            console.error(e);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [syncing, taskId]);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 h-full overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
        <Settings className="text-slate-400" size={32} />
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações</h1>
          <p className="text-slate-500">Gerencie integrações e dados do sistema</p>
        </div>
      </div>

      {/* Card 1: Integrações */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Server size={20} className="text-blue-500" /> Integrações Externas
          </h2>
        </div>
        <div className="p-6">
          {integrations.length === 0 ? (
            <p className="text-slate-500 italic">Nenhuma integração configurada (ex: Kaggle).</p>
          ) : (
            <div className="space-y-4">
              {integrations.map(integ => (
                <div key={integ.id} className="flex items-center justify-between p-4 border rounded-lg dark:border-slate-600">
                  <div className="flex items-center gap-4">
                    <img src="https://www.kaggle.com/static/images/site-logo.svg" className="w-8 h-8 opacity-80" alt="Kaggle" />
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-200">Kaggle API</p>
                      <p className="text-sm text-slate-500">Usuário: {integ.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {integ.is_active && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Ativo</span>}
                    <button 
                      onClick={() => handleDelete(integ.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                      title="Remover Integração"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Dados Offline (GeoNames) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Globe size={20} className="text-green-500" /> Banco de Dados Offline
          </h2>
          <div className="text-sm text-slate-500">
            Fonte: <a href="http://www.geonames.org/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">GeoNames</a>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">
                {geoStats.total_cities.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">Cidades cadastradas localmente</p>
            </div>
            
            <button 
              onClick={handleSyncGeonames}
              disabled={syncing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition shadow-lg 
                ${syncing ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-green-500/30'}`}
            >
              {syncing ? <RefreshCw className="animate-spin" size={18} /> : <Database size={18} />}
              {syncing ? "Atualizando..." : "Atualizar Base de Dados"}
            </button>
          </div>

          {/* Terminal de Logs do Sync */}
          {(syncing || syncLogs.length > 0) && (
            <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs max-h-48 overflow-y-auto border border-slate-800 shadow-inner custom-scrollbar">
               <div className="text-green-500 mb-2 flex items-center gap-2 font-bold sticky top-0 bg-slate-950">
                <Terminal size={12} /> Console de Sincronização
              </div>
              <div className="flex flex-col gap-1 text-slate-300">
                {syncLogs.map((log, i) => (
                  <div key={i} className="border-l-2 border-slate-800 pl-2">{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default SettingsPage;