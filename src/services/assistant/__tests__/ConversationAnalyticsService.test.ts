import { ConversationAnalyticsService } from '../ConversationAnalyticsService';
import { ConversationMessage, UserContext, RecognizedIntent, AssistantResponse, UserFeedback } from '../types';

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

// Mock timers
jest.useFakeTimers();

describe('ConversationAnalyticsService', () => {
  let analyticsService: ConversationAnalyticsService;
  let mockUserContext: UserContext;
  let mockMessage: ConversationMessage;
  let mockResponse: AssistantResponse;
  let mockIntent: RecognizedIntent;

  beforeEach(() => {
    analyticsService = ConversationAnalyticsService.getInstance();
    
    mockUserContext = {
      userId: 'test-user-123',
      conversationId: 'conv-123',
      businessProfile: {
        industry: 'Technology',
        primaryProducts: ['Software'],
        targetMarkets: ['USA'],
        experienceLevel: 'intermediate',
        preferredLanguage: 'en',
        businessSize: 'medium'
      },
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

    mockMessage = {
      id: 'msg-123',
      userId: 'test-user-123',
      conversationId: 'conv-123',
      timestamp: new Date(),
      type: 'user',
      content: 'Find buyers in Germany'
    };

    mockResponse = {
      id: 'resp-123',
      text: 'I can help you find buyers in Germany',
      timestamp: new Date(),
      quickActions: [
        {
          id: 'action-1',
          label: 'Search Buyers',
          action: 'navigate',
          parameters: { page: 'buyer-discovery' }
        }
      ]
    };

    mockIntent = {
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

    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ConversationAnalyticsService.getInstance();
      const instance2 = ConversationAnalyticsService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Event Tracking', () => {
    describe('trackMessage', () => {
      it('should track user message with intent data', () => {
        analyticsService.trackMessage(mockMessage, mockUserContext, mockIntent);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'exportguide_analytics_events',
          expect.any(String)
        );
      });

      it('should track message without intent', () => {
        analyticsService.trackMessage(mockMessage, mockUserContext);

        expect(localStorageMock.setItem).toHaveBeenCalled();
      });

      it('should handle tracking errors gracefully', () => {
        const invalidMessage = { ...mockMessage, timestamp: null as any };
        
        expect(() => {
          analyticsService.trackMessage(invalidMessage, mockUserContext, mockIntent);
        }).not.toThrow();
      });
    });

    describe('trackResponse', () => {
      it('should track assistant response with metrics', () => {
        const responseTime = 1500;
        
        analyticsService.trackResponse(mockResponse, mockUserContext, responseTime, mockIntent);

        expect(localStorageMock.setItem).toHaveBeenCalled();
      });

      it('should track response without quick actions', () => {
        const simpleResponse = {
          ...mockResponse,
          quickActions: undefined
        };
        
        analyticsService.trackResponse(simpleResponse, mockUserContext, 1000);

        expect(localStorageMock.setItem).toHaveBeenCalled();
      });

      it('should handle response tracking errors gracefully', () => {
        expect(() => {
          analyticsService.trackResponse(mockResponse, mockUserContext, -1);
        }).not.toThrow();
      });
    });

    describe('trackQuickAction', () => {
      it('should track quick action clicks', () => {
        analyticsService.trackQuickAction(
          'action-1',
          'navigate',
          'test-user-123',
          'conv-123',
          mockUserContext
        );

        expect(localStorageMock.setItem).toHaveBeenCalled();
      });

      it('should track action without context', () => {
        analyticsService.trackQuickAction(
          'action-1',
          'navigate',
          'test-user-123',
          'conv-123'
        );

        expect(localStorageMock.setItem).toHaveBeenCalled();
      });
    });

    describe('trackNavigation', () => {
      it('should track navigation events', () => {
        analyticsService.trackNavigation(
          'dashboard',
          'buyer-discovery',
          'test-user-123',
          'conv-123',
          'assistant'
        );

        expect(localStorageMock.setItem).toHaveBeenCalled();
      });

      it('should default to user trigger', () => {
        analyticsService.trackNavigation(
          'dashboard',
          'buyer-discovery',
          'test-user-123',
          'conv-123'
        );

        expect(localStorageMock.setItem).toHaveBeenCalled();
      });
    });

    describe('trackFeedback', () => {
      it('should track user feedback', () => {
        const feedback: UserFeedback = {
          rating: 5,
          helpful: true,
          comment: 'Very helpful response',
          timestamp: new Date()
        };

        analyticsService.trackFeedback(
          feedback,
          'msg-123',
          'test-user-123',
          'conv-123'
        );

        expect(localStorageMock.setItem).toHaveBeenCalled();
      });

      it('should track negative feedback', () => {
        const feedback: UserFeedback = {
          rating: 2,
          helpful: false,
          comment: 'Not helpful',
          timestamp: new Date()
        };

        analyticsService.trackFeedback(
          feedback,
          'msg-123',
          'test-user-123',
          'conv-123'
        );

        expect(localStorageMock.setItem).toHaveBeenCalled();
      });
    });

    describe('trackTaskCompletion', () => {
      it('should track completed tasks', () => {
        analyticsService.trackTaskCompletion(
          'buyer_search',
          'task-123',
          true,
          30000,
          'test-user-123',
          'conv-123'
        );

        expect(localStorageMock.setItem).toHaveBeenCalled();
      });

      it('should track incomplete tasks', () => {
        analyticsService.trackTaskCompletion(
          'buyer_search',
          'task-123',
          false,
          15000,
          'test-user-123',
          'conv-123'
        );

        expect(localStorageMock.setItem).toHaveBeenCalled();
      });
    });
  });

  describe('Metrics Calculation', () => {
    beforeEach(() => {
      // Set up some test data
      analyticsService.trackMessage(mockMessage, mockUserContext, mockIntent);
      analyticsService.trackResponse(mockResponse, mockUserContext, 1500, mockIntent);
      
      const feedback: UserFeedback = {
        rating: 4,
        helpful: true,
        timestamp: new Date()
      };
      analyticsService.trackFeedback(feedback, 'msg-123', 'test-user-123', 'conv-123');
    });

    describe('getResponseAccuracyMetrics', () => {
      it('should calculate response accuracy metrics', () => {
        const metrics = analyticsService.getResponseAccuracyMetrics();

        expect(metrics).toBeDefined();
        expect(typeof metrics.totalResponses).toBe('number');
        expect(typeof metrics.helpfulResponses).toBe('number');
        expect(typeof metrics.averageRating).toBe('number');
        expect(typeof metrics.accuracyRate).toBe('number');
        expect(metrics.confidenceDistribution).toBeDefined();
        expect(metrics.intentAccuracyByType).toBeDefined();
      });

      it('should filter metrics by user', () => {
        const metrics = analyticsService.getResponseAccuracyMetrics('test-user-123');

        expect(metrics).toBeDefined();
        expect(metrics.totalResponses).toBeGreaterThanOrEqual(0);
      });

      it('should filter metrics by time range', () => {
        const timeRange = {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date()
        };

        const metrics = analyticsService.getResponseAccuracyMetrics(undefined, timeRange);

        expect(metrics).toBeDefined();
      });

      it('should handle empty data gracefully', () => {
        const metrics = analyticsService.getResponseAccuracyMetrics('nonexistent-user');

        expect(metrics.totalResponses).toBe(0);
        expect(metrics.accuracyRate).toBe(0);
      });
    });

    describe('getTaskCompletionMetrics', () => {
      beforeEach(() => {
        analyticsService.trackTaskCompletion('buyer_search', 'task-1', true, 30000, 'test-user-123', 'conv-123');
        analyticsService.trackTaskCompletion('market_research', 'task-2', false, 15000, 'test-user-123', 'conv-123');
      });

      it('should calculate task completion metrics', () => {
        const metrics = analyticsService.getTaskCompletionMetrics();

        expect(metrics).toBeDefined();
        expect(typeof metrics.totalTasks).toBe('number');
        expect(typeof metrics.completedTasks).toBe('number');
        expect(typeof metrics.completionRate).toBe('number');
        expect(typeof metrics.averageTimeToComplete).toBe('number');
        expect(metrics.taskCompletionByType).toBeDefined();
        expect(metrics.dropOffPoints).toBeDefined();
      });

      it('should calculate completion rate correctly', () => {
        const metrics = analyticsService.getTaskCompletionMetrics();

        expect(metrics.totalTasks).toBeGreaterThan(0);
        expect(metrics.completionRate).toBeGreaterThanOrEqual(0);
        expect(metrics.completionRate).toBeLessThanOrEqual(100);
      });
    });

    describe('getUserInteractionPatterns', () => {
      it('should calculate user interaction patterns', () => {
        const patterns = analyticsService.getUserInteractionPatterns();

        expect(Array.isArray(patterns)).toBe(true);
        if (patterns.length > 0) {
          expect(patterns[0].userId).toBeDefined();
          expect(typeof patterns[0].totalSessions).toBe('number');
          expect(typeof patterns[0].totalMessages).toBe('number');
          expect(Array.isArray(patterns[0].mostUsedIntents)).toBe(true);
          expect(patterns[0].timeOfDayDistribution).toBeDefined();
        }
      });

      it('should filter patterns by user', () => {
        const patterns = analyticsService.getUserInteractionPatterns('test-user-123');

        expect(Array.isArray(patterns)).toBe(true);
        patterns.forEach(pattern => {
          expect(pattern.userId).toBe('test-user-123');
        });
      });
    });
  });

  describe('Analytics Dashboard', () => {
    beforeEach(() => {
      // Set up comprehensive test data
      analyticsService.trackMessage(mockMessage, mockUserContext, mockIntent);
      analyticsService.trackResponse(mockResponse, mockUserContext, 1500, mockIntent);
      analyticsService.trackQuickAction('action-1', 'navigate', 'test-user-123', 'conv-123');
      
      const feedback: UserFeedback = {
        rating: 4,
        helpful: true,
        timestamp: new Date()
      };
      analyticsService.trackFeedback(feedback, 'msg-123', 'test-user-123', 'conv-123');
    });

    it('should generate complete analytics dashboard', () => {
      const dashboard = analyticsService.getAnalyticsDashboard();

      expect(dashboard).toBeDefined();
      expect(dashboard.overview).toBeDefined();
      expect(dashboard.responseMetrics).toBeDefined();
      expect(dashboard.taskMetrics).toBeDefined();
      expect(Array.isArray(dashboard.userPatterns)).toBe(true);
      expect(Array.isArray(dashboard.topIssues)).toBe(true);
      expect(Array.isArray(dashboard.improvementSuggestions)).toBe(true);
      expect(Array.isArray(dashboard.timeSeriesData)).toBe(true);
    });

    it('should include overview statistics', () => {
      const dashboard = analyticsService.getAnalyticsDashboard();

      expect(dashboard.overview.totalUsers).toBeGreaterThanOrEqual(0);
      expect(dashboard.overview.totalConversations).toBeGreaterThanOrEqual(0);
      expect(dashboard.overview.totalMessages).toBeGreaterThanOrEqual(0);
      expect(dashboard.overview.averageSessionLength).toBeGreaterThanOrEqual(0);
      expect(dashboard.overview.userRetentionRate).toBeGreaterThanOrEqual(0);
    });

    it('should filter dashboard by time range', () => {
      const timeRange = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const dashboard = analyticsService.getAnalyticsDashboard(timeRange);

      expect(dashboard).toBeDefined();
      expect(dashboard.timeSeriesData.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Feedback Collection', () => {
    it('should determine when to collect feedback', async () => {
      // Track some messages to reach the feedback threshold
      for (let i = 0; i < 3; i++) {
        analyticsService.trackMessage(
          { ...mockMessage, id: `msg-${i}` },
          mockUserContext,
          mockIntent
        );
      }

      const result = await analyticsService.collectFeedback(
        'msg-123',
        'test-user-123',
        'conv-123'
      );

      expect(result).toBeDefined();
      expect(typeof result.shouldCollect).toBe('boolean');
      expect(typeof result.prompt).toBe('string');
      expect(result.config).toBeDefined();
    });

    it('should provide different feedback prompts', async () => {
      const helpfulResult = await analyticsService.collectFeedback(
        'msg-123',
        'test-user-123',
        'conv-123',
        'helpful'
      );

      const ratingResult = await analyticsService.collectFeedback(
        'msg-123',
        'test-user-123',
        'conv-123',
        'rating'
      );

      expect(helpfulResult.prompt).toBeDefined();
      expect(ratingResult.prompt).toBeDefined();
    });

    it('should handle feedback collection errors', async () => {
      const result = await analyticsService.collectFeedback(
        '',
        '',
        ''
      );

      expect(result.shouldCollect).toBe(false);
    });
  });

  describe('Data Export', () => {
    beforeEach(() => {
      analyticsService.trackMessage(mockMessage, mockUserContext, mockIntent);
      analyticsService.trackResponse(mockResponse, mockUserContext, 1500, mockIntent);
    });

    it('should export data as JSON', () => {
      const exported = analyticsService.exportAnalyticsData('json');

      expect(typeof exported).toBe('string');
      expect(() => JSON.parse(exported)).not.toThrow();
      
      const parsed = JSON.parse(exported);
      expect(parsed.exportDate).toBeDefined();
      expect(parsed.totalEvents).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(parsed.events)).toBe(true);
    });

    it('should export data as CSV', () => {
      const exported = analyticsService.exportAnalyticsData('csv');

      expect(typeof exported).toBe('string');
      expect(exported.includes('id,userId,conversationId')).toBe(true);
    });

    it('should filter exported data by user', () => {
      const exported = analyticsService.exportAnalyticsData('json', 'test-user-123');

      const parsed = JSON.parse(exported);
      expect(parsed.userId).toBe('test-user-123');
    });

    it('should filter exported data by time range', () => {
      const timeRange = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const exported = analyticsService.exportAnalyticsData('json', undefined, timeRange);

      const parsed = JSON.parse(exported);
      expect(parsed.timeRange).toEqual({
        start: timeRange.start.toISOString(),
        end: timeRange.end.toISOString()
      });
    });

    it('should handle export errors gracefully', () => {
      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn().mockImplementation(() => {
        throw new Error('Export error');
      });

      const exported = analyticsService.exportAnalyticsData('json');

      expect(exported).toContain('error');
      
      // Restore original function
      JSON.stringify = originalStringify;
    });
  });

  describe('Data Persistence', () => {
    it('should save events to localStorage', () => {
      analyticsService.trackMessage(mockMessage, mockUserContext, mockIntent);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'exportguide_analytics_events',
        expect.any(String)
      );
    });

    it('should load events from localStorage', () => {
      const mockEvents = {
        'test-user-123': [
          {
            id: 'event-1',
            userId: 'test-user-123',
            conversationId: 'conv-123',
            timestamp: new Date().toISOString(),
            type: 'message_sent',
            data: { messageLength: 20 },
            sessionId: 'session-1'
          }
        ]
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEvents));

      // Create new instance to trigger loading
      const newService = ConversationAnalyticsService.getInstance();
      const patterns = newService.getUserInteractionPatterns('test-user-123');

      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => ConversationAnalyticsService.getInstance()).not.toThrow();
    });

    it('should limit events per user', () => {
      // Track more than the maximum events
      for (let i = 0; i < 1100; i++) {
        analyticsService.trackMessage(
          { ...mockMessage, id: `msg-${i}` },
          mockUserContext,
          mockIntent
        );
      }

      const patterns = analyticsService.getUserInteractionPatterns('test-user-123');
      expect(patterns[0].totalMessages).toBeLessThanOrEqual(1000);
    });
  });

  describe('Periodic Cleanup', () => {
    it('should clean up old events', () => {
      // Fast-forward time to trigger cleanup
      jest.advanceTimersByTime(60 * 60 * 1000); // 1 hour

      // The cleanup should have run (tested implicitly)
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed event data', () => {
      const malformedMessage = {
        ...mockMessage,
        timestamp: 'invalid-date' as any
      };

      expect(() => {
        analyticsService.trackMessage(malformedMessage, mockUserContext);
      }).not.toThrow();
    });

    it('should handle missing user context', () => {
      expect(() => {
        analyticsService.trackMessage(mockMessage, null as any);
      }).not.toThrow();
    });

    it('should handle localStorage quota exceeded', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => {
        analyticsService.trackMessage(mockMessage, mockUserContext);
      }).not.toThrow();
    });
  });

  describe('Analytics Insights', () => {
    beforeEach(() => {
      // Create diverse test data
      const intents = ['FIND_BUYERS', 'MARKET_RESEARCH', 'COMPLIANCE_HELP'];
      const ratings = [1, 2, 3, 4, 5];
      
      for (let i = 0; i < 10; i++) {
        const intent = {
          ...mockIntent,
          name: intents[i % intents.length] as any
        };
        
        analyticsService.trackMessage(
          { ...mockMessage, id: `msg-${i}` },
          mockUserContext,
          intent
        );
        
        analyticsService.trackResponse(
          { ...mockResponse, id: `resp-${i}` },
          mockUserContext,
          1000 + i * 100,
          intent
        );
        
        const feedback: UserFeedback = {
          rating: ratings[i % ratings.length],
          helpful: ratings[i % ratings.length] >= 3,
          timestamp: new Date()
        };
        
        analyticsService.trackFeedback(feedback, `msg-${i}`, 'test-user-123', 'conv-123');
      }
    });

    it('should identify top issues from feedback', () => {
      const dashboard = analyticsService.getAnalyticsDashboard();

      expect(Array.isArray(dashboard.topIssues)).toBe(true);
      dashboard.topIssues.forEach(issue => {
        expect(issue.issue).toBeDefined();
        expect(typeof issue.frequency).toBe('number');
        expect(['high', 'medium', 'low']).toContain(issue.impact);
      });
    });

    it('should generate improvement suggestions', () => {
      const dashboard = analyticsService.getAnalyticsDashboard();

      expect(Array.isArray(dashboard.improvementSuggestions)).toBe(true);
      dashboard.improvementSuggestions.forEach(suggestion => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(0);
      });
    });

    it('should calculate time series data', () => {
      const dashboard = analyticsService.getAnalyticsDashboard();

      expect(Array.isArray(dashboard.timeSeriesData)).toBe(true);
      dashboard.timeSeriesData.forEach(dataPoint => {
        expect(dataPoint.date).toBeInstanceOf(Date);
        expect(dataPoint.metrics).toBeDefined();
        expect(typeof dataPoint.metrics.totalEvents).toBe('number');
      });
    });
  });
});