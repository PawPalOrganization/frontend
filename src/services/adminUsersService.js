import adminApi from './adminApi';

const adminUsersService = {
  // Get all users with pagination and search
  async getAllUsers(page = 1, limit = 10, search = '') {
    const params = { page, limit };
    if (search) params.search = search;

    const response = await adminApi.get('/users', { params });
    return response.data;
  },

  // Get single user by ID
  async getUserById(id) {
    const response = await adminApi.get(`/users/${id}`);
    return response.data;
  },

  // Create new user
  async createUser(userData) {
    const response = await adminApi.post('/users', userData);
    return response.data;
  },

  // Update user
  async updateUser(id, userData) {
    const response = await adminApi.put(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  async deleteUser(id) {
    const response = await adminApi.delete(`/users/${id}`);
    return response.data;
  },

  // Get users for dropdown (lightweight - only id, name, email)
  async getUsersForDropdown(search = '') {
    const params = search ? { search } : {};
    const response = await adminApi.get('/users/dropdown', { params });
    return response.data;
  },
};

export default adminUsersService;
