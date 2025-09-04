import { 
  ConversationMessage, 
  UserContext, 
  ConversationAnalytics, 
  ConversationStorage,
  UserPreferences 
} from './types';

/**
 * Encrypted localStorage-based storage for conversation data
 */
export class ConversationStorageManager {
  private static readonly STORAGE_KEY = 'exportguide_assistant_data';
  private static readonly ENCRYPTION_KEY = 'eg_assistant_v1';
  private static readonly MAX_CONVERSATIONS = 50;
  private static readonly MAX_MESSAGES_PER_CONVERSATION = 100;

  /**
   * Simple encryption for localStorage (not cryptographically secure, but prevents casual inspection)
   */
  private static encrypt(data: string): string {
    try {
      return btoa(encodeURIComponent(data));
    } catch (error) {
      console.warn('Failed to encrypt data:', error);
      return data;
    }
  }

  /**
   * Simple decryption for localStorage
   */
  private static decrypt(encryptedData: string): string {
    try {
      return decodeURIComponent(atob(encryptedData));
    } catch (error) {
      console.warn('Failed to decrypt data:', error);
      return encryptedData;
    }
  }

  /**
   * Get all stored data
   */
  private static getStorageData(): ConversationStorage {
    try {
      const encryptedData = localStorage.getItem(this.STORAGE_KEY);
      if (!encryptedData) {
        return this.getDefaultStorage();
      }

      const decryptedData = this.decrypt(encryptedData);
      const parsed = JSON.parse(decryptedData);
      
      // Convert date strings back to Date objects
      this.deserializeDates(parsed);
      
      return parsed;
    } catch (error) {
      console.error('Failed to load conversation storage:', error);
      return this.getDefaultStorage();
    }
  }

  /**
   * Save all data to storage
   */
  private static setStorageData(data: ConversationStorage): void {
    try {
      // Clean up old data before saving
      this.cleanupOldData(data);
      
      const serialized = JSON.stringify(data);
      const encrypted = this.encrypt(serialized);
      localStorage.setItem(this.STORAGE_KEY, encrypted);
    } catch (error) {
      console.error('Failed to save conversation storage:', error);
    }
  }

  /**
   * Get default empty storage structure
   */
  private static getDefaultStorage(): ConversationStorage {
    return {
      conversations: {},
      userContexts: {},
      analytics: {},
      lastUpdated: new Date()
    };
  }

  /**
   * Convert date strings back to Date objects after JSON parsing
   */
  private static deserializeDates(obj: any): void {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (obj[key] && typeof obj[key] === 'object') {
          if (key === 'timestamp' || key === 'lastUpdated' || key === 'startTime' || key === 'endTime' || key === 'lastActivity' || key === 'sessionStartTime') {
            obj[key] = new Date(obj[key]);
          } else {
            this.deserializeDates(obj[key]);
          }
        }
      }
    }
  }

  /**
   * Clean up old conversations and messages to prevent storage bloat
   */
  private static cleanupOldData(data: ConversationStorage): void {
    // Remove conversations older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    Object.keys(data.conversations).forEach(conversationId => {
      const messages = data.conversations[conversationId];
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.timestamp < thirtyDaysAgo) {
          delete data.conversations[conversationId];
          delete data.userContexts[conversationId];
          delete data.analytics[conversationId];
        } else {
          // Limit messages per conversation
          if (messages.length > this.MAX_MESSAGES_PER_CONVERSATION) {
            data.conversations[conversationId] = messages.slice(-this.MAX_MESSAGES_PER_CONVERSATION);
          }
        }
      }
    });

    // Limit total number of conversations
    const conversationIds = Object.keys(data.conversations);
    if (conversationIds.length > this.MAX_CONVERSATIONS) {
      // Sort by last message timestamp and keep only the most recent
      const sortedIds = conversationIds.sort((a, b) => {
        const aMessages = data.conversations[a];
        const bMessages = data.conversations[b];
        const aLastTime = aMessages.length > 0 ? aMessages[aMessages.length - 1].timestamp.getTime() : 0;
        const bLastTime = bMessages.length > 0 ? bMessages[bMessages.length - 1].timestamp.getTime() : 0;
        return bLastTime - aLastTime;
      });

      const toKeep = sortedIds.slice(0, this.MAX_CONVERSATIONS);
      const toRemove = sortedIds.slice(this.MAX_CONVERSATIONS);

      toRemove.forEach(id => {
        delete data.conversations[id];
        delete data.userContexts[id];
        delete data.analytics[id];
      });
    }
  }

  /**
   * Save a conversation message
   */
  static saveMessage(message: ConversationMessage): void {
    const data = this.getStorageData();
    
    if (!data.conversations[message.conversationId]) {
      data.conversations[message.conversationId] = [];
    }
    
    data.conversations[message.conversationId].push(message);
    data.lastUpdated = new Date();
    
    this.setStorageData(data);
  }

  /**
   * Get conversation history
   */
  static getConversationHistory(conversationId: string): ConversationMessage[] {
    const data = this.getStorageData();
    return data.conversations[conversationId] || [];
  }

  /**
   * Get all conversations for a user
   */
  static getUserConversations(userId: string): Record<string, ConversationMessage[]> {
    const data = this.getStorageData();
    const userConversations: Record<string, ConversationMessage[]> = {};
    
    Object.keys(data.conversations).forEach(conversationId => {
      const messages = data.conversations[conversationId];
      if (messages.length > 0 && messages[0].userId === userId) {
        userConversations[conversationId] = messages;
      }
    });
    
    return userConversations;
  }

  /**
   * Save user context
   */
  static saveUserContext(context: UserContext): void {
    const data = this.getStorageData();
    data.userContexts[context.conversationId] = context;
    data.lastUpdated = new Date();
    this.setStorageData(data);
  }

  /**
   * Get user context
   */
  static getUserContext(conversationId: string): UserContext | null {
    const data = this.getStorageData();
    return data.userContexts[conversationId] || null;
  }

  /**
   * Save conversation analytics
   */
  static saveAnalytics(analytics: ConversationAnalytics): void {
    const data = this.getStorageData();
    data.analytics[analytics.conversationId] = analytics;
    data.lastUpdated = new Date();
    this.setStorageData(data);
  }

  /**
   * Get conversation analytics
   */
  static getAnalytics(conversationId: string): ConversationAnalytics | null {
    const data = this.getStorageData();
    return data.analytics[conversationId] || null;
  }

  /**
   * Delete a conversation and all associated data
   */
  static deleteConversation(conversationId: string): void {
    const data = this.getStorageData();
    delete data.conversations[conversationId];
    delete data.userContexts[conversationId];
    delete data.analytics[conversationId];
    data.lastUpdated = new Date();
    this.setStorageData(data);
  }

  /**
   * Clear all stored data
   */
  static clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get storage statistics
   */
  static getStorageStats(): {
    totalConversations: number;
    totalMessages: number;
    storageSize: number;
    oldestConversation?: Date;
    newestConversation?: Date;
  } {
    const data = this.getStorageData();
    const conversations = Object.values(data.conversations);
    
    let totalMessages = 0;
    let oldestDate: Date | undefined;
    let newestDate: Date | undefined;
    
    conversations.forEach(messages => {
      totalMessages += messages.length;
      
      if (messages.length > 0) {
        const firstMessage = messages[0];
        const lastMessage = messages[messages.length - 1];
        
        if (!oldestDate || firstMessage.timestamp < oldestDate) {
          oldestDate = firstMessage.timestamp;
        }
        
        if (!newestDate || lastMessage.timestamp > newestDate) {
          newestDate = lastMessage.timestamp;
        }
      }
    });
    
    const storageData = localStorage.getItem(this.STORAGE_KEY);
    const storageSize = storageData ? new Blob([storageData]).size : 0;
    
    return {
      totalConversations: conversations.length,
      totalMessages,
      storageSize,
      oldestConversation: oldestDate,
      newestConversation: newestDate
    };
  }

  /**
   * Export conversation data for backup
   */
  static exportData(): string {
    const data = this.getStorageData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import conversation data from backup
   */
  static importData(jsonData: string): boolean {
    try {
      const parsed = JSON.parse(jsonData);
      this.deserializeDates(parsed);
      this.setStorageData(parsed);
      return true;
    } catch (error) {
      console.error('Failed to import conversation data:', error);
      return false;
    }
  }

  /**
   * Get all analytics data
   */
  static getAllAnalytics(): Record<string, ConversationAnalytics> {
    const data = this.getStorageData();
    return data.analytics;
  }

  /**
   * Get user context by userId (finds the most recent context for the user)
   */
  static getUserContextByUserId(userId: string): UserContext | null {
    const data = this.getStorageData();
    
    // Find the most recent context for this user
    let mostRecentContext: UserContext | null = null;
    let mostRecentTime = 0;
    
    Object.values(data.userContexts).forEach(context => {
      if (context.userId === userId) {
        const contextTime = context.currentSession.lastActivity.getTime();
        if (contextTime > mostRecentTime) {
          mostRecentTime = contextTime;
          mostRecentContext = context;
        }
      }
    });
    
    return mostRecentContext;
  }

  /**
   * Clear all data for a specific user
   */
  static clearUserData(userId: string): void {
    const data = this.getStorageData();
    
    // Find and remove all conversations for this user
    Object.keys(data.conversations).forEach(conversationId => {
      const messages = data.conversations[conversationId];
      if (messages.length > 0 && messages[0].userId === userId) {
        delete data.conversations[conversationId];
        delete data.userContexts[conversationId];
        delete data.analytics[conversationId];
      }
    });
    
    data.lastUpdated = new Date();
    this.setStorageData(data);
  }
}