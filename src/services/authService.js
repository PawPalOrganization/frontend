import api from './api';

/**
 * Authentication Service
 *
 * SECURITY NOTE: Currently using localStorage for token storage.
 * For production, consider implementing httpOnly cookies with backend support:
 * - Backend sets httpOnly, secure, sameSite cookies
 * - Frontend uses credentials: 'include' for requests
 * - CSRF protection with tokens
 *
 * If using localStorage:
 * - Implement strong Content Security Policy (CSP)
 * - Sanitize all user inputs to prevent XSS
 * - Use short token expiration times
 * - Consider token rotation
 */
const authService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.firstName - User's first name
   * @param {string} userData.lastName - User's last name
   * @param {string} userData.phoneNumber - User's phone number (format: +1234567890)
   * @param {string} userData.email - User's email address
   * @param {string} userData.password - User's password
   * @param {string} userData.birthDate - User's birth date (format: YYYY-MM-DD)
   * @param {string} userData.gender - User's gender (male/female)
   * @returns {Promise<Object>} Response with user data and token
   */
  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);

      // Store token and user data
      if (response.data.data && response.data.data.token) {
        localStorage.setItem('authToken', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User's email
   * @param {string} credentials.password - User's password
   * @returns {Promise<Object>} Response with user data and token
   */
  login: async (credentials) => {
    try {
      const response = await api.post('/api/auth/login', credentials);

      // Store token and user data
      if (response.data.data && response.data.data.token) {
        localStorage.setItem('authToken', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  /**
   * Logout user
   */
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  /**
   * Get current user from localStorage
   * @returns {Object|null} Current user or null
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  /**
   * Get auth token
   * @returns {string|null} Auth token or null
   */
  getToken: () => {
    return localStorage.getItem('authToken');
  },
};

export default authService;
