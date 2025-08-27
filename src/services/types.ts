// API Service Types and Interfaces

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: Date;
  source: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
  key: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
}

// Market Data Types
export interface MarketData {
  id: string;
  country: string;
  countryCode: string;
  productCategory: string;
  marketSize: number;
  growthRate: number;
  competitionLevel: 'low' | 'medium' | 'high';
  tariffRate: number;
  tradeVolume: number;
  lastUpdated: Date;
  source: string;
  reliability: 'high' | 'medium' | 'low';
}

export interface TradeStats {
  country: string;
  countryCode: string;
  totalExports: number;
  totalImports: number;
  tradeBalance: number;
  topExportProducts: ProductStat[];
  topImportProducts: ProductStat[];
  tradingPartners: TradingPartner[];
  period: string;
  source: string;
  lastUpdated: Date;
}

export interface ProductStat {
  productCode: string;
  productName: string;
  value: number;
  percentage: number;
  growthRate?: number;
}

export interface TradingPartner {
  country: string;
  countryCode: string;
  tradeValue: number;
  percentage: number;
  tradeType: 'export' | 'import' | 'both';
}

export interface ExportOpportunity {
  id: string;
  title: string;
  description: string;
  country: string;
  countryCode: string;
  productCategory: string;
  estimatedValue: number;
  deadline?: Date;
  requirements: string[];
  contactInfo: ContactInfo;
  source: string;
  verified: boolean;
  postedDate: Date;
  opportunityScore: number;
}

export interface ContactInfo {
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
}

// Search and Filter Types
export interface MarketSearchParams {
  productCategory?: string;
  countries?: string[];
  minMarketSize?: number;
  maxTariffRate?: number;
  minGrowthRate?: number;
  competitionLevel?: ('low' | 'medium' | 'high')[];
}

export interface OpportunityFilters {
  countries?: string[];
  productCategories?: string[];
  minValue?: number;
  maxValue?: number;
  verified?: boolean;
  postedAfter?: Date;
}

export interface BuyerSearch {
  country?: string;
  productCategory?: string;
  companySize?: 'small' | 'medium' | 'large';
  verified?: boolean;
}

// Dashboard Types
export interface DashboardStats {
  activeLeads: number;
  exportValue: number;
  activeBuyers: number;
  complianceScore: number;
  leadsChange: number;
  exportChange: number;
  buyersChange: number;
  complianceChange: number;
  lastUpdated: Date;
}

export interface PerformanceMetrics {
  leadConversionRate: number;
  marketCoverage: number;
  complianceScore: number;
  averageResponseTime: number;
  apiCallsToday: number;
  cacheHitRate: number;
}

// API Service Interface
export interface DataService {
  getMarketData(params: MarketSearchParams): Promise<ApiResponse<MarketData[]>>;
  getTradeStatistics(countryCode?: string): Promise<ApiResponse<TradeStats>>;
  getExportOpportunities(filters: OpportunityFilters): Promise<ApiResponse<ExportOpportunity[]>>;
  getDashboardStats(): Promise<ApiResponse<DashboardStats>>;
  getPerformanceMetrics(): Promise<ApiResponse<PerformanceMetrics>>;
}

// Cache Manager Interface
export interface CacheManager {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, ttl?: number): void;
  invalidate(pattern: string): void;
  clear(): void;
  isExpired(key: string): boolean;
  getStats(): CacheStats;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  totalSize: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}

// Error Types
export enum ApiErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  CACHE_ERROR = 'CACHE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  NO_DATA = 'NO_DATA'
}

export class ApiServiceError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public retryable: boolean = false,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiServiceError';
  }
}