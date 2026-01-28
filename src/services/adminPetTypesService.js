import adminApi from './adminApi';

const adminPetTypesService = {
  // Get all pet types with pagination and search
  async getAllPetTypes(page = 1, limit = 10, search = '') {
    const params = { page, limit };
    if (search) params.search = search;

    const response = await adminApi.get('/pet-types', { params });
    return response.data;
  },

  // Get single pet type by ID
  async getPetTypeById(id) {
    const response = await adminApi.get(`/pet-types/${id}`);
    return response.data;
  },

  // Create new pet type
  async createPetType(petTypeData) {
    const response = await adminApi.post('/pet-types', petTypeData);
    return response.data;
  },

  // Update pet type
  async updatePetType(id, petTypeData) {
    const response = await adminApi.put(`/pet-types/${id}`, petTypeData);
    return response.data;
  },

  // Delete pet type
  async deletePetType(id) {
    const response = await adminApi.delete(`/pet-types/${id}`);
    return response.data;
  },
};

export default adminPetTypesService;
