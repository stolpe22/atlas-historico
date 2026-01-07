import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 segundos de timeout (bom para cargas pesadas)
  headers: { 'Content-Type': 'application/json' }
});

// Interceptador para logar erros globalmente (facilita debug)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============================================================================
// EVENTS API
// ============================================================================
export const eventsApi = {
  // Busca todos os eventos (para a ListView)
  getAll: () => api.get('/events/all'),

  // Busca filtros únicos para os dropdowns (Continentes, Períodos, Fontes)
  getUniqueFilters: () => api.get('/events/filters'),

  // Busca GeoJSON filtrado (para o Mapa)
  getFiltered: (startYear, endYear, continent) => {
    let url = `/events?start_year=${startYear}&end_year=${endYear}`;
    if (continent && continent !== "Todos") url += `&continent=${continent}`;
    return api.get(url);
  },

  // Detecção espacial via PostGIS
  // Chamado automaticamente quando o usuário seleciona um ponto no mapa
  detectContinent: (lat, lon) => api.get(`/events/detect-continent?lat=${lat}&lon=${lon}`),

  // Cria ou Atualiza evento
  create: (eventData) => api.post('/events', eventData),

  // Deleta evento
  delete: (id) => api.delete(`/events/${id}`)
};

// ============================================================================
// SETTINGS API
// ============================================================================
export const settingsApi = {
  // Gerenciamento de Integrações (Kaggle, etc)
  getIntegrations: () => api.get('/settings/integrations'),
  connectIntegration: (data) => api.post('/settings/integrations/connect', data),
  deleteIntegration: (id) => api.delete(`/settings/integrations/${id}`),
  initDefinitions: () => api.post('/settings/init'), // Roda o seeder de definições

  // Gerenciamento do Banco Local (GeoNames)
  getGeonamesStats: () => api.get('/settings/geonames/stats'),
  syncGeonames: () => api.post('/settings/geonames/sync'),

  // Utilitários de Settings
  getTaskStatus: (taskId) => api.get(`/etl/status/${taskId}`),
  getTutorial: (slug) => api.get(`/docs/integration/${slug}`),
};

// ============================================================================
// ETL API (Automação)
// ============================================================================
export const etlApi = {
  // Dispara uma tarefa em background (Kaggle Import, Wiki Extract, Seed)
  runIntegration: (slug, params) => api.post('/etl/run', { slug, params }),
  
  // Para uma tarefa em execução
  stopTask: (taskId) => api.post(`/etl/stop/${taskId}`),
  
  // Consulta status para o Polling do Contexto
  getTaskStatus: (taskId) => api.get(`/etl/status/${taskId}`)
};

export default api;