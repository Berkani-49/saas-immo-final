import axios from 'axios';
import { API_URL } from '../config';

// Instance axios avec retry automatique
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Intercepteur de retry sur erreur 5xx
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Ne pas retry si déjà retried ou si erreur client (4xx)
    if (config._retry || (error.response && error.response.status < 500)) {
      return Promise.reject(error);
    }

    config._retry = true;

    // Attendre 1 seconde avant de retry
    await new Promise(resolve => setTimeout(resolve, 1000));

    return api(config);
  }
);

// Helper pour créer la config avec token
export const authConfig = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export default api;
