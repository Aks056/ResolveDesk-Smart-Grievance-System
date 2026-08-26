import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/authSlice';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

// User APIs
export const getCurrentProfile = () => api.get('/user/profile');
export const updateProfile = (data) => api.put('/user/profile', data);
export const changePassword = (data) => api.put('/user/change-password', data);

// Officer & Grievance APIs
export const getOfficerDashboardStats = () => api.get('/dashboard/officer');
export const getAssignedGrievances = (scope) => api.get('/grievances/assigned', { params: scope ? { scope } : {} });
export const acceptGrievance = (id) => api.put(`/grievances/${id}/accept`);
export const updateGrievanceStatus = (id, data) => api.put(`/grievances/${id}/status`, data);
export const getGrievanceDetails = (id) => api.get(`/grievances/${id}`);
export const getGrievanceHistory = (id) => api.get(`/grievances/${id}/history`);

export default api;
