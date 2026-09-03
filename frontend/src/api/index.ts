import api from './client';

// Auth
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Market
export const marketApi = {
  getCrops: () => api.get('/market/crops'),
  getMandis: (district?: string) => api.get('/market/mandis', { params: { district } }),
  getLatestPrices: (cropId?: string) => api.get('/market/prices/latest', { params: { cropId } }),
  getPriceHistory: (cropId: string, mandiId?: string, days = 30) =>
    api.get('/market/prices/history', { params: { cropId, mandiId, days } }),
  getPrices: (params: any) => api.get('/market/prices', { params }),
  getBestPrice: (cropId: string) => api.get('/market/prices/best', { params: { cropId } }),
};

// Farmer
export const farmerApi = {
  getProfile: () => api.get('/farmers/profile'),
  updateProfile: (data: any) => api.put('/farmers/profile', data),
  getCrops: () => api.get('/farmers/crops'),
  addCrop: (data: any) => api.post('/farmers/crops', data),
  getCrop: (id: string) => api.get(`/farmers/crops/${id}`),
  updateCrop: (id: string, data: any) => api.put(`/farmers/crops/${id}`, data),
  deleteCrop: (id: string) => api.delete(`/farmers/crops/${id}`),
  getIncome: () => api.get('/farmers/income'),
};

// Buyer
export const buyerApi = {
  getProfile: () => api.get('/buyers/profile'),
  updateProfile: (data: any) => api.put('/buyers/profile', data),
  getOffers: () => api.get('/buyers/offers'),
  createOffer: (data: any) => api.post('/buyers/offers', data),
  updateOffer: (id: string, data: any) => api.put(`/buyers/offers/${id}`, data),
  getMarketplace: (params: any) => api.get('/buyers/marketplace', { params }),
};

// Transactions
export const transactionApi = {
  getAll: (params: any) => api.get('/transactions', { params }),
  create: (data: any) => {
    // Generate a client-side idempotency key to prevent double-submit
    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return api.post('/transactions', data, {
      headers: { 'idempotency-key': idempotencyKey },
    });
  },
  updateStatus: (id: string, status: string) => api.patch(`/transactions/${id}/status`, { status }),
};

// AI
export const aiApi = {
  query: (data: any) => api.post('/ai/query', data),
  getForecast: (cropId: string, mandiId?: string, days?: number) =>
    api.get('/ai/forecast', { params: { cropId, mandiId, days } }),
  matchBuyers: (data: any) => api.post('/ai/match-buyers', data),
  storageAdvisor: (data: any) => api.post('/ai/storage-advisor', data),
  gradeQuality: (formData: FormData) =>
    api.post('/ai/quality-grade', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getHistory: () => api.get('/ai/history'),
  getRecommendations: () => api.get('/ai/recommendations'),
};

// Notifications
export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Admin
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getFarmers: (params: any) => api.get('/admin/farmers', { params }),
  updateFarmerStatus: (id: string, status: string) => api.patch(`/admin/farmers/${id}/status`, { status }),
  getBuyers: (params: any) => api.get('/admin/buyers', { params }),
  verifyBuyer: (id: string, status: string, notes?: string) =>
    api.patch(`/admin/buyers/${id}/verify`, { status, notes }),
  getTransactions: (params: any) => api.get('/admin/transactions', { params }),
  resolveDispute: (id: string, action: string) => api.patch(`/admin/transactions/${id}/resolve`, { action }),
  getAiMonitoring: () => api.get('/admin/ai-monitoring'),
  getAuditLogs: (params: any) => api.get('/admin/audit-logs', { params }),
  addMarketPrice: (data: any) => api.post('/admin/market-prices', data),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data: any) => api.put('/admin/settings', data),
  getSystemHealth: () => api.get('/admin/system-health'),
};
