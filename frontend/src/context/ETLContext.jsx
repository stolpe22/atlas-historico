import React, { createContext, useContext, useState, useEffect } from 'react';
import { etlApi } from '../services/api';

const ETLContext = createContext();

export const useETL = () => {
  const context = useContext(ETLContext);
  if (!context) throw new Error('useETL deve ser usado dentro de um ETLProvider');
  return context;
};

export const ETLProvider = ({ children }) => {
  // 1. Inicialização Persistente: Verifica se já existe uma tarefa ativa
  const [taskId, setTaskId] = useState(() => localStorage.getItem('atlas_etl_task_id'));
  const [integrationSlug, setIntegrationSlug] = useState(() => localStorage.getItem('atlas_etl_slug') || 'kaggle');
  
  // ✅ O SEGREDO: Se tem taskId, o modal já começa aberto (isOpen: true)
  const [isOpen, setIsOpen] = useState(() => !!localStorage.getItem('atlas_etl_task_id'));
  
  const [status, setStatus] = useState('ready'); 
  const [logs, setLogs] = useState([]);
  const [progressTrigger, setProgressTrigger] = useState(0);

  // 2. Sincroniza LocalStorage
  useEffect(() => {
    if (taskId) {
      localStorage.setItem('atlas_etl_task_id', taskId);
      localStorage.setItem('atlas_etl_slug', integrationSlug);
    } else {
      localStorage.removeItem('atlas_etl_task_id');
      localStorage.removeItem('atlas_etl_slug');
    }
  }, [taskId, integrationSlug]);

  // 3. Polling Robusto
  useEffect(() => {
    let interval;
    
    // Só inicia o polling se houver tarefa e não tiver terminado
    if (taskId && status !== 'completed' && status !== 'error' && status !== 'cancelled') {
      setStatus('running'); 
      
      interval = setInterval(async () => {
        try {
          const res = await etlApi.getTaskStatus(taskId);
          
          if (res.data) {
            setLogs(res.data.logs || []);
            
            // Avisa o mapa se novos logs (eventos) chegaram
            if (res.data.logs && res.data.logs.length > logs.length) {
                setProgressTrigger(prev => prev + 1);
            }

            if (res.data.status === 'completed') {
              setStatus('completed');
              setProgressTrigger(prev => prev + 1);
              clearInterval(interval);
            } else if (res.data.status === 'error' || res.data.status === 'cancelled') {
              setStatus(res.data.status);
              clearInterval(interval);
            }
          }
        } catch (e) {
          console.error("Erro polling ETL:", e);
          // Se o servidor disser que a task não existe (404), limpa tudo
          if (e.response?.status === 404) {
            setTaskId(null);
            setIsOpen(false);
          }
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [taskId, status]);

  const startETL = async (slug, params) => {
    try {
      setStatus('running');
      setLogs(['🚀 Iniciando solicitação...']);
      setIntegrationSlug(slug);
      
      const res = await etlApi.runIntegration(slug, params);
      setTaskId(res.data.task_id);
      setIsOpen(true); // Abre o modal ao iniciar
    } catch (e) {
      const msg = e.response?.data?.detail || e.message;
      setLogs(l => [...l, `❌ Erro ao iniciar: ${msg}`]);
      setStatus('error');
      setIsOpen(true);
    }
  };

  const stopETL = async () => {
    if (taskId) {
      try { 
        await etlApi.stopTask(taskId); 
        setStatus('cancelled');
      } catch(e) {}
    }
  };

  const closeWindow = () => {
    // Se terminou ou deu erro, podemos limpar a tarefa do storage
    if (status === 'completed' || status === 'error' || status === 'cancelled') {
      setTaskId(null);
      setLogs([]);
      setStatus('ready');
      setIsOpen(false);
    } else {
      // Se ainda estiver rodando, apenas MINIMIZA (não fecha de verdade)
      // Para isso o MinimizableModal já cuida do estado interno dele, 
      // mas se você quiser fechar a janela e deixar rodando no fundo:
      setIsOpen(false);
    }
  };

  return (
    <ETLContext.Provider value={{
      taskId, integrationSlug, status, logs, isOpen, progressTrigger,
      startETL, stopETL, closeWindow, 
      openWindow: () => setIsOpen(true)
    }}>
      {children}
    </ETLContext.Provider>
  );
};