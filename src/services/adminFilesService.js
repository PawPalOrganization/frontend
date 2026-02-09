import adminApi from './adminApi';

const adminFilesService = {
  // Upload a file and get back the URL
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await adminApi.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default adminFilesService;
