import { MessageHandler } from '../MessageHandler';
import { ConversationStorageManager } from '../storage';
import { AssistantUtils } from '../utils';
import { UserContext, QuickAction } from '../types';

// Mock the storage manager
jest.mock('../storage');

describe('MessageHandler', () => {
  let messageHandler: MessageHandler;
  let mockContext: UserContext;

  beforeEach(() => {
    messageHandler = MessageHandler.getInstance();
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock user context
    mockContext = AssistantUtils.createDefaultUserContext('user-123', 'conv-123');
    
    // Mock storage methods
    (ConversationStorageManager.saveMessage as jest.Mock) = jest.fn();
    (ConversationStorageManager.saveUserContext as jest.Mock) = jest.fn();
    (ConversationStorageManager.saveAnalytics as jest.Mock) = jest.fn();
    (ConversationStorageManager.getAnalytics as jest.Mock) = jest.fn().mockReturnValue(null);
  });

  describe('processMessage', () => {
    it('should process a valid message and return response', async () => {
      const content = 'How do I find buyers for my products?';
      
      const result = await messageHandler.processMessage(content, mockContext);
      
      expect(result.userMessage).toBeDefined();
      expect(result.userMessage.content).toBe(content);
      expect(result.userMessage.type).toBe('user');
      expect(result.userMessage.userId).toBe('user-123');
      
      expect(result.assistantResponse).toBeDefined();
      expect(result.assistantResponse.text).toContain('buyers');
      expect(result.assistantResponse.quickActions).toBeDefined();
      expect(result.assistantResponse.quickActions!.length).toBeGreaterThan(0);
    });

    it('should detect FIND_BUYERS intent correctly', async () => {
      const content = 'I need to find buyers for my textile products';
      
      const result = await messageHandler.processMessage(content, mockContext);
      
      expect(result.assistantResponse.text).toContain('Buyer Discovery');
      expect(result.assistantResponse.quickActions).toBeDefined();
      
      const buyerAction = result.assistantResponse.quickActions!.find(
        action => action.parameters.page === 'buyer-discovery'
      );
      expect(buyerAction).toBeDefined();
    });

    it('should detect MARKET_RESEARCH intent correctly', async () => {
      const content = 'What are the market opportunities in Germany?';
      
      const result = await messageHandler.processMessage(content, mockContext);
      
      expect(result.assistantResponse.text).toContain('Market Research');
      expect(result.assistantResponse.quickActions).toBeDefined();
      
      const researchAction = result.assistantResponse.quickActions!.find(
        action => action.parameters.page === 'market-research'
      );
      expect(researchAction).toBeDefined();
    });

    it('should detect COMPLIANCE_HELP intent correctly', async () => {
      const content = 'I need help with export compliance and regulations';
      
      const result = await messageHandler.processMessage(content, mockContext);
      
      expect(result.assistantResponse.text).toContain('compliance');
      expect(result.assistantResponse.quickActions).toBeDefined();
      
      const complianceAction = result.assistantResponse.quickActions!.find(
        action => action.parameters.page === 'export-compliance'
      );
      expect(complianceAction).toBeDefined();
    });

    it('should detect QUOTATION_HELP intent correctly', async () => {
      const content = 'How do I create a quotation for international sales?';
      
      const result = await messageHandler.processMessage(content, mockContext);
      
      expect(result.assistantResponse.text).toContain('quotation');
      expect(result.assistantResponse.quickActions).toBeDefined();
      
      const quotationAction = result.assistantResponse.quickActions!.find(
        action => action.parameters.page === 'quotation'
      );
      expect(quotationAction).toBeDefined();
    });

    it('should handle invalid input gracefully', async () => {
      const content = ''; // Empty content
      
      const result = await messageHandler.processMessage(content, mockContext);
      
      expect(result.assistantResponse.text).toContain('error');
      expect(result.assistantResponse.followUpQuestions).toBeDefined();
    });

    it('should extract entities from message content', async () => {
      const content = 'I want to export to USA and Germany for $50,000';
      
      const result = await messageHandler.processMessage(content, mockContext);
      
      // The message should be processed successfully
      expect(result.userMessage.content).toBe(content);
      expect(result.assistantResponse).toBeDefined();
    });

    it('should save messages to storage', async () => {
      const content = 'Test message';
      
      await messageHandler.processMessage(content, mockContext);
      
      // Should save both user and assistant messages
      expect(ConversationStorageManager.saveMessage).toHaveBeenCalledTimes(2);
      expect(ConversationStorageManager.saveUserContext).toHaveBeenCalledTimes(1);
      expect(ConversationStorageManager.saveAnalytics).toHaveBeenCalledTimes(1);
    });

    it('should update conversation history in context', async () => {
      const content = 'Test message';
      const initialHistoryLength = mockContext.conversationHistory.length;
      
      await messageHandler.processMessage(content, mockContext);
      
      // Should add both user and assistant messages to history
      expect(mockContext.conversationHistory.length).toBe(initialHistoryLength + 2);
      expect(mockContext.conversationHistory[initialHistoryLength].type).toBe('user');
      expect(mockContext.conversationHistory[initialHistoryLength + 1].type).toBe('assistant');
    });
  });

  describe('handleQuickAction', () => {
    it('should handle navigation actions', async () => {
      const action: QuickAction = {
        id: 'nav_test',
        label: 'Test Navigation',
        action: 'navigate',
        parameters: { page: 'buyer-discovery' }
      };
      
      const response = await messageHandler.handleQuickAction(action, mockContext);
      
      expect(response.text).toContain('buyer discovery');
      expect(response.navigationSuggestion).toBeDefined();
      expect(response.navigationSuggestion!.page).toBe('buyer-discovery');
    });

    it('should handle search actions', async () => {
      const action: QuickAction = {
        id: 'search_test',
        label: 'Test Search',
        action: 'search',
        parameters: { type: 'product' }
      };
      
      const response = await messageHandler.handleQuickAction(action, mockContext);
      
      expect(response.text).toContain('search');
      expect(response.text).toContain('product');
    });

    it('should handle create actions', async () => {
      const action: QuickAction = {
        id: 'create_test',
        label: 'Test Create',
        action: 'create',
        parameters: { type: 'quotation' }
      };
      
      const response = await messageHandler.handleQuickAction(action, mockContext);
      
      expect(response.text).toContain('create');
      expect(response.text).toContain('quotation');
    });

    it('should handle analyze actions', async () => {
      const action: QuickAction = {
        id: 'analyze_test',
        label: 'Test Analyze',
        action: 'analyze',
        parameters: { type: 'market' }
      };
      
      const response = await messageHandler.handleQuickAction(action, mockContext);
      
      expect(response.text).toContain('analyze');
      expect(response.text).toContain('market');
    });

    it('should handle unknown actions gracefully', async () => {
      const action: QuickAction = {
        id: 'unknown_test',
        label: 'Unknown Action',
        action: 'unknown' as any,
        parameters: {}
      };
      
      const response = await messageHandler.handleQuickAction(action, mockContext);
      
      expect(response.text).toContain('Unknown Action');
      expect(response.text).toContain('being implemented');
    });
  });

  describe('getConversationHistory', () => {
    it('should return conversation history for user', async () => {
      const mockConversations = {
        'conv-1': [
          {
            id: 'msg-1',
            userId: 'user-123',
            conversationId: 'conv-1',
            timestamp: new Date('2023-01-01'),
            type: 'user' as const,
            content: 'Hello'
          }
        ],
        'conv-2': [
          {
            id: 'msg-2',
            userId: 'user-123',
            conversationId: 'conv-2',
            timestamp: new Date('2023-01-02'),
            type: 'user' as const,
            content: 'Hi again'
          }
        ]
      };
      
      (ConversationStorageManager.getUserConversations as jest.Mock) = jest.fn()
        .mockReturnValue(mockConversations);
      
      const history = await messageHandler.getConversationHistory('user-123');
      
      expect(history).toHaveLength(2);
      expect(history[0].content).toBe('Hello');
      expect(history[1].content).toBe('Hi again');
      // Should be sorted by timestamp
      expect(history[0].timestamp.getTime()).toBeLessThan(history[1].timestamp.getTime());
    });

    it('should handle errors gracefully', async () => {
      (ConversationStorageManager.getUserConversations as jest.Mock) = jest.fn()
        .mockImplementation(() => {
          throw new Error('Storage error');
        });
      
      const history = await messageHandler.getConversationHistory('user-123');
      
      expect(history).toEqual([]);
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MessageHandler.getInstance();
      const instance2 = MessageHandler.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('intent detection', () => {
    it('should improve confidence with export keywords', async () => {
      const content = 'I need export compliance help for trade regulations';
      
      const result = await messageHandler.processMessage(content, mockContext);
      
      // Should detect compliance intent with good confidence
      expect(result.assistantResponse.text).toContain('compliance');
    });

    it('should consider conversation history for context', async () => {
      // Add previous messages to context
      mockContext.conversationHistory = [
        {
          id: 'prev-1',
          userId: 'user-123',
          conversationId: 'conv-123',
          timestamp: new Date(),
          type: 'user',
          content: 'I want to find buyers'
        }
      ];
      
      const content = 'What about Germany?'; // Ambiguous without context
      
      const result = await messageHandler.processMessage(content, mockContext);
      
      // Should still provide helpful response
      expect(result.assistantResponse.text).toBeDefined();
      expect(result.assistantResponse.followUpQuestions).toBeDefined();
    });
  });
});