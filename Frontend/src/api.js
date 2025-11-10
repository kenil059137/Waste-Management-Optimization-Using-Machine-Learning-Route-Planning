import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
const API_KEY = process.env.REACT_APP_API_KEY || '';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': API_KEY,
  },
});

// Reads
export const fetchClusters = () => api.get('/clusters').then(r => r.data);
export const fetchFillLevels = () => api.get('/bin_fill_levels').then(r => r.data);
export const fetchRoutes = () => api.get('/routes').then(r => r.data);
export const fetchSummary = () => api.get('/optimization_summary').then(r => r.data);
export const fetchModelInfo = () => api.get('/model_info').then(r => r.data);

// Actions
export const predictBin = (payload) => api.post('/predict_bin', payload).then(r => r.data);
export const updateBin = (payload) => api.post('/update_bin', payload).then(r => r.data);
export const clusterBins = (payload) => api.post('/cluster_bins', payload).then(r => r.data);
export const optimizeRoutes = (payload) => api.post('/optimize_routes', payload).then(r => r.data);

export default api;
