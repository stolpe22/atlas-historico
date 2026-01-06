import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const eventsApi = {
  getAll: () => api.get('/events/all'),
  getFiltered: (startYear, endYear, continent) => {
    let url = `/events?start_year=${startYear}&end_year=${endYear}`;
    if (continent && continent !== "Todos") url += `&continent=${continent}`;
    return api.get(url);
  },
  create: (eventData) => api.post('/events', eventData),
  delete: (id) => api.delete(`/events/${id}`)
};

export const settingsApi = {
  getIntegrations: () => api.get('/settings/integrations'),
  connectIntegration: (data) => api.post('/settings/integrations/connect', data),
  deleteIntegration: (id) => api.delete(`/settings/integrations/${id}`),
  initDefinitions: () => api.post('/settings/init'),
  getGeonamesStats: () => api.get('/settings/geonames/stats'),
  syncGeonames: () => api.post('/settings/geonames/sync'),
  getTaskStatus: (taskId) => api.get(`/etl/status/${taskId}`),
  getTutorial: (slug) => api.get(`/docs/integration/${slug}`),
};

export const etlApi = {
  runIntegration: (slug, params) => api.post('/etl/run', { slug, params }),
  stopTask: (taskId) => api.post(`/etl/stop/${taskId}`),
  getTaskStatus: (taskId) => api.get(`/etl/status/${taskId}`)
};

export default api;