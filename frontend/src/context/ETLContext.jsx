import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { etlApi } from '../services/api';

const ETLContext = createContext();

export const ETLProvider = ({ children }) => {
  // 1. Estado Central: { [slug]: { taskId, status, logs, showModal, name } }
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('atlas_active_tasks');
    return saved ? JSON.parse(saved) : {};
  });

  // 2. Persistência Centralizada
  useEffect(() => {
    localStorage.setItem('atlas_active_tasks', JSON.stringify(tasks));
  }, [tasks]);

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

            setTasks(prev => ({
              ...prev,
              [slug]: { 
                ...prev[slug], 
                status: status, 
                logs: logs || [] 
              }
            }));

            // Se a tarefa terminou, o polling para ela para no próximo ciclo
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
  }, [tasks]);

  // 4. API do Contexto
  
  // Registra ou atualiza uma tarefa no gerenciador
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

  // Remove uma tarefa (limpa estado e localStorage)
  const removeTask = useCallback((slug) => {
    setTasks(prev => {
      const newTasks = { ...prev };
      delete newTasks[slug];
      return newTasks;
    });
  }, []);

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
      getTask 
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