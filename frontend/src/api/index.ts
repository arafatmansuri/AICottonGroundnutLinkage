import api from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  FarmerProfile,
  BuyerProfile,
  Crop,
  FarmerCrop,
  Mandi,
  MarketPrice,
  BuyerOffer,
  Transaction,
  Notification,
  ForecastResult,
  AIQueryResult,
  MatchedBuyer,
  IncomeSummary,
  AdminStats,
  QualityAssessment,
} from '../types';
import type { AxiosResponse } from 'axios';

type AR<T> = Promise<AxiosResponse<ApiResponse<T>>>;
type PAR<T> = Promise<AxiosResponse<ApiResponse<PaginatedResponse<T>>>>;

// ── Request body types ────────────────────────────────────────────────────────

export interface RegisterInput {
  email: string;
  password: string;
  role: 'FARMER' | 'BUYER';
  name: string;
  district: string;
  phone?: string;
  village?: string;
  taluka?: string;
  companyName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface FarmerCropInput {
  cropId: string;
  quantity: number;
  soldQuantity?: number;
  unit?: string;
  quality?: 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'UNGRADED';
  harvestDate?: string;
  storageStatus?: 'NOT_STORED' | 'IN_STORAGE' | 'PARTIALLY_STORED';
  expectedPrice?: number;
  location: string;
  district: string;
  notes?: string;
}

export interface BuyerOfferInput {
  cropId: string;
  offeredPrice: number;
  minQuantity: number;
  maxQuantity: number;
  quality?: 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'UNGRADED';
  district: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  expiresAt?: string;
}

export interface TransactionCreateInput {
  buyerOfferId: string;
  farmerCropId: string;
  quantity: number;
}

export interface AIQueryInput {
  query: string;
  cropId?: string;
  farmerCropId?: string;
  language?: 'en' | 'hi' | 'gu';
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface StorageAdvisorInput {
  currentPrice: number;
  forecastMin: number;
  forecastMax: number;
  forecastConfidence: number;
  storageCostPerUnit: number;
  storageDurationDays: number;
  quantity: number;
  riskProfile?: 'LOW' | 'MODERATE' | 'HIGH';
  bestBuyerNetPrice?: number;
}

export interface BuyerMatchInput {
  cropId: string;
  quantity: number;
  quality?: string;
  district: string;
}

export interface MarketPricesParams {
  cropId?: string;
  mandiId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface AIHistoryItem {
  id: string;
  query: string;
  intent: string | null;
  response: string | null;
  createdAt: string;
  agentsUsed: string[];
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: RegisterInput): AR<AuthTokens> => api.post('/auth/register', data),
  login: (data: LoginInput): AR<AuthTokens> => api.post('/auth/login', data),
  refresh: (refreshToken: string): AR<AuthTokens> => api.post('/auth/refresh', { refreshToken }),
  logout: (): AR<null> => api.post('/auth/logout'),
  me: (): AR<User & { farmerProfile?: FarmerProfile; buyerProfile?: BuyerProfile }> =>
    api.get('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }): AR<null> =>
    api.post('/auth/change-password', data),
  forgotPassword: (email: string): AR<{ resetToken?: string }> =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; newPassword: string }): AR<null> =>
    api.post('/auth/reset-password', data),
};

// ── Market ────────────────────────────────────────────────────────────────────

export const marketApi = {
  getCrops: (): AR<Crop[]> => api.get('/market/crops'),
  getMandis: (district?: string): AR<Mandi[]> =>
    api.get('/market/mandis', { params: { district } }),
  getLatestPrices: (cropId?: string): AR<MarketPrice[]> =>
    api.get('/market/prices/latest', { params: { cropId } }),
  getPriceHistory: (cropId: string, mandiId?: string, days = 30): AR<MarketPrice[]> =>
    api.get('/market/prices/history', { params: { cropId, mandiId, days } }),
  getPrices: (params: MarketPricesParams): AR<MarketPrice[]> =>
    api.get('/market/prices', { params }),
  getBestPrice: (cropId: string): AR<MarketPrice> =>
    api.get('/market/prices/best', { params: { cropId } }),
};

// ── Farmer ────────────────────────────────────────────────────────────────────

export const farmerApi = {
  getProfile: (): AR<FarmerProfile> => api.get('/farmers/profile'),
  updateProfile: (data: Partial<FarmerProfile>): AR<FarmerProfile> =>
    api.put('/farmers/profile', data),
  getCrops: (): AR<FarmerCrop[]> => api.get('/farmers/crops'),
  addCrop: (data: FarmerCropInput): AR<FarmerCrop> => api.post('/farmers/crops', data),
  getCrop: (id: string): AR<FarmerCrop> => api.get(`/farmers/crops/${id}`),
  updateCrop: (id: string, data: Partial<FarmerCropInput>): AR<FarmerCrop> =>
    api.put(`/farmers/crops/${id}`, data),
  deleteCrop: (id: string): AR<null> => api.delete(`/farmers/crops/${id}`),
  getIncome: (): AR<IncomeSummary> => api.get('/farmers/income'),
};

// ── Buyer ─────────────────────────────────────────────────────────────────────

export const buyerApi = {
  getProfile: (): AR<BuyerProfile> => api.get('/buyers/profile'),
  updateProfile: (data: Partial<BuyerProfile>): AR<BuyerProfile> =>
    api.put('/buyers/profile', data),
  getOffers: (): AR<BuyerOffer[]> => api.get('/buyers/offers'),
  createOffer: (data: BuyerOfferInput): AR<BuyerOffer> => api.post('/buyers/offers', data),
  updateOffer: (id: string, data: Partial<BuyerOfferInput>): AR<BuyerOffer> =>
    api.put(`/buyers/offers/${id}`, data),
  getMarketplace: (params: MarketPricesParams & PaginationParams): AR<BuyerOffer[]> =>
    api.get('/buyers/marketplace', { params }),
};

// ── Transactions ──────────────────────────────────────────────────────────────

export const transactionApi = {
  getAll: (params: PaginationParams): AR<Transaction[]> =>
    api.get('/transactions', { params }),
  create: (data: TransactionCreateInput): AR<Transaction> => {
    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return api.post('/transactions', data, {
      headers: { 'idempotency-key': idempotencyKey },
    });
  },
  updateStatus: (id: string, status: string): AR<Transaction> =>
    api.patch(`/transactions/${id}/status`, { status }),
};

// ── AI ────────────────────────────────────────────────────────────────────────

export interface CloudinaryUploadParams {
  uploadUrl: string;
  publicId: string;
  signature: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  cloudName: string;
}

export const aiApi = {
  query: (data: AIQueryInput): AR<AIQueryResult> => api.post('/ai/query', data),
  getForecast: (cropId: string, mandiId?: string, days?: number): AR<ForecastResult> =>
    api.get('/ai/forecast', { params: { cropId, mandiId, days } }),
  matchBuyers: (data: BuyerMatchInput): AR<{ matchedBuyers: MatchedBuyer[]; totalFound: number }> =>
    api.post('/ai/match-buyers', data),
  storageAdvisor: (data: StorageAdvisorInput): AR<{
    recommendation: string;
    sellNowQuantity: number;
    storeQuantity: number;
    reasoning: string[];
    currentNetValue: number;
    expectedFutureNetValue: number;
    storageCost: number;
    potentialGain: number;
    riskLevel: string;
    confidence: number;
  }> => api.post('/ai/storage-advisor', data),
  /** Step 1: Get a signed Cloudinary upload URL from the backend */
  getUploadUrl: (): AR<CloudinaryUploadParams> => api.post('/ai/upload-url'),
  /** Step 3: Delete the image from Cloudinary via backend after grading is done */
  deleteImage: (publicId: string): AR<null> =>
    api.delete(`/ai/image/${btoa(publicId)}`),
  /** Step 2b: Submit the Cloudinary image URL to the backend for AI grading */
  gradeQuality: (data: { cropType: string; imageUrl?: string; farmerCropId?: string }): AR<QualityAssessment> =>
    api.post('/ai/quality-grade', data),
  getHistory: (): AR<AIHistoryItem[]> => api.get('/ai/history'),
  getRecommendations: (): AR<AIQueryResult[]> => api.get('/ai/recommendations'),
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationApi = {
  getAll: (): AR<Notification[]> => api.get('/notifications'),
  markRead: (id: string): AR<null> => api.patch(`/notifications/${id}/read`),
  markAllRead: (): AR<null> => api.patch('/notifications/read-all'),
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface AdminBuyerParams extends PaginationParams {
  status?: string;
}

export interface AdminFarmerParams extends PaginationParams {
  district?: string;
}

export const adminApi = {
  getStats: (): AR<AdminStats> => api.get('/admin/stats'),
  getFarmers: (params: AdminFarmerParams): PAR<FarmerProfile> =>
    api.get('/admin/farmers', { params }),
  updateFarmerStatus: (id: string, status: string): AR<null> =>
    api.patch(`/admin/farmers/${id}/status`, { status }),
  getBuyers: (params: AdminBuyerParams): PAR<BuyerProfile> =>
    api.get('/admin/buyers', { params }),
  verifyBuyer: (id: string, status: string, notes?: string): AR<BuyerProfile> =>
    api.patch(`/admin/buyers/${id}/verify`, { status, notes }),
  getTransactions: (params: PaginationParams): PAR<Transaction> =>
    api.get('/admin/transactions', { params }),
  resolveDispute: (id: string, action: string): AR<Transaction> =>
    api.patch(`/admin/transactions/${id}/resolve`, { action }),
  getAiMonitoring: (): AR<unknown> => api.get('/admin/ai-monitoring'),
  getAuditLogs: (params: PaginationParams): AR<unknown[]> =>
    api.get('/admin/audit-logs', { params }),
  addMarketPrice: (data: Partial<MarketPrice>): AR<MarketPrice> =>
    api.post('/admin/market-prices', data),
  getSettings: (): AR<Record<string, unknown>> => api.get('/admin/settings'),
  updateSettings: (data: Record<string, unknown>): AR<Record<string, unknown>> =>
    api.put('/admin/settings', data),
  getSystemHealth: (): AR<Record<string, unknown>> => api.get('/admin/system-health'),
};
