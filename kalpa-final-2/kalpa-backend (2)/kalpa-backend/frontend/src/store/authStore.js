import { create } from 'zustand';

function safeGetToken() {
  const t = localStorage.getItem('kalpa_token');
  // Reject 'undefined' / 'null' strings left by a corrupt write
  if (!t || t === 'undefined' || t === 'null') {
    localStorage.removeItem('kalpa_token');
    return null;
  }
  return t;
}

function safeGetUser() {
  try {
    const raw = localStorage.getItem('kalpa_user');
    if (!raw || raw === 'undefined' || raw === 'null') {
      localStorage.removeItem('kalpa_user');
      return null;
    }
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('kalpa_user');
    return null;
  }
}

export const useAuthStore = create((set) => ({
  token: safeGetToken(),
  user: safeGetUser(),
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
