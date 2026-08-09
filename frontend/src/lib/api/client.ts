import axios from 'axios';

const getBaseUrl = () => {
  if (typeof window === 'undefined') {
    // SSR: talk to backend container directly via Docker internal network
    return 'http://django_backend:8000/api';
  }
  // CSR: relative URL, Nginx proxies /api/ to backend
  return '/api';
};

const baseUrl = getBaseUrl();

const client = axios.create({});

client.interceptors.request.use((config) => {
  if (config.url) {
    const urlPath = config.url.startsWith('/') ? config.url.substring(1) : config.url;
    const base = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    config.url = `${base}/${urlPath}`;
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token && config.headers) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
