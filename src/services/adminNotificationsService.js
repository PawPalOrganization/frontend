import adminApi from './adminApi';

const adminNotificationsService = {
  // Get all notifications with pagination, search, and filters
  async getAllNotifications(page = 1, limit = 10, search = '', filters = {}) {
    const params = { page, limit };
    if (search) params.search = search;
    if (filters.userId) params.userId = filters.userId;
    if (filters.type) params.type = filters.type;
    if (filters.isRead !== undefined && filters.isRead !== '') params.isRead = filters.isRead;

    const response = await adminApi.get('/notifications', { params });
    return response.data;
  },

  // Get single notification by ID
  async getNotificationById(id) {
    const response = await adminApi.get(`/notifications/${id}`);
    return response.data;
  },

  // Create new notification
  async createNotification(notificationData) {
    const response = await adminApi.post('/notifications', notificationData);
    return response.data;
  },

  // Update notification
  async updateNotification(id, notificationData) {
    const response = await adminApi.put(`/notifications/${id}`, notificationData);
    return response.data;
  },

  // Delete notification
  async deleteNotification(id) {
    const response = await adminApi.delete(`/notifications/${id}`);
    return response.data;
  },
};

export default adminNotificationsService;
