import { useState, useEffect, useCallback } from 'react';
import { settingsApi } from '../services/api';

export function useIntegrationStatus(slug) {
  const [integration, setIntegration] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    if (!slug || slug === 'seed') {
      setLoading(false);
      return;
    }
    setLoading(true); // Estava 'True', corrigido para 'true'
    try {
      const res = await settingsApi.getIntegrations();
      const found = res.data.find(i => i.slug === slug);
      setIntegration(found);
    } catch (e) {
      console.error("Erro ao checar status da integração", e);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  return { 
    integration, 
    isConnected: integration?.is_connected, 
    loading, 
    refresh: checkStatus 
  };
}