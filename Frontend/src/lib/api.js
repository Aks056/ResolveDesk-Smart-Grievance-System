import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/authSlice';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
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
    if (error.response && error.response.status === 401) {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

// User APIs
export const getCurrentProfile = () => api.get('/user/profile');
export const updateProfile = (data) => api.put('/user/profile', data);
export const changePassword = (data) => api.put('/user/change-password', data);

export default api;
