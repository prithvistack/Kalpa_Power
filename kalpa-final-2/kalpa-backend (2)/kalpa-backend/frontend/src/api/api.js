import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kalpa_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isOnLoginPage = window.location.pathname === '/login';
      if (!isOnLoginPage) {
        localStorage.removeItem('kalpa_token');
        localStorage.removeItem('kalpa_user');
        window.location.href = '/login?session_expired=1';
      }
    }
    return Promise.reject(error);
  },
);

export const register = (payload) => api.post('/auth/register', payload);
export const login = (payload) => api.post('/auth/login', payload);
export const verifyOtp = (payload) => api.post('/auth/verify-otp', payload);
export const googleLogin = (credential) => api.post('/auth/google', { credential });
export const forgotPassword = (payload) => api.post('/auth/forgot-password', payload);
export const resetPassword = (payload) => api.post('/auth/reset-password', payload);
export const identifyProduct = (payload) => api.post('/identify', payload);
export const getProduct = (productId) => api.get(`/product/${productId}`);
export const searchProducts = (payload) => api.post('/products/search', payload);
export const getFilterOptions = () => api.get('/meta/options');
export const logScan = (payload) => api.post('/scan', payload);
export const createProduct = (payload) => api.post('/admin/product', payload);
export const createEvent = (payload) => api.post('/admin/event', payload);
export const generateQr = (payload) => api.post('/admin/generate-qr', payload);

export function getApiErrorMessage(error, fallback = 'Request failed') {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        const path = Array.isArray(item?.loc) ? item.loc.join('.') : item?.loc;
        return [path, item?.msg].filter(Boolean).join(': ');
      })
      .filter(Boolean)
      .join('; ') || fallback;
  }
  if (detail && typeof detail === 'object') {
    return detail.msg || JSON.stringify(detail);
  }
  return error?.message || fallback;
}

export default api;
