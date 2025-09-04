import { UserContextManager } from '../UserContextManager';
import { ConversationStorageManager } from '../storage';
import { AssistantUtils } from '../utils';
import { 
  UserContext, 
  BusinessProfile, 
  ConversationMessage, 
  RecognizedIntent,
  ExtractedEntity 
} from '../types';

// Mock dependencies
jest.mock('../storage');
jest.mock('../utils');

describe('UserContextManager', () => {
  let userContextManager: UserContextManager;
  let mockUserId: string;
  let mockConversationId: string;

  beforeEach(() => {
    userContextManager = UserContextManager.getInstance();
    mockUserId = 'test-user-123';
    mockConversationId = 'conv-456';
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock AssistantUtils.generateId
    (AssistantUtils.generateId as jest.Mock).mockReturnValue('generated-id-123');
    
    // Mock storage methods
    (ConversationStorageManager.getUserContextByUserId as jest.Mock).mockReturnValue(null);
    (ConversationStorageManager.saveUserContext as jest.Mock).mockReturnValue(undefined);
    (ConversationStorageManager.getUserConversations as jest.Mock).mockReturnValue({});
    (ConversationStorageManager.getAllAnalytics as jest.Mock).mockReturnValue({});
    (ConversationStorageManager.clearUserData as jest.Mock).mockReturnValue(undefined);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = UserContextManager.getInstance();
      const instance2 = UserContextManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getUserContext', () => {
    it('should create new user context when none exists', async () => {
      const context = await userContextManager.getUserContext(mockUserId);

      expect(context).toBeDefined();
      expect(context.userId).toBe(mockUserId);
      expect(context.conversationId).toBe('generated-id-123');
      expect(context.businessProfile).toBeDefined();
      expect(context.currentSession).toBeDefined();
      expect(context.preferences).toBeDefined();
      expect(context.conversationHistory).toEqual([]);
      expect(ConversationStorageManager.saveUserContext).toHaveBeenCalledWith(context);
    });

    it('should load existing context from storage', async () => {
      const existingContext: UserContext = {
        userId: mockUserId,
        conversationId: 'existing-conv',
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

      (ConversationStorageManager.getUserContextByUserId as jest.Mock).mockReturnValue(existingContext);

      const context = await userContextManager.getUserContext(mockUserId);

      expect(context.userId).toBe(mockUserId);
      expect(context.businessProfile.industry).toBe('Technology');
      expect(context.businessProfile.experienceLevel).toBe('intermediate');
    });

    it('should update conversation ID when provided', async () => {
      const existingContext: UserContext = {
        userId: mockUserId,
        conversationId: 'old-conv',
        businessProfile: {
          industry: 'Manufacturing',
          primaryProducts: [],
          targetMarkets: [],
          experienceLevel: 'beginner',
          preferredLanguage: 'en',
          businessSize: 'small'
        },
        currentSession: {
          currentPage: 'dashboard',
          sessionStartTime: new Date(),
          lastActivity: new Date(),
          pagesVisited: [],
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

      (ConversationStorageManager.getUserContextByUserId as jest.Mock).mockReturnValue(existingContext);

      const context = await userContextManager.getUserContext(mockUserId, mockConversationId);

      expect(context.conversationId).toBe(mockConversationId);
    });

    it('should return from memory cache on subsequent calls', async () => {
      // First call
      const context1 = await userContextManager.getUserContext(mockUserId);
      
      // Second call should use cached version
      const context2 = await userContextManager.getUserContext(mockUserId);

      expect(context1).toBe(context2);
      expect(ConversationStorageManager.getUserContextByUserId).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateUserContext', () => {
    it('should update user context with new information', async () => {
      // First get a context
      const originalContext = await userContextManager.getUserContext(mockUserId);
      
      const updates = {
        businessProfile: {
          ...originalContext.businessProfile,
          industry: 'Updated Industry'
        }
      };

      const updatedContext = await userContextManager.updateUserContext(mockUserId, updates);

      expect(updatedContext.businessProfile.industry).toBe('Updated Industry');
      expect(ConversationStorageManager.saveUserContext).toHaveBeenCalledWith(updatedContext);
    });

    it('should update session activity timestamp', async () => {
      const originalContext = await userContextManager.getUserContext(mockUserId);
      const originalActivity = originalContext.currentSession.lastActivity;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedContext = await userContextManager.updateUserContext(mockUserId, {});

      expect(updatedContext.currentSession.lastActivity.getTime()).toBeGreaterThan(originalActivity.getTime());
    });

    it('should not persist immediately when persistImmediately is false', async () => {
      await userContextManager.getUserContext(mockUserId);
      
      // Clear the mock call count
      (ConversationStorageManager.saveUserContext as jest.Mock).mockClear();

      await userContextManager.updateUserContext(mockUserId, {}, false);

      expect(ConversationStorageManager.saveUserContext).not.toHaveBeenCalled();
    });
  });

  describe('updateBusinessProfile', () => {
    it('should update business profile fields', async () => {
      const profileUpdates: Partial<BusinessProfile> = {
        industry: 'Technology',
        primaryProducts: ['Software', 'Hardware'],
        experienceLevel: 'advanced'
      };

      const updatedContext = await userContextManager.updateBusinessProfile(mockUserId, profileUpdates);

      expect(updatedContext.businessProfile.industry).toBe('Technology');
      expect(updatedContext.businessProfile.primaryProducts).toEqual(['Software', 'Hardware']);
      expect(updatedContext.businessProfile.experienceLevel).toBe('advanced');
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences', async () => {
      const preferenceUpdates = {
        theme: 'dark' as const,
        autoExpand: true,
        dataPrivacy: {
          allowAnalytics: false,
          allowPersonalization: true,
          retentionPeriod: 60
        }
      };

      const updatedContext = await userContextManager.updateUserPreferences(mockUserId, preferenceUpdates);

      expect(updatedContext.preferences.theme).toBe('dark');
      expect(updatedContext.preferences.autoExpand).toBe(true);
      expect(updatedContext.preferences.dataPrivacy.allowAnalytics).toBe(false);
      expect(updatedContext.preferences.dataPrivacy.retentionPeriod).toBe(60);
    });
  });

  describe('addMessageToHistory', () => {
    it('should add message to conversation history', async () => {
      const message: ConversationMessage = {
        id: 'msg-123',
        userId: mockUserId,
        conversationId: mockConversationId,
        timestamp: new Date(),
        type: 'user',
        content: 'Test message',
        intent: {
          name: 'FIND_BUYERS',
          confidence: 0.9,
          entities: [],
          parameters: {}
        }
      };

      const updatedContext = await userContextManager.addMessageToHistory(
        mockUserId,
        mockConversationId,
        message
      );

      expect(updatedContext.conversationHistory).toContain(message);
      expect(updatedContext.currentSession.actionsPerformed).toContain('intent_find_buyers');
    });

    it('should limit conversation history to 50 messages', async () => {
      // Create a context with 50 messages
      const context = await userContextManager.getUserContext(mockUserId, mockConversationId);
      
      // Add 50 messages
      for (let i = 0; i < 50; i++) {
        context.conversationHistory.push({
          id: `msg-${i}`,
          userId: mockUserId,
          conversationId: mockConversationId,
          timestamp: new Date(),
          type: 'user',
          content: `Message ${i}`
        });
      }

      // Add one more message
      const newMessage: ConversationMessage = {
        id: 'msg-51',
        userId: mockUserId,
        conversationId: mockConversationId,
        timestamp: new Date(),
        type: 'user',
        content: 'Message 51'
      };

      const updatedContext = await userContextManager.addMessageToHistory(
        mockUserId,
        mockConversationId,
        newMessage
      );

      expect(updatedContext.conversationHistory).toHaveLength(50);
      expect(updatedContext.conversationHistory[0].id).toBe('msg-1'); // First message removed
      expect(updatedContext.conversationHistory[49].id).toBe('msg-51'); // New message added
    });

    it('should extract keywords from user messages', async () => {
      (AssistantUtils.extractKeywords as jest.Mock).mockReturnValue(['export', 'buyers', 'germany']);

      const message: ConversationMessage = {
        id: 'msg-123',
        userId: mockUserId,
        conversationId: mockConversationId,
        timestamp: new Date(),
        type: 'user',
        content: 'Find buyers in Germany for export'
      };

      const updatedContext = await userContextManager.addMessageToHistory(
        mockUserId,
        mockConversationId,
        message
      );

      expect(updatedContext.currentSession.searchQueries).toEqual(['export', 'buyers', 'germany']);
    });
  });

  describe('getConversationThreads', () => {
    it('should return conversation threads information', () => {
      const mockConversations = {
        'conv-1': [
          {
            id: 'msg-1',
            userId: mockUserId,
            conversationId: 'conv-1',
            timestamp: new Date('2023-01-01'),
            type: 'user',
            content: 'First message',
            intent: { name: 'FIND_BUYERS', confidence: 0.9, entities: [], parameters: {} }
          },
          {
            id: 'msg-2',
            userId: mockUserId,
            conversationId: 'conv-1',
            timestamp: new Date('2023-01-02'),
            type: 'assistant',
            content: 'Response'
          }
        ],
        'conv-2': [
          {
            id: 'msg-3',
            userId: mockUserId,
            conversationId: 'conv-2',
            timestamp: new Date('2023-01-03'),
            type: 'user',
            content: 'Market research question'
          }
        ]
      };

      (ConversationStorageManager.getUserConversations as jest.Mock).mockReturnValue(mockConversations);

      const threads = userContextManager.getConversationThreads(mockUserId);

      expect(threads).toHaveLength(2);
      expect(threads[0].conversationId).toBe('conv-2'); // Most recent first
      expect(threads[0].messageCount).toBe(1);
      expect(threads[1].conversationId).toBe('conv-1');
      expect(threads[1].messageCount).toBe(2);
    });

    it('should extract topics from conversation messages', () => {
      const mockConversations = {
        'conv-1': [
          {
            id: 'msg-1',
            userId: mockUserId,
            conversationId: 'conv-1',
            timestamp: new Date(),
            type: 'user',
            content: 'Find buyers',
            intent: {
              name: 'FIND_BUYERS',
              confidence: 0.9,
              entities: [
                { type: 'COUNTRY', value: 'Germany', confidence: 0.8, startIndex: 0, endIndex: 7 }
              ],
              parameters: {}
            }
          }
        ]
      };

      (ConversationStorageManager.getUserConversations as jest.Mock).mockReturnValue(mockConversations);

      const threads = userContextManager.getConversationThreads(mockUserId);

      expect(threads[0].topics).toContain('find buyers');
      expect(threads[0].topics).toContain('germany');
    });
  });

  describe('createNewConversation', () => {
    it('should create a new conversation with unique ID', async () => {
      const conversationId = await userContextManager.createNewConversation(mockUserId);

      expect(conversationId).toBe('generated-id-123');
      expect(ConversationStorageManager.saveUserContext).toHaveBeenCalled();
    });
  });

  describe('switchConversation', () => {
    it('should switch to different conversation', async () => {
      // First create a context
      await userContextManager.getUserContext(mockUserId, 'conv-1');
      
      // Switch to different conversation
      const newContext = await userContextManager.switchConversation(mockUserId, 'conv-2');

      expect(newContext.conversationId).toBe('conv-2');
    });
  });

  describe('getPersonalizationInsights', () => {
    it('should return personalization insights for user', () => {
      const insights = userContextManager.getPersonalizationInsights(mockUserId);

      expect(insights).toBeDefined();
      expect(insights.preferredTopics).toBeDefined();
      expect(insights.commonQuestions).toBeDefined();
      expect(insights.suggestedActions).toBeDefined();
      expect(insights.experienceLevel).toBeDefined();
    });

    it('should return default insights when no context exists', () => {
      const insights = userContextManager.getPersonalizationInsights('non-existent-user');

      expect(insights.preferredTopics).toEqual(['market research', 'buyer discovery']);
      expect(insights.experienceLevel).toBe('beginner');
    });
  });

  describe('learnFromInteraction', () => {
    it('should learn from user interactions', async () => {
      const intent: RecognizedIntent = {
        name: 'FIND_BUYERS',
        confidence: 0.9,
        entities: [
          { type: 'COUNTRY', value: 'Japan', confidence: 0.8, startIndex: 0, endIndex: 5 }
        ],
        parameters: {}
      };

      const feedback = {
        helpful: true,
        rating: 5,
        comment: 'Very helpful!'
      };

      await userContextManager.learnFromInteraction(mockUserId, intent, feedback);

      // Should update business profile with new country
      const context = await userContextManager.getUserContext(mockUserId);
      expect(context.businessProfile.targetMarkets).toContain('Japan');
    });

    it('should handle learning without feedback', async () => {
      const intent: RecognizedIntent = {
        name: 'MARKET_RESEARCH',
        confidence: 0.8,
        entities: [
          { type: 'PRODUCT', value: 'Electronics', confidence: 0.9, startIndex: 0, endIndex: 11 }
        ],
        parameters: {}
      };

      await expect(userContextManager.learnFromInteraction(mockUserId, intent)).resolves.not.toThrow();
    });
  });

  describe('Context Update Callbacks', () => {
    it('should register and call context update callbacks', async () => {
      const callback = jest.fn();
      
      userContextManager.onContextUpdate(mockUserId, callback);
      
      const context = await userContextManager.updateUserContext(mockUserId, {
        businessProfile: { industry: 'Test Industry' }
      });

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        userId: mockUserId
      }));
    });

    it('should unregister context update callbacks', async () => {
      const callback = jest.fn();
      
      userContextManager.onContextUpdate(mockUserId, callback);
      userContextManager.offContextUpdate(mockUserId, callback);
      
      await userContextManager.updateUserContext(mockUserId, {});

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('clearUserContext', () => {
    it('should clear user context from memory and storage', async () => {
      // First create a context
      await userContextManager.getUserContext(mockUserId);
      
      await userContextManager.clearUserContext(mockUserId);

      expect(ConversationStorageManager.clearUserData).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('getContextRecoveryInfo', () => {
    it('should return recovery information', () => {
      const mockContext = {
        userId: mockUserId,
        conversationId: 'conv-123',
        currentSession: {
          lastActivity: new Date()
        }
      };

      (ConversationStorageManager.getUserContextByUserId as jest.Mock).mockReturnValue(mockContext);
      (ConversationStorageManager.getUserConversations as jest.Mock).mockReturnValue({
        'conv-123': [{ id: 'msg-1' }]
      });

      const recoveryInfo = userContextManager.getContextRecoveryInfo(mockUserId);

      expect(recoveryInfo.hasStoredContext).toBe(true);
      expect(recoveryInfo.conversationCount).toBe(1);
      expect(recoveryInfo.canRecover).toBe(true);
    });

    it('should handle missing context gracefully', () => {
      const recoveryInfo = userContextManager.getContextRecoveryInfo('non-existent-user');

      expect(recoveryInfo.hasStoredContext).toBe(false);
      expect(recoveryInfo.canRecover).toBe(false);
    });
  });

  describe('recoverContext', () => {
    it('should recover context from storage', async () => {
      const mockContext = {
        userId: mockUserId,
        conversationId: 'conv-123',
        currentSession: {
          lastActivity: new Date()
        }
      };

      (ConversationStorageManager.getUserContextByUserId as jest.Mock).mockReturnValue(mockContext);
      (ConversationStorageManager.getUserConversations as jest.Mock).mockReturnValue({
        'conv-123': [{ id: 'msg-1' }]
      });

      const recoveredContext = await userContextManager.recoverContext(mockUserId);

      expect(recoveredContext).toBeDefined();
      expect(recoveredContext!.userId).toBe(mockUserId);
    });

    it('should return null when recovery is not possible', async () => {
      const recoveredContext = await userContextManager.recoverContext('non-existent-user');

      expect(recoveredContext).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      (ConversationStorageManager.getUserContextByUserId as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const context = await userContextManager.getUserContext(mockUserId);

      // Should still return a valid context
      expect(context).toBeDefined();
      expect(context.userId).toBe(mockUserId);
    });

    it('should handle callback errors gracefully', async () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      userContextManager.onContextUpdate(mockUserId, errorCallback);
      
      // Should not throw even if callback fails
      await expect(userContextManager.updateUserContext(mockUserId, {})).resolves.not.toThrow();
    });
  });
});