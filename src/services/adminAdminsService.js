import adminApi from './adminApi';

const adminAdminsService = {
  // Get all admins with pagination and search
  async getAllAdmins(page = 1, limit = 10, search = '') {
    const params = { page, limit };
    if (search) params.search = search;

    const response = await adminApi.get('/admins', { params });
    return response.data;
  },

  // Get single admin by ID
  async getAdminById(id) {
    const response = await adminApi.get(`/admins/${id}`);
    return response.data;
  },

  // Create new admin
  async createAdmin(adminData) {
    const response = await adminApi.post('/admins', adminData);
    return response.data;
  },

  // Update admin
  async updateAdmin(id, adminData) {
    const response = await adminApi.put(`/admins/${id}`, adminData);
    return response.data;
  },

  // Delete admin (cannot delete self)
  async deleteAdmin(id) {
    const response = await adminApi.delete(`/admins/${id}`);
    return response.data;
  },
};

export default adminAdminsService;
