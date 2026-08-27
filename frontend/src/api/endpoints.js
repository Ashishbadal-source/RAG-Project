import api from './client';

export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard').then(res => res.data),
};

export const experimentsAPI = {
  list: (params) => api.get('/experiments', { params }).then(res => res.data),
  get: (id) => api.get(`/experiments/${id}`).then(res => res.data),
  run: (data) => api.post('/experiments/run', data).then(res => res.data),
  pause: (id) => api.post(`/experiments/${id}/pause`).then(res => res.data),
  resume: (id) => api.post(`/experiments/${id}/resume`).then(res => res.data),
  cancel: (id) => api.post(`/experiments/${id}/cancel`).then(res => res.data),
};

export const leaderboardAPI = {
  get: (params) => api.get('/leaderboard', { params }).then(res => res.data),
};

export const retrieversAPI = {
  list: () => api.get('/retrievers').then(res => res.data),
  getAnalysis: (id) => api.get(`/retrievers/${id}/analysis`).then(res => res.data),
};

export const llmsAPI = {
  list: () => api.get('/llms').then(res => res.data),
  getAnalysis: (id) => api.get(`/llms/${id}/analysis`).then(res => res.data),
};

export const queriesAPI = {
  list: (params) => api.get('/queries', { params }).then(res => res.data),
  get: (id, params) => api.get(`/queries/${id}`, { params }).then(res => res.data),
};

export const resultsAPI = {
  get: (id) => api.get(`/results/${id}`).then(res => res.data),
  downloadUrl: (id) => `http://localhost:8000/api/results/${id}/download`,
};

export const metricsAPI = {
  list: () => api.get('/metrics').then(res => res.data),
};

export const settingsAPI = {
  get: () => api.get('/settings').then(res => res.data),
  update: (data) => api.put('/settings', data).then(res => res.data),
};

export const logsAPI = {
  get: (id) => api.get(`/logs/${id}`).then(res => res.data),
};
