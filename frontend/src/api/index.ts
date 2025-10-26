import apiClient from './client';
import { authApi } from './auth';
import {
  User,
  Customer,
  Car,
  Driver,
  TourRep,
  Template,
  Booking,
  Payment,
  DashboardStats,
} from '@/types';

export const api = {
  auth: authApi,

  // Users
  users: {
    list: () => apiClient.get<User[]>('/users'),
    get: (id: number) => apiClient.get<User>(`/users/${id}`),
    update: (id: number, data: Partial<User>) => apiClient.put<User>(`/users/${id}`, data),
    delete: (id: number) => apiClient.delete(`/users/${id}`),
  },

  // Customers
  customers: {
    list: (search?: string) => apiClient.get<Customer[]>('/customers', { params: { search } }),
    get: (id: number) => apiClient.get<Customer>(`/customers/${id}`),
    create: (data: Partial<Customer>) => apiClient.post<Customer>('/customers', data),
    update: (id: number, data: Partial<Customer>) => apiClient.put<Customer>(`/customers/${id}`, data),
    delete: (id: number) => apiClient.delete(`/customers/${id}`),
  },

  // Resources
  cars: {
    list: (availableOnly?: boolean) => apiClient.get<Car[]>('/resources/cars', { params: { available_only: availableOnly } }),
    get: (id: number) => apiClient.get<Car>(`/resources/cars/${id}`),
    create: (data: Partial<Car>) => apiClient.post<Car>('/resources/cars', data),
    update: (id: number, data: Partial<Car>) => apiClient.put<Car>(`/resources/cars/${id}`, data),
    delete: (id: number) => apiClient.delete(`/resources/cars/${id}`),
  },

  drivers: {
    list: (availableOnly?: boolean) => apiClient.get<Driver[]>('/resources/drivers', { params: { available_only: availableOnly } }),
    get: (id: number) => apiClient.get<Driver>(`/resources/drivers/${id}`),
    create: (data: Partial<Driver>) => apiClient.post<Driver>('/resources/drivers', data),
    update: (id: number, data: Partial<Driver>) => apiClient.put<Driver>(`/resources/drivers/${id}`, data),
    delete: (id: number) => apiClient.delete(`/resources/drivers/${id}`),
  },

  tourReps: {
    list: (activeOnly?: boolean) => apiClient.get<TourRep[]>('/resources/tour-reps', { params: { active_only: activeOnly } }),
    get: (id: number) => apiClient.get<TourRep>(`/resources/tour-reps/${id}`),
    create: (data: Partial<TourRep>) => apiClient.post<TourRep>('/resources/tour-reps', data),
    update: (id: number, data: Partial<TourRep>) => apiClient.put<TourRep>(`/resources/tour-reps/${id}`, data),
    delete: (id: number) => apiClient.delete(`/resources/tour-reps/${id}`),
  },

  // Templates
  templates: {
    list: (activeOnly?: boolean) => apiClient.get<Template[]>('/templates', { params: { active_only: activeOnly } }),
    get: (id: number) => apiClient.get<Template>(`/templates/${id}`),
    create: (data: Partial<Template>) => apiClient.post<Template>('/templates', data),
    update: (id: number, data: Partial<Template>) => apiClient.put<Template>(`/templates/${id}`, data),
    delete: (id: number) => apiClient.delete(`/templates/${id}`),
  },

  // Bookings
  bookings: {
    list: (params?: any) => apiClient.get<Booking[]>('/bookings', { params }),
    get: (id: number) => apiClient.get<Booking>(`/bookings/${id}`),
    create: (data: any) => apiClient.post<Booking>('/bookings', data),
    update: (id: number, data: any) => apiClient.put<Booking>(`/bookings/${id}`, data),
    delete: (id: number) => apiClient.delete(`/bookings/${id}`),
    uploadPhoto: (id: number, file: File, photoType?: string, description?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (photoType) formData.append('photo_type', photoType);
      if (description) formData.append('description', description);
      return apiClient.post(`/bookings/${id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    getPhotos: (id: number) => apiClient.get(`/bookings/${id}/photos`),
    deletePhoto: (bookingId: number, photoId: number) =>
      apiClient.delete(`/bookings/${bookingId}/photos/${photoId}`),
  },

  // Payments
  payments: {
    list: (bookingId?: number) => apiClient.get<Payment[]>('/payments', { params: { booking_id: bookingId } }),
    get: (id: number) => apiClient.get<Payment>(`/payments/${id}`),
    create: (data: Partial<Payment>) => apiClient.post<Payment>('/payments', data),
    update: (id: number, data: Partial<Payment>) => apiClient.put<Payment>(`/payments/${id}`, data),
    delete: (id: number) => apiClient.delete(`/payments/${id}`),
    uploadReceipt: (id: number, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post(`/payments/${id}/upload-receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  },

  // Dashboard
  dashboard: {
    getStats: (startDate?: string, endDate?: string) =>
      apiClient.get<DashboardStats>('/dashboard/stats', {
        params: { start_date: startDate, end_date: endDate },
      }),
    getTourRepStats: (tourRepId: number, startDate?: string, endDate?: string) =>
      apiClient.get(`/dashboard/tour-rep/${tourRepId}/stats`, {
        params: { start_date: startDate, end_date: endDate },
      }),
  },
};

export default api;
