import { 
  NavigationAction, 
  UserContext, 
  RecognizedIntent, 
  QuickAction 
} from './types';

/**
 * Navigation route configuration
 */
interface RouteConfig {
  path: string;
  component: string;
  title: string;
  description: string;
  requiredParams?: string[];
  optionalParams?: string[];
  prePopulateFields?: string[];
  highlightElements?: string[];
}

/**
 * Form pre-population configuration
 */
interface FormPrePopulationConfig {
  formId: string;
  fieldMappings: Record<string, string>;
  validationRules?: Record<string, (value: any) => boolean>;
}

/**
 * NavigationIntegrationService handles platform navigation and deep linking
 */
export class NavigationIntegrationService {
  private static instance: NavigationIntegrationService;
  private routeConfigs: Map<string, RouteConfig> = new Map();
  private formConfigs: Map<string, FormPrePopulationConfig> = new Map();
  private navigationCallbacks: Map<string, ((action: NavigationAction) => void)[]> = new Map();

  private constructor() {
    this.initializeRouteConfigs();
    this.initializeFormConfigs();
  }

  public static getInstance(): NavigationIntegrationService {
    if (!NavigationIntegrationService.instance) {
      NavigationIntegrationService.instance = new NavigationIntegrationService();
    }
    return NavigationIntegrationService.instance;
  }

  /**
   * Generate navigation suggestions based on intent and context
   */
  generateNavigationSuggestions(
    intent: RecognizedIntent,
    context: UserContext
  ): NavigationAction[] {
    const suggestions: NavigationAction[] = [];

    try {
      // Primary navigation based on intent
      const primaryNav = this.getPrimaryNavigationForIntent(intent, context);
      if (primaryNav) {
        suggestions.push(primaryNav);
      }

      // Secondary suggestions based on user profile and context
      const secondaryNavs = this.getSecondaryNavigationSuggestions(intent, context);
      suggestions.push(...secondaryNavs);

      // Contextual suggestions based on current page
      const contextualNavs = this.getContextualNavigationSuggestions(context);
      suggestions.push(...contextualNavs);

      return suggestions.slice(0, 5); // Limit to 5 suggestions
    } catch (error) {
      console.error('Error generating navigation suggestions:', error);
      return [];
    }
  }

  /**
   * Create deep link with parameters
   */
  createDeepLink(
    page: string,
    params: Record<string, any> = {},
    prePopulateForm?: Record<string, any>
  ): NavigationAction {
    const routeConfig = this.routeConfigs.get(page);
    
    if (!routeConfig) {
      throw new Error(`Unknown page: ${page}`);
    }

    // Validate required parameters
    if (routeConfig.requiredParams) {
      const missingParams = routeConfig.requiredParams.filter(param => !params[param]);
      if (missingParams.length > 0) {
        console.warn(`Missing required parameters for ${page}:`, missingParams);
      }
    }

    // Build navigation action
    const navigationAction: NavigationAction = {
      page,
      params: this.sanitizeParams(params),
      reason: `Navigate to ${routeConfig.title}`
    };

    // Add form pre-population if provided
    if (prePopulateForm) {
      navigationAction.prePopulateForm = this.sanitizeFormData(prePopulateForm);
    }

    return navigationAction;
  }

  /**
   * Handle navigation action execution
   */
  async executeNavigation(
    action: NavigationAction,
    context: UserContext
  ): Promise<{
    success: boolean;
    url?: string;
    error?: string;
    prePopulatedFields?: Record<string, any>;
  }> {
    try {
      const routeConfig = this.routeConfigs.get(action.page);
      
      if (!routeConfig) {
        return {
          success: false,
          error: `Unknown page: ${action.page}`
        };
      }

      // Build URL with parameters
      const url = this.buildUrl(routeConfig.path, action.params || {});
      
      // Prepare form pre-population
      let prePopulatedFields: Record<string, any> | undefined;
      if (action.prePopulateForm) {
        prePopulatedFields = await this.prepareFormPrePopulation(
          action.page,
          action.prePopulateForm,
          context
        );
      }

      // Notify navigation callbacks
      this.notifyNavigationCallbacks(action.page, action);

      // Track navigation for analytics
      this.trackNavigation(action, context);

      return {
        success: true,
        url,
        prePopulatedFields
      };
    } catch (error) {
      console.error('Error executing navigation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown navigation error'
      };
    }
  }

  /**
   * Get navigation suggestions for current context
   */
  getContextualSuggestions(context: UserContext): QuickAction[] {
    const suggestions: QuickAction[] = [];

    try {
      // Based on current page
      const currentPageSuggestions = this.getSuggestionsForCurrentPage(context.currentSession.currentPage);
      suggestions.push(...currentPageSuggestions);

      // Based on user profile
      const profileSuggestions = this.getSuggestionsForUserProfile(context.businessProfile);
      suggestions.push(...profileSuggestions);

      // Based on recent activity
      const activitySuggestions = this.getSuggestionsForRecentActivity(context.currentSession);
      suggestions.push(...activitySuggestions);

      return suggestions.slice(0, 4); // Limit to 4 suggestions
    } catch (error) {
      console.error('Error getting contextual suggestions:', error);
      return [];
    }
  }

  /**
   * Pre-populate form fields based on user context and intent
   */
  async prePopulateForm(
    formId: string,
    context: UserContext,
    intent?: RecognizedIntent
  ): Promise<Record<string, any>> {
    try {
      const formConfig = this.formConfigs.get(formId);
      
      if (!formConfig) {
        console.warn(`No form configuration found for: ${formId}`);
        return {};
      }

      const prePopulatedData: Record<string, any> = {};

      // Map user context to form fields
      Object.entries(formConfig.fieldMappings).forEach(([formField, contextPath]) => {
        const value = this.getValueFromContext(context, contextPath);
        if (value !== undefined && value !== null) {
          // Validate the value if validation rules exist
          if (formConfig.validationRules?.[formField]) {
            if (formConfig.validationRules[formField](value)) {
              prePopulatedData[formField] = value;
            }
          } else {
            prePopulatedData[formField] = value;
          }
        }
      });

      // Add intent-based pre-population (should override context data)
      if (intent) {
        const intentBasedData = this.getIntentBasedPrePopulation(intent, formId);
        Object.assign(prePopulatedData, intentBasedData);
      }

      return prePopulatedData;
    } catch (error) {
      console.error('Error pre-populating form:', error);
      return {};
    }
  }

  /**
   * Register navigation callback
   */
  onNavigation(page: string, callback: (action: NavigationAction) => void): void {
    if (!this.navigationCallbacks.has(page)) {
      this.navigationCallbacks.set(page, []);
    }
    this.navigationCallbacks.get(page)!.push(callback);
  }

  /**
   * Unregister navigation callback
   */
  offNavigation(page: string, callback: (action: NavigationAction) => void): void {
    const callbacks = this.navigationCallbacks.get(page);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Get available routes
   */
  getAvailableRoutes(): Array<{
    page: string;
    title: string;
    description: string;
    path: string;
  }> {
    return Array.from(this.routeConfigs.entries()).map(([page, config]) => ({
      page,
      title: config.title,
      description: config.description,
      path: config.path
    }));
  }

  /**
   * Validate navigation parameters
   */
  validateNavigationParams(page: string, params: Record<string, any>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const routeConfig = this.routeConfigs.get(page);

    if (!routeConfig) {
      errors.push(`Unknown page: ${page}`);
      return { isValid: false, errors, warnings };
    }

    // Check required parameters
    if (routeConfig.requiredParams) {
      routeConfig.requiredParams.forEach(param => {
        if (!params[param]) {
          errors.push(`Missing required parameter: ${param}`);
        }
      });
    }

    // Check for unknown parameters
    const knownParams = [
      ...(routeConfig.requiredParams || []),
      ...(routeConfig.optionalParams || [])
    ];
    
    Object.keys(params).forEach(param => {
      if (!knownParams.includes(param)) {
        warnings.push(`Unknown parameter: ${param}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Private helper methods

  private initializeRouteConfigs(): void {
    // Dashboard
    this.routeConfigs.set('dashboard', {
      path: '/',
      component: 'EnhancedHomePage',
      title: 'Dashboard',
      description: 'Main dashboard with overview and key metrics',
      highlightElements: ['stats-cards', 'recent-activities']
    });

    // Buyer Discovery
    this.routeConfigs.set('buyer-discovery', {
      path: '/buyer-discovery',
      component: 'BuyerDiscoveryPage',
      title: 'Buyer Discovery',
      description: 'Find and connect with potential buyers',
      optionalParams: ['country', 'industry', 'product', 'size'],
      prePopulateFields: ['searchCountry', 'searchIndustry', 'searchProduct'],
      highlightElements: ['search-filters', 'buyer-results']
    });

    // Market Research
    this.routeConfigs.set('market-research', {
      path: '/market-research',
      component: 'SimpleMarketResearchPage',
      title: 'Market Research',
      description: 'Analyze market opportunities and trends',
      optionalParams: ['country', 'product', 'timeframe'],
      prePopulateFields: ['targetCountry', 'productCategory'],
      highlightElements: ['research-tools', 'market-data']
    });

    // Export Compliance
    this.routeConfigs.set('compliance', {
      path: '/compliance',
      component: 'CompliancePage',
      title: 'Export Compliance',
      description: 'Understand regulatory requirements and documentation',
      optionalParams: ['country', 'product', 'hsCode'],
      prePopulateFields: ['destinationCountry', 'productType'],
      highlightElements: ['compliance-checker', 'documentation-guide']
    });

    // Quotation
    this.routeConfigs.set('quotation', {
      path: '/quotation',
      component: 'QuotationPage',
      title: 'Quotation Management',
      description: 'Create and manage export quotations',
      optionalParams: ['template', 'customer', 'product'],
      prePopulateFields: ['customerInfo', 'productDetails', 'destination'],
      highlightElements: ['quotation-form', 'pricing-calculator']
    });

    // Lead Generation
    this.routeConfigs.set('lead-generation', {
      path: '/lead-generation',
      component: 'SimpleLeadGenerationPage',
      title: 'Lead Generation',
      description: 'Generate and manage export leads',
      optionalParams: ['source', 'status', 'priority'],
      prePopulateFields: ['leadSource', 'targetMarket'],
      highlightElements: ['lead-form', 'lead-pipeline']
    });
  }

  private initializeFormConfigs(): void {
    // Buyer Discovery Form
    this.formConfigs.set('buyer-search', {
      formId: 'buyer-search',
      fieldMappings: {
        'searchCountry': 'businessProfile.targetMarkets[0]',
        'searchIndustry': 'businessProfile.industry',
        'searchProduct': 'businessProfile.primaryProducts[0]',
        'companySize': 'businessProfile.businessSize'
      },
      validationRules: {
        'searchCountry': (value) => typeof value === 'string' && value.length > 0,
        'searchIndustry': (value) => typeof value === 'string' && value.length > 0
      }
    });

    // Market Research Form
    this.formConfigs.set('market-research', {
      formId: 'market-research',
      fieldMappings: {
        'targetCountry': 'businessProfile.targetMarkets[0]',
        'productCategory': 'businessProfile.primaryProducts[0]',
        'businessType': 'businessProfile.businessSize',
        'experienceLevel': 'businessProfile.experienceLevel'
      }
    });

    // Quotation Form
    this.formConfigs.set('quotation-form', {
      formId: 'quotation-form',
      fieldMappings: {
        'sellerCompany': 'businessProfile.companyName',
        'sellerIndustry': 'businessProfile.industry',
        'productCategory': 'businessProfile.primaryProducts[0]',
        'preferredLanguage': 'businessProfile.preferredLanguage'
      }
    });

    // Compliance Form
    this.formConfigs.set('compliance-checker', {
      formId: 'compliance-checker',
      fieldMappings: {
        'destinationCountry': 'businessProfile.targetMarkets[0]',
        'productType': 'businessProfile.primaryProducts[0]',
        'exporterType': 'businessProfile.businessSize'
      }
    });
  }

  private getPrimaryNavigationForIntent(
    intent: RecognizedIntent,
    context: UserContext
  ): NavigationAction | null {
    const intentNavigationMap: Record<string, string> = {
      'FIND_BUYERS': 'buyer-discovery',
      'MARKET_RESEARCH': 'market-research',
      'COMPLIANCE_HELP': 'compliance',
      'QUOTATION_HELP': 'quotation',
      'PLATFORM_NAVIGATION': 'dashboard'
    };

    const targetPage = intentNavigationMap[intent.name];
    if (!targetPage) return null;

    const params = this.extractParamsFromIntent(intent);
    const prePopulateForm = this.getFormPrePopulationFromIntent(intent, targetPage);

    return this.createDeepLink(targetPage, params, prePopulateForm);
  }

  private getSecondaryNavigationSuggestions(
    intent: RecognizedIntent,
    context: UserContext
  ): NavigationAction[] {
    const suggestions: NavigationAction[] = [];

    // Based on user's experience level
    if (context.businessProfile.experienceLevel === 'beginner') {
      if (intent.name === 'FIND_BUYERS') {
        suggestions.push(this.createDeepLink('market-research', {}, {
          targetCountry: context.businessProfile.targetMarkets[0]
        }));
      }
    }

    // Based on missing profile information
    if (context.businessProfile.targetMarkets.length === 0) {
      suggestions.push(this.createDeepLink('market-research'));
    }

    return suggestions;
  }

  private getContextualNavigationSuggestions(context: UserContext): NavigationAction[] {
    const suggestions: NavigationAction[] = [];
    const currentPage = context.currentSession.currentPage;

    // Suggest related pages based on current location
    const relatedPages: Record<string, string[]> = {
      'buyer-discovery': ['market-research', 'quotation'],
      'market-research': ['buyer-discovery', 'compliance'],
      'compliance': ['quotation', 'market-research'],
      'quotation': ['buyer-discovery', 'lead-generation']
    };

    const related = relatedPages[currentPage];
    if (related) {
      related.forEach(page => {
        suggestions.push(this.createDeepLink(page));
      });
    }

    return suggestions;
  }

  private getSuggestionsForCurrentPage(currentPage: string): QuickAction[] {
    const suggestions: QuickAction[] = [];

    const pageSuggestions: Record<string, QuickAction[]> = {
      'dashboard': [
        {
          id: 'nav-buyers',
          label: 'Find Buyers',
          action: 'navigate',
          parameters: { page: 'buyer-discovery' },
          icon: 'search'
        },
        {
          id: 'nav-research',
          label: 'Market Research',
          action: 'navigate',
          parameters: { page: 'market-research' },
          icon: 'analytics'
        }
      ],
      'buyer-discovery': [
        {
          id: 'nav-quotation',
          label: 'Create Quote',
          action: 'navigate',
          parameters: { page: 'quotation' },
          icon: 'receipt'
        }
      ]
    };

    return pageSuggestions[currentPage] || [];
  }

  private getSuggestionsForUserProfile(businessProfile: any): QuickAction[] {
    const suggestions: QuickAction[] = [];

    if (businessProfile.experienceLevel === 'beginner') {
      suggestions.push({
        id: 'nav-compliance',
        label: 'Learn Compliance',
        action: 'navigate',
        parameters: { page: 'compliance' },
        icon: 'school'
      });
    }

    if (businessProfile.targetMarkets.length === 0) {
      suggestions.push({
        id: 'nav-market-research',
        label: 'Explore Markets',
        action: 'navigate',
        parameters: { page: 'market-research' },
        icon: 'explore'
      });
    }

    return suggestions;
  }

  private getSuggestionsForRecentActivity(session: any): QuickAction[] {
    const suggestions: QuickAction[] = [];

    // Based on recent search queries
    if (session.searchQueries.includes('buyer') || session.searchQueries.includes('customer')) {
      suggestions.push({
        id: 'nav-buyer-discovery',
        label: 'Find More Buyers',
        action: 'navigate',
        parameters: { page: 'buyer-discovery' },
        icon: 'person_search'
      });
    }

    return suggestions;
  }

  private extractParamsFromIntent(intent: RecognizedIntent): Record<string, any> {
    const params: Record<string, any> = {};

    if (intent.entities) {
      intent.entities.forEach(entity => {
        switch (entity.type) {
          case 'COUNTRY':
            params.country = entity.value;
            break;
          case 'PRODUCT':
            params.product = entity.value;
            break;
          case 'INDUSTRY':
            params.industry = entity.value;
            break;
        }
      });
    }

    return params;
  }

  private getFormPrePopulationFromIntent(intent: RecognizedIntent, page: string): Record<string, any> {
    const prePopulation: Record<string, any> = {};

    if (intent.entities) {
      intent.entities.forEach(entity => {
        switch (entity.type) {
          case 'COUNTRY':
            if (page === 'buyer-discovery') {
              prePopulation.searchCountry = entity.value;
            } else if (page === 'market-research') {
              prePopulation.targetCountry = entity.value;
            }
            break;
          case 'PRODUCT':
            if (page === 'buyer-discovery') {
              prePopulation.searchProduct = entity.value;
            } else if (page === 'market-research') {
              prePopulation.productCategory = entity.value;
            }
            break;
        }
      });
    }

    return prePopulation;
  }

  private sanitizeParams(params: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        // Basic sanitization
        if (typeof value === 'string') {
          sanitized[key] = value.trim().substring(0, 100); // Limit length
        } else if (typeof value === 'number' && !isNaN(value)) {
          sanitized[key] = value;
        } else if (typeof value === 'boolean') {
          sanitized[key] = value;
        }
      }
    });

    return sanitized;
  }

  private sanitizeFormData(formData: Record<string, any>): Record<string, any> {
    return this.sanitizeParams(formData); // Same sanitization for now
  }

  private buildUrl(basePath: string, params: Record<string, any>): string {
    const url = new URL(basePath, window.location.origin);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  }

  private async prepareFormPrePopulation(
    page: string,
    formData: Record<string, any>,
    context: UserContext
  ): Promise<Record<string, any>> {
    // This would integrate with actual form systems
    // For now, just return the sanitized form data
    return this.sanitizeFormData(formData);
  }

  private getValueFromContext(context: UserContext, path: string): any {
    const parts = path.split('.');
    let current: any = context;

    for (const part of parts) {
      if (part.includes('[') && part.includes(']')) {
        // Handle array access like 'targetMarkets[0]'
        const [arrayName, indexStr] = part.split('[');
        const index = parseInt(indexStr.replace(']', ''));
        current = current?.[arrayName]?.[index];
      } else {
        current = current?.[part];
      }

      if (current === undefined || current === null) {
        return undefined;
      }
    }

    return current;
  }

  private getIntentBasedPrePopulation(intent: RecognizedIntent, formId: string): Record<string, any> {
    const prePopulation: Record<string, any> = {};

    // Add intent-specific pre-population logic here
    if (intent.entities) {
      intent.entities.forEach(entity => {
        if (entity.type === 'COUNTRY') {
          if (formId === 'buyer-search') {
            prePopulation.searchCountry = entity.value;
          } else if (formId === 'market-research') {
            prePopulation.targetCountry = entity.value;
          } else if (formId === 'compliance-checker') {
            prePopulation.destinationCountry = entity.value;
          }
        } else if (entity.type === 'PRODUCT') {
          if (formId === 'buyer-search') {
            prePopulation.searchProduct = entity.value;
          } else if (formId === 'market-research') {
            prePopulation.productCategory = entity.value;
          } else if (formId === 'compliance-checker') {
            prePopulation.productType = entity.value;
          }
        }
      });
    }

    return prePopulation;
  }

  private notifyNavigationCallbacks(page: string, action: NavigationAction): void {
    const callbacks = this.navigationCallbacks.get(page);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(action);
        } catch (error) {
          console.error('Error in navigation callback:', error);
        }
      });
    }
  }

  private trackNavigation(action: NavigationAction, context: UserContext): void {
    // This would integrate with analytics service
    console.log('Navigation tracked:', {
      page: action.page,
      userId: context.userId,
      timestamp: new Date(),
      params: action.params
    });
  }
}

export default NavigationIntegrationService;