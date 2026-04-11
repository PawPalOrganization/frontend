import adminApi from './adminApi';

const adminEmailsService = {
  // Send email to all users
  async sendToAll(emailData) {
    const response = await adminApi.post('/emails/send-all', emailData);
    return response.data;
  },

  // Send email to a specific user
  async sendToUser(userId, emailData) {
    const response = await adminApi.post(`/emails/send-user/${userId}`, emailData);
    return response.data;
  },
};

export default adminEmailsService;
