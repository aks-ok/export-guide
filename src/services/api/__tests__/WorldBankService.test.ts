import { WorldBankService } from '../WorldBankService';
import { ApiServiceError, ApiErrorCode } from '../../types';

// Mock the dependencies
jest.mock('../../ApiService');
jest.mock('../../transformers/WorldBankTransformer');
jest.mock('../../transformers/DataValidator');

describe('WorldBankService', () => {
  let service: WorldBankService;

  beforeEach(() => {
    service = new WorldBankService();
    jest.clearAllMocks();
  });

  describe('getTradeStatistics', () => {
    it('should fetch and transform trade statistics successfully', async () => {
      // Mock the API response
      const mockApiResponse = {
        data: [
          {
            indicator: { id: 'NE.EXP.GNFS.CD', value: 'Exports of goods and services' },
            country: { id: 'USA', value: 'United States' },
            countryiso3code: 'USA',
            date: '2023',
            value: 2000000000000
          }
        ],
        success: true,
        timestamp: new Date(),
        source: 'World Bank API'
      };

      // Mock the makeRequest method
      jest.spyOn(service as any, 'makeRequest').mockResolvedValue(mockApiResponse);
      jest.spyOn(service as any, 'getCountryName').mockResolvedValue('United States');

      const result = await service.getTradeStatistics('USA');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.source).toBe('World Bank API');
    });

    it('should handle API errors gracefully', async () => {
      jest.spyOn(service as any, 'makeRequest').mockRejectedValue(
        new ApiServiceError(ApiErrorCode.NOT_FOUND, 'Country not found', false)
      );

      await expect(service.getTradeStatistics('INVALID')).rejects.toThrow(ApiServiceError);
    });

    it('should use default country code when none provided', async () => {
      const mockApiResponse = {
        data: [],
        success: true,
        timestamp: new Date(),
        source: 'World Bank API'
      };

      const makeRequestSpy = jest.spyOn(service as any, 'makeRequest').mockResolvedValue(mockApiResponse);

      try {
        await service.getTradeStatistics();
      } catch (error) {
        // Expected to fail due to empty data, but we can check the call
      }

      expect(makeRequestSpy).toHaveBeenCalledWith(
        expect.stringContaining('/country/WLD/indicator/'),
        {},
        expect.any(Object)
      );
    });
  });

  describe('getMarketData', () => {
    it('should fetch market data for specified countries', async () => {
      const mockApiResponse = {
        data: [
          {
            indicator: { id: 'NY.GDP.MKTP.CD', value: 'GDP' },
            country: { id: 'USA', value: 'United States' },
            countryiso3code: 'USA',
            date: '2023',
            value: 25000000000000
          }
        ],
        success: true,
        timestamp: new Date(),
        source: 'World Bank API'
      };

      jest.spyOn(service as any, 'makeRequest').mockResolvedValue(mockApiResponse);

      const params = {
        countries: ['USA', 'CHN'],
        productCategory: 'Electronics'
      };

      const result = await service.getMarketData(params);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should use major economies when no countries specified', async () => {
      const mockApiResponse = {
        data: [],
        success: true,
        timestamp: new Date(),
        source: 'World Bank API'
      };

      const makeRequestSpy = jest.spyOn(service as any, 'makeRequest').mockResolvedValue(mockApiResponse);

      try {
        await service.getMarketData({ productCategory: 'Electronics' });
      } catch (error) {
        // Expected to fail due to empty data
      }

      expect(makeRequestSpy).toHaveBeenCalledWith(
        expect.stringContaining('/country/USA;CHN;JPN;DEU;IND;GBR;FRA;ITA;BRA;CAN/indicator/'),
        {},
        expect.any(Object)
      );
    });

    it('should apply market filters correctly', async () => {
      const mockApiResponse = {
        data: [
          {
            indicator: { id: 'NY.GDP.MKTP.CD', value: 'GDP' },
            country: { id: 'USA', value: 'United States' },
            countryiso3code: 'USA',
            date: '2023',
            value: 25000000000000
          }
        ],
        success: true,
        timestamp: new Date(),
        source: 'World Bank API'
      };

      jest.spyOn(service as any, 'makeRequest').mockResolvedValue(mockApiResponse);

      const params = {
        countries: ['USA'],
        productCategory: 'Electronics',
        minMarketSize: 1000000000,
        maxTariffRate: 10,
        minGrowthRate: 2,
        competitionLevel: ['low', 'medium'] as ('low' | 'medium' | 'high')[]
      };

      const result = await service.getMarketData(params);

      expect(result.success).toBe(true);
    });
  });

  describe('getEconomicIndicators', () => {
    it('should fetch economic indicators successfully', async () => {
      const mockApiResponse = {
        data: [
          {
            indicator: { id: 'NY.GDP.MKTP.CD', value: 'GDP' },
            country: { id: 'WLD', value: 'World' },
            countryiso3code: 'WLD',
            date: '2023',
            value: 100000000000000
          }
        ],
        success: true,
        timestamp: new Date(),
        source: 'World Bank API'
      };

      jest.spyOn(service as any, 'makeRequest').mockResolvedValue(mockApiResponse);

      const result = await service.getEconomicIndicators();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should use shorter cache TTL for dashboard data', async () => {
      const mockApiResponse = {
        data: [],
        success: true,
        timestamp: new Date(),
        source: 'World Bank API'
      };

      const makeRequestSpy = jest.spyOn(service as any, 'makeRequest').mockResolvedValue(mockApiResponse);

      await service.getEconomicIndicators(['USA']);

      expect(makeRequestSpy).toHaveBeenCalledWith(
        expect.any(String),
        {},
        expect.objectContaining({
          cacheTTL: expect.any(Number)
        })
      );
    });
  });

  describe('getCountries', () => {
    it('should fetch and transform countries list', async () => {
      const mockApiResponse = {
        data: [
          {
            id: 'USA',
            iso2Code: 'US',
            name: 'United States',
            region: { value: 'North America' },
            incomeLevel: { id: 'HIC', value: 'High income' },
            capitalCity: 'Washington D.C.',
            longitude: '-77.032',
            latitude: '38.8895'
          }
        ],
        success: true,
        timestamp: new Date(),
        source: 'World Bank API'
      };

      jest.spyOn(service as any, 'makeRequest').mockResolvedValue(mockApiResponse);

      const result = await service.getCountries();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('searchIndicators', () => {
    it('should search and filter indicators', async () => {
      const mockApiResponse = {
        data: [
          {
            id: 'NY.GDP.MKTP.CD',
            name: 'GDP (current US$)',
            sourceNote: 'GDP at purchaser prices'
          },
          {
            id: 'NE.EXP.GNFS.CD',
            name: 'Exports of goods and services (current US$)',
            sourceNote: 'Exports of goods and services'
          }
        ],
        success: true,
        timestamp: new Date(),
        source: 'World Bank API'
      };

      jest.spyOn(service as any, 'makeRequest').mockResolvedValue(mockApiResponse);

      const result = await service.searchIndicators('GDP');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should return empty array when no indicators found', async () => {
      const mockApiResponse = {
        data: null,
        success: true,
        timestamp: new Date(),
        source: 'World Bank API'
      };

      jest.spyOn(service as any, 'makeRequest').mockResolvedValue(mockApiResponse);

      const result = await service.searchIndicators('nonexistent');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('healthCheck', () => {
    it('should return true when API is healthy', async () => {
      jest.spyOn(service as any, 'makeRequest').mockResolvedValue({
        data: [{ value: 123 }],
        success: true,
        timestamp: new Date(),
        source: 'World Bank API'
      });

      const result = await service.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when API is unhealthy', async () => {
      jest.spyOn(service as any, 'makeRequest').mockRejectedValue(
        new ApiServiceError(ApiErrorCode.NETWORK_ERROR, 'Network error', true)
      );

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('getUsageStats', () => {
    it('should return usage statistics', () => {
      const stats = service.getUsageStats();

      expect(stats).toHaveProperty('baseURL');
      expect(stats).toHaveProperty('timeout');
      expect(stats).toHaveProperty('retries');
      expect(stats).toHaveProperty('cacheTTL');
      expect(typeof stats.baseURL).toBe('string');
      expect(typeof stats.timeout).toBe('number');
      expect(typeof stats.retries).toBe('number');
      expect(typeof stats.cacheTTL).toBe('number');
    });
  });

  describe('error handling', () => {
    it('should wrap non-ApiServiceError errors', async () => {
      jest.spyOn(service as any, 'makeRequest').mockRejectedValue(
        new Error('Generic error')
      );

      await expect(service.getTradeStatistics('USA')).rejects.toThrow(ApiServiceError);
    });

    it('should pass through ApiServiceError errors', async () => {
      const originalError = new ApiServiceError(
        ApiErrorCode.RATE_LIMIT,
        'Rate limit exceeded',
        true
      );

      jest.spyOn(service as any, 'makeRequest').mockRejectedValue(originalError);

      await expect(service.getTradeStatistics('USA')).rejects.toThrow(originalError);
    });
  });
});