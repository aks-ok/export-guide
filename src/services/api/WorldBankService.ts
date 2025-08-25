import { BaseApiService, apiConfig } from '../ApiService';
import { 
  ApiResponse, 
  TradeStats, 
  MarketData, 
  MarketSearchParams,
  ApiServiceError,
  ApiErrorCode 
} from '../types';
import { 
  WorldBankTransformer, 
  WorldBankResponse, 
  WorldBankIndicator, 
  WorldBankCountry 
} from '../transformers/WorldBankTransformer';
import { DataValidator } from '../transformers/DataValidator';

export class WorldBankService extends BaseApiService {
  private readonly apiVersion = 'v2';
  private readonly format = 'json';
  private readonly perPage = 1000;

  constructor() {
    const baseURL = apiConfig.get<string>('WORLD_BANK_BASE_URL') || 'https://api.worldbank.org/v2';
    super(baseURL);
    
    // World Bank API has a rate limit of 120 requests per minute
    this.setDefaultTimeout(15000); // 15 seconds
    this.setDefaultRetries(2);
  }

  /**
   * Get trade statistics for a specific country
   */
  async getTradeStatistics(countryCode: string = 'WLD'): Promise<ApiResponse<TradeStats>> {
    try {
      const indicators = WorldBankTransformer.getTradeIndicators();
      const indicatorString = indicators.join(';');
      
      const endpoint = `/country/${countryCode}/indicator/${indicatorString}`;
      const queryParams = this.buildQueryString({
        format: this.format,
        per_page: this.perPage,
        date: '2018:2023', // Last 5 years
        source: 2 // World Development Indicators
      });

      const response = await this.makeRequest<WorldBankIndicator[]>(
        `${endpoint}${queryParams}`,
        {},
        { cacheTTL: apiConfig.getCacheTTL() }
      );

      if (!response.data || response.data.length === 0) {
        throw new ApiServiceError(
          ApiErrorCode.NOT_FOUND,
          `No trade data found for country: ${countryCode}`,
          false
        );
      }

      // Get country name
      const countryName = await this.getCountryName(countryCode);
      
      // Transform the data
      const tradeStats = WorldBankTransformer.transformToTradeStats(
        response.data,
        countryCode,
        countryName
      );

      // Validate the transformed data
      const validation = DataValidator.validateTradeStats(tradeStats);
      if (!validation.isValid) {
        console.warn('Trade stats validation warnings:', validation.warnings);
        if (validation.errors.length > 0) {
          throw new ApiServiceError(
            ApiErrorCode.INVALID_RESPONSE,
            `Invalid trade statistics data: ${validation.errors.join(', ')}`,
            false
          );
        }
      }

      return {
        data: tradeStats,
        success: true,
        timestamp: new Date(),
        source: 'World Bank API'
      };

    } catch (error) {
      if (error instanceof ApiServiceError) {
        throw error;
      }
      throw new ApiServiceError(
        ApiErrorCode.SERVER_ERROR,
        `Failed to fetch trade statistics: ${error.message}`,
        true,
        error
      );
    }
  }

  /**
   * Get market data for multiple countries and a specific product category
   */
  async getMarketData(params: MarketSearchParams): Promise<ApiResponse<MarketData[]>> {
    try {
      const { countries, productCategory = 'General' } = params;
      
      // Use major economies if no specific countries provided
      const targetCountries = countries && countries.length > 0 
        ? countries 
        : WorldBankTransformer.getMajorEconomies().slice(0, 10);

      const indicators = WorldBankTransformer.getTradeIndicators();
      const indicatorString = indicators.join(';');
      const countryString = targetCountries.join(';');
      
      const endpoint = `/country/${countryString}/indicator/${indicatorString}`;
      const queryParams = this.buildQueryString({
        format: this.format,
        per_page: this.perPage,
        date: '2020:2023', // Last 3 years for market data
        source: 2
      });

      const response = await this.makeRequest<WorldBankIndicator[]>(
        `${endpoint}${queryParams}`,
        {},
        { cacheTTL: apiConfig.getCacheTTL() }
      );

      if (!response.data || response.data.length === 0) {
        throw new ApiServiceError(
          ApiErrorCode.NOT_FOUND,
          'No market data found for the specified criteria',
          false
        );
      }

      // Transform the data
      const marketData = WorldBankTransformer.transformToMarketData(
        response.data,
        productCategory
      );

      // Apply filters
      const filteredData = this.applyMarketFilters(marketData, params);

      // Validate each market data entry
      const validatedData = filteredData.filter(data => {
        const validation = DataValidator.validateMarketData(data);
        if (!validation.isValid) {
          console.warn(`Invalid market data for ${data.country}:`, validation.errors);
          return false;
        }
        return true;
      });

      return {
        data: validatedData,
        success: true,
        timestamp: new Date(),
        source: 'World Bank API'
      };

    } catch (error) {
      if (error instanceof ApiServiceError) {
        throw error;
      }
      throw new ApiServiceError(
        ApiErrorCode.SERVER_ERROR,
        `Failed to fetch market data: ${error.message}`,
        true,
        error
      );
    }
  }

  /**
   * Get economic indicators for dashboard statistics
   */
  async getEconomicIndicators(countries: string[] = ['WLD']): Promise<ApiResponse<any>> {
    try {
      const indicators = [
        'NY.GDP.MKTP.CD', // GDP
        'NE.EXP.GNFS.CD', // Exports
        'NE.IMP.GNFS.CD', // Imports
        'NE.TRD.GNFS.ZS'  // Trade as % of GDP
      ];
      
      const indicatorString = indicators.join(';');
      const countryString = countries.join(';');
      
      const endpoint = `/country/${countryString}/indicator/${indicatorString}`;
      const queryParams = this.buildQueryString({
        format: this.format,
        per_page: this.perPage,
        date: '2022:2023', // Latest 2 years
        source: 2
      });

      const response = await this.makeRequest<WorldBankIndicator[]>(
        `${endpoint}${queryParams}`,
        {},
        { cacheTTL: apiConfig.getCacheTTL() / 2 } // Shorter cache for dashboard data
      );

      return {
        data: response.data || [],
        success: true,
        timestamp: new Date(),
        source: 'World Bank API'
      };

    } catch (error) {
      if (error instanceof ApiServiceError) {
        throw error;
      }
      throw new ApiServiceError(
        ApiErrorCode.SERVER_ERROR,
        `Failed to fetch economic indicators: ${error.message}`,
        true,
        error
      );
    }
  }

  /**
   * Get list of all countries
   */
  async getCountries(): Promise<ApiResponse<any[]>> {
    try {
      const endpoint = '/country';
      const queryParams = this.buildQueryString({
        format: this.format,
        per_page: this.perPage
      });

      const response = await this.makeRequest<WorldBankCountry[]>(
        `${endpoint}${queryParams}`,
        {},
        { cacheTTL: 7 * 24 * 60 * 60 * 1000 } // Cache for 1 week
      );

      if (!response.data) {
        throw new ApiServiceError(
          ApiErrorCode.NOT_FOUND,
          'No country data available',
          false
        );
      }

      const countries = WorldBankTransformer.transformCountries(response.data);

      return {
        data: countries,
        success: true,
        timestamp: new Date(),
        source: 'World Bank API'
      };

    } catch (error) {
      if (error instanceof ApiServiceError) {
        throw error;
      }
      throw new ApiServiceError(
        ApiErrorCode.SERVER_ERROR,
        `Failed to fetch countries: ${error.message}`,
        true,
        error
      );
    }
  }

  /**
   * Search for specific indicators
   */
  async searchIndicators(query: string): Promise<ApiResponse<any[]>> {
    try {
      const endpoint = '/indicator';
      const queryParams = this.buildQueryString({
        format: this.format,
        per_page: 100,
        source: 2
      });

      const response = await this.makeRequest<any[]>(
        `${endpoint}${queryParams}`,
        {},
        { cacheTTL: 24 * 60 * 60 * 1000 } // Cache for 1 day
      );

      if (!response.data) {
        return {
          data: [],
          success: true,
          timestamp: new Date(),
          source: 'World Bank API'
        };
      }

      // Filter indicators based on query
      const filteredIndicators = response.data.filter(indicator => 
        indicator.name?.toLowerCase().includes(query.toLowerCase()) ||
        indicator.id?.toLowerCase().includes(query.toLowerCase())
      );

      return {
        data: filteredIndicators,
        success: true,
        timestamp: new Date(),
        source: 'World Bank API'
      };

    } catch (error) {
      if (error instanceof ApiServiceError) {
        throw error;
      }
      throw new ApiServiceError(
        ApiErrorCode.SERVER_ERROR,
        `Failed to search indicators: ${error.message}`,
        true,
        error
      );
    }
  }

  // Private helper methods
  private async getCountryName(countryCode: string): Promise<string> {
    try {
      const endpoint = `/country/${countryCode}`;
      const queryParams = this.buildQueryString({
        format: this.format
      });

      const response = await this.makeRequest<WorldBankCountry[]>(
        `${endpoint}${queryParams}`,
        {},
        { cacheTTL: 7 * 24 * 60 * 60 * 1000 } // Cache for 1 week
      );

      return response.data?.[0]?.name || countryCode;
    } catch (error) {
      console.warn(`Failed to get country name for ${countryCode}:`, error);
      return countryCode;
    }
  }

  private applyMarketFilters(data: MarketData[], params: MarketSearchParams): MarketData[] {
    let filtered = [...data];

    if (params.minMarketSize) {
      filtered = filtered.filter(item => item.marketSize >= params.minMarketSize!);
    }

    if (params.maxTariffRate) {
      filtered = filtered.filter(item => item.tariffRate <= params.maxTariffRate!);
    }

    if (params.minGrowthRate) {
      filtered = filtered.filter(item => item.growthRate >= params.minGrowthRate!);
    }

    if (params.competitionLevel && params.competitionLevel.length > 0) {
      filtered = filtered.filter(item => params.competitionLevel!.includes(item.competitionLevel));
    }

    return filtered;
  }

  /**
   * Check if World Bank API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const endpoint = '/country/USA/indicator/NY.GDP.MKTP.CD';
      const queryParams = this.buildQueryString({
        format: this.format,
        per_page: 1,
        date: '2023'
      });

      await this.makeRequest<any>(
        `${endpoint}${queryParams}`,
        {},
        { timeout: 5000, retries: 1, cache: false }
      );

      return true;
    } catch (error) {
      console.warn('World Bank API health check failed:', error);
      return false;
    }
  }

  /**
   * Get API usage statistics
   */
  getUsageStats(): {
    baseURL: string;
    timeout: number;
    retries: number;
    cacheTTL: number;
  } {
    return {
      baseURL: this.baseURL,
      timeout: this.defaultTimeout,
      retries: this.defaultRetries,
      cacheTTL: this.defaultCacheTTL
    };
  }
}

// Export singleton instance
export const worldBankService = new WorldBankService();