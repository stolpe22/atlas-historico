import React, { useState, useEffect } from 'react';
import { Settings, Database, Trash2, RefreshCw, Server, Terminal, Globe, Plus, X, Key, CheckCircle, Wrench } from 'lucide-react';
import { settingsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/modals/ConfirmModal';


// --- MODAL DINÂMICO ---
const DynamicIntegrationModal = ({ isOpen, onClose, integration, onSave }) => {
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
        <div className="flex justify-between items-center mb-4">
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
                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder={field.placeholder || ''}
                value={formData[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
              />
            </div>
          ))}

          <button 
            onClick={handleSubmit}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold mt-2"
          >
            Salvar Conexão
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const [integrationsList, setIntegrationsList] = useState([]);
  const [selectedInteg, setSelectedInteg] = useState(null);
  const [geoStats, setGeoStats] = useState({ total_cities: 0 });
  const [loading, setLoading] = useState(true);
  
  // Estados de Sync
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState([]);
  const [taskId, setTaskId] = useState(null);

  const { addToast } = useToast();
  const [deleteData, setDeleteData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let interval;

    // Só roda se estiver sincronizando E tiver um ID de tarefa
    if (syncing && taskId) {
      interval = setInterval(async () => {
        try {
          const res = await settingsApi.getTaskStatus(taskId);
          
          if (res.data) {
            // 1. Atualiza os Logs na tela em tempo real
            if (res.data.logs) {
              setSyncLogs(res.data.logs);
            }

            // 2. Se terminou com SUCESSO
            if (res.data.status === 'completed') {
              setSyncing(false);
              setTaskId(null);
              
              addToast({ 
                type: 'success', 
                title: 'Sincronização Concluída', 
                message: 'Base de dados offline atualizada com sucesso.' 
              });
              
              // ⚠️ O PULO DO GATO: Recarrega os dados para atualizar o contador de população
              loadData(); 
              
              clearInterval(interval);
            } 
            
            // 3. Se deu ERRO ou foi CANCELADO
            else if (res.data.status === 'error' || res.data.status === 'cancelled') {
              setSyncing(false);
              setTaskId(null);
              addToast({ 
                type: 'error', 
                title: 'Parada', 
                message: 'O processo foi interrompido ou falhou.' 
              });
              clearInterval(interval);
            }
          }
        } catch (error) {
          console.error("Erro no polling:", error);
          // Não para o loading aqui para tentar de novo no próximo segundo (resiliência de rede)
        }
      }, 1000); // Verifica a cada 1 segundo
    }

    // Limpa o intervalo se o componente desmontar
    return () => clearInterval(interval);
  }, [syncing, taskId, addToast]); // Dependências do efeito

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
      console.error("Erro ao carregar settings", error);
    } finally {
      setLoading(false);
    }
  };

  // --- AÇÃO DE INICIALIZAÇÃO (Correção do problema da tela vazia) ---
  const handleInitializeSystem = async () => {
    try {
      await settingsApi.initDefinitions();
      addToast({
        type: 'success',
        title: 'Sistema Inicializado',
        message: 'As definições padrão foram carregadas.'
      });
      loadData(); // Recarrega a lista
    } catch (e) {
      alert("Erro ao inicializar: " + e.message);
    }
  };

  const handleConnect = async (defId, credentials) => {
    try {
      console.log("Enviando conexão:", { defId, credentials }); // Log para debug
      
      await settingsApi.connectIntegration({
        definition_id: defId,
        name: "Conexão Principal",
        credentials: credentials
      });
      
      setSelectedInteg(null);
      loadData();
      addToast({
        type: 'success',
        title: 'Conectado!',
        message: 'Integração configurada e ativa.'
      });
      
    } catch (e) {
      console.error("Erro completo:", e);
      // Pega a mensagem detalhada do Backend se existir
      const errorMsg = e.response?.data?.detail || e.message || "Erro desconhecido";
      // Se o erro for de validação (array), formata melhor
      const finalMsg = Array.isArray(errorMsg) 
        ? errorMsg.map(err => `${err.loc.join('.')}: ${err.msg}`).join('\n') 
        : JSON.stringify(errorMsg);
        
      addToast({
        type: 'error',
        title: 'Falha ao Conectar',
        message: finalMsg,
        duration: 5000 // Fica um pouco mais de tempo para ler
      });
    }
  };

  const handleRequestDelete = (integ) => {
    setDeleteData({ 
      id: integ.connected_id, 
      name: integ.name 
    });
  };

  // 2. Executa a exclusão quando o usuário confirma no Modal
  const handleConfirmDelete = async () => {
    if (!deleteData) return;
    
    try {
      await settingsApi.deleteIntegration(deleteData.id);
      loadData();
      addToast({ 
        type: 'info', 
        title: 'Desconectado', 
        message: `A integração "${deleteData.name}" foi removida.` 
      });
    } catch (e) { 
      addToast({ 
        type: 'error', 
        title: 'Erro', 
        message: 'Não foi possível desconectar.' 
      });
    } finally {
      setDeleteData(null); // Fecha o modal
    }
  };

  // ... (Lógica do GeoNames Sync mantém igual) ...
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
  
  // Efeito de Polling (mantido resumido aqui)
  // ... (useEffect do syncing) ...

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

      {/* SEÇÃO 1: INTEGRAÇÕES */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Server size={20} className="text-blue-500" /> Integrações Disponíveis
          </h2>
        </div>
        
        <div className="p-6">
          {loading ? (
             <p className="text-slate-500">Carregando...</p>
          ) : integrationsList.length === 0 ? (
            // --- ESTADO VAZIO: BOTÃO DE RESGATE ---
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
              <Wrench className="mx-auto text-slate-400 mb-2" size={32} />
              <p className="text-slate-600 dark:text-slate-300 font-bold mb-1">
                Banco de definições vazio
              </p>
              <p className="text-sm text-slate-500 mb-4">
                O sistema precisa instalar as definições padrão (Kaggle, OpenAI, etc).
              </p>
              <button 
                onClick={handleInitializeSystem}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-500/30 transition animate-pulse"
              >
                Inicializar Sistema Agora
              </button>
            </div>
          ) : (
            // --- LISTA DE INTEGRAÇÕES ---
            <div className="space-y-4">
              {integrationsList.map(integ => (
                <div key={integ.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 gap-4 transition-all">
      
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      {/* Logo com tamanho fixo para não esmagar */}
                      <img src={integ.logo_url} className="w-10 h-10 object-contain flex-shrink-0" alt="Logo" />
                      <div className="min-w-0"> {/* min-w-0 permite que o texto quebre linha se precisar */}
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 flex-wrap">
                          {integ.name}
                          {integ.is_connected && <CheckCircle size={14} className="text-green-500 flex-shrink-0" />}
                        </h3>
                        <p className="text-sm text-slate-500 break-words leading-tight mt-1">
                          {integ.description}
                        </p>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex sm:justify-end">
                      {integ.is_connected ? (
                        <button 
                          // Chama o request passando o objeto inteiro
                          onClick={() => handleRequestDelete(integ)} 
                          className="w-full sm:w-auto justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded border border-red-200 dark:border-red-800 text-sm font-bold transition flex items-center gap-2"
                        >
                          <Trash2 size={16} /> Desconectar
                        </button>
                      ) : (
                        <button 
                          onClick={() => setSelectedInteg(integ)}
                          className="w-full sm:w-auto justify-center bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-sm"
                        >
                          <Plus size={16} /> Conectar
                        </button>
                      )}
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO 2: DADOS OFFLINE (GeoNames) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Globe size={20} className="text-green-500" /> Banco de Dados Offline
          </h2>
          <div className="text-sm text-slate-500">Fonte: GeoNames</div>
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

      {/* MODAL GENÉRICO */}
      <DynamicIntegrationModal 
        isOpen={!!selectedInteg}
        onClose={() => setSelectedInteg(null)}
        integration={selectedInteg}
        onSave={handleConnect}
      />
      {/*Modal de Confirmação*/}
      <ConfirmModal 
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={handleConfirmDelete}
        title="Desconectar Integração?"
        message={`Você tem certeza que deseja remover a conexão com "${deleteData?.name}"? Isso pode afetar rotinas de importação.`}
        confirmText="Sim, desconectar"
        cancelText="Cancelar"
        isDanger={true} // Deixa o botão vermelho para indicar perigo
      />
    </div>
  );
};

export default SettingsPage;