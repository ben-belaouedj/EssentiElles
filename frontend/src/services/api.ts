import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_UNREACHABLE_MESSAGE, getApiBaseUrl } from '../constants/api';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('livrella_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Uniform error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      (!error.response && error.message === 'Network Error' && API_UNREACHABLE_MESSAGE) ||
      error.response?.data?.detail ||
      error.message ||
      'Une erreur est survenue';
    return Promise.reject(new Error(Array.isArray(message) ? message.map((e: any) => e.msg || e).join(', ') : message));
  }
);

export default api;

// ─── Auth ───────────────────────────────────────────────
export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) =>
    api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data: { firstName?: string; lastName?: string; phone?: string }) =>
    api.put('/auth/me', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/me/password', { currentPassword, newPassword }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (email: string, code: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, code, newPassword }),
  deleteAccount: (password: string) =>
    api.delete('/auth/me', { data: { password } }),
};

// ─── Categories ─────────────────────────────────────────
export const categoryService = {
  getAll: () => api.get('/categories'),
};

// ─── Products ───────────────────────────────────────────
export const productService = {
  getAll: (params?: { category?: string; search?: string; featured?: boolean; sort?: string; limit?: number; skip?: number }) =>
    api.get('/products', { params }),
  getFeatured: () => api.get('/products/featured'),
  getById: (id: string) => api.get(`/products/${id}`),
};

// ─── Addresses ──────────────────────────────────────────
export const addressService = {
  getAll: () => api.get('/addresses'),
  create: (data: any) => api.post('/addresses', data),
  update: (id: string, data: any) => api.put(`/addresses/${id}`, data),
  delete: (id: string) => api.delete(`/addresses/${id}`),
  setDefault: (id: string) => api.put(`/addresses/${id}/default`),
};

// ─── Subscriptions ──────────────────────────────────────
export const subscriptionService = {
  getAll: () => api.get('/subscriptions'),
  getById: (id: string) => api.get(`/subscriptions/${id}`),
  create: (data: { productId: string; addressId: string; frequency: string; quantity: number }) =>
    api.post('/subscriptions', data),
  update: (id: string, data: any) => api.put(`/subscriptions/${id}`, data),
  pause: (id: string) => api.post(`/subscriptions/${id}/pause`),
  resume: (id: string) => api.post(`/subscriptions/${id}/resume`),
  cancel: (id: string) => api.delete(`/subscriptions/${id}`),
};

// ─── Orders ─────────────────────────────────────────────
export const orderService = {
  getAll: () => api.get('/orders'),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
};

// ─── Invoices ───────────────────────────────────────────
export const invoiceService = {
  getAll: () => api.get('/invoices'),
  getById: (id: string) => api.get(`/invoices/${id}`),
};

// ─── Notifications ──────────────────────────────────────
export const notificationService = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// ─── Support ────────────────────────────────────────────
export const supportService = {
  getFaq: () => api.get('/support/faq'),
  getTickets: () => api.get('/support/tickets'),
  getTicket: (id: string) => api.get(`/support/tickets/${id}`),
  createTicket: (data: { subject: string; category: string; message: string; priority?: string }) =>
    api.post('/support/tickets', data),
  addMessage: (id: string, message: string) =>
    api.post(`/support/tickets/${id}/messages`, { message }),
  closeTicket: (id: string) => api.put(`/support/tickets/${id}/close`),
  rateTicket: (id: string, rating: number) =>
    api.put(`/support/tickets/${id}/rate?rating=${rating}`),
};

// ─── Offers ─────────────────────────────────────────────
export const offerService = {
  getAll: () => api.get('/offers'),
};

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAllProducts: () => api.get('/admin/products'),
  getUsers: () => api.get('/admin/users'),
  toggleUser: (id: string) => api.put(`/admin/users/${id}/toggle`),
  getOrders: () => api.get('/admin/orders'),
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/admin/orders/${id}/status`, { status }),
  getSubscriptions: () => api.get('/admin/subscriptions'),
  getTickets: () => api.get('/admin/tickets'),
  replyTicket: (id: string, message: string) =>
    api.post(`/admin/tickets/${id}/reply`, { message }),
  createProduct: (data: any) => api.post('/products', data),
  updateProduct: (id: string, data: any) => api.put(`/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
  toggleProduct: (id: string) => api.put(`/products/${id}/toggle`),
  broadcast: (title: string, body: string) =>
    api.post('/admin/notifications/broadcast', { title, body }),
  createOffer: (data: any) => api.post('/admin/offers', data),
  updateOffer: (id: string, data: any) => api.put(`/admin/offers/${id}`, data),
  deleteOffer: (id: string) => api.delete(`/admin/offers/${id}`),
  getCategories: () => api.get('/categories'),
  createCategory: (data: any) => api.post('/categories', data),
};
