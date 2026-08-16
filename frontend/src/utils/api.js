import axios from 'axios';

const API_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

const isLocalhostApi = /localhost|127\.0\.0\.1/i.test(API_URL);
export const isApiConfigured = Boolean(
  API_URL &&
    (/^https?:\/\//i.test(API_URL) || API_URL.startsWith('/')) &&
    (process.env.NODE_ENV !== 'production' || !isLocalhostApi)
);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if ((config.method || 'get').toLowerCase() === 'get') {
    config.params = { ...config.params, _t: Date.now() };
  }
  return config;
});

export const businessAPI = {
  getAll: (filters) => api.get('/businesses', { params: filters }),
  getById: (id) => api.get(`/businesses/${encodeURIComponent(id)}`),
  create: (data) => api.post(
    '/businesses',
    data,
    data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined
  ),
  update: (id, data) => api.put(
    `/businesses/${encodeURIComponent(id)}`,
    data,
    data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined
  ),
  delete: (id) => api.delete(`/businesses/${encodeURIComponent(id)}`),
  rememberDeleted: (ids, names) => api.post('/businesses/tombstones', { ids, names }),
  addMenu: (id, data) => api.post(`/businesses/${encodeURIComponent(id)}/menus`, data),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${encodeURIComponent(id)}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${encodeURIComponent(id)}`, data),
  delete: (id) => api.delete(`/categories/${encodeURIComponent(id)}`),
};

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const resolveMediaUrl = (mediaPath) => {
  if (!mediaPath) return '';
  if (/^https?:\/\//i.test(mediaPath)) return mediaPath;
  if (mediaPath.startsWith('/images/') || mediaPath.startsWith('/img/')) return mediaPath;
  return `${API_ORIGIN}${mediaPath.startsWith('/') ? mediaPath : `/${mediaPath}`}`;
};

export default api;
