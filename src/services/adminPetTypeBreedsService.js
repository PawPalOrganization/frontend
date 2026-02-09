import adminApi from './adminApi';

const adminPetTypeBreedsService = {
  // Get all pet type breeds with pagination, search, and petTypeId filter
  async getAllPetTypeBreeds(page = 1, limit = 10, petTypeId = '', search = '') {
    const params = { page, limit };
    if (petTypeId) params.petTypeId = petTypeId;
    if (search) params.search = search;

    const response = await adminApi.get('/pet-type-breeds', { params });
    return response.data;
  },

  // Get single pet type breed by ID
  async getPetTypeBreedById(id) {
    const response = await adminApi.get(`/pet-type-breeds/${id}`);
    return response.data;
  },

  // Create new pet type breed
  async createPetTypeBreed(data) {
    const response = await adminApi.post('/pet-type-breeds', data);
    return response.data;
  },

  // Update pet type breed
  async updatePetTypeBreed(id, data) {
    const response = await adminApi.put(`/pet-type-breeds/${id}`, data);
    return response.data;
  },

  // Delete pet type breed
  async deletePetTypeBreed(id) {
    const response = await adminApi.delete(`/pet-type-breeds/${id}`);
    return response.data;
  },
};

export default adminPetTypeBreedsService;
