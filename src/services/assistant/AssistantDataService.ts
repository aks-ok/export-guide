import { worldBankService } from '../api/WorldBankService';
import { dashboardService } from '../DashboardService';
import { cacheManager } from '../CacheManager';
import { errorHandler } from '../ErrorHandler';
import { 
  RecognizedIntent, 
  UserContext, 
  DataVisualization,
  AssistantApiResponse 
} from './types';
import { 
  ApiResponse, 
  TradeStats, 
  MarketData, 
  MarketSearchParams,
  ApiServiceError,
  ApiErrorCode 
} from '../types';

/**
 * AssistantDataService integrates with existing platform services to provide real-time data
 */
export class AssistantDataService {
  private static instance: AssistantDataService;
  private readonly cachePrefix = 'assistant_data_';
  private readonly defaultCacheTTL = 15 * 60 * 1000; // 15 minutes

  private constructor() {}

  public static getInstance(): AssistantDataService {
    if (!AssistantDataService.instance) {
      AssistantDataService.instance = new AssistantDataService();
    }
    return AssistantDataService.instance;
  }

  /**
   * Fetch data based on recognized intent and entities
   */
  async fetchIntentData(
    intent: RecognizedIntent,
    context: UserContext
  ): Promise<AssistantApiResponse> {
    try {
      switch (intent.name) {
        case 'FIND_BUYERS':
          return await this.fetchBuyerData(intent, context);
        
        case 'MARKET_RESEARCH':
          return await this.fetchMarketResearchData(intent, context);
        
        case 'COMPLIANCE_HELP':
          return await this.fetchComplianceData(intent, context);
        
        case 'GENERAL_EXPORT_ADVICE':
          return await this.fetchExportAdviceData(intent, context);
        
        default:
          return {
            success: true,
            data: null,
            metadata: {
              responseTime: 0,
              source: 'assistant',
              cached: false
            }
          };
      }
    } catch (error) {
      errorHandler.handleError(error as ApiServiceError, 'AssistantDataService.fetchIntentData');
      return {
        success: false,
        error: {
          code: 'DATA_FETCH_ERROR',
          message: 'Failed to fetch data for assistant response',
          details: error
        },
        metadata: {
          responseTime: 0,
          source: 'error',
          cached: false
        }
      };
    }
  }

  /**
   * Get trade statistics for specific countries
   */
  async getTradeStatistics(
    countries: string[],
    useCache: boolean = true
  ): Promise<AssistantApiResponse> {
    const startTime = Date.now();
    const cacheKey = `${this.cachePrefix}trade_stats_${countries.join('_')}`;

    try {
      // Check cache first
      if (useCache) {
        const cached = cacheManager.get<TradeStats[]>(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            metadata: {
              responseTime: Date.now() - startTime,
              source: 'cache',
              cached: true
            }
          };
        }
      }

      // Fetch data for each country
      const tradePromises = countries.map(async (countryCode) => {
        try {
          const response = await worldBankService.getTradeStatistics(countryCode);
          return response.success ? response.data : null;
        } catch (error) {
          console.warn(`Failed to fetch trade stats for ${countryCode}:`, error);
          return null;
        }
      });

      const results = await Promise.all(tradePromises);
      const validResults = results.filter(result => result !== null) as TradeStats[];

      // Cache the results
      if (useCache && validResults.length > 0) {
        cacheManager.set(cacheKey, validResults, this.defaultCacheTTL);
      }

      return {
        success: true,
        data: validResults,
        metadata: {
          responseTime: Date.now() - startTime,
          source: 'world_bank_api',
          cached: false
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TRADE_STATS_ERROR',
          message: 'Failed to fetch trade statistics',
          details: error
        },
        metadata: {
          responseTime: Date.now() - startTime,
          source: 'error',
          cached: false
        }
      };
    }
  }

  /**
   * Get market data for specific search parameters
   */
  async getMarketData(
    params: MarketSearchParams,
    useCache: boolean = true
  ): Promise<AssistantApiResponse> {
    const startTime = Date.now();
    const cacheKey = `${this.cachePrefix}market_data_${JSON.stringify(params)}`;

    try {
      // Check cache first
      if (useCache) {
        const cached = cacheManager.get<MarketData[]>(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            metadata: {
              responseTime: Date.now() - startTime,
              source: 'cache',
              cached: true
            }
          };
        }
      }

      // Fetch market data
      const response = await worldBankService.getMarketData(params);
      
      if (!response.success) {
        throw new ApiServiceError(
          ApiErrorCode.INVALID_RESPONSE,
          'Failed to fetch market data',
          true
        );
      }

      // Cache the results
      if (useCache && response.data) {
        cacheManager.set(cacheKey, response.data, this.defaultCacheTTL);
      }

      return {
        success: true,
        data: response.data,
        metadata: {
          responseTime: Date.now() - startTime,
          source: 'world_bank_api',
          cached: false
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MARKET_DATA_ERROR',
          message: 'Failed to fetch market data',
          details: error
        },
        metadata: {
          responseTime: Date.now() - startTime,
          source: 'error',
          cached: false
        }
      };
    }
  }

  /**
   * Get dashboard statistics for context
   */
  async getDashboardStats(useCache: boolean = true): Promise<AssistantApiResponse> {
    const startTime = Date.now();
    const cacheKey = `${this.cachePrefix}dashboard_stats`;

    try {
      // Check cache first
      if (useCache) {
        const cached = cacheManager.get(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            metadata: {
              responseTime: Date.now() - startTime,
              source: 'cache',
              cached: true
            }
          };
        }
      }

      // Fetch dashboard data
      const response = await dashboardService.getDashboardStats();
      
      if (!response.success) {
        throw new ApiServiceError(
          ApiErrorCode.INVALID_RESPONSE,
          'Failed to fetch dashboard statistics',
          true
        );
      }

      // Cache the results
      if (useCache && response.data) {
        cacheManager.set(cacheKey, response.data, this.defaultCacheTTL / 2); // Shorter cache for dashboard
      }

      return {
        success: true,
        data: response.data,
        metadata: {
          responseTime: Date.now() - startTime,
          source: 'dashboard_service',
          cached: false
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DASHBOARD_ERROR',
          message: 'Failed to fetch dashboard statistics',
          details: error
        },
        metadata: {
          responseTime: Date.now() - startTime,
          source: 'error',
          cached: false
        }
      };
    }
  }

  /**
   * Get countries list for suggestions
   */
  async getCountries(useCache: boolean = true): Promise<AssistantApiResponse> {
    const startTime = Date.now();
    const cacheKey = `${this.cachePrefix}countries`;

    try {
      // Check cache first (countries don't change often)
      if (useCache) {
        const cached = cacheManager.get(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            metadata: {
              responseTime: Date.now() - startTime,
              source: 'cache',
              cached: true
            }
          };
        }
      }

      // Fetch countries
      const response = await worldBankService.getCountries();
      
      if (!response.success) {
        throw new ApiServiceError(
          ApiErrorCode.INVALID_RESPONSE,
          'Failed to fetch countries',
          true
        );
      }

      // Cache for longer period (countries don't change often)
      if (useCache && response.data) {
        cacheManager.set(cacheKey, response.data, 7 * 24 * 60 * 60 * 1000); // 1 week
      }

      return {
        success: true,
        data: response.data,
        metadata: {
          responseTime: Date.now() - startTime,
          source: 'world_bank_api',
          cached: false
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COUNTRIES_ERROR',
          message: 'Failed to fetch countries list',
          details: error
        },
        metadata: {
          responseTime: Date.now() - startTime,
          source: 'error',
          cached: false
        }
      };
    }
  }

  /**
   * Create data visualization based on fetched data
   */
  createDataVisualization(
    data: any,
    intent: RecognizedIntent,
    context: UserContext
  ): DataVisualization | undefined {
    try {
      switch (intent.name) {
        case 'MARKET_RESEARCH':
          return this.createMarketResearchVisualization(data, intent);
        
        case 'FIND_BUYERS':
          return this.createBuyerDataVisualization(data, intent);
        
        default:
          return undefined;
      }
    } catch (error) {
      console.error('Error creating data visualization:', error);
      return undefined;
    }
  }

  /**
   * Check if data services are available
   */
  async checkDataAvailability(): Promise<{
    worldBank: boolean;
    dashboard: boolean;
    cache: boolean;
    overall: boolean;
  }> {
    try {
      const [worldBankHealth, dashboardHealth] = await Promise.all([
        worldBankService.healthCheck().catch(() => false),
        this.checkDashboardHealth().catch(() => false)
      ]);

      const cacheHealth = this.checkCacheHealth();

      return {
        worldBank: worldBankHealth,
        dashboard: dashboardHealth,
        cache: cacheHealth,
        overall: worldBankHealth && dashboardHealth && cacheHealth
      };
    } catch (error) {
      return {
        worldBank: false,
        dashboard: false,
        cache: false,
        overall: false
      };
    }
  }

  // Private helper methods

  private async fetchBuyerData(
    intent: RecognizedIntent,
    context: UserContext
  ): Promise<AssistantApiResponse> {
    const countries = this.extractCountriesFromIntent(intent, context);
    
    if (countries.length === 0) {
      return {
        success: true,
        data: {
          message: 'No specific countries identified. Using user profile target markets.',
          suggestedCountries: context.businessProfile.targetMarkets
        }
      };
    }

    return await this.getTradeStatistics(countries);
  }

  private async fetchMarketResearchData(
    intent: RecognizedIntent,
    context: UserContext
  ): Promise<AssistantApiResponse> {
    const countries = this.extractCountriesFromIntent(intent, context);
    const products = this.extractProductsFromIntent(intent, context);
    
    const searchParams: MarketSearchParams = {
      countries: countries.length > 0 ? countries : context.businessProfile.targetMarkets,
      productCategory: products.length > 0 ? products[0] : context.businessProfile.primaryProducts[0]
    };

    return await this.getMarketData(searchParams);
  }

  private async fetchComplianceData(
    intent: RecognizedIntent,
    context: UserContext
  ): Promise<AssistantApiResponse> {
    // For compliance, we might fetch country-specific trade regulations
    const countries = this.extractCountriesFromIntent(intent, context);
    
    return {
      success: true,
      data: {
        countries: countries.length > 0 ? countries : context.businessProfile.targetMarkets,
        complianceResources: [
          'Export documentation requirements',
          'Tariff and duty information',
          'Product certification needs',
          'Regulatory compliance guidelines'
        ]
      }
    };
  }

  private async fetchExportAdviceData(
    intent: RecognizedIntent,
    context: UserContext
  ): Promise<AssistantApiResponse> {
    // Fetch dashboard stats to provide context for advice
    const dashboardData = await this.getDashboardStats();
    
    return {
      success: true,
      data: {
        userProfile: context.businessProfile,
        marketTrends: dashboardData.data,
        recommendedActions: this.generateRecommendedActions(context)
      }
    };
  }

  private extractCountriesFromIntent(intent: RecognizedIntent, context: UserContext): string[] {
    const countries: string[] = [];
    
    if (intent.entities) {
      intent.entities.forEach(entity => {
        if (entity.type === 'COUNTRY') {
          // Convert country names to ISO codes if needed
          const countryCode = this.convertToCountryCode(entity.value);
          if (countryCode) {
            countries.push(countryCode);
          }
        }
      });
    }
    
    return countries;
  }

  private extractProductsFromIntent(intent: RecognizedIntent, context: UserContext): string[] {
    const products: string[] = [];
    
    if (intent.entities) {
      intent.entities.forEach(entity => {
        if (entity.type === 'PRODUCT') {
          products.push(entity.value);
        }
      });
    }
    
    return products;
  }

  private convertToCountryCode(countryName: string): string | null {
    // Simple mapping - in a real implementation, this would be more comprehensive
    const countryMap: Record<string, string> = {
      'united states': 'USA',
      'usa': 'USA',
      'america': 'USA',
      'germany': 'DEU',
      'japan': 'JPN',
      'china': 'CHN',
      'united kingdom': 'GBR',
      'uk': 'GBR',
      'britain': 'GBR',
      'india': 'IND',
      'canada': 'CAN',
      'australia': 'AUS',
      'france': 'FRA',
      'italy': 'ITA',
      'spain': 'ESP',
      'brazil': 'BRA',
      'mexico': 'MEX'
    };
    
    return countryMap[countryName.toLowerCase()] || null;
  }

  private createMarketResearchVisualization(
    data: MarketData[],
    intent: RecognizedIntent
  ): DataVisualization {
    return {
      type: 'chart',
      title: 'Market Analysis',
      description: 'Trade statistics and market opportunities',
      data: data.map(market => ({
        country: market.country,
        marketSize: market.marketSize,
        growthRate: market.growthRate,
        competitionLevel: market.competitionLevel
      })),
      config: {
        chartType: 'bar',
        xAxis: 'country',
        yAxis: 'marketSize',
        colorBy: 'growthRate'
      }
    };
  }

  private createBuyerDataVisualization(
    data: TradeStats[],
    intent: RecognizedIntent
  ): DataVisualization {
    return {
      type: 'table',
      title: 'Trade Statistics',
      description: 'Export and import data for target markets',
      data: data.map(stats => ({
        country: stats.country,
        totalExports: stats.totalExports,
        totalImports: stats.totalImports,
        tradeBalance: stats.totalExports - stats.totalImports
      })),
      config: {
        columns: ['country', 'totalExports', 'totalImports', 'tradeBalance'],
        sortBy: 'totalExports',
        sortOrder: 'desc'
      }
    };
  }

  private generateRecommendedActions(context: UserContext): string[] {
    const actions: string[] = [];
    
    if (context.businessProfile.experienceLevel === 'beginner') {
      actions.push('Start with market research for your primary products');
      actions.push('Focus on countries with lower trade barriers');
      actions.push('Consider working with export consultants');
    } else if (context.businessProfile.experienceLevel === 'intermediate') {
      actions.push('Expand to new geographic markets');
      actions.push('Diversify your product portfolio');
      actions.push('Optimize your supply chain for efficiency');
    } else {
      actions.push('Explore emerging markets with high growth potential');
      actions.push('Consider strategic partnerships or joint ventures');
      actions.push('Implement advanced trade finance solutions');
    }
    
    return actions;
  }

  private async checkDashboardHealth(): Promise<boolean> {
    try {
      const response = await dashboardService.getDashboardStats();
      return response.success;
    } catch (error) {
      return false;
    }
  }

  private checkCacheHealth(): boolean {
    try {
      const testKey = 'health_check_test';
      cacheManager.set(testKey, 'test', 1000);
      const result = cacheManager.get(testKey);
      cacheManager.invalidate(testKey);
      return result === 'test';
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    try {
      // Clear assistant-specific cache entries
      const stats = cacheManager.getStats();
      console.log('Clearing assistant data cache. Current stats:', stats);
      
      // In a real implementation, we'd have a method to clear by prefix
      // For now, we'll clear all cache
      cacheManager.clear();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    try {
      return cacheManager.getStats();
    } catch (error) {
      return { error: 'Failed to get cache stats' };
    }
  }
}

export default AssistantDataService;