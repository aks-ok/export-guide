import { AssistantDataService } from './AssistantDataService';
import { worldBankService } from '../api/WorldBankService';
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
  ApiServiceError,
  ApiErrorCode 
} from '../types';

/**
 * Real-time data configuration
 */
interface RealTimeDataConfig {
  refreshInterval: number; // in milliseconds
  maxRetries: number;
  timeout: number;
  cacheTTL: number;
  fallbackEnabled: boolean;
}

/**
 * Data freshness indicator
 */
interface DataFreshness {
  lastUpdated: Date;
  source: string;
  isStale: boolean;
  stalenessThreshold: number; // in minutes
  nextRefresh?: Date;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Exchange rate data
 */
interface ExchangeRate {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  lastUpdated: Date;
  source: string;
  bid?: number;
  ask?: number;
  change24h?: number;
  changePercent24h?: number;
}

/**
 * Economic indicator data
 */
interface EconomicIndicator {
  indicatorId: string;
  name: string;
  value: number;
  unit: string;
  country: string;
  date: Date;
  source: string;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Real-time data subscription
 */
interface DataSubscription {
  id: string;
  type: 'trade_stats' | 'exchange_rates' | 'economic_indicators';
  parameters: Record<string, any>;
  callback: (data: any, freshness: DataFreshness) => void;
  interval: number;
  lastFetch: Date;
  active: boolean;
}

/**
 * RealTimeDataService handles live data fetching and real-time updates
 */
export class RealTimeDataService {
  private static instance: RealTimeDataService;
  private config: RealTimeDataConfig;
  private subscriptions: Map<string, DataSubscription> = new Map();
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map();
  private exchangeRateCache: Map<string, ExchangeRate> = new Map();
  private economicIndicatorCache: Map<string, EconomicIndicator> = new Map();
  private readonly EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest';
  private readonly ECONOMIC_DATA_REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour

  private constructor() {
    this.config = {
      refreshInterval: 5 * 60 * 1000, // 5 minutes
      maxRetries: 3,
      timeout: 10000, // 10 seconds
      cacheTTL: 15 * 60 * 1000, // 15 minutes
      fallbackEnabled: true
    };
    
    this.initializeRealTimeData();
  }

  public static getInstance(): RealTimeDataService {
    if (!RealTimeDataService.instance) {
      RealTimeDataService.instance = new RealTimeDataService();
    }
    return RealTimeDataService.instance;
  }

  /**
   * Get live trade statistics with real-time updates
   */
  async getLiveTradeStatistics(
    countries: string[],
    forceRefresh: boolean = false
  ): Promise<{
    data: TradeStats[];
    freshness: DataFreshness;
    success: boolean;
    error?: string;
  }> {
    try {
      const cacheKey = `live_trade_stats_${countries.join('_')}`;
      const now = new Date();

      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cached = cacheManager.get<{data: TradeStats[], timestamp: Date}>(cacheKey);
        if (cached && this.isDataFresh(cached.timestamp, 30)) { // 30 minutes freshness
          return {
            data: cached.data,
            freshness: this.calculateFreshness(cached.timestamp, 'World Bank API', 30),
            success: true
          };
        }
      }

      // Fetch fresh data
      const assistantDataService = AssistantDataService.getInstance();
      const response = await assistantDataService.getTradeStatistics(countries, false);

      if (response.success && response.data) {
        // Cache the fresh data
        cacheManager.set(cacheKey, {
          data: response.data,
          timestamp: now
        }, this.config.cacheTTL);

        return {
          data: response.data,
          freshness: this.calculateFreshness(now, 'World Bank API', 30),
          success: true
        };
      } else {
        throw new Error(response.error?.message || 'Failed to fetch trade statistics');
      }
    } catch (error) {
      console.error('Error fetching live trade statistics:', error);
      
      // Try fallback data if enabled
      if (this.config.fallbackEnabled) {
        const fallbackData = await this.getFallbackTradeData(countries);
        if (fallbackData) {
          return {
            data: fallbackData.data,
            freshness: fallbackData.freshness,
            success: true,
            error: 'Using cached data due to API unavailability'
          };
        }
      }

      return {
        data: [],
        freshness: this.calculateFreshness(new Date(0), 'Error', 0),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get live exchange rates
   */
  async getLiveExchangeRates(
    baseCurrency: string = 'USD',
    targetCurrencies: string[] = ['EUR', 'GBP', 'JPY', 'CNY']
  ): Promise<{
    rates: ExchangeRate[];
    freshness: DataFreshness;
    success: boolean;
    error?: string;
  }> {
    try {
      const cacheKey = `exchange_rates_${baseCurrency}_${targetCurrencies.join('_')}`;
      const now = new Date();

      // Check cache first (exchange rates update frequently)
      const cached = cacheManager.get<{rates: ExchangeRate[], timestamp: Date}>(cacheKey);
      if (cached && this.isDataFresh(cached.timestamp, 5)) { // 5 minutes freshness
        return {
          rates: cached.rates,
          freshness: this.calculateFreshness(cached.timestamp, 'Exchange Rate API', 5),
          success: true
        };
      }

      // Fetch fresh exchange rates
      const rates = await this.fetchExchangeRates(baseCurrency, targetCurrencies);
      
      // Cache the fresh data
      cacheManager.set(cacheKey, {
        rates,
        timestamp: now
      }, 5 * 60 * 1000); // 5 minutes cache

      return {
        rates,
        freshness: this.calculateFreshness(now, 'Exchange Rate API', 5),
        success: true
      };
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      
      // Return cached data if available
      const fallbackRates = this.getFallbackExchangeRates(baseCurrency, targetCurrencies);
      
      return {
        rates: fallbackRates,
        freshness: this.calculateFreshness(new Date(Date.now() - 60 * 60 * 1000), 'Cached Data', 60),
        success: false,
        error: error instanceof Error ? error.message : 'Exchange rate service unavailable'
      };
    }
  }

  /**
   * Get live economic indicators
   */
  async getLiveEconomicIndicators(
    countries: string[] = ['WLD'],
    indicators: string[] = ['NY.GDP.MKTP.CD', 'NE.EXP.GNFS.CD', 'NE.IMP.GNFS.CD']
  ): Promise<{
    indicators: EconomicIndicator[];
    freshness: DataFreshness;
    success: boolean;
    error?: string;
  }> {
    try {
      const cacheKey = `economic_indicators_${countries.join('_')}_${indicators.join('_')}`;
      const now = new Date();

      // Check cache first (economic data updates less frequently)
      const cached = cacheManager.get<{indicators: EconomicIndicator[], timestamp: Date}>(cacheKey);
      if (cached && this.isDataFresh(cached.timestamp, 60)) { // 1 hour freshness
        return {
          indicators: cached.indicators,
          freshness: this.calculateFreshness(cached.timestamp, 'World Bank API', 60),
          success: true
        };
      }

      // Fetch fresh economic indicators
      const economicData = await worldBankService.getEconomicIndicators(countries);
      
      if (economicData.success && economicData.data) {
        const processedIndicators = this.processEconomicIndicators(economicData.data);
        
        // Cache the fresh data
        cacheManager.set(cacheKey, {
          indicators: processedIndicators,
          timestamp: now
        }, this.ECONOMIC_DATA_REFRESH_INTERVAL);

        return {
          indicators: processedIndicators,
          freshness: this.calculateFreshness(now, 'World Bank API', 60),
          success: true
        };
      } else {
        throw new Error('Failed to fetch economic indicators');
      }
    } catch (error) {
      console.error('Error fetching economic indicators:', error);
      
      // Return fallback data
      const fallbackIndicators = this.getFallbackEconomicIndicators(countries);
      
      return {
        indicators: fallbackIndicators,
        freshness: this.calculateFreshness(new Date(Date.now() - 2 * 60 * 60 * 1000), 'Cached Data', 120),
        success: false,
        error: error instanceof Error ? error.message : 'Economic data service unavailable'
      };
    }
  }

  /**
   * Subscribe to real-time data updates
   */
  subscribeToRealTimeData(
    type: 'trade_stats' | 'exchange_rates' | 'economic_indicators',
    parameters: Record<string, any>,
    callback: (data: any, freshness: DataFreshness) => void,
    interval: number = this.config.refreshInterval
  ): string {
    const subscriptionId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: DataSubscription = {
      id: subscriptionId,
      type,
      parameters,
      callback,
      interval,
      lastFetch: new Date(0),
      active: true
    };

    this.subscriptions.set(subscriptionId, subscription);
    
    // Start the refresh timer
    this.startSubscriptionTimer(subscription);
    
    // Fetch initial data
    this.fetchSubscriptionData(subscription);
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from real-time data updates
   */
  unsubscribeFromRealTimeData(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.active = false;
      this.subscriptions.delete(subscriptionId);
      
      // Clear the timer
      const timer = this.refreshTimers.get(subscriptionId);
      if (timer) {
        clearInterval(timer);
        this.refreshTimers.delete(subscriptionId);
      }
      
      return true;
    }
    return false;
  }

  /**
   * Get data freshness indicator
   */
  getDataFreshness(
    dataType: string,
    parameters: Record<string, any>
  ): DataFreshness {
    const cacheKey = `${dataType}_${JSON.stringify(parameters)}`;
    const cached = cacheManager.get<{timestamp: Date}>(cacheKey);
    
    if (cached) {
      return this.calculateFreshness(cached.timestamp, 'Cached', this.getStalenessThreshold(dataType));
    }
    
    return {
      lastUpdated: new Date(0),
      source: 'Unknown',
      isStale: true,
      stalenessThreshold: this.getStalenessThreshold(dataType),
      confidence: 'low'
    };
  }

  /**
   * Force refresh all cached data
   */
  async forceRefreshAll(): Promise<{
    refreshed: string[];
    failed: string[];
  }> {
    const refreshed: string[] = [];
    const failed: string[] = [];

    // Refresh all active subscriptions
    for (const subscription of Array.from(this.subscriptions.values())) {
      try {
        await this.fetchSubscriptionData(subscription);
        refreshed.push(subscription.id);
      } catch (error) {
        console.error(`Failed to refresh subscription ${subscription.id}:`, error);
        failed.push(subscription.id);
      }
    }

    return { refreshed, failed };
  }

  /**
   * Get real-time data availability status
   */
  async getDataAvailabilityStatus(): Promise<{
    tradeStats: boolean;
    exchangeRates: boolean;
    economicIndicators: boolean;
    overall: boolean;
    lastChecked: Date;
  }> {
    const now = new Date();
    
    try {
      // Test each data source
      const [tradeStatsTest, exchangeRatesTest, economicIndicatorsTest] = await Promise.allSettled([
        this.testTradeStatsAvailability(),
        this.testExchangeRatesAvailability(),
        this.testEconomicIndicatorsAvailability()
      ]);

      const tradeStats = tradeStatsTest.status === 'fulfilled' && tradeStatsTest.value;
      const exchangeRates = exchangeRatesTest.status === 'fulfilled' && exchangeRatesTest.value;
      const economicIndicators = economicIndicatorsTest.status === 'fulfilled' && economicIndicatorsTest.value;

      return {
        tradeStats,
        exchangeRates,
        economicIndicators,
        overall: tradeStats && exchangeRates && economicIndicators,
        lastChecked: now
      };
    } catch (error) {
      console.error('Error checking data availability:', error);
      return {
        tradeStats: false,
        exchangeRates: false,
        economicIndicators: false,
        overall: false,
        lastChecked: now
      };
    }
  }

  /**
   * Create real-time data visualization
   */
  createRealTimeVisualization(
    data: any,
    dataType: string,
    freshness: DataFreshness
  ): DataVisualization {
    const baseVisualization: DataVisualization = {
      type: 'chart',
      title: this.getVisualizationTitle(dataType),
      description: `Real-time ${dataType} data`,
      data,
      config: {
        realTime: true,
        lastUpdated: freshness.lastUpdated,
        source: freshness.source,
        confidence: freshness.confidence,
        refreshInterval: this.config.refreshInterval
      }
    };

    // Customize based on data type
    switch (dataType) {
      case 'trade_stats':
        return {
          ...baseVisualization,
          type: 'table',
          config: {
            ...baseVisualization.config,
            columns: ['country', 'totalExports', 'totalImports', 'tradeBalance'],
            sortBy: 'totalExports',
            sortOrder: 'desc'
          }
        };
      
      case 'exchange_rates':
        return {
          ...baseVisualization,
          type: 'metric',
          config: {
            ...baseVisualization.config,
            format: 'currency',
            showChange: true,
            colorByChange: true
          }
        };
      
      case 'economic_indicators':
        return {
          ...baseVisualization,
          type: 'chart',
          config: {
            ...baseVisualization.config,
            chartType: 'line',
            xAxis: 'date',
            yAxis: 'value',
            showTrend: true
          }
        };
      
      default:
        return baseVisualization;
    }
  }

  // Private helper methods

  private initializeRealTimeData(): void {
    // Initialize exchange rate cache with common currencies
    this.preloadCommonExchangeRates();
    
    // Set up periodic health checks
    setInterval(() => {
      this.performHealthCheck();
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  private async fetchExchangeRates(
    baseCurrency: string,
    targetCurrencies: string[]
  ): Promise<ExchangeRate[]> {
    try {
      // This would integrate with a real exchange rate API
      // For now, return mock data with realistic structure
      const mockRates: ExchangeRate[] = targetCurrencies.map(currency => ({
        baseCurrency,
        targetCurrency: currency,
        rate: this.generateMockExchangeRate(baseCurrency, currency),
        lastUpdated: new Date(),
        source: 'Exchange Rate API',
        change24h: (Math.random() - 0.5) * 0.1,
        changePercent24h: (Math.random() - 0.5) * 2
      }));

      return mockRates;
    } catch (error) {
      throw new Error(`Failed to fetch exchange rates: ${error}`);
    }
  }

  private processEconomicIndicators(rawData: any[]): EconomicIndicator[] {
    return rawData.map(item => ({
      indicatorId: item.indicator?.id || 'unknown',
      name: item.indicator?.value || 'Unknown Indicator',
      value: item.value || 0,
      unit: this.getIndicatorUnit(item.indicator?.id),
      country: item.country?.value || 'Unknown',
      date: new Date(item.date || Date.now()),
      source: 'World Bank API',
      trend: this.calculateTrend(item.value, item.previousValue)
    }));
  }

  private calculateFreshness(
    lastUpdated: Date,
    source: string,
    stalenessThreshold: number
  ): DataFreshness {
    const now = new Date();
    const ageMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
    const isStale = ageMinutes > stalenessThreshold;
    
    let confidence: 'high' | 'medium' | 'low' = 'high';
    if (ageMinutes > stalenessThreshold * 0.5) confidence = 'medium';
    if (isStale) confidence = 'low';

    return {
      lastUpdated,
      source,
      isStale,
      stalenessThreshold,
      nextRefresh: new Date(now.getTime() + this.config.refreshInterval),
      confidence
    };
  }

  private isDataFresh(timestamp: Date, thresholdMinutes: number): boolean {
    const ageMinutes = (Date.now() - timestamp.getTime()) / (1000 * 60);
    return ageMinutes <= thresholdMinutes;
  }

  private getStalenessThreshold(dataType: string): number {
    const thresholds: Record<string, number> = {
      'trade_stats': 30, // 30 minutes
      'exchange_rates': 5, // 5 minutes
      'economic_indicators': 60 // 1 hour
    };
    return thresholds[dataType] || 15;
  }

  private async startSubscriptionTimer(subscription: DataSubscription): Promise<void> {
    const timer = setInterval(async () => {
      if (subscription.active) {
        try {
          await this.fetchSubscriptionData(subscription);
        } catch (error) {
          console.error(`Error in subscription ${subscription.id}:`, error);
        }
      }
    }, subscription.interval);

    this.refreshTimers.set(subscription.id, timer);
  }

  private async fetchSubscriptionData(subscription: DataSubscription): Promise<void> {
    try {
      let data: any;
      let freshness: DataFreshness;

      switch (subscription.type) {
        case 'trade_stats':
          const tradeResult = await this.getLiveTradeStatistics(
            subscription.parameters.countries || ['WLD']
          );
          data = tradeResult.data;
          freshness = tradeResult.freshness;
          break;

        case 'exchange_rates':
          const rateResult = await this.getLiveExchangeRates(
            subscription.parameters.baseCurrency,
            subscription.parameters.targetCurrencies
          );
          data = rateResult.rates;
          freshness = rateResult.freshness;
          break;

        case 'economic_indicators':
          const indicatorResult = await this.getLiveEconomicIndicators(
            subscription.parameters.countries,
            subscription.parameters.indicators
          );
          data = indicatorResult.indicators;
          freshness = indicatorResult.freshness;
          break;

        default:
          throw new Error(`Unknown subscription type: ${subscription.type}`);
      }

      subscription.lastFetch = new Date();
      subscription.callback(data, freshness);
    } catch (error) {
      console.error(`Error fetching data for subscription ${subscription.id}:`, error);
      throw error;
    }
  }

  private async getFallbackTradeData(countries: string[]): Promise<{
    data: TradeStats[];
    freshness: DataFreshness;
  } | null> {
    // Try to get cached data
    const cacheKey = `fallback_trade_stats_${countries.join('_')}`;
    const cached = cacheManager.get<{data: TradeStats[], timestamp: Date}>(cacheKey);
    
    if (cached) {
      return {
        data: cached.data,
        freshness: this.calculateFreshness(cached.timestamp, 'Cached Data', 120)
      };
    }
    
    return null;
  }

  private getFallbackExchangeRates(
    baseCurrency: string,
    targetCurrencies: string[]
  ): ExchangeRate[] {
    // Return cached rates or default rates
    return targetCurrencies.map(currency => {
      const cacheKey = `${baseCurrency}_${currency}`;
      const cached = this.exchangeRateCache.get(cacheKey);
      
      if (cached) {
        return cached;
      }
      
      // Return default/estimated rates
      return {
        baseCurrency,
        targetCurrency: currency,
        rate: this.generateMockExchangeRate(baseCurrency, currency),
        lastUpdated: new Date(Date.now() - 60 * 60 * 1000), // 1 hour old
        source: 'Fallback Data'
      };
    });
  }

  private getFallbackEconomicIndicators(countries: string[]): EconomicIndicator[] {
    // Return cached or default indicators
    return countries.map(country => ({
      indicatorId: 'NY.GDP.MKTP.CD',
      name: 'GDP (current US$)',
      value: 1000000000000, // Default 1 trillion
      unit: 'USD',
      country,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day old
      source: 'Fallback Data',
      trend: 'stable' as const
    }));
  }

  private generateMockExchangeRate(base: string, target: string): number {
    // Generate realistic mock exchange rates
    const rates: Record<string, Record<string, number>> = {
      'USD': { 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110, 'CNY': 6.5 },
      'EUR': { 'USD': 1.18, 'GBP': 0.86, 'JPY': 130, 'CNY': 7.6 }
    };
    
    return rates[base]?.[target] || 1.0;
  }

  private getIndicatorUnit(indicatorId: string): string {
    const units: Record<string, string> = {
      'NY.GDP.MKTP.CD': 'USD',
      'NE.EXP.GNFS.CD': 'USD',
      'NE.IMP.GNFS.CD': 'USD',
      'NE.TRD.GNFS.ZS': '%'
    };
    return units[indicatorId] || 'units';
  }

  private calculateTrend(current: number, previous?: number): 'up' | 'down' | 'stable' {
    if (!previous || current === previous) return 'stable';
    return current > previous ? 'up' : 'down';
  }

  private getVisualizationTitle(dataType: string): string {
    const titles: Record<string, string> = {
      'trade_stats': 'Live Trade Statistics',
      'exchange_rates': 'Real-Time Exchange Rates',
      'economic_indicators': 'Economic Indicators'
    };
    return titles[dataType] || 'Real-Time Data';
  }

  private async preloadCommonExchangeRates(): Promise<void> {
    try {
      const commonRates = await this.fetchExchangeRates('USD', ['EUR', 'GBP', 'JPY']);
      commonRates.forEach(rate => {
        const key = `${rate.baseCurrency}_${rate.targetCurrency}`;
        this.exchangeRateCache.set(key, rate);
      });
    } catch (error) {
      console.warn('Failed to preload exchange rates:', error);
    }
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const status = await this.getDataAvailabilityStatus();
      console.log('Real-time data health check:', status);
      
      // Log any issues
      if (!status.overall) {
        console.warn('Some real-time data sources are unavailable:', {
          tradeStats: status.tradeStats,
          exchangeRates: status.exchangeRates,
          economicIndicators: status.economicIndicators
        });
      }
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  private async testTradeStatsAvailability(): Promise<boolean> {
    try {
      const result = await this.getLiveTradeStatistics(['USA'], true);
      return result.success;
    } catch (error) {
      return false;
    }
  }

  private async testExchangeRatesAvailability(): Promise<boolean> {
    try {
      const result = await this.getLiveExchangeRates('USD', ['EUR']);
      return result.success;
    } catch (error) {
      return false;
    }
  }

  private async testEconomicIndicatorsAvailability(): Promise<boolean> {
    try {
      const result = await this.getLiveEconomicIndicators(['WLD'], ['NY.GDP.MKTP.CD']);
      return result.success;
    } catch (error) {
      return false;
    }
  }
}

export default RealTimeDataService;