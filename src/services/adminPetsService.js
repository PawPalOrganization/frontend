import adminApi from './adminApi';

const adminPetsService = {
  // Get all pets with pagination, search, and filters
  async getAllPets(page = 1, limit = 10, search = '', userId = '', petTypeId = '') {
    const params = { page, limit };
    if (search) params.search = search;
    if (userId) params.userId = userId;
    if (petTypeId) params.petTypeId = petTypeId;

    const response = await adminApi.get('/pets', { params });
    return response.data;
  },

  // Get single pet by ID
  async getPetById(id) {
    const response = await adminApi.get(`/pets/${id}`);
    return response.data;
  },

  // Create new pet (requires userId)
  async createPet(petData) {
    const response = await adminApi.post('/pets', petData);
    return response.data;
  },

  // Update pet
  async updatePet(id, petData) {
    const response = await adminApi.put(`/pets/${id}`, petData);
    return response.data;
  },

  // Delete pet
  async deletePet(id) {
    const response = await adminApi.delete(`/pets/${id}`);
    return response.data;
  },

  // Get all pets for specific user
  async getUserPets(userId) {
    const response = await adminApi.get(`/pets/user/${userId}`);
    return response.data;
  },
};

export default adminPetsService;
