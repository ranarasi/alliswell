import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add selected PDM ID to requests only for delivery-scoped endpoints
api.interceptors.request.use((config) => {
  // Check if this request should be scoped to the selected PDM
  // Only add user ID if explicitly requested via a custom header
  const shouldScopeToPDM = config.headers['x-scope-to-pdm'];

  if (shouldScopeToPDM) {
    const selectedPDM = localStorage.getItem('selectedPDM');
    if (selectedPDM) {
      const pdm = JSON.parse(selectedPDM);
      config.headers['x-user-id'] = pdm.id;
    }
    // Remove the custom header so it's not sent to the server
    delete config.headers['x-scope-to-pdm'];
  }

  return config;
});

// Helper function to make PDM-scoped API calls (for Delivery module)
export const apiScoped = {
  get: (url: string, config = {}) =>
    api.get(url, { ...config, headers: { ...config.headers, 'x-scope-to-pdm': 'true' } }),
  post: (url: string, data?: any, config = {}) =>
    api.post(url, data, { ...config, headers: { ...config.headers, 'x-scope-to-pdm': 'true' } }),
  put: (url: string, data?: any, config = {}) =>
    api.put(url, data, { ...config, headers: { ...config.headers, 'x-scope-to-pdm': 'true' } }),
  delete: (url: string, config = {}) =>
    api.delete(url, { ...config, headers: { ...config.headers, 'x-scope-to-pdm': 'true' } }),
};

export default api;
