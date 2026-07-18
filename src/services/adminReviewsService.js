import adminApi from './adminApi';

const adminReviewsService = {
  async getAllReviews({
    page = 1,
    limit = 20,
    clinicId = '',
    clinicBranchId = '',
    approved = '',
    includeDeleted = false,
    sort = 'latest',
  } = {}) {
    const params = { page, limit, sort };
    if (clinicId) params.clinicId = clinicId;
    if (clinicBranchId) params.clinicBranchId = clinicBranchId;
    if (approved !== '') params.approved = approved;
    if (includeDeleted) params.includeDeleted = true;
    const response = await adminApi.get('/reviews', { params });
    return response.data;
  },

  async deleteReview(id) {
    const response = await adminApi.delete(`/reviews/${id}`);
    return response.data;
  },
};

export default adminReviewsService;
