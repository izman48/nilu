import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } else if (error.response?.status === 403) {
          // Forbidden - user doesn't have permission
          const errorDetail = (error.response.data as any)?.detail || 'Access denied';

          // Show error message
          console.error('Access Forbidden:', errorDetail);

          // If trying to access dashboard as non-admin, redirect to bookings
          if (window.location.pathname === '/' || window.location.pathname.includes('dashboard')) {
            alert('Access denied: Only administrators can access the dashboard');
            window.location.href = '/bookings';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  getInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().getInstance();
export default apiClient;
