import React, { useState, useEffect } from 'react';
import { Settings, Database, Trash2, RefreshCw, Server, Terminal, Globe, Plus, X, Key, CheckCircle } from 'lucide-react';
import { settingsApi, kaggleApi } from '../services/api';

// --- MODAL PARA ADICIONAR INTEGRAÇÃO ---
const AddIntegrationModal = ({ isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState({ username: 'admin', api_key: '' });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Key className="text-blue-500" size={20} /> Conectar Kaggle
          </h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        
        <div className="space-y-4">
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
            onClick={() => onSave(config)}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
          >
            Salvar e Conectar
          </button>
        </div>
      </div>
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---
const SettingsPage = () => {
  const [integrations, setIntegrations] = useState([]);
  const [geoStats, setGeoStats] = useState({ total_cities: 0 });
  
  // Estados de Modals
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Estados de Sync (GeoNames)
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
    }
  };

  // --- LÓGICA DO KAGGLE ---
  // Verifica se já existe integração do Kaggle salva
  const kaggleIntegration = integrations.find(i => i.username); // Assumindo que o backend retorna lista

  const handleSaveKaggle = async (config) => {
    try {
      await kaggleApi.saveConfig({
        name: "Kaggle Principal",
        username: config.username || "admin",
        api_key: config.api_key
      });
      setShowAddModal(false);
      loadData(); // Atualiza a lista
      alert("Integração salva com sucesso!");
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    }
  };

  const handleDeleteIntegration = async (id) => {
    if(!confirm("Tem certeza que deseja desconectar esta integração?")) return;
    try {
      await settingsApi.deleteIntegration(id);
      loadData(); 
    } catch (e) {
      alert("Erro ao deletar");
    }
  };

  // --- LÓGICA DO GEONAMES ---
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
        } catch (e) { console.error(e); }
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

      {/* SEÇÃO 1: INTEGRAÇÕES (Predefinidas) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Server size={20} className="text-blue-500" /> Integrações
          </h2>
        </div>
        
        <div className="p-6">
          {/* Card do Kaggle (Fixo) */}
          <div className="flex items-center justify-between p-4 border rounded-lg dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/20">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white rounded shadow-sm">
                <img src="https://www.kaggle.com/static/images/site-logo.svg" className="w-8 h-8" alt="Kaggle" />
              </div>
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  Kaggle API
                  {kaggleIntegration && <CheckCircle size={14} className="text-green-500" />}
                </p>
                <p className="text-sm text-slate-500">
                  {kaggleIntegration 
                    ? `Conectado como: ${kaggleIntegration.username}` 
                    : "Importação de datasets massivos"}
                </p>
              </div>
            </div>

            <div>
              {kaggleIntegration ? (
                <button 
                  onClick={() => handleDeleteIntegration(kaggleIntegration.id)}
                  className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg text-sm font-bold border border-red-200 dark:border-red-800 transition"
                >
                  Desconectar / Excluir
                </button>
              ) : (
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition shadow-lg shadow-blue-500/30 flex items-center gap-2"
                >
                  <Plus size={16} /> Conectar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: DADOS OFFLINE (GeoNames) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Globe size={20} className="text-green-500" /> Banco de Dados Offline
          </h2>
          <div className="text-sm text-slate-500">
            Fonte: GeoNames
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

      <AddIntegrationModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSave={handleSaveKaggle} 
      />
    </div>
  );
};

export default SettingsPage;