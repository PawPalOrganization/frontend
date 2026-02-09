import axios from 'axios';

// Use relative path to utilize Vite proxy in development
// In production, set VITE_API_BASE_URL in .env
const ADMIN_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Admin API instance with /admin/api base path
const adminApi = axios.create({
  baseURL: `${ADMIN_API_BASE_URL}/admin/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add admin token to all requests
adminApi.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors globally
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;
