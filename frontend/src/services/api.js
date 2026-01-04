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

export default api;