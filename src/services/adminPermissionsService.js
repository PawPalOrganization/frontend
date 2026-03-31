import adminApi from './adminApi';

const adminPermissionsService = {
  // Get all permissions (no pagination — full catalog)
  async getAllPermissions() {
    const response = await adminApi.get('/permissions');
    return response.data;
  },
};

export default adminPermissionsService;
