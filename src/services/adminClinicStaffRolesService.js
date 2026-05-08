import adminApi from './adminApi';

const adminClinicStaffRolesService = {
  async getAllClinicStaffRoles() {
    const response = await adminApi.get('/clinic-staff-roles');
    return response.data;
  },

  async createClinicStaffRole(data) {
    const response = await adminApi.post('/clinic-staff-roles', data);
    return response.data;
  },

  // Only permissions can be updated after creation
  async updateClinicStaffRolePermissions(id, permissionIds) {
    const response = await adminApi.put(`/clinic-staff-roles/${id}/permissions`, { permissionIds });
    return response.data;
  },

  async getAllClinicStaffPermissions() {
    const response = await adminApi.get('/clinic-staff-permissions');
    return response.data;
  },
};

export default adminClinicStaffRolesService;
