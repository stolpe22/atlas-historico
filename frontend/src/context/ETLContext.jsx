import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { etlApi } from '../services/api';

const ETLContext = createContext();

export const ETLProvider = ({ children }) => {
  // 1. Estado Central: { [slug]: { taskId, status, logs, showModal, name } }
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('atlas_active_tasks');
    return saved ? JSON.parse(saved) : {};
  });

  // Estado para notificar a MainPage que algo mudou e ela deve dar refresh na lista
  const [progressTrigger, setProgressTrigger] = useState(0);

  // 2. Persistência Centralizada
  useEffect(() => {
    localStorage.setItem('atlas_active_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Helper interno para limpar tarefa
  const removeTask = useCallback((slug) => {
    setTasks(prev => {
      const newTasks = { ...prev };
      delete newTasks[slug];
      return newTasks;
    });
  }, []);

  // 3. Polling Inteligente Unificado
  useEffect(() => {
    // Identifica quais slugs precisam de atualização (status inacabado)
    const activeSlugs = Object.keys(tasks).filter(slug => 
      ['running', 'pending', 'canceling'].includes(tasks[slug].status)
    );

    if (activeSlugs.length === 0) return;

    const interval = setInterval(async () => {
      // Executa o check para cada tarefa ativa em paralelo
      await Promise.all(activeSlugs.map(async (slug) => {
        try {
          const taskData = tasks[slug];
          const res = await etlApi.getTaskStatus(taskData.taskId);
          
          if (res.data) {
            const { status, logs } = res.data;

            // Se o status mudou para completed, incrementa o trigger para atualizar a lista
            if (status === 'completed' && taskData.status !== 'completed') {
              setProgressTrigger(prev => prev + 1);
            }

            setTasks(prev => ({
              ...prev,
              [slug]: { 
                ...prev[slug], 
                status: status, 
                logs: logs || [] 
              }
            }));
          }
        } catch (e) {
          console.error(`Erro no polling da task [${slug}]:`, e);
          // Se der 404, a task sumiu do backend, então removemos daqui
          if (e.response?.status === 404) {
            removeTask(slug);
          }
        }
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, [tasks, removeTask]);

  // 4. API do Contexto
  
  // Registra manualmente uma tarefa (usado pelo ETLModal)
  const registerTask = useCallback((slug, taskId, config = {}) => {
    const { showModal = true, name = slug } = config;
    setTasks(prev => ({
      ...prev,
      [slug]: {
        taskId,
        name,
        showModal,
        status: 'running',
        logs: ['🚀 Inicializando...']
      }
    }));
  }, []);

  // 🌟 NOVO: Função Helper para iniciar ETL direto (usado pela Sidebar/MainPage)
  const startETL = useCallback(async (slug, params = {}) => {
    try {
      const res = await etlApi.runIntegration(slug, params);
      
      // Define nomes amigáveis baseados no slug
      let friendlyName = slug;
      if (slug === 'seed') friendlyName = "Restaurar Local";
      if (slug === 'kaggle') friendlyName = "Importação Kaggle";
      if (slug === 'wikidata') friendlyName = "Extração Wikidata";

      registerTask(slug, res.data.task_id, {
        showModal: true,
        name: friendlyName
      });
      return { success: true };
    } catch (e) {
      console.error("Erro ao iniciar ETL:", e);
      // Opcional: Você pode disparar um toast de erro aqui se injetar o ToastContext
      throw e; 
    }
  }, [registerTask]);

  // Para uma tarefa em execução
  const stopTask = useCallback(async (slug) => {
    const task = tasks[slug];
    if (task && task.taskId) {
      try {
        await etlApi.stopTask(task.taskId);
        setTasks(prev => ({
          ...prev,
          [slug]: { ...prev[slug], status: 'canceling' }
        }));
      } catch (e) {
        console.error("Erro ao parar task:", e);
      }
    }
  }, [tasks]);

  // Helper para facilitar a vida das páginas: busca uma task por slug
  const getTask = (slug) => tasks[slug] || null;

  return (
    <ETLContext.Provider value={{ 
      tasks, 
      registerTask, 
      removeTask, 
      stopTask, 
      getTask,
      startETL,       // <--- Agora existe!
      progressTrigger // <--- Agora existe!
    }}>
      {children}
    </ETLContext.Provider>
  );
};

export const useETL = () => {
  const context = useContext(ETLContext);
  if (!context) throw new Error('useETL deve ser usado dentro de um ETLProvider');
  return context;
};