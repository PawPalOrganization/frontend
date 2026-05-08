import adminApi from './adminApi';

const adminClinicStaffService = {
  async getAllClinicStaff(page = 1, limit = 10, search = '') {
    const params = { page, limit };
    if (search) params.search = search;
    const response = await adminApi.get('/clinic-staff', { params });
    return response.data;
  },

  async getClinicStaffById(id) {
    const response = await adminApi.get(`/clinic-staff/${id}`);
    return response.data;
  },

  async createClinicStaff(data) {
    const response = await adminApi.post('/clinic-staff', data);
    return response.data;
  },

  async updateClinicStaff(id, data) {
    const response = await adminApi.put(`/clinic-staff/${id}`, data);
    return response.data;
  },

  async updateClinicStaffAssignments(id, clinicBranchIds) {
    const response = await adminApi.put(`/clinic-staff/${id}/assignments`, { clinicBranchIds });
    return response.data;
  },

  async deleteClinicStaff(id) {
    const response = await adminApi.delete(`/clinic-staff/${id}`);
    return response.data;
  },
};

export default adminClinicStaffService;
