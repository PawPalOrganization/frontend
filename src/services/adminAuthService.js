import adminApi from './adminApi';

const adminAuthService = {
  // Admin login
  async login(credentials) {
    const response = await adminApi.post('/auth/login', credentials);
    const { token, admin } = response.data.data;

    // Store in localStorage
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(admin));

    return response.data.data;
  },

  // Admin logout
  logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  },

  // Get current admin from localStorage
  getCurrentAdmin() {
    const adminUser = localStorage.getItem('adminUser');
    return adminUser ? JSON.parse(adminUser) : null;
  },

  // Check if admin is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('adminToken');
  },

  // Get admin token
  getToken() {
    return localStorage.getItem('adminToken');
  },
};

export default adminAuthService;
