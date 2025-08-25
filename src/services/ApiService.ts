import { 
  ApiResponse, 
  ApiError, 
  ApiErrorCode, 
  ApiServiceError, 
  RequestConfig 
} from './types';
import { cacheManager } from './CacheManager';

export class BaseApiService {
  protected baseURL: string;
  protected defaultTimeout: number = 10000; // 10 seconds
  protected defaultRetries: number = 3;
  protected defaultCacheTTL: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      cache = true,
      cacheTTL = this.defaultCacheTTL
    } = config;

    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = this.generateCacheKey(url, options);

    // Try cache first for GET requests
    if (cache && (!options.method || options.method === 'GET')) {
      const cachedData = cacheManager.get<ApiResponse<T>>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    let lastError: ApiServiceError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw this.createApiError(response.status, response.statusText);
        }

        const data = await response.json();
        const apiResponse: ApiResponse<T> = {
          data,
          success: true,
          timestamp: new Date(),
          source: this.constructor.name
        };

        // Cache successful responses
        if (cache && (!options.method || options.method === 'GET')) {
          cacheManager.set(cacheKey, apiResponse, cacheTTL);
        }

        return apiResponse;

      } catch (error) {
        lastError = this.handleError(error);
        
        // Don't retry non-retryable errors
        if (!lastError.retryable) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    // If all retries failed, throw the last error
    throw lastError;
  }

  protected generateCacheKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}_${url}_${this.hashString(body)}`;
  }

  protected hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString();
  }

  protected createApiError(status: number, statusText: string): ApiServiceError {
    switch (status) {
      case 401:
        return new ApiServiceError(
          ApiErrorCode.UNAUTHORIZED,
          'Authentication failed. Please check your API credentials.',
          false
        );
      case 404:
        return new ApiServiceError(
          ApiErrorCode.NOT_FOUND,
          'The requested resource was not found.',
          false
        );
      case 429:
        return new ApiServiceError(
          ApiErrorCode.RATE_LIMIT,
          'Rate limit exceeded. Please try again later.',
          true
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return new ApiServiceError(
          ApiErrorCode.SERVER_ERROR,
          `Server error: ${statusText}`,
          true
        );
      default:
        return new ApiServiceError(
          ApiErrorCode.SERVER_ERROR,
          `HTTP ${status}: ${statusText}`,
          status >= 500
        );
    }
  }

  protected handleError(error: any): ApiServiceError {
    if (error instanceof ApiServiceError) {
      return error;
    }

    if (error.name === 'AbortError') {
      return new ApiServiceError(
        ApiErrorCode.TIMEOUT,
        'Request timed out. Please try again.',
        true
      );
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new ApiServiceError(
        ApiErrorCode.NETWORK_ERROR,
        'Network error. Please check your internet connection.',
        true
      );
    }

    return new ApiServiceError(
      ApiErrorCode.SERVER_ERROR,
      error.message || 'An unexpected error occurred.',
      false,
      error
    );
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, item.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // Utility methods for API health checking
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest<any>('/', {}, { 
        timeout: 5000, 
        retries: 1, 
        cache: false 
      });
      return response.success;
    } catch (error) {
      console.warn(`Health check failed for ${this.baseURL}:`, error);
      return false;
    }
  }

  public getBaseURL(): string {
    return this.baseURL;
  }

  public setDefaultTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
  }

  public setDefaultRetries(retries: number): void {
    this.defaultRetries = retries;
  }

  public setDefaultCacheTTL(ttl: number): void {
    this.defaultCacheTTL = ttl;
  }
}

// Configuration helper
export class ApiConfig {
  private static instance: ApiConfig;
  private config: Map<string, any> = new Map();

  private constructor() {
    this.loadFromEnvironment();
  }

  public static getInstance(): ApiConfig {
    if (!ApiConfig.instance) {
      ApiConfig.instance = new ApiConfig();
    }
    return ApiConfig.instance;
  }

  private loadFromEnvironment(): void {
    // Load configuration from environment variables
    this.config.set('WORLD_BANK_BASE_URL', 
      process.env.REACT_APP_WORLD_BANK_BASE_URL || 'https://api.worldbank.org/v2');
    
    this.config.set('COMTRADE_BASE_URL', 
      process.env.REACT_APP_COMTRADE_BASE_URL || 'https://comtradeapi.un.org/data/v1');
    
    this.config.set('TRADE_GOV_BASE_URL', 
      process.env.REACT_APP_TRADE_GOV_BASE_URL || 'https://api.trade.gov');
    
    this.config.set('COMTRADE_API_KEY', 
      process.env.REACT_APP_COMTRADE_API_KEY);
    
    this.config.set('TRADE_GOV_API_KEY', 
      process.env.REACT_APP_TRADE_GOV_API_KEY);
    
    this.config.set('CACHE_TTL_HOURS', 
      parseInt(process.env.REACT_APP_CACHE_TTL_HOURS || '24'));
    
    this.config.set('ENABLE_REAL_DATA', 
      process.env.REACT_APP_ENABLE_REAL_DATA === 'true');
    
    this.config.set('FALLBACK_TO_MOCK', 
      process.env.REACT_APP_FALLBACK_TO_MOCK !== 'false');
    
    this.config.set('DEBUG_API_CALLS', 
      process.env.REACT_APP_DEBUG_API_CALLS === 'true');
  }

  public get<T>(key: string): T | undefined {
    return this.config.get(key);
  }

  public set<T>(key: string, value: T): void {
    this.config.set(key, value);
  }

  public has(key: string): boolean {
    return this.config.has(key);
  }

  public isRealDataEnabled(): boolean {
    return this.get<boolean>('REACT_APP_ENABLE_REAL_DATA') ?? false;
  }

  public shouldFallbackToMock(): boolean {
    return this.get<boolean>('FALLBACK_TO_MOCK') ?? true;
  }

  public isDebugMode(): boolean {
    return this.get<boolean>('DEBUG_API_CALLS') ?? false;
  }

  public getCacheTTL(): number {
    const hours = this.get<number>('CACHE_TTL_HOURS') ?? 24;
    return hours * 60 * 60 * 1000; // Convert to milliseconds
  }
}

// Export singleton instance
export const apiConfig = ApiConfig.getInstance();