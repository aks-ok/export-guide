import { AssistantResponse, RecognizedIntent, UserContext, QuickAction, DataVisualization, NavigationAction } from './types';
import { AssistantUtils } from './utils';

/**
 * Response template for different intent types
 */
interface ResponseTemplate {
  textTemplates: string[];
  quickActions?: QuickAction[];
  followUpQuestions?: string[];
  requiresData?: boolean;
}

/**
 * ResponseGenerator creates contextual responses based on recognized intents and user context
 */
export class ResponseGenerator {
  private static instance: ResponseGenerator;
  private responseTemplates: Map<string, ResponseTemplate>;

  private constructor() {
    this.responseTemplates = new Map();
    this.initializeTemplates();
  }

  public static getInstance(): ResponseGenerator {
    if (!ResponseGenerator.instance) {
      ResponseGenerator.instance = new ResponseGenerator();
    }
    return ResponseGenerator.instance;
  }

  /**
   * Generate response based on intent and context
   */
  public async generateResponse(
    intent: RecognizedIntent,
    context: UserContext,
    originalMessage: string
  ): Promise<AssistantResponse> {
    try {
      const template = this.responseTemplates.get(intent.name);
      
      if (!template) {
        return this.generateFallbackResponse(originalMessage, context);
      }

      // Select appropriate text template based on context
      const text = this.selectTextTemplate(template, intent, context);
      
      // Generate quick actions
      const quickActions = this.generateQuickActions(intent, context, template.quickActions);
      
      // Generate navigation suggestions
      const navigationSuggestion = this.generateNavigationSuggestion(intent, context);
      
      // Generate data visualization if needed
      const dataVisualization = template.requiresData 
        ? await this.generateDataVisualization(intent, context)
        : undefined;

      // Generate follow-up questions
      const followUpQuestions = this.generateFollowUpQuestions(template, intent, context);

      return {
        id: AssistantUtils.generateId(),
        timestamp: new Date(),
        text,
        quickActions,
        navigationSuggestion,
        dataVisualization,
        followUpQuestions
      };
    } catch (error) {
      console.error('Error generating response:', error);
      return this.generateErrorResponse(originalMessage, context);
    }
  }

  /**
   * Initialize response templates for different intents
   */
  private initializeTemplates(): void {
    // FIND_BUYERS intent templates
    this.responseTemplates.set('FIND_BUYERS', {
      textTemplates: [
        "I can help you find potential buyers for your products. Let me guide you to our Buyer Discovery tool with relevant filters.",
        "Great! Finding the right buyers is crucial for export success. I'll help you search for buyers based on your products and target markets.",
        "Let's discover potential buyers for your business. I can set up a targeted search based on your industry and preferences."
      ],
      quickActions: [
        {
          id: 'open-buyer-discovery',
          label: 'Open Buyer Discovery',
          action: 'navigate',
          parameters: { page: 'buyer-discovery' },
          icon: 'search'
        },
        {
          id: 'filter-by-country',
          label: 'Filter by Country',
          action: 'search',
          parameters: { type: 'country-filter' },
          icon: 'globe'
        }
      ],
      followUpQuestions: [
        "Which countries are you most interested in?",
        "What products are you looking to export?",
        "Do you have any specific industry preferences?"
      ],
      requiresData: true
    });

    // MARKET_RESEARCH intent templates
    this.responseTemplates.set('MARKET_RESEARCH', {
      textTemplates: [
        "I'll help you access comprehensive market research data. Let me gather the latest information for your target markets.",
        "Market research is essential for successful exports. I can provide you with current trade statistics and market analysis.",
        "Let's explore market opportunities together. I'll pull up relevant data and insights for your business."
      ],
      quickActions: [
        {
          id: 'open-market-research',
          label: 'View Market Data',
          action: 'navigate',
          parameters: { page: 'market-research' },
          icon: 'chart'
        },
        {
          id: 'trade-statistics',
          label: 'Trade Statistics',
          action: 'analyze',
          parameters: { type: 'trade-stats' },
          icon: 'trending-up'
        }
      ],
      followUpQuestions: [
        "Which specific markets are you researching?",
        "Are you looking for import/export data?",
        "Do you need competitor analysis?"
      ],
      requiresData: true
    });

    // COMPLIANCE_HELP intent templates
    this.responseTemplates.set('COMPLIANCE_HELP', {
      textTemplates: [
        "Export compliance can be complex, but I'm here to help. Let me provide you with relevant regulatory information.",
        "I understand compliance is crucial for successful exports. I'll guide you through the requirements for your specific situation.",
        "Compliance requirements vary by country and product. Let me help you navigate the regulations."
      ],
      quickActions: [
        {
          id: 'compliance-guide',
          label: 'Compliance Guide',
          action: 'navigate',
          parameters: { page: 'compliance' },
          icon: 'shield'
        },
        {
          id: 'document-checklist',
          label: 'Document Checklist',
          action: 'create',
          parameters: { type: 'compliance-checklist' },
          icon: 'list'
        }
      ],
      followUpQuestions: [
        "Which country are you exporting to?",
        "What type of products are you exporting?",
        "Do you need help with specific documentation?"
      ]
    });

    // QUOTATION_HELP intent templates
    this.responseTemplates.set('QUOTATION_HELP', {
      textTemplates: [
        "I'll help you create professional quotations for your export business. Let me guide you to our quotation tools.",
        "Creating accurate quotations is important for winning export deals. I can help you with templates and calculations.",
        "Let's work on your quotation together. I'll provide you with the tools and guidance you need."
      ],
      quickActions: [
        {
          id: 'create-quotation',
          label: 'Create Quotation',
          action: 'navigate',
          parameters: { page: 'quotation' },
          icon: 'file-text'
        },
        {
          id: 'quotation-template',
          label: 'Use Template',
          action: 'create',
          parameters: { type: 'quotation-template' },
          icon: 'template'
        }
      ],
      followUpQuestions: [
        "What products are you quoting for?",
        "Do you need help with pricing calculations?",
        "Would you like to use a specific template?"
      ]
    });

    // PLATFORM_NAVIGATION intent templates
    this.responseTemplates.set('PLATFORM_NAVIGATION', {
      textTemplates: [
        "I'm here to help you navigate the ExportGuide platform. Let me show you how to use our features effectively.",
        "The platform has many useful tools for exporters. I'll guide you to the right features for your needs.",
        "Let me help you find what you're looking for on the platform. I can provide step-by-step guidance."
      ],
      quickActions: [
        {
          id: 'platform-tour',
          label: 'Take Platform Tour',
          action: 'navigate',
          parameters: { page: 'tour' },
          icon: 'compass'
        },
        {
          id: 'feature-overview',
          label: 'Feature Overview',
          action: 'navigate',
          parameters: { page: 'features' },
          icon: 'grid'
        }
      ],
      followUpQuestions: [
        "Which feature would you like to learn about?",
        "Are you looking for something specific?",
        "Would you like a guided tour?"
      ]
    });

    // GENERAL_EXPORT_ADVICE intent templates
    this.responseTemplates.set('GENERAL_EXPORT_ADVICE', {
      textTemplates: [
        "I'm happy to provide export advice based on best practices and current market conditions.",
        "Export success requires careful planning and execution. I can share insights and recommendations for your situation.",
        "Let me help you with export guidance tailored to your business needs and experience level."
      ],
      quickActions: [
        {
          id: 'export-guide',
          label: 'Export Guide',
          action: 'navigate',
          parameters: { page: 'guide' },
          icon: 'book'
        },
        {
          id: 'best-practices',
          label: 'Best Practices',
          action: 'navigate',
          parameters: { page: 'best-practices' },
          icon: 'star'
        }
      ],
      followUpQuestions: [
        "What specific aspect of exporting interests you?",
        "Are you a beginner or experienced exporter?",
        "Do you have a particular challenge you're facing?"
      ]
    });

    // ONBOARDING_HELP intent templates
    this.responseTemplates.set('ONBOARDING_HELP', {
      textTemplates: [
        "Welcome to ExportGuide! I'm excited to help you get started. Let me show you around the platform.",
        "Great to have you here! I'll guide you through the key features that will help grow your export business.",
        "Let's get you set up for export success. I'll walk you through the most important tools and features."
      ],
      quickActions: [
        {
          id: 'start-onboarding',
          label: 'Start Tour',
          action: 'navigate',
          parameters: { page: 'onboarding' },
          icon: 'play'
        },
        {
          id: 'setup-profile',
          label: 'Setup Profile',
          action: 'navigate',
          parameters: { page: 'profile-setup' },
          icon: 'user'
        }
      ],
      followUpQuestions: [
        "What's your main goal with exporting?",
        "Have you exported before?",
        "Which markets are you interested in?"
      ]
    });
  }

  /**
   * Select appropriate text template based on context
   */
  private selectTextTemplate(
    template: ResponseTemplate,
    intent: RecognizedIntent,
    context: UserContext
  ): string {
    const templates = template.textTemplates;
    
    // Simple selection based on user experience level or random
    if (context.businessProfile?.experienceLevel === 'beginner') {
      return templates[0]; // More explanatory template
    } else if (context.businessProfile?.experienceLevel === 'advanced') {
      return templates[templates.length - 1]; // More direct template
    }
    
    // Random selection for variety
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate quick actions based on intent and context
   */
  private generateQuickActions(
    intent: RecognizedIntent,
    context: UserContext,
    templateActions?: QuickAction[]
  ): QuickAction[] {
    const actions: QuickAction[] = [...(templateActions || [])];
    
    // Add context-specific actions based on extracted entities
    if (intent.entities) {
      for (const entity of intent.entities) {
        if (entity.type === 'COUNTRY' && entity.value) {
          actions.push({
            id: `search-${entity.value.toLowerCase()}`,
            label: `Explore ${entity.value}`,
            action: 'search',
            parameters: { country: entity.value },
            icon: 'globe'
          });
        }
        
        if (entity.type === 'PRODUCT' && entity.value) {
          actions.push({
            id: `analyze-${entity.value.toLowerCase()}`,
            label: `Analyze ${entity.value}`,
            action: 'analyze',
            parameters: { product: entity.value },
            icon: 'trending-up'
          });
        }
      }
    }
    
    return actions.slice(0, 4); // Limit to 4 actions for UI
  }

  /**
   * Generate navigation suggestion based on intent
   */
  private generateNavigationSuggestion(
    intent: RecognizedIntent,
    context: UserContext
  ): NavigationAction | undefined {
    const navigationMap: Record<string, NavigationAction> = {
      'FIND_BUYERS': {
        page: 'buyer-discovery',
        params: this.extractNavigationParams(intent),
        reason: 'Find potential buyers for your products'
      },
      'MARKET_RESEARCH': {
        page: 'market-research',
        params: this.extractNavigationParams(intent),
        reason: 'Access comprehensive market data'
      },
      'QUOTATION_HELP': {
        page: 'quotation',
        params: this.extractNavigationParams(intent),
        reason: 'Create professional quotations'
      },
      'COMPLIANCE_HELP': {
        page: 'compliance',
        params: this.extractNavigationParams(intent),
        reason: 'Get compliance guidance'
      }
    };

    return navigationMap[intent.name];
  }

  /**
   * Extract navigation parameters from intent entities
   */
  private extractNavigationParams(intent: RecognizedIntent): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (intent.entities) {
      for (const entity of intent.entities) {
        if (entity.type === 'COUNTRY') {
          params.country = entity.value;
        } else if (entity.type === 'PRODUCT') {
          params.product = entity.value;
        } else if (entity.type === 'INDUSTRY') {
          params.industry = entity.value;
        }
      }
    }
    
    return params;
  }

  /**
   * Generate data visualization for data-requiring intents
   */
  private async generateDataVisualization(
    intent: RecognizedIntent,
    context: UserContext
  ): Promise<DataVisualization | undefined> {
    // This would integrate with actual data services
    // For now, return a placeholder structure
    if (intent.name === 'MARKET_RESEARCH') {
      return {
        type: 'chart',
        title: 'Trade Statistics',
        data: [], // Would be populated with real data
        config: {
          chartType: 'line',
          xAxis: 'Year',
          yAxis: 'Trade Value (USD)'
        }
      };
    }
    
    return undefined;
  }

  /**
   * Generate contextual follow-up questions
   */
  private generateFollowUpQuestions(
    template: ResponseTemplate,
    intent: RecognizedIntent,
    context: UserContext
  ): string[] {
    const baseQuestions = template.followUpQuestions || [];
    const contextualQuestions: string[] = [];
    
    // Add questions based on missing entities
    if (intent.name === 'FIND_BUYERS' || intent.name === 'MARKET_RESEARCH') {
      const hasCountry = intent.entities?.some(e => e.type === 'COUNTRY');
      const hasProduct = intent.entities?.some(e => e.type === 'PRODUCT');
      
      if (!hasCountry) {
        contextualQuestions.push("Which countries are you targeting?");
      }
      if (!hasProduct) {
        contextualQuestions.push("What products are you working with?");
      }
    }
    
    return [...baseQuestions, ...contextualQuestions].slice(0, 3);
  }

  /**
   * Generate fallback response for unrecognized intents
   */
  private generateFallbackResponse(
    originalMessage: string,
    context: UserContext
  ): AssistantResponse {
    const fallbackTexts = [
      "I'm not sure I understand exactly what you're looking for. Could you rephrase your question?",
      "I want to help you with that. Can you provide a bit more detail about what you need?",
      "Let me help you find what you're looking for. Could you be more specific about your question?"
    ];

    const fallbackActions: QuickAction[] = [
      {
        id: 'browse-features',
        label: 'Browse Features',
        action: 'navigate',
        parameters: { page: 'features' },
        icon: 'grid'
      },
      {
        id: 'contact-support',
        label: 'Contact Support',
        action: 'navigate',
        parameters: { page: 'support' },
        icon: 'help-circle'
      }
    ];

    return {
      id: AssistantUtils.generateId(),
      timestamp: new Date(),
      text: fallbackTexts[Math.floor(Math.random() * fallbackTexts.length)],
      quickActions: fallbackActions,
      followUpQuestions: [
        "Are you looking for buyer information?",
        "Do you need market research data?",
        "Would you like help with compliance?"
      ]
    };
  }

  /**
   * Generate error response for system failures
   */
  private generateErrorResponse(
    originalMessage: string,
    context: UserContext
  ): AssistantResponse {
    return {
      id: AssistantUtils.generateId(),
      timestamp: new Date(),
      text: "I'm experiencing some technical difficulties right now. Please try again in a moment, or let me know if you need immediate assistance.",
      quickActions: [
        {
          id: 'retry-message',
          label: 'Try Again',
          action: 'navigate',
          parameters: { retry: true },
          icon: 'refresh'
        },
        {
          id: 'contact-support',
          label: 'Contact Support',
          action: 'navigate',
          parameters: { page: 'support' },
          icon: 'help-circle'
        }
      ],
      followUpQuestions: [
        "Would you like me to try processing your request again?",
        "Is there something else I can help you with?"
      ]
    };
  }

  /**
   * Format response for different content types
   */
  public formatResponse(
    response: AssistantResponse,
    format: 'text' | 'html' | 'markdown' = 'text'
  ): string {
    switch (format) {
      case 'html':
        return this.formatAsHtml(response);
      case 'markdown':
        return this.formatAsMarkdown(response);
      default:
        return response.text;
    }
  }

  /**
   * Format response as HTML
   */
  private formatAsHtml(response: AssistantResponse): string {
    let html = `<p>${response.text}</p>`;
    
    if (response.quickActions && response.quickActions.length > 0) {
      html += '<div class="quick-actions">';
      for (const action of response.quickActions) {
        html += `<button class="quick-action" data-action="${action.id}">${action.label}</button>`;
      }
      html += '</div>';
    }
    
    return html;
  }

  /**
   * Format response as Markdown
   */
  private formatAsMarkdown(response: AssistantResponse): string {
    let markdown = response.text;
    
    if (response.quickActions && response.quickActions.length > 0) {
      markdown += '\n\n**Quick Actions:**\n';
      for (const action of response.quickActions) {
        markdown += `- ${action.label}\n`;
      }
    }
    
    if (response.followUpQuestions && response.followUpQuestions.length > 0) {
      markdown += '\n\n**You might also ask:**\n';
      for (const question of response.followUpQuestions) {
        markdown += `- ${question}\n`;
      }
    }
    
    return markdown;
  }
}

export default ResponseGenerator;