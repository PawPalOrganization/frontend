export const APP_CONFIG = {
  appName: 'Paw Buddy',
  appVersion: '1.0.0',
  apiBaseUrl: process.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  defaultLanguage: 'en',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: 'HH:mm',
};

export const PET_SIZES = {
  SMALL: 'Small',
  MEDIUM: 'Medium',
  LARGE: 'Large',
};

export const PET_BREEDS = [
  'Bichon Frise',
  'Mixed Breed',
  'Husky',
  'Beagle',
  'Collie',
  'Shiba Inu',
  'Euro',
  'Boxer',
  'Chow Chow',
  'Dalmatian',
  'Golden Retriever',
  'Labrador',
];
