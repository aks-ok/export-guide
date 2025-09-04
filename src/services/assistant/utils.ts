import { ConversationMessage, UserContext, BusinessProfile } from './types';

/**
 * Utility functions for the assistant system
 */
export class AssistantUtils {
  
  /**
   * Generate a unique ID for messages and conversations
   */
  static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a conversation ID based on user ID and timestamp
   */
  static generateConversationId(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `conv_${userId}_${timestamp}_${random}`;
  }

  /**
   * Create a default business profile for new users
   */
  static createDefaultBusinessProfile(userId: string): BusinessProfile {
    return {
      industry: '',
      primaryProducts: [],
      targetMarkets: [],
      experienceLevel: 'beginner',
      preferredLanguage: 'en',
      businessSize: 'small'
    };
  }

  /**
   * Create a default user context
   */
  static createDefaultUserContext(userId: string, conversationId: string): UserContext {
    return {
      userId,
      conversationId,
      businessProfile: this.createDefaultBusinessProfile(userId),
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
        theme: 'auto',
        language: 'en',
        dataPrivacy: {
          allowAnalytics: true,
          allowPersonalization: true,
          retentionPeriod: 30
        }
      },
      conversationHistory: []
    };
  }

  /**
   * Format timestamp for display
   */
  static formatTimestamp(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Extract keywords from message content for search and analysis
   */
  static extractKeywords(content: string): string[] {
    if (!content || typeof content !== 'string') {
      return [];
    }

    // Common export-related keywords
    const exportKeywords = [
      'export', 'import', 'trade', 'shipping', 'customs', 'tariff', 'quota',
      'buyer', 'seller', 'market', 'product', 'country', 'compliance',
      'certificate', 'documentation', 'freight', 'logistics', 'payment',
      'quotation', 'price', 'currency', 'exchange', 'regulation'
    ];

    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    const keywords = words.filter(word => 
      exportKeywords.includes(word) || 
      word.length > 4 // Include longer words that might be specific terms
    );

    // Remove duplicates and return
    return Array.from(new Set(keywords));
  }

  /**
   * Calculate conversation engagement score
   */
  static calculateEngagementScore(messages: ConversationMessage[]): number {
    if (messages.length === 0) return 0;

    let score = 0;
    const userMessages = messages.filter(m => m.type === 'user');
    const assistantMessages = messages.filter(m => m.type === 'assistant');

    // Base score from message count
    score += Math.min(messages.length * 2, 20);

    // Bonus for balanced conversation
    const ratio = userMessages.length / Math.max(assistantMessages.length, 1);
    if (ratio >= 0.5 && ratio <= 2) {
      score += 10;
    }

    // Bonus for message length (indicates engagement)
    const avgUserMessageLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / Math.max(userMessages.length, 1);
    if (avgUserMessageLength > 20) {
      score += 5;
    }

    // Bonus for conversation duration
    if (messages.length > 1) {
      const duration = messages[messages.length - 1].timestamp.getTime() - messages[0].timestamp.getTime();
      const durationMinutes = duration / (1000 * 60);
      if (durationMinutes > 2) {
        score += Math.min(durationMinutes, 15);
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Detect user intent from message patterns
   */
  static detectBasicIntent(content: string): string {
    const lowerContent = content.toLowerCase();

    // Compliance patterns (check first as they're specific)
    if (lowerContent.includes('compliance') || lowerContent.includes('regulation') || 
        lowerContent.includes('certificate') || lowerContent.includes('documentation') ||
        lowerContent.includes('regulatory') || lowerContent.includes('legal')) {
      return 'COMPLIANCE_HELP';
    }

    // Buyer/customer patterns
    if (lowerContent.includes('buyer') || lowerContent.includes('customer') || 
        lowerContent.includes('find') && (lowerContent.includes('client') || lowerContent.includes('purchaser'))) {
      return 'FIND_BUYERS';
    }

    // Market research patterns
    if (lowerContent.includes('market') || lowerContent.includes('research') || 
        lowerContent.includes('opportunity') || lowerContent.includes('analysis')) {
      return 'MARKET_RESEARCH';
    }

    // Quotation patterns
    if (lowerContent.includes('quote') || lowerContent.includes('quotation') || 
        lowerContent.includes('price') || lowerContent.includes('pricing') ||
        lowerContent.includes('cost')) {
      return 'QUOTATION_HELP';
    }

    // Navigation patterns
    if (lowerContent.includes('go to') || lowerContent.includes('show me') || 
        lowerContent.includes('navigate') || lowerContent.includes('take me')) {
      return 'PLATFORM_NAVIGATION';
    }

    // Help/onboarding patterns
    if (lowerContent.includes('help') || lowerContent.includes('guide') || 
        lowerContent.includes('tutorial') || lowerContent.includes('started') ||
        lowerContent.includes('new') && lowerContent.includes('user')) {
      return 'ONBOARDING_HELP';
    }

    // General export advice patterns
    if (lowerContent.includes('export') || lowerContent.includes('trade') || 
        lowerContent.includes('international') || lowerContent.includes('shipping')) {
      return 'GENERAL_EXPORT_ADVICE';
    }

    return 'UNKNOWN';
  }

  /**
   * Truncate text to specified length with ellipsis
   */
  static truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Check if conversation is stale (no activity for specified minutes)
   */
  static isConversationStale(lastActivity: Date, staleMinutes: number = 30): boolean {
    const now = new Date();
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffMins = diffMs / (1000 * 60);
    return diffMins > staleMinutes;
  }

  /**
   * Get conversation summary for display
   */
  static getConversationSummary(messages: ConversationMessage[]): {
    title: string;
    preview: string;
    messageCount: number;
    lastActivity: Date;
  } {
    if (messages.length === 0) {
      return {
        title: 'New Conversation',
        preview: 'No messages yet',
        messageCount: 0,
        lastActivity: new Date()
      };
    }

    const firstUserMessage = messages.find(m => m.type === 'user');
    const lastMessage = messages[messages.length - 1];

    const title = firstUserMessage 
      ? this.truncateText(firstUserMessage.content, 50)
      : 'New Conversation';

    const preview = this.truncateText(lastMessage.content, 100);

    return {
      title,
      preview,
      messageCount: messages.length,
      lastActivity: lastMessage.timestamp
    };
  }

  /**
   * Validate and normalize country names
   */
  static normalizeCountryName(country: string): string {
    if (!country || typeof country !== 'string') {
      return '';
    }

    // Common country name mappations
    const countryMappings: Record<string, string> = {
      'usa': 'United States',
      'us': 'United States',
      'america': 'United States',
      'uk': 'United Kingdom',
      'britain': 'United Kingdom',
      'uae': 'United Arab Emirates',
      'china': 'China',
      'india': 'India',
      'germany': 'Germany',
      'japan': 'Japan',
      'canada': 'Canada',
      'australia': 'Australia',
      'france': 'France',
      'italy': 'Italy',
      'spain': 'Spain',
      'brazil': 'Brazil',
      'mexico': 'Mexico',
      'russia': 'Russia',
      'south korea': 'South Korea',
      'singapore': 'Singapore'
    };

    const normalized = country.toLowerCase().trim();
    return countryMappings[normalized] || 
           country.charAt(0).toUpperCase() + country.slice(1).toLowerCase();
  }

  /**
   * Format currency amounts for display
   */
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount.toLocaleString()}`;
    }
  }
}