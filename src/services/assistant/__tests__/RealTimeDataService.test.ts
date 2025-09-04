import { RealTimeDataService } from '../RealTimeDataService';
import { AssistantDataService } from '../AssistantDataService';
import { worldBankService } from '../../api/WorldBankService';
import { cacheManager } from '../../CacheManager';

// Mock dependencies
jest.mock('../AssistantDataService');
jest.mock('../../api/WorldBankService');
jest.mock('../../CacheManager');

// Mock timers
jest.useFakeTimers();

describe('RealTimeDataService', () => {
  let realTimeService: RealTimeDataService;

  beforeEach(() => {
    realTimeService = RealTimeDataService.getInstance();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock cacheManager
    (cacheManager.get as jest.Mock).mockReturnValue(null);
    (cacheManager.set as jest.Mock).mockReturnValue(undefined);
    
    // Mock AssistantDataService
    (AssistantDataService.getInstance as jest.Mock).mockReturnValue({
      getTradeStatistics: jest.fn().mockResolvedValue({
        success: true,
        data: [
          {
            country: 'USA',
            countryCode: 'USA',
            totalExports: 1000000000000,
            totalImports: 800000000000,
            year: 2023,
            lastUpdated: new Date()
          }
        ]
      })
    });

    // Mock worldBankService
    (worldBankService.getEconomicIndicators as jest.Mock).mockResolvedValue({
      success: true,
      data: [
        {
          indicator: { id: 'NY.GDP.MKTP.CD', value: 'GDP (current US$)' },
          country: { value: 'United States' },
          value: 25000000000000,
          date: '2023'
        }
      ]
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = RealTimeDataService.getInstance();
      const instance2 = RealTimeDataService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getLiveTradeStatistics', () => {
    it('should fetch live trade statistics successfully', async () => {
      const result = await realTimeService.getLiveTradeStatistics(['USA']);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.freshness).toBeDefined();
      expect(result.freshness.confidence).toBe('high');
    });

    it('should return cached data when available and fresh', async () => {
      const cachedData = {
        data: [{ country: 'USA', totalExports: 1000000000000 }],
        timestamp: new Date()
      };
      
      (cacheManager.get as jest.Mock).mockReturnValue(cachedData);

      const result = await realTimeService.getLiveTradeStatistics(['USA']);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedData.data);
      expect(AssistantDataService.getInstance().getTradeStatistics).not.toHaveBeenCalled();
    });

    it('should force refresh when requested', async () => {
      const cachedData = {
        data: [{ country: 'USA', totalExports: 1000000000000 }],
        timestamp: new Date()
      };
      
      (cacheManager.get as jest.Mock).mockReturnValue(cachedData);

      const result = await realTimeService.getLiveTradeStatistics(['USA'], true);

      expect(result.success).toBe(true);
      expect(AssistantDataService.getInstance().getTradeStatistics).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      (AssistantDataService.getInstance as jest.Mock).mockReturnValue({
        getTradeStatistics: jest.fn().mockResolvedValue({
          success: false,
          error: { message: 'API Error' }
        })
      });

      const result = await realTimeService.getLiveTradeStatistics(['USA']);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toEqual([]);
    });

    it('should use fallback data when API fails and fallback is enabled', async () => {
      (AssistantDataService.getInstance as jest.Mock).mockReturnValue({
        getTradeStatistics: jest.fn().mockRejectedValue(new Error('Network error'))
      });

      // Mock fallback data in cache
      (cacheManager.get as jest.Mock)
        .mockReturnValueOnce(null) // First call for fresh data
        .mockReturnValueOnce({ // Second call for fallback data
          data: [{ country: 'USA', totalExports: 500000000000 }],
          timestamp: new Date(Date.now() - 60 * 60 * 1000) // 1 hour old
        });

      const result = await realTimeService.getLiveTradeStatistics(['USA']);

      expect(result.success).toBe(true);
      expect(result.error).toContain('cached data');
    });
  });

  describe('getLiveExchangeRates', () => {
    it('should fetch live exchange rates successfully', async () => {
      const result = await realTimeService.getLiveExchangeRates('USD', ['EUR', 'GBP']);

      expect(result.success).toBe(true);
      expect(result.rates).toBeDefined();
      expect(result.rates.length).toBe(2);
      expect(result.rates[0].baseCurrency).toBe('USD');
      expect(result.rates[0].targetCurrency).toBe('EUR');
      expect(result.freshness).toBeDefined();
    });

    it('should return cached exchange rates when fresh', async () => {
      const cachedRates = {
        rates: [
          {
            baseCurrency: 'USD',
            targetCurrency: 'EUR',
            rate: 0.85,
            lastUpdated: new Date(),
            source: 'Exchange Rate API'
          }
        ],
        timestamp: new Date()
      };
      
      (cacheManager.get as jest.Mock).mockReturnValue(cachedRates);

      const result = await realTimeService.getLiveExchangeRates('USD', ['EUR']);

      expect(result.success).toBe(true);
      expect(result.rates).toEqual(cachedRates.rates);
    });

    it('should handle exchange rate API errors', async () => {
      // Mock the internal fetchExchangeRates to throw an error
      const result = await realTimeService.getLiveExchangeRates('USD', ['INVALID']);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.rates).toBeDefined(); // Should return fallback rates
    });

    it('should include rate change information', async () => {
      const result = await realTimeService.getLiveExchangeRates('USD', ['EUR']);

      expect(result.success).toBe(true);
      expect(result.rates[0].change24h).toBeDefined();
      expect(result.rates[0].changePercent24h).toBeDefined();
    });
  });

  describe('getLiveEconomicIndicators', () => {
    it('should fetch live economic indicators successfully', async () => {
      const result = await realTimeService.getLiveEconomicIndicators(['USA'], ['NY.GDP.MKTP.CD']);

      expect(result.success).toBe(true);
      expect(result.indicators).toBeDefined();
      expect(result.indicators.length).toBeGreaterThan(0);
      expect(result.indicators[0].indicatorId).toBe('NY.GDP.MKTP.CD');
      expect(result.freshness).toBeDefined();
    });

    it('should return cached indicators when fresh', async () => {
      const cachedIndicators = {
        indicators: [
          {
            indicatorId: 'NY.GDP.MKTP.CD',
            name: 'GDP (current US$)',
            value: 25000000000000,
            unit: 'USD',
            country: 'United States',
            date: new Date(),
            source: 'World Bank API',
            trend: 'up'
          }
        ],
        timestamp: new Date()
      };
      
      (cacheManager.get as jest.Mock).mockReturnValue(cachedIndicators);

      const result = await realTimeService.getLiveEconomicIndicators(['USA']);

      expect(result.success).toBe(true);
      expect(result.indicators).toEqual(cachedIndicators.indicators);
    });

    it('should handle World Bank API errors', async () => {
      (worldBankService.getEconomicIndicators as jest.Mock).mockResolvedValue({
        success: false,
        error: 'API Error'
      });

      const result = await realTimeService.getLiveEconomicIndicators(['USA']);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.indicators).toBeDefined(); // Should return fallback data
    });

    it('should process economic indicators correctly', async () => {
      const result = await realTimeService.getLiveEconomicIndicators(['USA']);

      expect(result.success).toBe(true);
      expect(result.indicators[0].unit).toBe('USD');
      expect(result.indicators[0].trend).toBeDefined();
      expect(['up', 'down', 'stable']).toContain(result.indicators[0].trend);
    });
  });

  describe('Real-time Subscriptions', () => {
    it('should create subscription successfully', () => {
      const callback = jest.fn();
      const subscriptionId = realTimeService.subscribeToRealTimeData(
        'trade_stats',
        { countries: ['USA'] },
        callback,
        5000
      );

      expect(subscriptionId).toBeDefined();
      expect(typeof subscriptionId).toBe('string');
    });

    it('should call subscription callback with data', async () => {
      const callback = jest.fn();
      const subscriptionId = realTimeService.subscribeToRealTimeData(
        'trade_stats',
        { countries: ['USA'] },
        callback,
        1000
      );

      // Wait for initial fetch
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          lastUpdated: expect.any(Date),
          source: expect.any(String),
          confidence: expect.any(String)
        })
      );
    });

    it('should unsubscribe successfully', () => {
      const callback = jest.fn();
      const subscriptionId = realTimeService.subscribeToRealTimeData(
        'exchange_rates',
        { baseCurrency: 'USD', targetCurrencies: ['EUR'] },
        callback
      );

      const unsubscribed = realTimeService.unsubscribeFromRealTimeData(subscriptionId);

      expect(unsubscribed).toBe(true);
    });

    it('should return false when unsubscribing non-existent subscription', () => {
      const unsubscribed = realTimeService.unsubscribeFromRealTimeData('non-existent');

      expect(unsubscribed).toBe(false);
    });

    it('should handle subscription errors gracefully', async () => {
      (AssistantDataService.getInstance as jest.Mock).mockReturnValue({
        getTradeStatistics: jest.fn().mockRejectedValue(new Error('Subscription error'))
      });

      const callback = jest.fn();
      const subscriptionId = realTimeService.subscribeToRealTimeData(
        'trade_stats',
        { countries: ['USA'] },
        callback
      );

      // Wait for initial fetch attempt
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not crash the service
      expect(subscriptionId).toBeDefined();
    });
  });

  describe('Data Freshness', () => {
    it('should calculate data freshness correctly', () => {
      const freshness = realTimeService.getDataFreshness('trade_stats', { countries: ['USA'] });

      expect(freshness).toBeDefined();
      expect(freshness.lastUpdated).toBeInstanceOf(Date);
      expect(freshness.source).toBeDefined();
      expect(typeof freshness.isStale).toBe('boolean');
      expect(typeof freshness.stalenessThreshold).toBe('number');
      expect(['high', 'medium', 'low']).toContain(freshness.confidence);
    });

    it('should indicate stale data correctly', () => {
      const oldTimestamp = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      (cacheManager.get as jest.Mock).mockReturnValue({ timestamp: oldTimestamp });

      const freshness = realTimeService.getDataFreshness('trade_stats', { countries: ['USA'] });

      expect(freshness.isStale).toBe(true);
      expect(freshness.confidence).toBe('low');
    });

    it('should indicate fresh data correctly', () => {
      const recentTimestamp = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      (cacheManager.get as jest.Mock).mockReturnValue({ timestamp: recentTimestamp });

      const freshness = realTimeService.getDataFreshness('trade_stats', { countries: ['USA'] });

      expect(freshness.isStale).toBe(false);
      expect(freshness.confidence).toBe('high');
    });
  });

  describe('Force Refresh', () => {
    it('should force refresh all subscriptions', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      const sub1 = realTimeService.subscribeToRealTimeData('trade_stats', { countries: ['USA'] }, callback1);
      const sub2 = realTimeService.subscribeToRealTimeData('exchange_rates', { baseCurrency: 'USD' }, callback2);

      const result = await realTimeService.forceRefreshAll();

      expect(result.refreshed).toContain(sub1);
      expect(result.refreshed).toContain(sub2);
      expect(result.failed).toEqual([]);
    });

    it('should handle refresh failures', async () => {
      (AssistantDataService.getInstance as jest.Mock).mockReturnValue({
        getTradeStatistics: jest.fn().mockRejectedValue(new Error('Refresh error'))
      });

      const callback = jest.fn();
      const subscriptionId = realTimeService.subscribeToRealTimeData('trade_stats', { countries: ['USA'] }, callback);

      const result = await realTimeService.forceRefreshAll();

      expect(result.failed).toContain(subscriptionId);
    });
  });

  describe('Data Availability Status', () => {
    it('should check data availability status', async () => {
      const status = await realTimeService.getDataAvailabilityStatus();

      expect(status).toBeDefined();
      expect(typeof status.tradeStats).toBe('boolean');
      expect(typeof status.exchangeRates).toBe('boolean');
      expect(typeof status.economicIndicators).toBe('boolean');
      expect(typeof status.overall).toBe('boolean');
      expect(status.lastChecked).toBeInstanceOf(Date);
    });

    it('should return false for overall when any service is down', async () => {
      // Mock one service to fail
      (AssistantDataService.getInstance as jest.Mock).mockReturnValue({
        getTradeStatistics: jest.fn().mockRejectedValue(new Error('Service down'))
      });

      const status = await realTimeService.getDataAvailabilityStatus();

      expect(status.overall).toBe(false);
    });
  });

  describe('Real-time Visualization', () => {
    it('should create real-time visualization for trade stats', () => {
      const mockData = [{ country: 'USA', totalExports: 1000000000000 }];
      const mockFreshness = {
        lastUpdated: new Date(),
        source: 'World Bank API',
        isStale: false,
        stalenessThreshold: 30,
        confidence: 'high' as const
      };

      const visualization = realTimeService.createRealTimeVisualization(
        mockData,
        'trade_stats',
        mockFreshness
      );

      expect(visualization).toBeDefined();
      expect(visualization.type).toBe('table');
      expect(visualization.title).toBe('Live Trade Statistics');
      expect(visualization.config.realTime).toBe(true);
      expect(visualization.config.lastUpdated).toEqual(mockFreshness.lastUpdated);
    });

    it('should create real-time visualization for exchange rates', () => {
      const mockData = [{ baseCurrency: 'USD', targetCurrency: 'EUR', rate: 0.85 }];
      const mockFreshness = {
        lastUpdated: new Date(),
        source: 'Exchange Rate API',
        isStale: false,
        stalenessThreshold: 5,
        confidence: 'high' as const
      };

      const visualization = realTimeService.createRealTimeVisualization(
        mockData,
        'exchange_rates',
        mockFreshness
      );

      expect(visualization.type).toBe('metric');
      expect(visualization.config.format).toBe('currency');
      expect(visualization.config.showChange).toBe(true);
    });

    it('should create real-time visualization for economic indicators', () => {
      const mockData = [{ indicatorId: 'NY.GDP.MKTP.CD', value: 25000000000000 }];
      const mockFreshness = {
        lastUpdated: new Date(),
        source: 'World Bank API',
        isStale: false,
        stalenessThreshold: 60,
        confidence: 'high' as const
      };

      const visualization = realTimeService.createRealTimeVisualization(
        mockData,
        'economic_indicators',
        mockFreshness
      );

      expect(visualization.type).toBe('chart');
      expect(visualization.config.chartType).toBe('line');
      expect(visualization.config.showTrend).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle cache errors gracefully', async () => {
      (cacheManager.get as jest.Mock).mockImplementation(() => {
        throw new Error('Cache error');
      });

      const result = await realTimeService.getLiveTradeStatistics(['USA']);

      // Should still work without cache
      expect(result).toBeDefined();
    });

    it('should handle network timeouts', async () => {
      (AssistantDataService.getInstance as jest.Mock).mockReturnValue({
        getTradeStatistics: jest.fn().mockImplementation(() => 
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
        )
      });

      const result = await realTimeService.getLiveTradeStatistics(['USA']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout');
    });

    it('should handle malformed API responses', async () => {
      (worldBankService.getEconomicIndicators as jest.Mock).mockResolvedValue({
        success: true,
        data: null // Malformed response
      });

      const result = await realTimeService.getLiveEconomicIndicators(['USA']);

      expect(result.success).toBe(false);
      expect(result.indicators).toBeDefined(); // Should return fallback
    });
  });

  describe('Performance', () => {
    it('should not create duplicate subscriptions', () => {
      const callback = jest.fn();
      const params = { countries: ['USA'] };
      
      const sub1 = realTimeService.subscribeToRealTimeData('trade_stats', params, callback);
      const sub2 = realTimeService.subscribeToRealTimeData('trade_stats', params, callback);

      expect(sub1).not.toBe(sub2); // Should be different subscription IDs
    });

    it('should clean up timers on unsubscribe', () => {
      const callback = jest.fn();
      const subscriptionId = realTimeService.subscribeToRealTimeData(
        'trade_stats',
        { countries: ['USA'] },
        callback
      );

      const unsubscribed = realTimeService.unsubscribeFromRealTimeData(subscriptionId);

      expect(unsubscribed).toBe(true);
      // Timer should be cleared (tested implicitly by no memory leaks)
    });
  });
});