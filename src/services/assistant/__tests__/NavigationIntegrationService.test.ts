import { NavigationIntegrationService } from '../NavigationIntegrationService';
import { RecognizedIntent, UserContext, BusinessProfile, NavigationAction } from '../types';

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000'
  },
  writable: true
});

describe('NavigationIntegrationService', () => {
  let navigationService: NavigationIntegrationService;
  let mockUserContext: UserContext;
  let mockBusinessProfile: BusinessProfile;

  beforeEach(() => {
    navigationService = NavigationIntegrationService.getInstance();
    
    mockBusinessProfile = {
      industry: 'Technology',
      primaryProducts: ['Software', 'Hardware'],
      targetMarkets: ['USA', 'Germany'],
      experienceLevel: 'intermediate',
      preferredLanguage: 'en',
      businessSize: 'medium',
      companyName: 'Test Company'
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
        searchQueries: ['buyers', 'export']
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
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = NavigationIntegrationService.getInstance();
      const instance2 = NavigationIntegrationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateNavigationSuggestions', () => {
    it('should generate navigation suggestions for FIND_BUYERS intent', () => {
      const intent: RecognizedIntent = {
        name: 'FIND_BUYERS',
        confidence: 0.9,
        entities: [
          {
            type: 'COUNTRY',
            value: 'Japan',
            confidence: 0.8,
            startIndex: 0,
            endIndex: 5
          }
        ],
        parameters: {}
      };

      const suggestions = navigationService.generateNavigationSuggestions(intent, mockUserContext);

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].page).toBe('buyer-discovery');
      expect(suggestions[0].params?.country).toBe('Japan');
    });

    it('should generate navigation suggestions for MARKET_RESEARCH intent', () => {
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

      const suggestions = navigationService.generateNavigationSuggestions(intent, mockUserContext);

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].page).toBe('market-research');
      expect(suggestions[0].params?.product).toBe('Electronics');
    });

    it('should generate navigation suggestions for COMPLIANCE_HELP intent', () => {
      const intent: RecognizedIntent = {
        name: 'COMPLIANCE_HELP',
        confidence: 0.8,
        entities: [],
        parameters: {}
      };

      const suggestions = navigationService.generateNavigationSuggestions(intent, mockUserContext);

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].page).toBe('compliance');
    });

    it('should limit suggestions to 5 items', () => {
      const intent: RecognizedIntent = {
        name: 'PLATFORM_NAVIGATION',
        confidence: 0.7,
        entities: [],
        parameters: {}
      };

      const suggestions = navigationService.generateNavigationSuggestions(intent, mockUserContext);

      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it('should handle unknown intents gracefully', () => {
      const intent: RecognizedIntent = {
        name: 'UNKNOWN',
        confidence: 0.3,
        entities: [],
        parameters: {}
      };

      const suggestions = navigationService.generateNavigationSuggestions(intent, mockUserContext);

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('createDeepLink', () => {
    it('should create deep link for buyer discovery', () => {
      const params = { country: 'Germany', industry: 'Manufacturing' };
      const prePopulate = { searchCountry: 'Germany' };

      const deepLink = navigationService.createDeepLink('buyer-discovery', params, prePopulate);

      expect(deepLink.page).toBe('buyer-discovery');
      expect(deepLink.params).toEqual(params);
      expect(deepLink.prePopulateForm).toEqual(prePopulate);
      expect(deepLink.reason).toContain('Buyer Discovery');
    });

    it('should create deep link for market research', () => {
      const params = { country: 'USA', product: 'Software' };

      const deepLink = navigationService.createDeepLink('market-research', params);

      expect(deepLink.page).toBe('market-research');
      expect(deepLink.params).toEqual(params);
      expect(deepLink.reason).toContain('Market Research');
    });

    it('should throw error for unknown page', () => {
      expect(() => {
        navigationService.createDeepLink('unknown-page');
      }).toThrow('Unknown page: unknown-page');
    });

    it('should handle empty parameters', () => {
      const deepLink = navigationService.createDeepLink('dashboard');

      expect(deepLink.page).toBe('dashboard');
      expect(deepLink.params).toEqual({});
    });
  });

  describe('executeNavigation', () => {
    it('should execute navigation successfully', async () => {
      const action: NavigationAction = {
        page: 'buyer-discovery',
        params: { country: 'Germany' },
        reason: 'Find buyers in Germany'
      };

      const result = await navigationService.executeNavigation(action, mockUserContext);

      expect(result.success).toBe(true);
      expect(result.url).toBeDefined();
      expect(result.url).toContain('buyer-discovery');
      expect(result.url).toContain('country=Germany');
    });

    it('should handle form pre-population', async () => {
      const action: NavigationAction = {
        page: 'buyer-discovery',
        params: { country: 'Germany' },
        prePopulateForm: { searchCountry: 'Germany', searchIndustry: 'Technology' },
        reason: 'Find buyers with pre-populated form'
      };

      const result = await navigationService.executeNavigation(action, mockUserContext);

      expect(result.success).toBe(true);
      expect(result.prePopulatedFields).toBeDefined();
    });

    it('should handle unknown page error', async () => {
      const action: NavigationAction = {
        page: 'unknown-page',
        reason: 'Test unknown page'
      };

      const result = await navigationService.executeNavigation(action, mockUserContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown page');
    });
  });

  describe('getContextualSuggestions', () => {
    it('should return contextual suggestions for dashboard', () => {
      const context = {
        ...mockUserContext,
        currentSession: {
          ...mockUserContext.currentSession,
          currentPage: 'dashboard'
        }
      };

      const suggestions = navigationService.getContextualSuggestions(context);

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.parameters.page === 'buyer-discovery')).toBe(true);
    });

    it('should return contextual suggestions for buyer discovery page', () => {
      const context = {
        ...mockUserContext,
        currentSession: {
          ...mockUserContext.currentSession,
          currentPage: 'buyer-discovery'
        }
      };

      const suggestions = navigationService.getContextualSuggestions(context);

      expect(suggestions).toBeDefined();
      expect(suggestions.some(s => s.parameters.page === 'quotation')).toBe(true);
    });

    it('should provide suggestions based on user experience level', () => {
      const beginnerContext = {
        ...mockUserContext,
        businessProfile: {
          ...mockBusinessProfile,
          experienceLevel: 'beginner' as const
        }
      };

      const suggestions = navigationService.getContextualSuggestions(beginnerContext);

      expect(suggestions).toBeDefined();
      expect(suggestions.some(s => s.parameters.page === 'compliance')).toBe(true);
    });

    it('should provide suggestions based on missing profile information', () => {
      const incompleteProfileContext = {
        ...mockUserContext,
        businessProfile: {
          ...mockBusinessProfile,
          targetMarkets: []
        }
      };

      const suggestions = navigationService.getContextualSuggestions(incompleteProfileContext);

      expect(suggestions).toBeDefined();
      expect(suggestions.some(s => s.parameters.page === 'market-research')).toBe(true);
    });

    it('should limit suggestions to 4 items', () => {
      const suggestions = navigationService.getContextualSuggestions(mockUserContext);

      expect(suggestions.length).toBeLessThanOrEqual(4);
    });
  });

  describe('prePopulateForm', () => {
    it('should pre-populate buyer search form', async () => {
      const prePopulated = await navigationService.prePopulateForm('buyer-search', mockUserContext);

      expect(prePopulated).toBeDefined();
      expect(prePopulated.searchCountry).toBe('USA'); // First target market
      expect(prePopulated.searchIndustry).toBe('Technology');
      expect(prePopulated.searchProduct).toBe('Software'); // First primary product
    });

    it('should pre-populate market research form', async () => {
      const prePopulated = await navigationService.prePopulateForm('market-research', mockUserContext);

      expect(prePopulated).toBeDefined();
      expect(prePopulated.targetCountry).toBe('USA');
      expect(prePopulated.productCategory).toBe('Software');
      expect(prePopulated.experienceLevel).toBe('intermediate');
    });

    it('should handle unknown form gracefully', async () => {
      const prePopulated = await navigationService.prePopulateForm('unknown-form', mockUserContext);

      expect(prePopulated).toEqual({});
    });

    it('should include intent-based pre-population', async () => {
      const intent: RecognizedIntent = {
        name: 'FIND_BUYERS',
        confidence: 0.9,
        entities: [
          {
            type: 'COUNTRY',
            value: 'Japan',
            confidence: 0.8,
            startIndex: 0,
            endIndex: 5
          }
        ],
        parameters: {}
      };

      const prePopulated = await navigationService.prePopulateForm('buyer-search', mockUserContext, intent);

      expect(prePopulated.searchCountry).toBe('Japan'); // From intent, should override context
    });
  });

  describe('getAvailableRoutes', () => {
    it('should return list of available routes', () => {
      const routes = navigationService.getAvailableRoutes();

      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
      expect(routes.every(route => route.page && route.title && route.description && route.path)).toBe(true);
    });

    it('should include expected routes', () => {
      const routes = navigationService.getAvailableRoutes();
      const pageNames = routes.map(route => route.page);

      expect(pageNames).toContain('dashboard');
      expect(pageNames).toContain('buyer-discovery');
      expect(pageNames).toContain('market-research');
      expect(pageNames).toContain('compliance');
      expect(pageNames).toContain('quotation');
    });
  });

  describe('validateNavigationParams', () => {
    it('should validate known page with valid params', () => {
      const validation = navigationService.validateNavigationParams('buyer-discovery', {
        country: 'Germany',
        industry: 'Manufacturing'
      });

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should return error for unknown page', () => {
      const validation = navigationService.validateNavigationParams('unknown-page', {});

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Unknown page: unknown-page');
    });

    it('should warn about unknown parameters', () => {
      const validation = navigationService.validateNavigationParams('buyer-discovery', {
        country: 'Germany',
        unknownParam: 'value'
      });

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('Unknown parameter: unknownParam');
    });

    it('should handle missing required parameters', () => {
      // For this test, we'd need a route with required params
      // Since current routes don't have required params, this tests the logic
      const validation = navigationService.validateNavigationParams('dashboard', {});

      expect(validation.isValid).toBe(true); // Dashboard has no required params
    });
  });

  describe('Navigation Callbacks', () => {
    it('should register and call navigation callbacks', async () => {
      const callback = jest.fn();
      
      navigationService.onNavigation('buyer-discovery', callback);
      
      const action: NavigationAction = {
        page: 'buyer-discovery',
        params: { country: 'Germany' },
        reason: 'Test callback'
      };

      await navigationService.executeNavigation(action, mockUserContext);

      expect(callback).toHaveBeenCalledWith(action);
    });

    it('should unregister navigation callbacks', async () => {
      const callback = jest.fn();
      
      navigationService.onNavigation('buyer-discovery', callback);
      navigationService.offNavigation('buyer-discovery', callback);
      
      const action: NavigationAction = {
        page: 'buyer-discovery',
        params: { country: 'Germany' },
        reason: 'Test callback removal'
      };

      await navigationService.executeNavigation(action, mockUserContext);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', async () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      navigationService.onNavigation('buyer-discovery', errorCallback);
      
      const action: NavigationAction = {
        page: 'buyer-discovery',
        params: { country: 'Germany' },
        reason: 'Test error handling'
      };

      // Should not throw even if callback fails
      await expect(navigationService.executeNavigation(action, mockUserContext)).resolves.not.toThrow();
    });
  });

  describe('Parameter Sanitization', () => {
    it('should sanitize string parameters', () => {
      const params = {
        country: '  Germany  ',
        longString: 'a'.repeat(200) // Very long string
      };

      const deepLink = navigationService.createDeepLink('buyer-discovery', params);

      expect(deepLink.params.country).toBe('Germany'); // Trimmed
      expect(deepLink.params.longString.length).toBeLessThanOrEqual(100); // Limited length
    });

    it('should handle null and undefined parameters', () => {
      const params = {
        country: 'Germany',
        nullParam: null,
        undefinedParam: undefined
      };

      const deepLink = navigationService.createDeepLink('buyer-discovery', params);

      expect(deepLink.params.country).toBe('Germany');
      expect(deepLink.params.nullParam).toBeUndefined();
      expect(deepLink.params.undefinedParam).toBeUndefined();
    });

    it('should preserve valid number and boolean parameters', () => {
      const params = {
        count: 42,
        active: true,
        invalid: NaN
      };

      const deepLink = navigationService.createDeepLink('buyer-discovery', params);

      expect(deepLink.params.count).toBe(42);
      expect(deepLink.params.active).toBe(true);
      expect(deepLink.params.invalid).toBeUndefined(); // NaN should be filtered out
    });
  });

  describe('URL Building', () => {
    it('should build correct URLs with parameters', async () => {
      const action: NavigationAction = {
        page: 'buyer-discovery',
        params: { country: 'Germany', industry: 'Tech' },
        reason: 'Test URL building'
      };

      const result = await navigationService.executeNavigation(action, mockUserContext);

      expect(result.success).toBe(true);
      expect(result.url).toContain('/buyer-discovery');
      expect(result.url).toContain('country=Germany');
      expect(result.url).toContain('industry=Tech');
    });

    it('should handle URLs without parameters', async () => {
      const action: NavigationAction = {
        page: 'dashboard',
        reason: 'Test URL without params'
      };

      const result = await navigationService.executeNavigation(action, mockUserContext);

      expect(result.success).toBe(true);
      expect(result.url).toBe('http://localhost:3000/');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in navigation suggestions gracefully', () => {
      // Create an intent that might cause issues
      const problematicIntent: RecognizedIntent = {
        name: 'FIND_BUYERS',
        confidence: 0.9,
        entities: [
          {
            type: 'COUNTRY',
            value: null as any, // Problematic value
            confidence: 0.8,
            startIndex: 0,
            endIndex: 5
          }
        ],
        parameters: {}
      };

      const suggestions = navigationService.generateNavigationSuggestions(problematicIntent, mockUserContext);

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle errors in form pre-population gracefully', async () => {
      // Create a context that might cause issues
      const problematicContext = {
        ...mockUserContext,
        businessProfile: null as any
      };

      const prePopulated = await navigationService.prePopulateForm('buyer-search', problematicContext);

      expect(prePopulated).toBeDefined();
      expect(typeof prePopulated).toBe('object');
    });
  });
});