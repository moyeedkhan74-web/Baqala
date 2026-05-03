import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://baqala-kwt6.onrender.com/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL
});

// Request interceptor to attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
