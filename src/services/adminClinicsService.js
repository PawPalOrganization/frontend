import adminApi from './adminApi';

const adminClinicsService = {
  // ── Clinics ──────────────────────────────────────────────────────────────
  async getAllClinics(page = 1, limit = 10, search = '') {
    const params = { page, limit };
    if (search) params.search = search;
    const response = await adminApi.get('/clinics', { params });
    return response.data;
  },

  async getClinicById(id) {
    const response = await adminApi.get(`/clinics/${id}`);
    return response.data;
  },

  async createClinic(data) {
    const response = await adminApi.post('/clinics', data);
    return response.data;
  },

  async updateClinic(id, data) {
    const response = await adminApi.put(`/clinics/${id}`, data);
    return response.data;
  },

  async deleteClinic(id) {
    const response = await adminApi.delete(`/clinics/${id}`);
    return response.data;
  },

  async approveClinic(id) {
    const response = await adminApi.post(`/clinics/${id}/approve`);
    return response.data;
  },

  async rejectClinic(id) {
    const response = await adminApi.post(`/clinics/${id}/reject`);
    return response.data;
  },

  // ── Branches ─────────────────────────────────────────────────────────────
  async getBranches(clinicId) {
    const response = await adminApi.get(`/clinics/${clinicId}/branches`);
    return response.data;
  },

  async getBranchById(clinicId, branchId) {
    const response = await adminApi.get(`/clinics/${clinicId}/branches/${branchId}`);
    return response.data;
  },

  async createBranch(clinicId, data) {
    const response = await adminApi.post(`/clinics/${clinicId}/branches`, data);
    return response.data;
  },

  async updateBranch(clinicId, branchId, data) {
    const response = await adminApi.put(`/clinics/${clinicId}/branches/${branchId}`, data);
    return response.data;
  },

  async deleteBranch(clinicId, branchId) {
    const response = await adminApi.delete(`/clinics/${clinicId}/branches/${branchId}`);
    return response.data;
  },
};

export default adminClinicsService;
