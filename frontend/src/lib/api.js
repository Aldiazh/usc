import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request interceptor — attach Bearer token
// Checks admin token first, then participant token
api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('auth_token');
  const participantToken = localStorage.getItem('participant_token');
  
  // Use admin token for admin routes, participant token for participant routes
  if (adminToken && config.url?.startsWith('/admin')) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  } else if (adminToken && config.url?.startsWith('/auth/logout')) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  } else if (participantToken && (config.url?.startsWith('/participant') || config.url?.startsWith('/auth/logout'))) {
    config.headers.Authorization = `Bearer ${participantToken}`;
  } else if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  } else if (participantToken) {
    config.headers.Authorization = `Bearer ${participantToken}`;
  }
  
  return config;
});

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check which context we're in
      if (window.location.pathname.startsWith('/admin')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/admin/login';
      } else if (window.location.pathname.startsWith('/join') || 
                 window.location.pathname.startsWith('/play')) {
        localStorage.removeItem('participant_token');
        localStorage.removeItem('participant_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
