import axios from 'axios';

const api = axios.create({

  baseURL: '/api', 
  
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (config.url.includes('/auth/login') || config.url.includes('/login')) {
      return config;
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
          localStorage.removeItem('token');
          window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;