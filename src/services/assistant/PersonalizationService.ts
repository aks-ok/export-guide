import { 
  UserContext, 
  BusinessProfile, 
  RecognizedIntent, 
  AssistantResponse,
  QuickAction,
  UserFeedback
} from './types';
import { UserContextManager } from './UserContextManager';
import { ConversationAnalyticsService } from './ConversationAnalyticsService';
import { AssistantUtils } from './utils';

/**
 * User behavior pattern
 */
interface UserBehaviorPattern {
  userId: string;
  preferredIntents: Array<{ intent: string; frequency: number; successRate: number }>;
  timePatterns: Record<string, number>; // hour of day -> frequency
  sessionPatterns: {
    averageLength: number;
    preferredStartPages: string[];
    commonFlows: Array<{ path: string[]; frequency: number }>;
  };
  contentPreferences: {
    responseLength: 'short' | 'medium' | 'long';
    includeData: boolean;
    preferQuickActions: boolean;
    visualizationTypes: string[];
  };
  learningStyle: 'guided' | 'exploratory' | 'direct';
  expertiseGrowth: Array<{ date: Date; level: string; area: string }>;
}

/**
 * Personalized recommendation
 */
interface PersonalizedRecommendation {
  id: string;
  type: 'feature' | 'content' | 'action' | 'learning';
  title: string;
  description: string;
  confidence: number;
  reasoning: string[];
  action?: QuickAction;
  priority: 'high' | 'medium' | 'low';
  category: string;
  expiresAt?: Date;
}

/**
 * Industry-specific customization
 */
interface IndustryCustomization {
  industry: string;
  terminology: Record<string, string>;
  commonIntents: string[];
  recommendedFeatures: string[];
  responseTemplates: Record<string, string>;
  dataPreferences: {
    keyMetrics: string[];
    preferredVisualization: string;
    updateFrequency: string;
  };
  complianceRequirements: string[];
  marketFocus: string[];
}/**

 * Learning algorithm configuration
 */
interface LearningConfig {
  enableBehaviorLearning: boolean;
  enablePreferenceLearning: boolean;
  enableContentAdaptation: boolean;
  learningRate: number;
  decayFactor: number;
  minInteractions: number;
  confidenceThreshold: number;
}

/**
 * PersonalizationService provides advanced personalization and learning capabilities
 */
export class PersonalizationService {
  private static instance: PersonalizationService;
  private userBehaviorPatterns: Map<string, UserBehaviorPattern> = new Map();
  private industryCustomizations: Map<string, IndustryCustomization> = new Map();
  private learningConfig: LearningConfig;
  private readonly STORAGE_KEY = 'exportguide_personalization_data';

  private constructor() {
    this.learningConfig = {
      enableBehaviorLearning: true,
      enablePreferenceLearning: true,
      enableContentAdaptation: true,
      learningRate: 0.1,
      decayFactor: 0.95,
      minInteractions: 5,
      confidenceThreshold: 0.7
    };
    
    this.initializeIndustryCustomizations();
    this.loadPersonalizationData();
  }

  public static getInstance(): PersonalizationService {
    if (!PersonalizationService.instance) {
      PersonalizationService.instance = new PersonalizationService();
    }
    return PersonalizationService.instance;
  }

  /**
   * Learn from user interaction
   */
  async learnFromInteraction(
    userId: string,
    intent: RecognizedIntent,
    response: AssistantResponse,
    feedback?: UserFeedback,
    context?: UserContext
  ): Promise<void> {
    if (!this.learningConfig.enableBehaviorLearning) return;

    try {
      let pattern = this.userBehaviorPatterns.get(userId);
      if (!pattern) {
        pattern = await this.initializeUserPattern(userId, context);
      }

      // Update intent preferences
      this.updateIntentPreferences(pattern, intent, feedback);
      
      // Update time patterns
      this.updateTimePatterns(pattern);
      
      // Update content preferences
      this.updateContentPreferences(pattern, response, feedback);
      
      // Update session patterns
      if (context) {
        this.updateSessionPatterns(pattern, context);
      }

      // Update learning style
      this.updateLearningStyle(pattern, intent, feedback);

      this.userBehaviorPatterns.set(userId, pattern);
      this.savePersonalizationData();
    } catch (error) {
      console.error('Error learning from interaction:', error);
    }
  }

  /**
   * Generate personalized recommendations
   */
  async generateRecommendations(
    userId: string,
    context: UserContext,
    limit: number = 5
  ): Promise<PersonalizedRecommendation[]> {
    try {
      const pattern = this.userBehaviorPatterns.get(userId);
      const recommendations: PersonalizedRecommendation[] = [];

      // Feature recommendations based on usage patterns
      const featureRecs = await this.generateFeatureRecommendations(userId, pattern, context);
      recommendations.push(...featureRecs);

      // Content recommendations based on preferences
      const contentRecs = await this.generateContentRecommendations(userId, pattern, context);
      recommendations.push(...contentRecs);

      // Learning recommendations based on expertise growth
      const learningRecs = await this.generateLearningRecommendations(userId, pattern, context);
      recommendations.push(...learningRecs);

      // Industry-specific recommendations
      const industryRecs = await this.generateIndustryRecommendations(userId, context);
      recommendations.push(...industryRecs);

      // Sort by priority and confidence, then limit
      return recommendations
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          return priorityDiff !== 0 ? priorityDiff : b.confidence - a.confidence;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Adapt response based on user preferences
   */
  adaptResponse(
    response: AssistantResponse,
    userId: string,
    context: UserContext
  ): AssistantResponse {
    if (!this.learningConfig.enableContentAdaptation) return response;

    try {
      const pattern = this.userBehaviorPatterns.get(userId);
      if (!pattern) return response;

      const adaptedResponse = { ...response };

      // Adapt response length
      adaptedResponse.text = this.adaptResponseLength(
        response.text,
        pattern.contentPreferences.responseLength
      );

      // Adapt quick actions based on preferences
      if (pattern.contentPreferences.preferQuickActions && !response.quickActions) {
        adaptedResponse.quickActions = this.generateContextualQuickActions(context);
      } else if (!pattern.contentPreferences.preferQuickActions && response.quickActions) {
        adaptedResponse.quickActions = response.quickActions.slice(0, 2); // Limit to 2
      }

      // Add industry-specific terminology
      adaptedResponse.text = this.applyIndustryTerminology(
        adaptedResponse.text,
        context.businessProfile.industry
      );

      return adaptedResponse;
    } catch (error) {
      console.error('Error adapting response:', error);
      return response;
    }
  }

  /**
   * Get user's personalization insights
   */
  getPersonalizationInsights(userId: string): {
    behaviorPattern: UserBehaviorPattern | null;
    recommendations: PersonalizedRecommendation[];
    learningProgress: {
      interactionCount: number;
      expertiseLevel: string;
      strongAreas: string[];
      improvementAreas: string[];
    };
    preferences: {
      communicationStyle: string;
      preferredFeatures: string[];
      optimalTimes: string[];
    };
  } {
    try {
      const pattern = this.userBehaviorPatterns.get(userId);
      
      if (!pattern) {
        return {
          behaviorPattern: null,
          recommendations: [],
          learningProgress: {
            interactionCount: 0,
            expertiseLevel: 'beginner',
            strongAreas: [],
            improvementAreas: []
          },
          preferences: {
            communicationStyle: 'standard',
            preferredFeatures: [],
            optimalTimes: []
          }
        };
      }

      const learningProgress = this.analyzeLearningProgress(pattern);
      const preferences = this.extractUserPreferences(pattern);

      return {
        behaviorPattern: pattern,
        recommendations: [], // Would be populated with cached recommendations
        learningProgress,
        preferences
      };
    } catch (error) {
      console.error('Error getting personalization insights:', error);
      return {
        behaviorPattern: null,
        recommendations: [],
        learningProgress: {
          interactionCount: 0,
          expertiseLevel: 'beginner',
          strongAreas: [],
          improvementAreas: []
        },
        preferences: {
          communicationStyle: 'standard',
          preferredFeatures: [],
          optimalTimes: []
        }
      };
    }
  }

  /**
   * Update user preferences manually
   */
  async updateUserPreferences(
    userId: string,
    preferences: {
      responseLength?: 'short' | 'medium' | 'long';
      includeData?: boolean;
      preferQuickActions?: boolean;
      learningStyle?: 'guided' | 'exploratory' | 'direct';
    }
  ): Promise<void> {
    try {
      let pattern = this.userBehaviorPatterns.get(userId);
      if (!pattern) {
        const userContextManager = UserContextManager.getInstance();
        const context = await userContextManager.getUserContext(userId);
        pattern = await this.initializeUserPattern(userId, context);
      }

      // Update content preferences
      if (preferences.responseLength) {
        pattern.contentPreferences.responseLength = preferences.responseLength;
      }
      if (preferences.includeData !== undefined) {
        pattern.contentPreferences.includeData = preferences.includeData;
      }
      if (preferences.preferQuickActions !== undefined) {
        pattern.contentPreferences.preferQuickActions = preferences.preferQuickActions;
      }
      if (preferences.learningStyle) {
        pattern.learningStyle = preferences.learningStyle;
      }

      this.userBehaviorPatterns.set(userId, pattern);
      this.savePersonalizationData();
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  /**
   * Get industry-specific customization
   */
  getIndustryCustomization(industry: string): IndustryCustomization | null {
    return this.industryCustomizations.get(industry.toLowerCase()) || null;
  }

  /**
   * Reset user personalization data
   */
  async resetPersonalization(userId: string): Promise<void> {
    try {
      this.userBehaviorPatterns.delete(userId);
      this.savePersonalizationData();
    } catch (error) {
      console.error('Error resetting personalization:', error);
    }
  }

  // Private helper methods

  private async initializeUserPattern(
    userId: string,
    context?: UserContext
  ): Promise<UserBehaviorPattern> {
    return {
      userId,
      preferredIntents: [],
      timePatterns: {},
      sessionPatterns: {
        averageLength: 0,
        preferredStartPages: context ? [context.currentSession.currentPage] : ['dashboard'],
        commonFlows: []
      },
      contentPreferences: {
        responseLength: 'medium',
        includeData: true,
        preferQuickActions: true,
        visualizationTypes: ['chart', 'table']
      },
      learningStyle: 'guided',
      expertiseGrowth: []
    };
  }

  private updateIntentPreferences(
    pattern: UserBehaviorPattern,
    intent: RecognizedIntent,
    feedback?: UserFeedback
  ): void {
    const existingIntent = pattern.preferredIntents.find(p => p.intent === intent.name);
    const success = feedback ? feedback.helpful : true; // Default to success if no feedback

    if (existingIntent) {
      existingIntent.frequency += 1;
      existingIntent.successRate = (existingIntent.successRate + (success ? 1 : 0)) / 2;
    } else {
      pattern.preferredIntents.push({
        intent: intent.name,
        frequency: 1,
        successRate: success ? 1 : 0
      });
    }

    // Sort by frequency and keep top 10
    pattern.preferredIntents = pattern.preferredIntents
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  private updateTimePatterns(pattern: UserBehaviorPattern): void {
    const currentHour = new Date().getHours().toString();
    pattern.timePatterns[currentHour] = (pattern.timePatterns[currentHour] || 0) + 1;
  }

  private updateContentPreferences(
    pattern: UserBehaviorPattern,
    response: AssistantResponse,
    feedback?: UserFeedback
  ): void {
    if (!feedback) return;

    // Learn from response length preference
    const responseLength = response.text.length;
    if (feedback.helpful) {
      if (responseLength < 100) {
        this.adjustPreference(pattern, 'responseLength', 'short', 0.1);
      } else if (responseLength > 300) {
        this.adjustPreference(pattern, 'responseLength', 'long', 0.1);
      } else {
        this.adjustPreference(pattern, 'responseLength', 'medium', 0.1);
      }
    }

    // Learn from quick actions preference
    if (response.quickActions && response.quickActions.length > 0) {
      pattern.contentPreferences.preferQuickActions = feedback.helpful;
    }

    // Learn from data visualization preference
    if (response.dataVisualization) {
      pattern.contentPreferences.includeData = feedback.helpful;
      if (feedback.helpful && response.dataVisualization.type) {
        const vizType = response.dataVisualization.type;
        if (!pattern.contentPreferences.visualizationTypes.includes(vizType)) {
          pattern.contentPreferences.visualizationTypes.push(vizType);
        }
      }
    }
  }

  private updateSessionPatterns(pattern: UserBehaviorPattern, context: UserContext): void {
    // Update preferred start pages
    const currentPage = context.currentSession.currentPage;
    if (!pattern.sessionPatterns.preferredStartPages.includes(currentPage)) {
      pattern.sessionPatterns.preferredStartPages.push(currentPage);
    }

    // Update average session length (simplified)
    const sessionLength = Date.now() - context.currentSession.sessionStartTime.getTime();
    pattern.sessionPatterns.averageLength = 
      (pattern.sessionPatterns.averageLength + sessionLength) / 2;

    // Update common flows (simplified - would need more sophisticated tracking)
    const pagesVisited = context.currentSession.pagesVisited;
    if (pagesVisited.length > 1) {
      const flow = pagesVisited.slice(-3); // Last 3 pages
      const existingFlow = pattern.sessionPatterns.commonFlows.find(f => 
        JSON.stringify(f.path) === JSON.stringify(flow)
      );
      
      if (existingFlow) {
        existingFlow.frequency += 1;
      } else {
        pattern.sessionPatterns.commonFlows.push({ path: flow, frequency: 1 });
      }
    }
  }

  private updateLearningStyle(
    pattern: UserBehaviorPattern,
    intent: RecognizedIntent,
    feedback?: UserFeedback
  ): void {
    // Simple heuristic to determine learning style
    if (intent.name === 'PLATFORM_NAVIGATION' && feedback?.helpful) {
      this.adjustLearningStyle(pattern, 'guided');
    } else if (intent.name === 'GENERAL_EXPORT_ADVICE' && feedback?.helpful) {
      this.adjustLearningStyle(pattern, 'exploratory');
    } else if (['FIND_BUYERS', 'MARKET_RESEARCH'].includes(intent.name) && feedback?.helpful) {
      this.adjustLearningStyle(pattern, 'direct');
    }
  }

  private adjustPreference(
    pattern: UserBehaviorPattern,
    preference: string,
    value: string,
    weight: number
  ): void {
    // Simple preference adjustment (would be more sophisticated in practice)
    if (Math.random() < weight) {
      (pattern.contentPreferences as any)[preference] = value;
    }
  }

  private adjustLearningStyle(pattern: UserBehaviorPattern, style: 'guided' | 'exploratory' | 'direct'): void {
    // Simple learning style adjustment
    if (Math.random() < this.learningConfig.learningRate) {
      pattern.learningStyle = style;
    }
  }

  private async generateFeatureRecommendations(
    userId: string,
    pattern: UserBehaviorPattern | undefined,
    context: UserContext
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    if (!pattern) return recommendations;

    // Recommend underused features
    const allFeatures = ['buyer-discovery', 'market-research', 'compliance', 'quotation'];
    const usedFeatures = pattern.preferredIntents.map(p => this.intentToFeature(p.intent));
    const unusedFeatures = allFeatures.filter(f => !usedFeatures.includes(f));

    unusedFeatures.forEach(feature => {
      recommendations.push({
        id: AssistantUtils.generateId(),
        type: 'feature',
        title: `Try ${this.featureToTitle(feature)}`,
        description: `Based on your usage patterns, you might find ${feature} helpful for your export business.`,
        confidence: 0.7,
        reasoning: ['Feature not yet explored', 'Matches your business profile'],
        action: {
          id: `try-${feature}`,
          label: `Explore ${this.featureToTitle(feature)}`,
          action: 'navigate',
          parameters: { page: feature }
        },
        priority: 'medium',
        category: 'feature_discovery'
      });
    });

    return recommendations.slice(0, 2);
  }

  private async generateContentRecommendations(
    userId: string,
    pattern: UserBehaviorPattern | undefined,
    context: UserContext
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    if (!pattern) return recommendations;

    // Recommend content based on successful intents
    const topIntents = pattern.preferredIntents
      .filter(p => p.successRate > 0.7)
      .slice(0, 3);

    topIntents.forEach(intentData => {
      recommendations.push({
        id: AssistantUtils.generateId(),
        type: 'content',
        title: `More ${this.intentToTitle(intentData.intent)} Resources`,
        description: `Since you frequently use ${this.intentToTitle(intentData.intent)}, here are additional resources.`,
        confidence: intentData.successRate,
        reasoning: [`High success rate (${Math.round(intentData.successRate * 100)}%)`, 'Frequently used feature'],
        priority: 'high',
        category: 'content_suggestion'
      });
    });

    return recommendations.slice(0, 2);
  }

  private async generateLearningRecommendations(
    userId: string,
    pattern: UserBehaviorPattern | undefined,
    context: UserContext
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    if (!pattern) return recommendations;

    // Recommend learning based on expertise growth
    const currentLevel = context.businessProfile.experienceLevel;
    
    if (currentLevel === 'beginner' && pattern.preferredIntents.length > 5) {
      recommendations.push({
        id: AssistantUtils.generateId(),
        type: 'learning',
        title: 'Ready for Intermediate Features',
        description: 'You\'ve mastered the basics! Time to explore more advanced export tools.',
        confidence: 0.8,
        reasoning: ['Multiple features used successfully', 'Consistent engagement'],
        action: {
          id: 'intermediate-tour',
          label: 'Start Intermediate Tour',
          action: 'navigate',
          parameters: { action: 'intermediate-onboarding' }
        },
        priority: 'high',
        category: 'skill_development'
      });
    }

    return recommendations.slice(0, 1);
  }

  private async generateIndustryRecommendations(
    userId: string,
    context: UserContext
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];
    const industry = context.businessProfile.industry;
    const customization = this.getIndustryCustomization(industry);

    if (customization) {
      customization.recommendedFeatures.forEach(feature => {
        recommendations.push({
          id: AssistantUtils.generateId(),
          type: 'feature',
          title: `${this.featureToTitle(feature)} for ${industry}`,
          description: `This feature is particularly valuable for businesses in the ${industry} industry.`,
          confidence: 0.8,
          reasoning: ['Industry-specific recommendation', 'Tailored for your sector'],
          action: {
            id: `industry-${feature}`,
            label: `Explore ${this.featureToTitle(feature)}`,
            action: 'navigate',
            parameters: { page: feature, industry: industry }
          },
          priority: 'high',
          category: 'industry_specific'
        });
      });
    }

    return recommendations.slice(0, 2);
  }

  private adaptResponseLength(text: string, preference: 'short' | 'medium' | 'long'): string {
    const sentences = text.split('. ');
    
    switch (preference) {
      case 'short':
        return sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
      case 'long':
        return text; // Keep full length
      case 'medium':
      default:
        return sentences.slice(0, 3).join('. ') + (sentences.length > 3 ? '.' : '');
    }
  }

  private generateContextualQuickActions(context: UserContext): QuickAction[] {
    return [
      {
        id: 'contextual-help',
        label: 'Get Help',
        action: 'navigate',
        parameters: { page: 'help', context: context.currentSession.currentPage }
      },
      {
        id: 'related-features',
        label: 'Related Features',
        action: 'navigate',
        parameters: { action: 'show-related' }
      }
    ];
  }

  private applyIndustryTerminology(text: string, industry: string): string {
    const customization = this.getIndustryCustomization(industry);
    if (!customization) return text;

    let adaptedText = text;
    Object.entries(customization.terminology).forEach(([generic, specific]) => {
      const regex = new RegExp(`\\b${generic}\\b`, 'gi');
      adaptedText = adaptedText.replace(regex, specific);
    });

    return adaptedText;
  }

  private analyzeLearningProgress(pattern: UserBehaviorPattern): {
    interactionCount: number;
    expertiseLevel: string;
    strongAreas: string[];
    improvementAreas: string[];
  } {
    const interactionCount = pattern.preferredIntents.reduce((sum, p) => sum + p.frequency, 0);
    
    let expertiseLevel = 'beginner';
    if (interactionCount > 50) expertiseLevel = 'advanced';
    else if (interactionCount > 20) expertiseLevel = 'intermediate';

    const strongAreas = pattern.preferredIntents
      .filter(p => p.successRate > 0.8)
      .map(p => this.intentToTitle(p.intent))
      .slice(0, 3);

    const improvementAreas = pattern.preferredIntents
      .filter(p => p.successRate < 0.5)
      .map(p => this.intentToTitle(p.intent))
      .slice(0, 3);

    return {
      interactionCount,
      expertiseLevel,
      strongAreas,
      improvementAreas
    };
  }

  private extractUserPreferences(pattern: UserBehaviorPattern): {
    communicationStyle: string;
    preferredFeatures: string[];
    optimalTimes: string[];
  } {
    const communicationStyle = pattern.learningStyle === 'direct' ? 'concise' : 
                              pattern.learningStyle === 'guided' ? 'detailed' : 'balanced';

    const preferredFeatures = pattern.preferredIntents
      .slice(0, 3)
      .map(p => this.intentToTitle(p.intent));

    const optimalTimes = Object.entries(pattern.timePatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    return {
      communicationStyle,
      preferredFeatures,
      optimalTimes
    };
  }

  private initializeIndustryCustomizations(): void {
    // Technology industry
    this.industryCustomizations.set('technology', {
      industry: 'technology',
      terminology: {
        'products': 'solutions',
        'buyers': 'clients',
        'market': 'sector'
      },
      commonIntents: ['FIND_BUYERS', 'COMPLIANCE_HELP', 'MARKET_RESEARCH'],
      recommendedFeatures: ['buyer-discovery', 'compliance'],
      responseTemplates: {
        'FIND_BUYERS': 'Technology clients often look for innovative solutions...'
      },
      dataPreferences: {
        keyMetrics: ['market_size', 'growth_rate', 'tech_adoption'],
        preferredVisualization: 'chart',
        updateFrequency: 'weekly'
      },
      complianceRequirements: ['data_protection', 'export_controls'],
      marketFocus: ['developed_markets', 'emerging_tech_hubs']
    });

    // Manufacturing industry
    this.industryCustomizations.set('manufacturing', {
      industry: 'manufacturing',
      terminology: {
        'products': 'goods',
        'buyers': 'distributors',
        'compliance': 'quality standards'
      },
      commonIntents: ['MARKET_RESEARCH', 'COMPLIANCE_HELP', 'QUOTATION_HELP'],
      recommendedFeatures: ['market-research', 'quotation', 'compliance'],
      responseTemplates: {
        'COMPLIANCE_HELP': 'Manufacturing exports require strict quality compliance...'
      },
      dataPreferences: {
        keyMetrics: ['production_capacity', 'trade_volume', 'tariff_rates'],
        preferredVisualization: 'table',
        updateFrequency: 'monthly'
      },
      complianceRequirements: ['quality_standards', 'safety_regulations'],
      marketFocus: ['industrial_markets', 'developing_economies']
    });

    // Add more industries as needed
  }

  private intentToFeature(intent: string): string {
    const mapping: Record<string, string> = {
      'FIND_BUYERS': 'buyer-discovery',
      'MARKET_RESEARCH': 'market-research',
      'COMPLIANCE_HELP': 'compliance',
      'QUOTATION_HELP': 'quotation'
    };
    return mapping[intent] || 'dashboard';
  }

  private featureToTitle(feature: string): string {
    const mapping: Record<string, string> = {
      'buyer-discovery': 'Buyer Discovery',
      'market-research': 'Market Research',
      'compliance': 'Export Compliance',
      'quotation': 'Quotation Management'
    };
    return mapping[feature] || feature;
  }

  private intentToTitle(intent: string): string {
    const mapping: Record<string, string> = {
      'FIND_BUYERS': 'Buyer Discovery',
      'MARKET_RESEARCH': 'Market Research',
      'COMPLIANCE_HELP': 'Export Compliance',
      'QUOTATION_HELP': 'Quotation Management',
      'PLATFORM_NAVIGATION': 'Platform Navigation',
      'GENERAL_EXPORT_ADVICE': 'Export Advice'
    };
    return mapping[intent] || intent;
  }

  private loadPersonalizationData(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data.userBehaviorPatterns || {}).forEach(([userId, pattern]: [string, any]) => {
          // Convert date strings back to Date objects
          if (pattern.expertiseGrowth) {
            pattern.expertiseGrowth.forEach((growth: any) => {
              growth.date = new Date(growth.date);
            });
          }
          this.userBehaviorPatterns.set(userId, pattern);
        });
      }
    } catch (error) {
      console.error('Error loading personalization data:', error);
    }
  }

  private savePersonalizationData(): void {
    try {
      const data = {
        userBehaviorPatterns: Object.fromEntries(this.userBehaviorPatterns.entries()),
        lastUpdated: new Date()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving personalization data:', error);
    }
  }
}

export default PersonalizationService;