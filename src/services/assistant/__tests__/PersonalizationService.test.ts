import { PersonalizationService } from '../PersonalizationService';
import { UserContextManager } from '../UserContextManager';
import { 
  UserContext, 
  RecognizedIntent, 
  AssistantResponse, 
  UserFeedback,
  BusinessProfile 
} from '../types';

// Mock dependencies
jest.mock('../UserContextManager');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('PersonalizationService', () => {
  let personalizationService: PersonalizationService;
  let mockUserContext: UserContext;
  let mockBusinessProfile: BusinessProfile;

  beforeEach(() => {
    personalizationService = PersonalizationService.getInstance();
    
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
        pagesVisited: ['dashboard', 'buyer-discovery'],
        actionsPerformed: ['search_buyers'],
        searchQueries: ['buyers', 'germany']
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
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock UserContextManager
    (UserContextManager.getInstance as jest.Mock).mockReturnValue({
      getUserContext: jest.fn().mockResolvedValue(mockUserContext)
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PersonalizationService.getInstance();
      const instance2 = PersonalizationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Learning from Interactions', () => {
    const mockIntent: RecognizedIntent = {
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

    const mockResponse: AssistantResponse = {
      id: 'resp-123',
      text: 'I can help you find buyers in Germany. Here are some options.',
      timestamp: new Date(),
      quickActions: [
        {
          id: 'search-buyers',
          label: 'Search Buyers',
          action: 'navigate',
          parameters: { page: 'buyer-discovery' }
        }
      ]
    };

    it('should learn from positive feedback', async () => {
      const positiveFeedback: UserFeedback = {
        rating: 5,
        helpful: true,
        comment: 'Very helpful!',
        timestamp: new Date()
      };

      await personalizationService.learnFromInteraction(
        'test-user-123',
        mockIntent,
        mockResponse,
        positiveFeedback,
        mockUserContext
      );

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'exportguide_personalization_data',
        expect.any(String)
      );
    });

    it('should learn from negative feedback', async () => {
      const negativeFeedback: UserFeedback = {
        rating: 2,
        helpful: false,
        comment: 'Not what I was looking for',
        timestamp: new Date()
      };

      await personalizationService.learnFromInteraction(
        'test-user-123',
        mockIntent,
        mockResponse,
        negativeFeedback,
        mockUserContext
      );

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should learn without feedback', async () => {
      await personalizationService.learnFromInteraction(
        'test-user-123',
        mockIntent,
        mockResponse,
        undefined,
        mockUserContext
      );

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle learning errors gracefully', async () => {
      const invalidIntent = null as any;

      await expect(
        personalizationService.learnFromInteraction(
          'test-user-123',
          invalidIntent,
          mockResponse,
          undefined,
          mockUserContext
        )
      ).resolves.not.toThrow();
    });

    it('should update intent preferences correctly', async () => {
      const feedback: UserFeedback = {
        rating: 4,
        helpful: true,
        timestamp: new Date()
      };

      // Learn from multiple interactions
      for (let i = 0; i < 3; i++) {
        await personalizationService.learnFromInteraction(
          'test-user-123',
          mockIntent,
          mockResponse,
          feedback,
          mockUserContext
        );
      }

      const insights = personalizationService.getPersonalizationInsights('test-user-123');
      expect(insights.behaviorPattern).toBeDefined();
      expect(insights.behaviorPattern!.preferredIntents.length).toBeGreaterThan(0);
      expect(insights.behaviorPattern!.preferredIntents[0].intent).toBe('FIND_BUYERS');
    });
  });

  describe('Personalized Recommendations', () => {
    beforeEach(async () => {
      // Set up some learning data
      const intent: RecognizedIntent = {
        name: 'FIND_BUYERS',
        confidence: 0.9,
        entities: [],
        parameters: {}
      };

      const response: AssistantResponse = {
        id: 'resp-123',
        text: 'Test response',
        timestamp: new Date()
      };

      const feedback: UserFeedback = {
        rating: 4,
        helpful: true,
        timestamp: new Date()
      };

      await personalizationService.learnFromInteraction(
        'test-user-123',
        intent,
        response,
        feedback,
        mockUserContext
      );
    });

    it('should generate personalized recommendations', async () => {
      const recommendations = await personalizationService.generateRecommendations(
        'test-user-123',
        mockUserContext,
        5
      );

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(5);
      
      recommendations.forEach(rec => {
        expect(rec.id).toBeDefined();
        expect(rec.type).toBeDefined();
        expect(rec.title).toBeDefined();
        expect(rec.description).toBeDefined();
        expect(typeof rec.confidence).toBe('number');
        expect(Array.isArray(rec.reasoning)).toBe(true);
        expect(['high', 'medium', 'low']).toContain(rec.priority);
        expect(rec.category).toBeDefined();
      });
    });

    it('should limit recommendations to specified count', async () => {
      const recommendations = await personalizationService.generateRecommendations(
        'test-user-123',
        mockUserContext,
        2
      );

      expect(recommendations.length).toBeLessThanOrEqual(2);
    });

    it('should prioritize recommendations correctly', async () => {
      const recommendations = await personalizationService.generateRecommendations(
        'test-user-123',
        mockUserContext,
        10
      );

      if (recommendations.length > 1) {
        // Check that high priority comes before low priority
        const priorities = recommendations.map(r => r.priority);
        const highIndex = priorities.indexOf('high');
        const lowIndex = priorities.indexOf('low');
        
        if (highIndex !== -1 && lowIndex !== -1) {
          expect(highIndex).toBeLessThan(lowIndex);
        }
      }
    });

    it('should handle empty user data gracefully', async () => {
      const recommendations = await personalizationService.generateRecommendations(
        'new-user-456',
        mockUserContext,
        5
      );

      expect(Array.isArray(recommendations)).toBe(true);
      // Should still generate some recommendations based on context
    });

    it('should generate industry-specific recommendations', async () => {
      const techContext = {
        ...mockUserContext,
        businessProfile: {
          ...mockBusinessProfile,
          industry: 'Technology'
        }
      };

      const recommendations = await personalizationService.generateRecommendations(
        'test-user-123',
        techContext,
        10
      );

      const industryRecs = recommendations.filter(r => r.category === 'industry_specific');
      expect(industryRecs.length).toBeGreaterThan(0);
    });
  });

  describe('Response Adaptation', () => {
    const mockResponse: AssistantResponse = {
      id: 'resp-123',
      text: 'This is a detailed response about finding buyers in Germany. It contains multiple sentences with comprehensive information. The response includes various details and explanations.',
      timestamp: new Date(),
      quickActions: [
        {
          id: 'action-1',
          label: 'Search Buyers',
          action: 'navigate',
          parameters: { page: 'buyer-discovery' }
        },
        {
          id: 'action-2',
          label: 'Market Research',
          action: 'navigate',
          parameters: { page: 'market-research' }
        }
      ]
    };

    beforeEach(async () => {
      // Set up user preferences
      await personalizationService.updateUserPreferences('test-user-123', {
        responseLength: 'short',
        preferQuickActions: false
      });
    });

    it('should adapt response length based on preferences', () => {
      const adaptedResponse = personalizationService.adaptResponse(
        mockResponse,
        'test-user-123',
        mockUserContext
      );

      expect(adaptedResponse.text.length).toBeLessThan(mockResponse.text.length);
    });

    it('should adapt quick actions based on preferences', () => {
      const adaptedResponse = personalizationService.adaptResponse(
        mockResponse,
        'test-user-123',
        mockUserContext
      );

      expect(adaptedResponse.quickActions!.length).toBeLessThanOrEqual(2);
    });

    it('should apply industry terminology', () => {
      const techContext = {
        ...mockUserContext,
        businessProfile: {
          ...mockBusinessProfile,
          industry: 'Technology'
        }
      };

      const responseWithProducts = {
        ...mockResponse,
        text: 'Here are some products that might interest you.'
      };

      const adaptedResponse = personalizationService.adaptResponse(
        responseWithProducts,
        'test-user-123',
        techContext
      );

      expect(adaptedResponse.text).toContain('solutions');
    });

    it('should handle adaptation errors gracefully', () => {
      const invalidResponse = null as any;

      const adaptedResponse = personalizationService.adaptResponse(
        invalidResponse,
        'test-user-123',
        mockUserContext
      );

      expect(adaptedResponse).toBeNull();
    });

    it('should return original response when no pattern exists', () => {
      const adaptedResponse = personalizationService.adaptResponse(
        mockResponse,
        'new-user-456',
        mockUserContext
      );

      expect(adaptedResponse).toEqual(mockResponse);
    });
  });

  describe('User Preferences Management', () => {
    it('should update user preferences', async () => {
      await personalizationService.updateUserPreferences('test-user-123', {
        responseLength: 'long',
        includeData: false,
        preferQuickActions: true,
        learningStyle: 'direct'
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle partial preference updates', async () => {
      await personalizationService.updateUserPreferences('test-user-123', {
        responseLength: 'short'
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should create new pattern for new user', async () => {
      await personalizationService.updateUserPreferences('new-user-456', {
        learningStyle: 'guided'
      });

      expect(UserContextManager.getInstance().getUserContext).toHaveBeenCalledWith('new-user-456');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle preference update errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(
        personalizationService.updateUserPreferences('test-user-123', {
          responseLength: 'medium'
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Personalization Insights', () => {
    beforeEach(async () => {
      // Set up learning data
      const intents = ['FIND_BUYERS', 'MARKET_RESEARCH', 'COMPLIANCE_HELP'];
      
      for (let i = 0; i < 10; i++) {
        const intent: RecognizedIntent = {
          name: intents[i % intents.length] as any,
          confidence: 0.8 + (i % 3) * 0.1,
          entities: [],
          parameters: {}
        };

        const response: AssistantResponse = {
          id: `resp-${i}`,
          text: `Response ${i}`,
          timestamp: new Date()
        };

        const feedback: UserFeedback = {
          rating: 3 + (i % 3),
          helpful: i % 2 === 0,
          timestamp: new Date()
        };

        await personalizationService.learnFromInteraction(
          'test-user-123',
          intent,
          response,
          feedback,
          mockUserContext
        );
      }
    });

    it('should provide comprehensive personalization insights', () => {
      const insights = personalizationService.getPersonalizationInsights('test-user-123');

      expect(insights).toBeDefined();
      expect(insights.behaviorPattern).toBeDefined();
      expect(insights.learningProgress).toBeDefined();
      expect(insights.preferences).toBeDefined();

      expect(typeof insights.learningProgress.interactionCount).toBe('number');
      expect(typeof insights.learningProgress.expertiseLevel).toBe('string');
      expect(Array.isArray(insights.learningProgress.strongAreas)).toBe(true);
      expect(Array.isArray(insights.learningProgress.improvementAreas)).toBe(true);

      expect(typeof insights.preferences.communicationStyle).toBe('string');
      expect(Array.isArray(insights.preferences.preferredFeatures)).toBe(true);
      expect(Array.isArray(insights.preferences.optimalTimes)).toBe(true);
    });

    it('should handle insights for new user', () => {
      const insights = personalizationService.getPersonalizationInsights('new-user-456');

      expect(insights.behaviorPattern).toBeNull();
      expect(insights.learningProgress.interactionCount).toBe(0);
      expect(insights.learningProgress.expertiseLevel).toBe('beginner');
      expect(insights.preferences.communicationStyle).toBe('standard');
    });

    it('should calculate expertise level correctly', () => {
      const insights = personalizationService.getPersonalizationInsights('test-user-123');

      expect(insights.learningProgress.interactionCount).toBeGreaterThan(0);
      expect(['beginner', 'intermediate', 'advanced']).toContain(insights.learningProgress.expertiseLevel);
    });

    it('should identify strong and weak areas', () => {
      const insights = personalizationService.getPersonalizationInsights('test-user-123');

      expect(Array.isArray(insights.learningProgress.strongAreas)).toBe(true);
      expect(Array.isArray(insights.learningProgress.improvementAreas)).toBe(true);
    });
  });

  describe('Industry Customization', () => {
    it('should provide technology industry customization', () => {
      const customization = personalizationService.getIndustryCustomization('Technology');

      expect(customization).toBeDefined();
      expect(customization!.industry).toBe('technology');
      expect(customization!.terminology).toBeDefined();
      expect(customization!.commonIntents).toBeDefined();
      expect(customization!.recommendedFeatures).toBeDefined();
    });

    it('should provide manufacturing industry customization', () => {
      const customization = personalizationService.getIndustryCustomization('Manufacturing');

      expect(customization).toBeDefined();
      expect(customization!.industry).toBe('manufacturing');
      expect(customization!.terminology.products).toBe('goods');
    });

    it('should return null for unknown industry', () => {
      const customization = personalizationService.getIndustryCustomization('Unknown Industry');

      expect(customization).toBeNull();
    });

    it('should handle case-insensitive industry lookup', () => {
      const customization = personalizationService.getIndustryCustomization('TECHNOLOGY');

      expect(customization).toBeDefined();
      expect(customization!.industry).toBe('technology');
    });
  });

  describe('Data Persistence', () => {
    it('should save personalization data to localStorage', async () => {
      await personalizationService.updateUserPreferences('test-user-123', {
        responseLength: 'short'
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'exportguide_personalization_data',
        expect.any(String)
      );
    });

    it('should load personalization data from localStorage', () => {
      const mockData = {
        userBehaviorPatterns: {
          'test-user-123': {
            userId: 'test-user-123',
            preferredIntents: [
              { intent: 'FIND_BUYERS', frequency: 5, successRate: 0.8 }
            ],
            timePatterns: { '10': 3, '14': 2 },
            sessionPatterns: {
              averageLength: 300000,
              preferredStartPages: ['dashboard'],
              commonFlows: []
            },
            contentPreferences: {
              responseLength: 'medium',
              includeData: true,
              preferQuickActions: true,
              visualizationTypes: ['chart']
            },
            learningStyle: 'guided',
            expertiseGrowth: []
          }
        },
        lastUpdated: new Date().toISOString()
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      // Create new instance to trigger loading
      const newService = PersonalizationService.getInstance();
      const insights = newService.getPersonalizationInsights('test-user-123');

      expect(insights.behaviorPattern).toBeDefined();
      expect(insights.behaviorPattern!.preferredIntents.length).toBeGreaterThan(0);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => PersonalizationService.getInstance()).not.toThrow();
    });

    it('should handle malformed stored data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      expect(() => PersonalizationService.getInstance()).not.toThrow();
    });
  });

  describe('Reset Functionality', () => {
    beforeEach(async () => {
      // Set up some data first
      await personalizationService.updateUserPreferences('test-user-123', {
        responseLength: 'short'
      });
    });

    it('should reset user personalization data', async () => {
      await personalizationService.resetPersonalization('test-user-123');

      const insights = personalizationService.getPersonalizationInsights('test-user-123');
      expect(insights.behaviorPattern).toBeNull();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle reset errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      await expect(
        personalizationService.resetPersonalization('test-user-123')
      ).resolves.not.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null user context', async () => {
      await expect(
        personalizationService.learnFromInteraction(
          'test-user-123',
          { name: 'FIND_BUYERS', confidence: 0.8, entities: [], parameters: {} },
          { id: 'resp-123', text: 'test', timestamp: new Date() },
          undefined,
          null as any
        )
      ).resolves.not.toThrow();
    });

    it('should handle invalid intent data', async () => {
      const invalidIntent = {
        name: null as any,
        confidence: 'invalid' as any,
        entities: null as any,
        parameters: {}
      };

      await expect(
        personalizationService.learnFromInteraction(
          'test-user-123',
          invalidIntent,
          { id: 'resp-123', text: 'test', timestamp: new Date() },
          undefined,
          mockUserContext
        )
      ).resolves.not.toThrow();
    });

    it('should handle storage quota exceeded', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      await expect(
        personalizationService.updateUserPreferences('test-user-123', {
          responseLength: 'medium'
        })
      ).resolves.not.toThrow();
    });

    it('should handle concurrent access gracefully', async () => {
      // Simulate concurrent learning
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          personalizationService.learnFromInteraction(
            'test-user-123',
            { name: 'FIND_BUYERS', confidence: 0.8, entities: [], parameters: {} },
            { id: `resp-${i}`, text: 'test', timestamp: new Date() },
            { rating: 4, helpful: true, timestamp: new Date() },
            mockUserContext
          )
        );
      }

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });
});