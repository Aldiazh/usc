import { create } from 'zustand';
import api from '../lib/api';

const useParticipantAuthStore = create((set) => ({
  token: localStorage.getItem('participant_token') || null,
  user: JSON.parse(localStorage.getItem('participant_user') || 'null'),
  isAuthenticated: !!localStorage.getItem('participant_token'),
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/participant-login', { username, password });
      const { token, user } = res.data;
      
      localStorage.setItem('participant_token', token);
      localStorage.setItem('participant_user', JSON.stringify(user));
      
      set({ token, user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err) {
      const message = err.response?.data?.message || 'Login gagal';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: () => {
    try {
      const token = localStorage.getItem('participant_token');
      if (token) {
        api.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});
      }
    } catch {
      // Ignore errors on logout
    }
    localStorage.removeItem('participant_token');
    localStorage.removeItem('participant_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));

export default useParticipantAuthStore;
