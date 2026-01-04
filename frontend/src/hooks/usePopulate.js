import { useState, useEffect, useCallback, useRef } from 'react';
import { populateApi } from '../services/api';
import { POLLING_INTERVAL } from '../utils/constants';

export function usePopulate(onComplete) {
  const [isPopulating, setIsPopulating] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const intervalRef = useRef(null);

  const addLog = useCallback((message) => {
    setLogs(prev => {
      if (prev[prev.length - 1] === message) return prev;
      return [...prev, message];
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Polling do status
  useEffect(() => {
    if (! isPopulating) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(async () => {
      try {
        const res = await populateApi.getStatus();
        addLog(res.data.message);

        if (! res.data.is_running) {
          setIsPopulating(false);
          setShowModal(false);
          onComplete?.({
            type: 'success',
            title: 'Concluído! ',
            message:  res.data.message
          });
        }
      } catch (err) {
        console.error('Erro no polling:', err);
      }
    }, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPopulating, addLog, onComplete]);

  const startExtraction = async (config) => {
    try {
      await populateApi.start({
        mode: 'fast',
        continents: config.continents,
        start_year: config.start_year,
        end_year:  config.end_year
      });

      setIsPopulating(true);
      setLogs([
        "🚀 Inicializando subsistemas...",
        "⏳ Enviando configuração ao servidor..."
      ]);
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const startSeed = async () => {
    try {
      await populateApi.startSeed();
      setIsPopulating(true);
      setLogs([
        "📂 Iniciando carga de dados padrão...",
        "Aguarde..."
      ]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const stop = async () => {
    try {
      addLog("🛑 Enviando sinal de parada...");
      await populateApi.stop();
      addLog("⏳ Aguardando finalização...");
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return {
    isPopulating,
    logs,
    showModal,
    setShowModal,
    startExtraction,
    startSeed,
    stop,
    clearLogs
  };
}