import { 
  RecognizedIntent, 
  IntentType, 
  ExtractedEntity, 
  EntityType, 
  UserContext 
} from './types';
import { AssistantUtils } from './utils';

/**
 * Advanced intent recognition engine with pattern matching and entity extraction
 */
export class IntentRecognizer {
  private static instance: IntentRecognizer;
  
  // Intent patterns with weights for confidence calculation
  private readonly intentPatterns: Record<IntentType, {
    keywords: string[];
    phrases: string[];
    weight: number;
    contextBoost?: string[];
  }> = {
    FIND_BUYERS: {
      keywords: ['buyer', 'customer', 'client', 'purchaser', 'importer', 'distributor', 'wholesaler'],
      phrases: ['find buyers', 'search for customers', 'locate clients', 'discover importers'],
      weight: 1.0,
      contextBoost: ['contact', 'connect', 'reach out', 'business']
    },
    MARKET_RESEARCH: {
      keywords: ['market', 'research', 'analysis', 'opportunity', 'trend', 'data', 'statistics'],
      phrases: ['market research', 'market analysis', 'market opportunity', 'market trends', 'export data'],
      weight: 1.0,
      contextBoost: ['country', 'region', 'growth', 'competition']
    },
    COMPLIANCE_HELP: {
      keywords: ['compliance', 'regulation', 'certificate', 'documentation', 'legal', 'requirement', 'permit'],
      phrases: ['export compliance', 'regulatory requirements', 'legal documentation', 'certification process'],
      weight: 1.2, // Higher weight as it's very specific
      contextBoost: ['customs', 'tariff', 'duty', 'license']
    },
    QUOTATION_HELP: {
      keywords: ['quotation', 'quote', 'price', 'pricing', 'cost', 'estimate', 'proposal'],
      phrases: ['create quotation', 'price quote', 'cost estimate', 'pricing proposal'],
      weight: 1.0,
      contextBoost: ['incoterms', 'shipping', 'insurance', 'payment']
    },
    PLATFORM_NAVIGATION: {
      keywords: ['navigate', 'go to', 'show me', 'take me', 'open', 'access', 'use'],
      phrases: ['how to use', 'show me how', 'take me to', 'navigate to', 'access the'],
      weight: 0.8,
      contextBoost: ['dashboard', 'feature', 'tool', 'page']
    },
    ONBOARDING_HELP: {
      keywords: ['help', 'guide', 'tutorial', 'started', 'new', 'beginner', 'learn'],
      phrases: ['getting started', 'how to begin', 'new user', 'first time', 'tutorial'],
      weight: 0.9,
      contextBoost: ['setup', 'configure', 'profile', 'account']
    },
    GENERAL_EXPORT_ADVICE: {
      keywords: ['export', 'trade', 'international', 'shipping', 'business', 'advice', 'tips'],
      phrases: ['export advice', 'trade tips', 'international business', 'export strategy'],
      weight: 0.7, // Lower weight as it's more general
      contextBoost: ['strategy', 'process', 'best practices', 'success']
    },
    UNKNOWN: {
      keywords: [],
      phrases: [],
      weight: 0.0
    }
  };

  // Entity patterns for extraction
  private readonly entityPatterns: Record<EntityType, {
    patterns: RegExp[];
    normalizer?: (value: string) => string;
  }> = {
    COUNTRY: {
      patterns: [
        /\b(usa|united states|america)\b/gi,
        /\b(uk|united kingdom|britain|england)\b/gi,
        /\b(uae|united arab emirates)\b/gi,
        /\b(china|prc)\b/gi,
        /\b(germany|deutschland)\b/gi,
        /\b(japan|nippon)\b/gi,
        /\b(india|bharat)\b/gi,
        /\b(canada|can)\b/gi,
        /\b(australia|aus)\b/gi,
        /\b(france|fr)\b/gi,
        /\b(italy|italia)\b/gi,
        /\b(spain|espana)\b/gi,
        /\b(brazil|brasil)\b/gi,
        /\b(mexico|mx)\b/gi,
        /\b(russia|russian federation)\b/gi,
        /\b(south korea|korea)\b/gi,
        /\b(singapore|sg)\b/gi,
        /\b(netherlands|holland)\b/gi,
        /\b(switzerland|ch)\b/gi,
        /\b(sweden|se)\b/gi
      ],
      normalizer: AssistantUtils.normalizeCountryName
    },
    PRODUCT: {
      patterns: [
        /\b(textile|fabric|clothing|garment)s?\b/gi,
        /\b(electronic|computer|software|hardware)\b/gi,
        /\b(machinery|equipment|tool)s?\b/gi,
        /\b(chemical|pharmaceutical|medicine)s?\b/gi,
        /\b(food|agricultural|organic)\b/gi,
        /\b(automotive|car|vehicle)s?\b/gi,
        /\b(jewelry|diamond|gold|silver)\b/gi,
        /\b(furniture|wood|timber)\b/gi,
        /\b(plastic|rubber|polymer)s?\b/gi,
        /\b(metal|steel|iron|aluminum)\b/gi
      ]
    },
    INDUSTRY: {
      patterns: [
        /\b(manufacturing|production|factory)\b/gi,
        /\b(technology|tech|it|software)\b/gi,
        /\b(healthcare|medical|pharmaceutical)\b/gi,
        /\b(agriculture|farming|agri)\b/gi,
        /\b(automotive|automobile|car)\b/gi,
        /\b(textile|fashion|apparel)\b/gi,
        /\b(electronics|electrical|electronic)\b/gi,
        /\b(construction|building|infrastructure)\b/gi,
        /\b(energy|oil|gas|renewable)\b/gi,
        /\b(finance|banking|financial)\b/gi
      ]
    },
    CURRENCY: {
      patterns: [
        /\b(usd|dollar|dollars|\$)\b/gi,
        /\b(eur|euro|euros|€)\b/gi,
        /\b(gbp|pound|pounds|£)\b/gi,
        /\b(inr|rupee|rupees|₹)\b/gi,
        /\b(cny|yuan|rmb|¥)\b/gi,
        /\b(jpy|yen|¥)\b/gi,
        /\b(cad|canadian dollar)\b/gi,
        /\b(aud|australian dollar)\b/gi
      ]
    },
    AMOUNT: {
      patterns: [
        /\$[\d,]+(?:\.\d{2})?/g,
        /€[\d,]+(?:\.\d{2})?/g,
        /£[\d,]+(?:\.\d{2})?/g,
        /₹[\d,]+(?:\.\d{2})?/g,
        /¥[\d,]+(?:\.\d{2})?/g,
        /\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:usd|eur|gbp|inr|cny|jpy|dollars?|euros?|pounds?|rupees?|yuan|yen)\b/gi,
        /\b(?:usd|eur|gbp|inr|cny|jpy)\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b/gi
      ]
    },
    DATE: {
      patterns: [
        /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
        /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,
        /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}\b/gi,
        /\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4}\b/gi,
        /\b(?:today|tomorrow|yesterday|next week|last week|next month|last month)\b/gi
      ]
    },
    HS_CODE: {
      patterns: [
        /\b\d{4}\.\d{2}\.\d{2}\b/g, // Standard HS code format
        /\b\d{6,10}\b/g, // HS code without dots
        /\bhs\s*code\s*:?\s*\d+/gi,
        /\btariff\s*code\s*:?\s*\d+/gi
      ]
    }
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): IntentRecognizer {
    if (!IntentRecognizer.instance) {
      IntentRecognizer.instance = new IntentRecognizer();
    }
    return IntentRecognizer.instance;
  }

  /**
   * Recognize intent from user message with advanced pattern matching
   */
  recognizeIntent(content: string, context: UserContext): RecognizedIntent {
    const normalizedContent = content.toLowerCase().trim();
    const words = this.tokenize(normalizedContent);
    
    // Calculate scores for each intent
    const intentScores = this.calculateIntentScores(normalizedContent, words, context);
    
    // Find the best matching intent
    const bestIntent = this.selectBestIntent(intentScores);
    
    // Extract entities from the content
    const entities = this.extractEntities(content);
    
    // Calculate final confidence
    const confidence = this.calculateFinalConfidence(bestIntent, intentScores, entities, context);
    
    return {
      name: bestIntent.intent,
      confidence,
      entities,
      parameters: {
        keywords: AssistantUtils.extractKeywords(content),
        messageLength: content.length,
        hasQuestion: content.includes('?'),
        conversationLength: context.conversationHistory.length,
        detectedPatterns: bestIntent.matchedPatterns,
        entityCount: entities.length,
        contextBoosts: bestIntent.contextBoosts
      }
    };
  }

  /**
   * Tokenize content into words
   */
  private tokenize(content: string): string[] {
    return content
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
  }

  /**
   * Calculate scores for all intents
   */
  private calculateIntentScores(
    content: string, 
    words: string[], 
    context: UserContext
  ): Array<{
    intent: IntentType;
    score: number;
    matchedPatterns: string[];
    contextBoosts: string[];
  }> {
    const scores: Array<{
      intent: IntentType;
      score: number;
      matchedPatterns: string[];
      contextBoosts: string[];
    }> = [];

    Object.entries(this.intentPatterns).forEach(([intent, pattern]) => {
      if (intent === 'UNKNOWN') return;

      let score = 0;
      const matchedPatterns: string[] = [];
      const contextBoosts: string[] = [];

      // Check keyword matches
      pattern.keywords.forEach(keyword => {
        if (content.includes(keyword)) {
          score += pattern.weight * 0.3;
          matchedPatterns.push(keyword);
        }
      });

      // Check phrase matches (higher weight)
      pattern.phrases.forEach(phrase => {
        if (content.includes(phrase)) {
          score += pattern.weight * 0.6;
          matchedPatterns.push(phrase);
        }
      });

      // Check context boosts
      if (pattern.contextBoost) {
        pattern.contextBoost.forEach(boost => {
          if (content.includes(boost)) {
            score += pattern.weight * 0.2;
            contextBoosts.push(boost);
          }
        });
      }

      // Conversation history boost
      if (context.conversationHistory.length > 0) {
        const recentMessages = context.conversationHistory.slice(-3);
        const recentIntents = recentMessages
          .map(m => m.intent?.name)
          .filter(Boolean);
        
        if (recentIntents.includes(intent as IntentType)) {
          score += 0.1; // Small boost for conversation continuity
        }
      }

      // Business profile boost
      if (this.hasBusinessProfileBoost(intent as IntentType, context)) {
        score += 0.15;
      }

      scores.push({
        intent: intent as IntentType,
        score,
        matchedPatterns,
        contextBoosts
      });
    });

    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Check if business profile provides boost for intent
   */
  private hasBusinessProfileBoost(intent: IntentType, context: UserContext): boolean {
    const profile = context.businessProfile;
    
    switch (intent) {
      case 'ONBOARDING_HELP':
        return profile.experienceLevel === 'beginner';
      case 'COMPLIANCE_HELP':
        return profile.experienceLevel === 'intermediate' || profile.experienceLevel === 'advanced';
      case 'MARKET_RESEARCH':
        return profile.targetMarkets.length === 0; // New to markets
      case 'FIND_BUYERS':
        return profile.primaryProducts.length > 0; // Has products to sell
      default:
        return false;
    }
  }

  /**
   * Select the best intent from scores
   */
  private selectBestIntent(scores: Array<{
    intent: IntentType;
    score: number;
    matchedPatterns: string[];
    contextBoosts: string[];
  }>): {
    intent: IntentType;
    score: number;
    matchedPatterns: string[];
    contextBoosts: string[];
  } {
    if (scores.length === 0 || scores[0].score < 0.1) {
      return {
        intent: 'UNKNOWN',
        score: 0,
        matchedPatterns: [],
        contextBoosts: []
      };
    }

    return scores[0];
  }

  /**
   * Extract entities from content
   */
  private extractEntities(content: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    Object.entries(this.entityPatterns).forEach(([entityType, config]) => {
      config.patterns.forEach(pattern => {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        
        while ((match = regex.exec(content)) !== null) {
          const value = config.normalizer ? 
            config.normalizer(match[0]) : 
            match[0].trim();

          entities.push({
            type: entityType as EntityType,
            value,
            confidence: this.calculateEntityConfidence(entityType as EntityType, match[0]),
            startIndex: match.index,
            endIndex: match.index + match[0].length
          });
        }
      });
    });

    // Remove duplicates and overlapping entities
    return this.deduplicateEntities(entities);
  }

  /**
   * Calculate confidence for extracted entity
   */
  private calculateEntityConfidence(entityType: EntityType, matchedText: string): number {
    const baseConfidence = 0.7;
    
    switch (entityType) {
      case 'COUNTRY':
        // Higher confidence for full country names
        return matchedText.length > 3 ? 0.9 : 0.7;
      case 'AMOUNT':
        // Higher confidence for properly formatted amounts
        return /[\$€£₹¥]/.test(matchedText) ? 0.95 : 0.8;
      case 'DATE':
        // Higher confidence for standard date formats
        return /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(matchedText) ? 0.9 : 0.7;
      case 'HS_CODE':
        // Higher confidence for properly formatted HS codes
        return /\d{4}\.\d{2}\.\d{2}/.test(matchedText) ? 0.95 : 0.6;
      default:
        return baseConfidence;
    }
  }

  /**
   * Remove duplicate and overlapping entities
   */
  private deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
    const sorted = entities.sort((a, b) => a.startIndex - b.startIndex);
    const deduplicated: ExtractedEntity[] = [];

    for (const entity of sorted) {
      const hasOverlap = deduplicated.some(existing => 
        (entity.startIndex >= existing.startIndex && entity.startIndex < existing.endIndex) ||
        (entity.endIndex > existing.startIndex && entity.endIndex <= existing.endIndex)
      );

      if (!hasOverlap) {
        deduplicated.push(entity);
      }
    }

    return deduplicated;
  }

  /**
   * Calculate final confidence score
   */
  private calculateFinalConfidence(
    bestIntent: { intent: IntentType; score: number; matchedPatterns: string[]; contextBoosts: string[] },
    allScores: Array<{ intent: IntentType; score: number }>,
    entities: ExtractedEntity[],
    context: UserContext
  ): number {
    let confidence = Math.min(bestIntent.score, 1.0);

    // Boost confidence based on entities
    if (entities.length > 0) {
      const avgEntityConfidence = entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
      confidence += avgEntityConfidence * 0.1;
    }

    // Boost confidence if there's a clear winner
    if (allScores.length > 1) {
      const secondBest = allScores[1];
      const gap = bestIntent.score - secondBest.score;
      if (gap > 0.3) {
        confidence += 0.1;
      }
    }

    // Reduce confidence for very short messages
    if (context.conversationHistory.length === 0 && bestIntent.matchedPatterns.length < 2) {
      confidence *= 0.8;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Get intent suggestions for ambiguous messages
   */
  getIntentSuggestions(content: string, context: UserContext): IntentType[] {
    const scores = this.calculateIntentScores(content.toLowerCase(), this.tokenize(content.toLowerCase()), context);
    
    return scores
      .filter(s => s.score > 0.1)
      .slice(0, 3)
      .map(s => s.intent);
  }

  /**
   * Analyze message complexity for response adaptation
   */
  analyzeMessageComplexity(content: string): {
    complexity: 'simple' | 'moderate' | 'complex';
    factors: string[];
  } {
    const factors: string[] = [];
    let complexityScore = 0;

    // Length factor
    if (content.length > 100) {
      complexityScore += 1;
      factors.push('long_message');
    }

    // Multiple questions
    const questionCount = (content.match(/\?/g) || []).length;
    if (questionCount > 1) {
      complexityScore += 1;
      factors.push('multiple_questions');
    }

    // Technical terms
    const technicalTerms = ['compliance', 'regulation', 'incoterms', 'hs code', 'tariff', 'duty'];
    const technicalCount = technicalTerms.filter(term => content.toLowerCase().includes(term)).length;
    if (technicalCount > 0) {
      complexityScore += technicalCount;
      factors.push('technical_terms');
    }

    // Multiple entities
    const entities = this.extractEntities(content);
    if (entities.length > 2) {
      complexityScore += 1;
      factors.push('multiple_entities');
    }

    // Determine complexity level
    let complexity: 'simple' | 'moderate' | 'complex';
    if (complexityScore === 0) {
      complexity = 'simple';
    } else if (complexityScore <= 2) {
      complexity = 'moderate';
    } else {
      complexity = 'complex';
    }

    return { complexity, factors };
  }
}