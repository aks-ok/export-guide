import { 
  UserContext, 
  BusinessProfile, 
  SessionContext, 
  UserPreferences, 
  ConversationMessage,
  ConversationAnalytics,
  RecognizedIntent
} from './types';
import { ConversationStorageManager } from './storage';
import { AssistantUtils } from './utils';
import { AssistantValidator } from './validation';

/**
 * UserContextManager maintains conversation context and user preferences
 */
export class UserContextManager {
  private static instance: UserContextManager;
  private activeContexts: Map<string, UserContext> = new Map();
  private contextUpdateCallbacks: Map<string, ((context: UserContext) => void)[]> = new Map();

  private constructor() {
    // Initialize cleanup interval for inactive contexts
    this.startContextCleanup();
  }

  public static getInstance(): UserContextManager {
    if (!UserContextManager.instance) {
      UserContextManager.instance = new UserContextManager();
    }
    return UserContextManager.instance;
  }

  /**
   * Get or create user context
   */
  async getUserContext(userId: string, conversationId?: string): Promise<UserContext> {
    try {
      const contextKey = `${userId}_${conversationId || 'default'}`;
      
      // Check if context is already in memory
      if (this.activeContexts.has(contextKey)) {
        const context = this.activeContexts.get(contextKey)!;
        this.updateSessionActivity(context);
        return context;
      }

      // Try to load from storage
      let context = ConversationStorageManager.getUserContextByUserId(userId);
      
      if (!context) {
        // Create new context
        context = await this.createNewUserContext(userId, conversationId);
      } else {
        // Update conversation ID if provided
        if (conversationId && context.conversationId !== conversationId) {
          context.conversationId = conversationId;
        }
        
        // Refresh session context
        context.currentSession = this.createSessionContext();
        
        // Load conversation history for this conversation
        context.conversationHistory = this.getConversationHistory(userId, context.conversationId);
      }

      // Validate context
      const validation = AssistantValidator.validateUserContext(context);
      if (!validation.isValid) {
        console.warn('User context validation warnings:', validation.errors);
        // Fix common issues
        context = this.repairUserContext(context);
      }

      // Store in memory
      this.activeContexts.set(contextKey, context);
      
      return context;
    } catch (error) {
      console.error('Error getting user context:', error);
      // Return minimal context as fallback
      return await this.createNewUserContext(userId, conversationId);
    }
  }

  /**
   * Update user context with new information
   */
  async updateUserContext(
    userId: string, 
    updates: Partial<UserContext>,
    persistImmediately: boolean = true
  ): Promise<UserContext> {
    try {
      const contextKey = `${userId}_${updates.conversationId || 'default'}`;
      let context = this.activeContexts.get(contextKey);
      
      if (!context) {
        context = await this.getUserContext(userId, updates.conversationId);
      }

      // Apply updates
      context = {
        ...context,
        ...updates,
        currentSession: {
          ...context.currentSession,
          ...updates.currentSession,
          lastActivity: new Date()
        }
      };

      // Update in memory
      this.activeContexts.set(contextKey, context);

      // Persist to storage if requested
      if (persistImmediately) {
        ConversationStorageManager.saveUserContext(context);
      }

      // Notify callbacks
      this.notifyContextUpdate(contextKey, context);

      return context;
    } catch (error) {
      console.error('Error updating user context:', error);
      throw error;
    }
  }

  /**
   * Update business profile
   */
  async updateBusinessProfile(
    userId: string,
    profileUpdates: Partial<BusinessProfile>
  ): Promise<UserContext> {
    const context = await this.getUserContext(userId);
    
    const updatedProfile: BusinessProfile = {
      ...context.businessProfile,
      ...profileUpdates
    };

    return await this.updateUserContext(userId, {
      businessProfile: updatedProfile
    });
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferenceUpdates: Partial<UserPreferences>
  ): Promise<UserContext> {
    const context = await this.getUserContext(userId);
    
    const updatedPreferences: UserPreferences = {
      ...context.preferences,
      ...preferenceUpdates,
      dataPrivacy: {
        ...context.preferences.dataPrivacy,
        ...preferenceUpdates.dataPrivacy
      }
    };

    return await this.updateUserContext(userId, {
      preferences: updatedPreferences
    });
  }

  /**
   * Add message to conversation history
   */
  async addMessageToHistory(
    userId: string,
    conversationId: string,
    message: ConversationMessage
  ): Promise<UserContext> {
    const context = await this.getUserContext(userId, conversationId);
    
    // Add message to history
    context.conversationHistory.push(message);
    
    // Keep only last 50 messages to prevent memory issues
    if (context.conversationHistory.length > 50) {
      context.conversationHistory = context.conversationHistory.slice(-50);
    }

    // Update session context based on message
    this.updateSessionFromMessage(context, message);

    return await this.updateUserContext(userId, context);
  }

  /**
   * Get conversation threading information
   */
  getConversationThreads(userId: string): Array<{
    conversationId: string;
    startTime: Date;
    lastActivity: Date;
    messageCount: number;
    topics: string[];
  }> {
    try {
      const userConversations = ConversationStorageManager.getUserConversations(userId);
      const threads: Array<{
        conversationId: string;
        startTime: Date;
        lastActivity: Date;
        messageCount: number;
        topics: string[];
      }> = [];

      Object.entries(userConversations).forEach(([conversationId, messages]) => {
        if (messages.length === 0) return;

        const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const topics = this.extractTopicsFromMessages(messages);

        threads.push({
          conversationId,
          startTime: sortedMessages[0].timestamp,
          lastActivity: sortedMessages[sortedMessages.length - 1].timestamp,
          messageCount: messages.length,
          topics
        });
      });

      // Sort by last activity (most recent first)
      return threads.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    } catch (error) {
      console.error('Error getting conversation threads:', error);
      return [];
    }
  }

  /**
   * Create new conversation thread
   */
  async createNewConversation(userId: string): Promise<string> {
    const conversationId = AssistantUtils.generateId();
    const context = await this.getUserContext(userId, conversationId);
    
    // Initialize new conversation
    context.conversationHistory = [];
    context.currentSession = this.createSessionContext();
    
    await this.updateUserContext(userId, context);
    
    return conversationId;
  }

  /**
   * Switch to different conversation
   */
  async switchConversation(userId: string, conversationId: string): Promise<UserContext> {
    // Remove current context from memory to force reload
    const currentContextKey = Array.from(this.activeContexts.keys())
      .find(key => key.startsWith(`${userId}_`));
    
    if (currentContextKey) {
      this.activeContexts.delete(currentContextKey);
    }

    // Load the target conversation
    return await this.getUserContext(userId, conversationId);
  }

  /**
   * Get personalization insights for user
   */
  getPersonalizationInsights(userId: string): {
    preferredTopics: string[];
    commonQuestions: string[];
    suggestedActions: string[];
    experienceLevel: string;
    targetMarkets: string[];
    primaryProducts: string[];
  } {
    try {
      const context = this.activeContexts.get(`${userId}_default`) || 
                     ConversationStorageManager.getUserContextByUserId(userId);
      
      if (!context) {
        return this.getDefaultPersonalizationInsights();
      }

      const analytics = this.analyzeUserBehavior(userId);
      
      return {
        preferredTopics: this.extractPreferredTopics(context, analytics),
        commonQuestions: this.extractCommonQuestions(context, analytics),
        suggestedActions: this.generateSuggestedActions(context, analytics),
        experienceLevel: context.businessProfile.experienceLevel,
        targetMarkets: context.businessProfile.targetMarkets,
        primaryProducts: context.businessProfile.primaryProducts
      };
    } catch (error) {
      console.error('Error getting personalization insights:', error);
      return this.getDefaultPersonalizationInsights();
    }
  }

  /**
   * Learn from user interactions to improve personalization
   */
  async learnFromInteraction(
    userId: string,
    intent: RecognizedIntent,
    userFeedback?: { helpful: boolean; rating?: number; comment?: string }
  ): Promise<void> {
    try {
      const context = await this.getUserContext(userId);
      
      // Update business profile based on entities
      if (intent.entities) {
        await this.updateProfileFromEntities(userId, intent.entities);
      }

      // Track interaction patterns
      this.trackInteractionPattern(userId, intent, userFeedback);
      
      // Update preferences based on feedback
      if (userFeedback) {
        await this.updatePreferencesFromFeedback(userId, intent, userFeedback);
      }
    } catch (error) {
      console.error('Error learning from interaction:', error);
    }
  }

  /**
   * Register callback for context updates
   */
  onContextUpdate(userId: string, callback: (context: UserContext) => void): void {
    const contextKey = `${userId}_default`;
    
    if (!this.contextUpdateCallbacks.has(contextKey)) {
      this.contextUpdateCallbacks.set(contextKey, []);
    }
    
    this.contextUpdateCallbacks.get(contextKey)!.push(callback);
  }

  /**
   * Unregister context update callback
   */
  offContextUpdate(userId: string, callback: (context: UserContext) => void): void {
    const contextKey = `${userId}_default`;
    const callbacks = this.contextUpdateCallbacks.get(contextKey);
    
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Clear user context (for privacy/logout)
   */
  async clearUserContext(userId: string): Promise<void> {
    try {
      // Remove from memory
      const keysToRemove = Array.from(this.activeContexts.keys())
        .filter(key => key.startsWith(`${userId}_`));
      
      keysToRemove.forEach(key => {
        this.activeContexts.delete(key);
        this.contextUpdateCallbacks.delete(key);
      });

      // Remove from storage
      ConversationStorageManager.clearUserData(userId);
    } catch (error) {
      console.error('Error clearing user context:', error);
    }
  }

  /**
   * Get context recovery information
   */
  getContextRecoveryInfo(userId: string): {
    hasStoredContext: boolean;
    lastActivity: Date | null;
    conversationCount: number;
    canRecover: boolean;
  } {
    try {
      const context = ConversationStorageManager.getUserContextByUserId(userId);
      const conversations = ConversationStorageManager.getUserConversations(userId);
      
      return {
        hasStoredContext: !!context,
        lastActivity: context?.currentSession.lastActivity || null,
        conversationCount: Object.keys(conversations).length,
        canRecover: !!context && Object.keys(conversations).length > 0
      };
    } catch (error) {
      return {
        hasStoredContext: false,
        lastActivity: null,
        conversationCount: 0,
        canRecover: false
      };
    }
  }

  /**
   * Recover context from storage
   */
  async recoverContext(userId: string): Promise<UserContext | null> {
    try {
      const recoveryInfo = this.getContextRecoveryInfo(userId);
      
      if (!recoveryInfo.canRecover) {
        return null;
      }

      const context = await this.getUserContext(userId);
      
      // Refresh session but keep historical data
      context.currentSession = this.createSessionContext();
      
      return context;
    } catch (error) {
      console.error('Error recovering context:', error);
      return null;
    }
  }

  // Private helper methods

  private async createNewUserContext(userId: string, conversationId?: string): Promise<UserContext> {
    const newContext: UserContext = {
      userId,
      conversationId: conversationId || AssistantUtils.generateId(),
      businessProfile: this.createDefaultBusinessProfile(),
      currentSession: this.createSessionContext(),
      preferences: this.createDefaultPreferences(),
      conversationHistory: []
    };

    // Save to storage
    ConversationStorageManager.saveUserContext(newContext);
    
    return newContext;
  }

  private createDefaultBusinessProfile(): BusinessProfile {
    return {
      industry: '',
      primaryProducts: [],
      targetMarkets: [],
      experienceLevel: 'beginner',
      preferredLanguage: 'en',
      businessSize: 'small'
    };
  }

  private createSessionContext(): SessionContext {
    return {
      currentPage: 'dashboard',
      sessionStartTime: new Date(),
      lastActivity: new Date(),
      pagesVisited: ['dashboard'],
      actionsPerformed: [],
      searchQueries: []
    };
  }

  private createDefaultPreferences(): UserPreferences {
    return {
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
    };
  }

  private updateSessionActivity(context: UserContext): void {
    context.currentSession.lastActivity = new Date();
  }

  private getConversationHistory(userId: string, conversationId: string): ConversationMessage[] {
    try {
      const userConversations = ConversationStorageManager.getUserConversations(userId);
      return userConversations[conversationId] || [];
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  private repairUserContext(context: UserContext): UserContext {
    // Fix missing or invalid fields
    if (!context.businessProfile) {
      context.businessProfile = this.createDefaultBusinessProfile();
    }
    
    if (!context.currentSession) {
      context.currentSession = this.createSessionContext();
    }
    
    if (!context.preferences) {
      context.preferences = this.createDefaultPreferences();
    }
    
    if (!context.conversationHistory) {
      context.conversationHistory = [];
    }

    return context;
  }

  private updateSessionFromMessage(context: UserContext, message: ConversationMessage): void {
    // Extract keywords for search queries
    if (message.type === 'user') {
      const keywords = AssistantUtils.extractKeywords(message.content);
      context.currentSession.searchQueries.push(...keywords);
      
      // Keep only last 20 search queries
      if (context.currentSession.searchQueries.length > 20) {
        context.currentSession.searchQueries = context.currentSession.searchQueries.slice(-20);
      }
    }

    // Track actions based on intent
    if (message.intent) {
      context.currentSession.actionsPerformed.push(`intent_${message.intent.name.toLowerCase()}`);
    }
  }

  private extractTopicsFromMessages(messages: ConversationMessage[]): string[] {
    const topics = new Set<string>();
    
    messages.forEach(message => {
      if (message.intent) {
        topics.add(message.intent.name.toLowerCase().replace('_', ' '));
      }
      
      // Extract entities as topics
      if (message.intent?.entities) {
        message.intent.entities.forEach(entity => {
          if (entity.type === 'COUNTRY' || entity.type === 'PRODUCT' || entity.type === 'INDUSTRY') {
            topics.add(entity.value.toLowerCase());
          }
        });
      }
    });
    
    return Array.from(topics).slice(0, 10); // Limit to 10 topics
  }

  private analyzeUserBehavior(userId: string): ConversationAnalytics[] {
    try {
      const allAnalytics = ConversationStorageManager.getAllAnalytics();
      return Object.values(allAnalytics).filter(analytics => analytics.userId === userId);
    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      return [];
    }
  }

  private extractPreferredTopics(context: UserContext, analytics: ConversationAnalytics[]): string[] {
    const topicCounts = new Map<string, number>();
    
    // Count intents from analytics
    analytics.forEach(analytic => {
      analytic.intentsRecognized.forEach(intent => {
        const topic = intent.toLowerCase().replace('_', ' ');
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    });
    
    // Sort by frequency and return top 5
    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private extractCommonQuestions(context: UserContext, analytics: ConversationAnalytics[]): string[] {
    // Extract common question patterns from conversation history
    const questionPatterns = new Set<string>();
    
    context.conversationHistory
      .filter(msg => msg.type === 'user' && msg.content.includes('?'))
      .forEach(msg => {
        // Simplify questions to patterns
        const pattern = this.simplifyQuestion(msg.content);
        if (pattern) {
          questionPatterns.add(pattern);
        }
      });
    
    return Array.from(questionPatterns).slice(0, 5);
  }

  private generateSuggestedActions(context: UserContext, analytics: ConversationAnalytics[]): string[] {
    const suggestions: string[] = [];
    
    // Based on experience level
    if (context.businessProfile.experienceLevel === 'beginner') {
      suggestions.push('Complete your business profile');
      suggestions.push('Explore market research tools');
    } else if (context.businessProfile.experienceLevel === 'intermediate') {
      suggestions.push('Find new buyers in target markets');
      suggestions.push('Analyze competitor strategies');
    } else {
      suggestions.push('Explore emerging markets');
      suggestions.push('Optimize export processes');
    }
    
    // Based on missing profile information
    if (context.businessProfile.targetMarkets.length === 0) {
      suggestions.push('Define your target markets');
    }
    
    if (context.businessProfile.primaryProducts.length === 0) {
      suggestions.push('Add your primary products');
    }
    
    return suggestions.slice(0, 5);
  }

  private getDefaultPersonalizationInsights() {
    return {
      preferredTopics: ['market research', 'buyer discovery'],
      commonQuestions: ['How do I find buyers?', 'What are the export requirements?'],
      suggestedActions: ['Complete your profile', 'Explore market data'],
      experienceLevel: 'beginner',
      targetMarkets: [],
      primaryProducts: []
    };
  }

  private async updateProfileFromEntities(userId: string, entities: any[]): Promise<void> {
    const updates: Partial<BusinessProfile> = {};
    
    entities.forEach(entity => {
      if (entity.type === 'COUNTRY') {
        const context = this.activeContexts.get(`${userId}_default`);
        if (context && !context.businessProfile.targetMarkets.includes(entity.value)) {
          updates.targetMarkets = [...(context.businessProfile.targetMarkets || []), entity.value];
        }
      } else if (entity.type === 'PRODUCT') {
        const context = this.activeContexts.get(`${userId}_default`);
        if (context && !context.businessProfile.primaryProducts.includes(entity.value)) {
          updates.primaryProducts = [...(context.businessProfile.primaryProducts || []), entity.value];
        }
      }
    });
    
    if (Object.keys(updates).length > 0) {
      await this.updateBusinessProfile(userId, updates);
    }
  }

  private trackInteractionPattern(
    userId: string,
    intent: RecognizedIntent,
    feedback?: { helpful: boolean; rating?: number; comment?: string }
  ): void {
    // This would integrate with analytics service
    console.log(`Tracking interaction for ${userId}: ${intent.name}`, feedback);
  }

  private async updatePreferencesFromFeedback(
    userId: string,
    intent: RecognizedIntent,
    feedback: { helpful: boolean; rating?: number; comment?: string }
  ): Promise<void> {
    // Adjust preferences based on feedback
    if (!feedback.helpful && feedback.rating && feedback.rating < 3) {
      // User didn't find the response helpful - could adjust response style
      console.log(`Negative feedback for ${intent.name}, considering preference adjustments`);
    }
  }

  private simplifyQuestion(question: string): string {
    // Simplify questions to common patterns
    const simplified = question.toLowerCase()
      .replace(/\b(how|what|where|when|why|who)\b/g, '[question]')
      .replace(/\b(i|my|me|we|our)\b/g, '[user]')
      .replace(/\b\d+\b/g, '[number]')
      .trim();
    
    return simplified.length > 10 ? simplified : '';
  }

  private notifyContextUpdate(contextKey: string, context: UserContext): void {
    const callbacks = this.contextUpdateCallbacks.get(contextKey);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(context);
        } catch (error) {
          console.error('Error in context update callback:', error);
        }
      });
    }
  }

  private startContextCleanup(): void {
    // Clean up inactive contexts every 30 minutes
    setInterval(() => {
      const now = new Date();
      const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
      
      for (const [key, context] of Array.from(this.activeContexts.entries())) {
        const timeSinceActivity = now.getTime() - context.currentSession.lastActivity.getTime();
        
        if (timeSinceActivity > inactiveThreshold) {
          // Save to storage before removing from memory
          ConversationStorageManager.saveUserContext(context);
          this.activeContexts.delete(key);
          this.contextUpdateCallbacks.delete(key);
        }
      }
    }, 30 * 60 * 1000); // Run every 30 minutes
  }
}

export default UserContextManager;