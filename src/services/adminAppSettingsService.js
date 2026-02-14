import adminApi from './adminApi';

const adminAppSettingsService = {
  // Get all app settings with pagination and search
  async getAllAppSettings(page = 1, limit = 10, search = '') {
    const params = { page, limit };
    if (search) params.search = search;

    const response = await adminApi.get('/app-settings', { params });
    return response.data;
  },

  // Get single app setting by key
  async getAppSettingByKey(key) {
    const response = await adminApi.get(`/app-settings/${key}`);
    return response.data;
  },

  // Create new app setting
  async createAppSetting(data) {
    const response = await adminApi.post('/app-settings', data);
    return response.data;
  },

  // Update app settings (bulk — array of { id, value })
  async updateAppSettings(settingsArray) {
    const response = await adminApi.put('/app-settings', settingsArray);
    return response.data;
  },

  // Delete app setting by key
  async deleteAppSetting(key) {
    const response = await adminApi.delete(`/app-settings/${key}`);
    return response.data;
  },
};

export default adminAppSettingsService;
