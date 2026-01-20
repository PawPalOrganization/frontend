import axios from 'axios';

// Use environment variables for different environments
// Empty string in development uses Vite proxy, full URL in production
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // NOTE: For production, consider using credentials: 'include' with httpOnly cookies
  // This requires backend support for CORS and Set-Cookie headers
  // withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // NOTE: localStorage has XSS vulnerability. Consider httpOnly cookies for production.
    // If using localStorage, ensure strong CSP headers and proper XSS prevention.
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      // Prevent redirect loop: only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
