import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API Methods para Eventos
export const eventsApi = {
  getAll: () => api.get('/events/all'),
  
  getFiltered: (startYear, endYear, continent) => {
    let url = `/events?start_year=${startYear}&end_year=${endYear}`;
    if (continent && continent !== "Todos") {
      url += `&continent=${continent}`;
    }
    return api.get(url);
  },
  
  create: (eventData) => api.post('/events', eventData),
  
  delete: (id) => api.delete(`/events/${id}`)
};

// API Methods para População
export const populateApi = {
  start: (options) => api.post('/populate', options),
  
  startSeed: () => api.post('/populate/seed'),
  
  getStatus: () => api.get('/populate/status'),
  
  stop: () => api.post('/populate/stop')
};

export const kaggleApi = {
  // Salva ou atualiza a chave API
  saveConfig: (data) => api.post('/kaggle/config', data),
  
  // Verifica se já existe uma config salva
  checkConfig: () => api.get('/kaggle/config/active'),
  
  // Dispara o download e processamento
  runImport: (datasetId) => api.post('/kaggle/import', { kaggle_id: datasetId }),

  // Para o processo em andamento
  stopImport: (taskId) => api.post(`/kaggle/stop/${taskId}`),
  
  // Pega o status do processo (polling)
  getStatus: (taskId) => api.get(`/kaggle/status/${taskId}`)
};

export const settingsApi = {
  // Integrações (Kaggle)
  getIntegrations: () => api.get('/settings/integrations'),
  deleteIntegration: (id) => api.delete(`/settings/integrations/${id}`),
  
  // GeoNames
  getGeonamesStats: () => api.get('/settings/geonames/stats'),
  syncGeonames: () => api.post('/settings/geonames/sync'),
};

export default api;