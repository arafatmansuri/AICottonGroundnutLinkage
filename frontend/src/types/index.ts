// Core types mirroring backend schema

export type Role = 'FARMER' | 'BUYER' | 'ADMIN';
export type Language = 'en' | 'hi' | 'gu';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
  language?: Language;
}

export interface FarmerProfile {
  id: string;
  userId: string;
  name: string;
  village?: string;
  taluka?: string;
  district: string;
  state: string;
  riskProfile: string;
  createdAt: string;
}

export interface BuyerProfile {
  id: string;
  userId: string;
  companyName: string;
  contactName: string;
  district: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rating?: number;
  totalTransactions?: number;
}

export interface Crop {
  id: string;
  name: string;
  nameHi?: string;
  nameGu?: string;
}

export interface FarmerCrop {
  id: string;
  cropId: string;
  crop: Crop;
  quantity: number;
  soldQuantity: number;
  unit: string;
  quality: string;
  harvestDate?: string;
  storageStatus: string;
  expectedPrice?: number;
  location: string;
  district: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Mandi {
  id: string;
  name: string;
  nameGu?: string;
  district: string;
  state: string;
}

export interface MarketPrice {
  id: string;
  mandiId: string;
  mandi: Mandi;
  cropId: string;
  crop: Crop;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  arrivalQty?: number;
  priceDate: string;
  trend: string;
  priceChangePct?: number;
}

export interface BuyerOffer {
  id: string;
  buyerProfileId: string;
  buyerProfile: {
    companyName: string;
    contactName: string;
    district: string;
    verificationStatus: string;
    rating?: number;
    totalTransactions?: number;
  };
  crop: Crop;
  offeredPrice: number;
  minQuantity: number;
  maxQuantity: number;
  quality: string;
  district: string;
  notes?: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  farmerProfileId: string;
  buyerProfileId: string;
  farmerCrop: FarmerCrop;
  buyerProfile: BuyerProfile;
  quantity: number;
  agreedPrice: number;
  transportCost: number;
  storageCost: number;
  netRealization: number;
  status: string;
  createdAt: string;
  completedAt?: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export type PriceTrend = 'INCREASING' | 'DECREASING' | 'STABLE' | 'VOLATILE';
export type PriceSignal = 'SELL_NOW' | 'SELL_PARTIALLY' | 'WAIT' | 'STORE';
export type RecommendationDecision = 'SELL_NOW' | 'STORE' | 'SELL_PARTIALLY' | 'WAIT_AND_MONITOR';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type BetterOption = 'BUYER' | 'MANDI';

export interface ForecastResult {
  agentName: string;
  success: boolean;
  confidence: number;
  executionMs: number;
  currentPrice: number;
  forecastRange: { min: number; max: number };
  trend: PriceTrend;
  signal: PriceSignal;
  horizonDays: number;
  explanation: string;
  dataPoints: number;
}

export interface MatchedBuyer {
  buyerOfferId: string;
  buyerProfileId: string;
  companyName: string;
  verificationStatus: string;
  offeredPrice: number;
  maxQuantity: number;
  district: string;
  estimatedTransportCost: number;
  transportCostPerUnit: number;
  estimatedNetRealization: number;
  rating: number;
  score: number;
  isVerified: boolean;
}

export interface NetPriceComparison {
  mandiPrice: number;
  bestBuyerGrossPrice: number;
  transportCostPerUnit: number;
  bestBuyerNetRealization: number;
  betterOption: BetterOption;
}

export interface AIRecommendation {
  decision: RecommendationDecision;
  sellNowQuantity: number;
  holdQuantity: number;
  confidence: number;
  reasoning: string[];
  riskLevel: RiskLevel;
}

/** One step in the agentic ReAct loop — shown in the UI as a live trace */
export interface AgentStep {
  toolName: string;
  toolCallId: string;
  inputArgs: Record<string, unknown>;
  outputSummary: string;
  durationMs: number;
}

export interface AIQueryResult {
  intent: string;
  agentsUsed: string[];
  agentSteps: AgentStep[];
  recommendation?: AIRecommendation;
  forecast?: ForecastResult;
  matchedBuyers?: MatchedBuyer[];
  netPriceComparison?: NetPriceComparison;
  explanation: string;
  dataTimestamp: string;
  executionMs: number;
  provider: string;
}

export interface IncomeSummary {
  totalNetIncome: number;
  totalSoldQuantity: number;
  cropSummaries: Array<{
    id: string;
    cropName: string;
    quantity: number;
    soldQuantity: number;
    unit: string;
    quality: string;
    currentMarketValue: number;
    marketPrice: number;
    storageStatus: string;
  }>;
}

export interface AdminStats {
  farmers: number;
  buyers: number;
  verifiedBuyers: number;
  activeCrops: number;
  activeOffers: number;
  completedTransactions: number;
  marketRecords: number;
  aiRequests: number;
  pendingNotifications: number;
}

export interface QualityAssessment {
  estimatedGrade: string;
  confidence: number;
  estimatedPriceRange: { min: number; max: number };
  observations: string[];
  warning: string;
  success: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: { code: string; message: string; details?: unknown };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
