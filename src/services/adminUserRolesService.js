import adminApi from './adminApi';

const adminUserRolesService = {
  // Get all user roles with pagination and optional search
  async getAllUserRoles(page = 1, limit = 10, search = '') {
    const params = { page, limit };
    if (search) params.search = search;

    const response = await adminApi.get('/user-roles', { params });
    return response.data;
  },

  // Get single user role by ID (includes its permissions)
  async getUserRoleById(id) {
    const response = await adminApi.get(`/user-roles/${id}`);
    return response.data;
  },

  // Create a new user role
  async createUserRole(roleData) {
    const response = await adminApi.post('/user-roles', roleData);
    return response.data;
  },

  // Update a user role (permissionIds replaces the full set)
  async updateUserRole(id, roleData) {
    const response = await adminApi.put(`/user-roles/${id}`, roleData);
    return response.data;
  },

  // Delete a user role
  async deleteUserRole(id) {
    const response = await adminApi.delete(`/user-roles/${id}`);
    return response.data;
  },
};

export default adminUserRolesService;
