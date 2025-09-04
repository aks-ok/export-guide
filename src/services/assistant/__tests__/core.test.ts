import { 
  AssistantValidator, 
  ConversationStorageManager, 
  AssistantUtils,
  ConversationMessage,
  AssistantResponse,
  UserContext
} from '../index';

describe('Assistant Core Infrastructure', () => {
  
  beforeEach(() => {
    // Clear localStorage before each test
    ConversationStorageManager.clearAllData();
  });

  describe('AssistantValidator', () => {
    it('should validate a correct message', () => {
      const message: ConversationMessage = {
        id: 'test-id',
        userId: 'user-123',
        conversationId: 'conv-123',
        timestamp: new Date(),
        type: 'user',
        content: 'Hello, I need help with exports'
      };

      const result = AssistantValidator.validateMessage(message);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid message', () => {
      const message = {
        id: '',
        userId: '',
        content: '',
        type: 'invalid'
      };

      const result = AssistantValidator.validateMessage(message);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should sanitize dangerous input', () => {
      const dangerousInput = '<script>alert("xss")</script>Hello world';
      const sanitized = AssistantValidator.sanitizeInput(dangerousInput);
      expect(sanitized).toBe('Hello world');
      expect(sanitized).not.toContain('<script>');
    });
  });

  describe('AssistantUtils', () => {
    it('should generate unique IDs', () => {
      const id1 = AssistantUtils.generateId();
      const id2 = AssistantUtils.generateId();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should detect basic intents', () => {
      expect(AssistantUtils.detectBasicIntent('How do I find buyers?')).toBe('FIND_BUYERS');
      expect(AssistantUtils.detectBasicIntent('What is market research?')).toBe('MARKET_RESEARCH');
      expect(AssistantUtils.detectBasicIntent('Help me with compliance')).toBe('ONBOARDING_HELP');
      expect(AssistantUtils.detectBasicIntent('Random text')).toBe('UNKNOWN');
    });

    it('should extract keywords from content', () => {
      const content = 'I need help with export compliance and finding buyers in Germany';
      const keywords = AssistantUtils.extractKeywords(content);
      
      expect(keywords).toContain('export');
      expect(keywords).toContain('compliance');
      expect(keywords).toContain('buyers');
    });

    it('should format timestamps correctly', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      const formatted = AssistantUtils.formatTimestamp(fiveMinutesAgo);
      expect(formatted).toContain('min');
    });
  });

  describe('ConversationStorageManager', () => {
    it('should save and retrieve messages', () => {
      const message: ConversationMessage = {
        id: 'msg-1',
        userId: 'user-123',
        conversationId: 'conv-123',
        timestamp: new Date(),
        type: 'user',
        content: 'Test message'
      };

      ConversationStorageManager.saveMessage(message);
      const history = ConversationStorageManager.getConversationHistory('conv-123');
      
      expect(history).toHaveLength(1);
      expect(history[0].content).toBe('Test message');
    });

    it('should save and retrieve user context', () => {
      const context = AssistantUtils.createDefaultUserContext('user-123', 'conv-123');
      
      ConversationStorageManager.saveUserContext(context);
      const retrieved = ConversationStorageManager.getUserContext('conv-123');
      
      expect(retrieved).toBeTruthy();
      expect(retrieved?.userId).toBe('user-123');
    });

    it('should provide storage statistics', () => {
      const message: ConversationMessage = {
        id: 'msg-1',
        userId: 'user-123',
        conversationId: 'conv-123',
        timestamp: new Date(),
        type: 'user',
        content: 'Test message'
      };

      ConversationStorageManager.saveMessage(message);
      const stats = ConversationStorageManager.getStorageStats();
      
      expect(stats.totalConversations).toBe(1);
      expect(stats.totalMessages).toBe(1);
    });
  });
});