import adminApi from './adminApi';

const adminNotificationsService = {
  // Send notification to all users
  async sendToAll(notificationData) {
    const response = await adminApi.post('/notifications/send-all', notificationData);
    return response.data;
  },

  // Send notification to a specific user
  async sendToUser(userId, notificationData) {
    const response = await adminApi.post(`/notifications/send-user/${userId}`, notificationData);
    return response.data;
  },
};

export default adminNotificationsService;
