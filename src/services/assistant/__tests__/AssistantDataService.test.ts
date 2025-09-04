import { AssistantDataService } from '../AssistantDataService';
import { RecognizedIntent, UserContext, BusinessProfile } from '../types';
import { worldBankService } from '../../api/WorldBankService';
import { dashboardService } from '../../DashboardService';
import { cacheManager } from '../../CacheManager';

// Mock the external services
jest.mock('../../api/WorldBankService');
jest.mock('../../DashboardService');
jest.mock('../../CacheManager');

describe('AssistantDataService', () => {
  let assistantDataService: AssistantDataService;
  let mockUserContext: UserContext;
  let mockBusinessProfile: BusinessProfile;

  beforeEach(() => {
    assistantDataService = AssistantDataService.getInstance();
    
    mockBusinessProfile = {
      industry: 'Manufacturing',
      primaryProducts: ['Electronics', 'Components'],
      targetMarkets: ['USA', 'Germany', 'Japan'],
      experienceLevel: 'intermediate',
      preferredLanguage: 'en',
      businessSize: 'medium',
      companyName: 'Test Company',
      establishedYear: 2020
    };

    mockUserContext = {
      userId: 'test-user-123',
      conversationId: 'conv-123',
      businessProfile: mockBusinessProfile,
      currentSession: {
        currentPage: 'dashboard',
        sessionStartTime: new Date(),
        lastActivity: new Date(),
        pagesVisited: ['dashboard'],
        actionsPerformed: [],
        searchQueries: []
      },
      preferences: {
        chatPosition: 'bottom-right',
        autoExpand: false,
        soundEnabled: true,
        theme: 'light',
        language: 'en',
        dataPrivacy: {
          allowAnalytics: true,
          allowPersonalization: true,
          retentionPeriod: 30
        }
      },
      conversationHistory: []
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AssistantDataService.getInstance();
      const instance2 = AssistantDataService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('fetchIntentData', () => {
    it('should fetch buyer data for FIND_BUYERS intent', async () => {
      const intent: RecognizedIntent = {
        name: 'FIND_BUYERS',
        confidence: 0.9,
        entities: [
          {
            type: 'COUNTRY',
            value: 'Germany',
            confidence: 0.8,
            startIndex: 0,
            endIndex: 7
          }
        ],
        parameters: {}
      };

      const mockTradeStats = {
        country: 'Germany',
        countryCode: 'DEU',
        totalExports: 1500000000000,
        totalImports: 1200000000000,
        year: 2023,
        lastUpdated: new Date()
      };

      (worldBankService.getTradeStatistics as jest.Mock).mockResolvedValue({
        success: true,
        data: mockTradeStats
      });

      const result = await assistantDataService.fetchIntentData(intent, mockUserContext);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(worldBankService.getTradeStatistics).toHaveBeenCalledWith('DEU');
    });

    it('should fetch market research data for MARKET_RESEARCH intent', async () => {
      const intent: RecognizedIntent = {
        name: 'MARKET_RESEARCH',
        confidence: 0.85,
        entities: [
          {
            type: 'PRODUCT',
            value: 'Electronics',
            confidence: 0.9,
            startIndex: 0,
            endIndex: 11
          }
        ],
        parameters: {}
      };

      const mockMarketData = [{
        country: 'USA',
        countryCode: 'USA',
        productCategory: 'Electronics',
        marketSize: 500000000000,
        growthRate: 5.2,
        competitionLevel: 'High',
        tariffRate: 2.5,
        lastUpdated: new Date()
      }];

      (worldBankService.getMarketData as jest.Mock).mockResolvedValue({
        success: true,
        data: mockMarketData
      });

      const result = await assistantDataService.fetchIntentData(intent, mockUserContext);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(worldBankService.getMarketData).toHaveBeenCalled();
    });

    it('should handle compliance help intent', async () => {
      const intent: RecognizedIntent = {
        name: 'COMPLIANCE_HELP',
        confidence: 0.8,
        entities: [
          {
            type: 'COUNTRY',
            value: 'Japan',
            confidence: 0.9,
            startIndex: 0,
            endIndex: 5
          }
        ],
        parameters: {}
      };

      const result = await assistantDataService.fetchIntentData(intent, mockUserContext);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.countries).toContain('JPN');
      expect(result.data.complianceResources).toBeDefined();
    });

    it('should handle general export advice intent', async () => {
      const intent: RecognizedIntent = {
        name: 'GENERAL_EXPORT_ADVICE',
        confidence: 0.7,
        entities: [],
        parameters: {}
      };

      const mockDashboardData = {
        activeLeads: 150,
        exportValue: 2500000000,
        activeBuyers: 75,
        complianceScore: 92,
        leadsChange: 12.5,
        exportChange: 8.3,
        buyersChange: 15.2,
        complianceChange: 2.1,
        lastUpdated: new Date()
      };

      (dashboardService.getDashboardStats as jest.Mock).mockResolvedValue({
        success: true,
        data: mockDashboardData
      });

      const result = await assistantDataService.fetchIntentData(intent, mockUserContext);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.userProfile).toEqual(mockBusinessProfile);
      expect(result.data.recommendedActions).toBeDefined();
    });

    it('should return null data for unknown intents', async () => {
      const intent: RecognizedIntent = {
        name: 'UNKNOWN',
        confidence: 0.3,
        entities: [],
        parameters: {}
      };

      const result = await assistantDataService.fetchIntentData(intent, mockUserContext);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const intent: RecognizedIntent = {
        name: 'FIND_BUYERS',
        confidence: 0.9,
        entities: [],
        parameters: {}
      };

      (worldBankService.getTradeStatistics as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      const result = await assistantDataService.fetchIntentData(intent, mockUserContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe('DATA_FETCH_ERROR');
    });
  });

  describe('getTradeStatistics', () => {
    it('should fetch trade statistics for multiple countries', async () => {
      const countries = ['USA', 'DEU', 'JPN'];
      const mockTradeStats = countries.map(code => ({
        country: code,
        countryCode: code,
        totalExports: 1000000000000,
        totalImports: 800000000000,
        year: 2023,
        lastUpdated: new Date()
      }));

      (worldBankService.getTradeStatistics as jest.Mock)
        .mockResolvedValueOnce({ success: true, data: mockTradeStats[0] })
        .mockResolvedValueOnce({ success: true, data: mockTradeStats[1] })
        .mockResolvedValueOnce({ success: true, data: mockTradeStats[2] });

      const result = await assistantDataService.getTradeStatistics(countries);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.metadata?.source).toBe('world_bank_api');
      expect(worldBankService.getTradeStatistics).toHaveBeenCalledTimes(3);
    });

    it('should use cached data when available', async () => {
      const countries = ['USA'];
      const cachedData = [{
        country: 'USA',
        countryCode: 'USA',
        totalExports: 1000000000000,
        totalImports: 800000000000,
        year: 2023,
        lastUpdated: new Date()
      }];

      (cacheManager.get as jest.Mock).mockReturnValue(cachedData);

      const result = await assistantDataService.getTradeStatistics(countries);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedData);
      expect(result.metadata?.cached).toBe(true);
      expect(worldBankService.getTradeStatistics).not.toHaveBeenCalled();
    });

    it('should handle partial failures gracefully', async () => {
      const countries = ['USA', 'INVALID'];

      (worldBankService.getTradeStatistics as jest.Mock)
        .mockResolvedValueOnce({ 
          success: true, 
          data: { country: 'USA', totalExports: 1000000000000 } 
        })
        .mockRejectedValueOnce(new Error('Invalid country'));

      const result = await assistantDataService.getTradeStatistics(countries);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].country).toBe('USA');
    });
  });

  describe('getMarketData', () => {
    it('should fetch market data with search parameters', async () => {
      const params = {
        countries: ['USA', 'DEU'],
        productCategory: 'Electronics'
      };

      const mockMarketData = [{
        country: 'USA',
        countryCode: 'USA',
        productCategory: 'Electronics',
        marketSize: 500000000000,
        growthRate: 5.2,
        competitionLevel: 'High',
        tariffRate: 2.5,
        lastUpdated: new Date()
      }];

      (worldBankService.getMarketData as jest.Mock).mockResolvedValue({
        success: true,
        data: mockMarketData
      });

      const result = await assistantDataService.getMarketData(params);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMarketData);
      expect(worldBankService.getMarketData).toHaveBeenCalledWith(params);
    });

    it('should use cached data when available', async () => {
      const params = { countries: ['USA'], productCategory: 'Electronics' };
      const cachedData = [{ country: 'USA', marketSize: 500000000000 }];

      (cacheManager.get as jest.Mock).mockReturnValue(cachedData);

      const result = await assistantDataService.getMarketData(params);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedData);
      expect(result.metadata?.cached).toBe(true);
    });

    it('should handle API failures', async () => {
      const params = { countries: ['USA'], productCategory: 'Electronics' };

      (worldBankService.getMarketData as jest.Mock).mockResolvedValue({
        success: false,
        error: 'API Error'
      });

      const result = await assistantDataService.getMarketData(params);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getDashboardStats', () => {
    it('should fetch dashboard statistics', async () => {
      const mockDashboardData = {
        activeLeads: 150,
        exportValue: 2500000000,
        activeBuyers: 75,
        complianceScore: 92
      };

      (dashboardService.getDashboardStats as jest.Mock).mockResolvedValue({
        success: true,
        data: mockDashboardData
      });

      const result = await assistantDataService.getDashboardStats();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDashboardData);
      expect(dashboardService.getDashboardStats).toHaveBeenCalled();
    });

    it('should use cached data when available', async () => {
      const cachedData = { activeLeads: 150, exportValue: 2500000000 };

      (cacheManager.get as jest.Mock).mockReturnValue(cachedData);

      const result = await assistantDataService.getDashboardStats();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cachedData);
      expect(result.metadata?.cached).toBe(true);
    });
  });

  describe('getCountries', () => {
    it('should fetch countries list', async () => {
      const mockCountries = [
        { code: 'USA', name: 'United States' },
        { code: 'DEU', name: 'Germany' },
        { code: 'JPN', name: 'Japan' }
      ];

      (worldBankService.getCountries as jest.Mock).mockResolvedValue({
        success: true,
        data: mockCountries
      });

      const result = await assistantDataService.getCountries();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCountries);
      expect(worldBankService.getCountries).toHaveBeenCalled();
    });
  });

  describe('createDataVisualization', () => {
    it('should create market research visualization', () => {
      const mockData = [{
        country: 'USA',
        marketSize: 500000000000,
        growthRate: 5.2,
        competitionLevel: 'High'
      }];

      const intent: RecognizedIntent = {
        name: 'MARKET_RESEARCH',
        confidence: 0.9,
        entities: [],
        parameters: {}
      };

      const result = assistantDataService.createDataVisualization(
        mockData,
        intent,
        mockUserContext
      );

      expect(result).toBeDefined();
      expect(result!.type).toBe('chart');
      expect(result!.title).toBe('Market Analysis');
      expect(result!.data).toHaveLength(1);
    });

    it('should create buyer data visualization', () => {
      const mockData = [{
        country: 'USA',
        totalExports: 1000000000000,
        totalImports: 800000000000
      }];

      const intent: RecognizedIntent = {
        name: 'FIND_BUYERS',
        confidence: 0.9,
        entities: [],
        parameters: {}
      };

      const result = assistantDataService.createDataVisualization(
        mockData,
        intent,
        mockUserContext
      );

      expect(result).toBeDefined();
      expect(result!.type).toBe('table');
      expect(result!.title).toBe('Trade Statistics');
      expect(result!.data).toHaveLength(1);
    });

    it('should return undefined for unsupported intents', () => {
      const intent: RecognizedIntent = {
        name: 'UNKNOWN',
        confidence: 0.3,
        entities: [],
        parameters: {}
      };

      const result = assistantDataService.createDataVisualization(
        {},
        intent,
        mockUserContext
      );

      expect(result).toBeUndefined();
    });
  });

  describe('checkDataAvailability', () => {
    it('should check availability of all data services', async () => {
      (worldBankService.healthCheck as jest.Mock).mockResolvedValue(true);
      (dashboardService.getDashboardStats as jest.Mock).mockResolvedValue({
        success: true,
        data: {}
      });
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      (cacheManager.get as jest.Mock).mockReturnValue('test');
      (cacheManager.delete as jest.Mock).mockReturnValue(true);

      const result = await assistantDataService.checkDataAvailability();

      expect(result.worldBank).toBe(true);
      expect(result.dashboard).toBe(true);
      expect(result.cache).toBe(true);
      expect(result.overall).toBe(true);
    });

    it('should handle service failures', async () => {
      (worldBankService.healthCheck as jest.Mock).mockRejectedValue(new Error('API Error'));
      (dashboardService.getDashboardStats as jest.Mock).mockRejectedValue(new Error('Service Error'));

      const result = await assistantDataService.checkDataAvailability();

      expect(result.worldBank).toBe(false);
      expect(result.dashboard).toBe(false);
      expect(result.overall).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      (cacheManager.getStats as jest.Mock).mockReturnValue({ hits: 10, misses: 5 });
      (cacheManager.clear as jest.Mock).mockReturnValue(undefined);

      assistantDataService.clearCache();

      expect(cacheManager.clear).toHaveBeenCalled();
    });

    it('should get cache statistics', () => {
      const mockStats = { hits: 100, misses: 20, hitRate: 83.3 };
      (cacheManager.getStats as jest.Mock).mockReturnValue(mockStats);

      const result = assistantDataService.getCacheStats();

      expect(result).toEqual(mockStats);
    });

    it('should handle cache errors gracefully', () => {
      (cacheManager.getStats as jest.Mock).mockImplementation(() => {
        throw new Error('Cache error');
      });

      const result = assistantDataService.getCacheStats();

      expect(result.error).toBe('Failed to get cache stats');
    });
  });

  describe('Entity Extraction', () => {
    it('should extract countries from intent entities', async () => {
      const intent: RecognizedIntent = {
        name: 'FIND_BUYERS',
        confidence: 0.9,
        entities: [
          {
            type: 'COUNTRY',
            value: 'United States',
            confidence: 0.9,
            startIndex: 0,
            endIndex: 13
          },
          {
            type: 'COUNTRY',
            value: 'Germany',
            confidence: 0.8,
            startIndex: 14,
            endIndex: 21
          }
        ],
        parameters: {}
      };

      (worldBankService.getTradeStatistics as jest.Mock).mockResolvedValue({
        success: true,
        data: { country: 'USA', totalExports: 1000000000000 }
      });

      const result = await assistantDataService.fetchIntentData(intent, mockUserContext);

      expect(worldBankService.getTradeStatistics).toHaveBeenCalledWith('USA');
      expect(worldBankService.getTradeStatistics).toHaveBeenCalledWith('DEU');
    });

    it('should use user profile target markets when no countries in intent', async () => {
      const intent: RecognizedIntent = {
        name: 'FIND_BUYERS',
        confidence: 0.9,
        entities: [],
        parameters: {}
      };

      const result = await assistantDataService.fetchIntentData(intent, mockUserContext);

      expect(result.success).toBe(true);
      expect(result.data.suggestedCountries).toEqual(mockBusinessProfile.targetMarkets);
    });
  });
});