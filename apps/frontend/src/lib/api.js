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
// SEC-01 FIX: Explicit URL-pattern routing for tokens to prevent admin token leaking
// into participant requests when both are logged in simultaneously (e.g. two browser tabs).
api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('auth_token');
  const participantToken = localStorage.getItem('participant_token');
  const url = config.url ?? '';

  if (url.startsWith('/admin')) {
    // Admin-only routes always use admin token
    if (adminToken) config.headers.Authorization = `Bearer ${adminToken}`;
  } else if (url.startsWith('/participant')) {
    // Participant-only routes always use participant token
    if (participantToken) config.headers.Authorization = `Bearer ${participantToken}`;
  } else if (url === '/auth/logout' || url.startsWith('/auth/logout')) {
    // Logout: use the token that matches the current page context
    const isAdminPath = window.location.pathname.startsWith('/admin');
    const token = isAdminPath ? adminToken : participantToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } else if (url.startsWith('/auth')) {
    // Public auth routes (login) — no token needed
  } else {
    // Fallback for any other protected routes: prefer admin token, then participant
    const token = adminToken || participantToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
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
