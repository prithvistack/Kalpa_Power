import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('kalpa_token'),
  user: JSON.parse(localStorage.getItem('kalpa_user') || 'null'),
  setSession: (session) => {
    localStorage.setItem('kalpa_token', session.access_token);
    localStorage.setItem('kalpa_user', JSON.stringify(session.user));
    set({ token: session.access_token, user: session.user });
  },
  logout: () => {
    localStorage.removeItem('kalpa_token');
    localStorage.removeItem('kalpa_user');
    set({ token: null, user: null });
  },
}));
