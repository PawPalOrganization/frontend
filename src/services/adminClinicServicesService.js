import adminApi from './adminApi';

const adminClinicServicesService = {
  async getAllClinicServices(page = 1, limit = 10, search = '', scope = 'all', clinicId = '', categoryId = '') {
    const params = { page, limit };
    if (search) params.search = search;
    if (scope && scope !== 'all') params.scope = scope;
    if (clinicId) params.clinicId = clinicId;
    if (categoryId) params.categoryId = categoryId;
    const response = await adminApi.get('/clinic-services', { params });
    return response.data;
  },

  async createClinicService(data) {
    // data may include clinicId (null for platform, number for clinic-specific)
    const response = await adminApi.post('/clinic-services', data);
    return response.data;
  },

  async updateClinicService(id, data) {
    const response = await adminApi.put(`/clinic-services/${id}`, data);
    return response.data;
  },

  async deleteClinicService(id) {
    const response = await adminApi.delete(`/clinic-services/${id}`);
    return response.data;
  },
};

export default adminClinicServicesService;
