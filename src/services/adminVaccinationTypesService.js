import adminApi from './adminApi';

const adminVaccinationTypesService = {
  // Get all vaccination types with pagination and search
  async getAllVaccinationTypes(page = 1, limit = 10, search = '') {
    const params = { page, limit };
    if (search) params.search = search;

    const response = await adminApi.get('/vaccination-types', { params });
    return response.data;
  },

  // Get single vaccination type by ID
  async getVaccinationTypeById(id) {
    const response = await adminApi.get(`/vaccination-types/${id}`);
    return response.data;
  },

  // Create new vaccination type
  async createVaccinationType(data) {
    const response = await adminApi.post('/vaccination-types', data);
    return response.data;
  },

  // Update (rename) a vaccination type
  async updateVaccinationType(id, data) {
    const response = await adminApi.put(`/vaccination-types/${id}`, data);
    return response.data;
  },

  // Delete a vaccination type — 409 while any clinic vaccination plan still uses it
  async deleteVaccinationType(id) {
    const response = await adminApi.delete(`/vaccination-types/${id}`);
    return response.data;
  },
};

export default adminVaccinationTypesService;
