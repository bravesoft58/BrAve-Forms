import axios from 'axios';
import useAuthStore from '../store/authStore';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Logout user if token is invalid
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  verifyMfa: (userId, mfaCode) => api.post('/auth/verify-mfa', { userId, mfaCode }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
  enableMfa: () => api.post('/auth/enable-mfa'),
  disableMfa: () => api.post('/auth/disable-mfa'),
};

// User Management API
export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updateUserStatus: (id, statusData) => api.patch(`/users/${id}/status`, statusData),
  resetUserPassword: (id) => api.post(`/users/${id}/reset-password`),
};

// Projects API
export const projectsAPI = {
  getProjects: () => api.get('/projects'),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (projectData) => api.post('/projects', projectData),
  updateProject: (id, projectData) => api.put(`/projects/${id}`, projectData),
  archiveProject: (id) => api.put(`/projects/${id}/archive`),
  assignUser: (id, userData) => api.post(`/projects/${id}/assign`, userData),
  removeUser: (id, userData) => api.post(`/projects/${id}/remove-user`, userData),
};

// Logs API
export const logsAPI = {
  getLogs: (projectId) => api.get(`/logs?projectId=${projectId}`),
  getLog: (id) => api.get(`/logs/${id}`),
  createLog: (logData) => api.post('/logs', logData),
  updateLog: (id, logData) => api.put(`/logs/${id}`, logData),
  deleteLog: (id) => api.delete(`/logs/${id}`),
  uploadPhoto: (formData) => api.post('/logs/upload-photo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getLogsByDate: (startDate, endDate, projectId) => api.get('/logs/by-date', {
    params: { startDate, endDate, projectId }
  }),
  getLogStats: (projectId) => api.get(`/logs/stats?projectId=${projectId}`),
};

// Reports API
export const reportsAPI = {
  generateReport: (reportData) => api.post('/reports/generate', reportData),
  getReports: (projectId) => api.get(`/reports?projectId=${projectId}`),
  getReport: (id) => api.get(`/reports/${id}`),
  downloadReport: (id, format) => api.get(`/reports/${id}/download?format=${format}`, {
    responseType: 'blob'
  }),
};

export default api;