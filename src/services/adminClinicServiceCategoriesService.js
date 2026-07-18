import adminApi from './adminApi';

const adminClinicServiceCategoriesService = {
  async getAllClinicServiceCategories(page = 1, limit = 10, search = '') {
    const params = { page, limit };
    if (search) params.search = search;
    const response = await adminApi.get('/clinic-service-categories', { params });
    return response.data;
  },

  async getClinicServiceCategoryById(id) {
    const response = await adminApi.get(`/clinic-service-categories/${id}`);
    return response.data;
  },

  async createClinicServiceCategory(data) {
    const response = await adminApi.post('/clinic-service-categories', data);
    return response.data;
  },

  async updateClinicServiceCategory(id, data) {
    const response = await adminApi.put(`/clinic-service-categories/${id}`, data);
    return response.data;
  },

  async deleteClinicServiceCategory(id) {
    const response = await adminApi.delete(`/clinic-service-categories/${id}`);
    return response.data;
  },
};

export default adminClinicServiceCategoriesService;
