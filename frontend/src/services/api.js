import axios from 'axios';

// Detecta se está rodando local ou em rede, ou usa variável de ambiente
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
});

export default api;