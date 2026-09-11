import adminApi from './adminApi';

const adminCancellationReasonsService = {
  // Get all appointment cancellation reasons with pagination and search
  async getAllCancellationReasons(page = 1, limit = 10, search = '') {
    const params = { page, limit };
    if (search) params.search = search;

    const response = await adminApi.get('/appointment-cancellation-reasons', { params });
    return response.data;
  },

  // Get single cancellation reason by ID
  async getCancellationReasonById(id) {
    const response = await adminApi.get(`/appointment-cancellation-reasons/${id}`);
    return response.data;
  },

  // Create new cancellation reason — title + description required, title unique
  async createCancellationReason(data) {
    const response = await adminApi.post('/appointment-cancellation-reasons', data);
    return response.data;
  },

  // Update a cancellation reason — all fields optional, title must stay unique
  async updateCancellationReason(id, data) {
    const response = await adminApi.put(`/appointment-cancellation-reasons/${id}`, data);
    return response.data;
  },

  // Delete a cancellation reason — 409 while any appointment still references it
  async deleteCancellationReason(id) {
    const response = await adminApi.delete(`/appointment-cancellation-reasons/${id}`);
    return response.data;
  },
};

export default adminCancellationReasonsService;
