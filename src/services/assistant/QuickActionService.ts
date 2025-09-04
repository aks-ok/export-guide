import { 
  QuickAction, 
  UserContext, 
  RecognizedIntent, 
  NavigationAction,
  AssistantResponse
} from './types';
import { NavigationIntegrationService } from './NavigationIntegrationService';
import { ConversationAnalyticsService } from './ConversationAnalyticsService';
import { AssistantUtils } from './utils';

/**
 * Quick action configuration
 */
interface QuickActionConfig {
  id: string;
  label: string;
  action: 'navigate' | 'search' | 'create' | 'analyze' | 'export' | 'filter';
  icon?: string;
  color?: string;
  category: string;
  priority: number;
  conditions?: {
    requiredEntities?: string[];
    requiredContext?: string[];
    userExperience?: string[];
    businessProfile?: Partial<any>;
  };
  parameters: Record<string, any>;
  formPrePopulation?: Record<string, string>;
  successMetrics?: string[];
}

/**
 * Action execution result
 */
interface ActionExecutionResult {
  success: boolean;
  actionId: string;
  executionTime: number;
  result?: {
    navigated?: boolean;
    dataGenerated?: boolean;
    formPrePopulated?: boolean;
    url?: string;
    data?: any;
  };
  error?: string;
  nextActions?: QuickAction[];
}

/**
 * Action completion tracking
 */
interface ActionCompletion {
  actionId: string;
  userId: string;
  conversationId: string;
  timestamp: Date;
  success: boolean;
  executionTime: number;
  followUpAction?: string;
  userSatisfaction?: number;
}

/**
 * QuickActionService manages dynamic quick actions and their execution
 */
export class QuickActionService {
  private static instance: QuickActionService;
  private actionConfigs: Map<string, QuickActionConfig> = new Map();
  private actionCompletions: Map<string, ActionCompletion[]> = new Map();
  private readonly STORAGE_KEY = 'exportguide_quick_actions';

  private constructor() {
    this.initializeActionConfigs();
    this.loadActionData();
  }

  public static getInstance(): QuickActionService {
    if (!QuickActionService.instance) {
      QuickActionService.instance = new QuickActionService();
    }
    return QuickActionService.instance;
  }

  /**
   * Generate dynamic quick actions based on context and intent
   */
  generateQuickActions(
    intent: RecognizedIntent,
    context: UserContext,
    maxActions: number = 4
  ): QuickAction[] {
    try {
      const actions: QuickAction[] = [];

      // Get base actions for the intent
      const baseActions = this.getBaseActionsForIntent(intent);
      actions.push(...baseActions);

      // Add contextual actions based on entities
      const entityActions = this.generateEntityBasedActions(intent, context);
      actions.push(...entityActions);

      // Add user profile-based actions
      const profileActions = this.generateProfileBasedActions(context);
      actions.push(...profileActions);

      // Add session context actions
      const contextActions = this.generateContextualActions(context);
      actions.push(...contextActions);

      // Filter actions based on conditions and priority
      const filteredActions = this.filterActionsByConditions(actions, intent, context);
      
      // Sort by priority and return top actions
      return filteredActions
        .sort((a, b) => (this.getActionPriority(b.id) - this.getActionPriority(a.id)))
        .slice(0, maxActions);
    } catch (error) {
      console.error('Error generating quick actions:', error);
      return this.getFallbackActions(context);
    }
  }

  /**
   * Execute quick action
   */
  async executeQuickAction(
    action: QuickAction,
    context: UserContext
  ): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    
    try {
      let result: ActionExecutionResult;

      switch (action.action) {
        case 'navigate':
          result = await this.executeNavigationAction(action, context);
          break;
        case 'search':
          result = await this.executeSearchAction(action, context);
          break;
        case 'create':
          result = await this.executeCreateAction(action, context);
          break;
        case 'analyze':
          result = await this.executeAnalyzeAction(action, context);
          break;
        case 'export':
          result = await this.executeExportAction(action, context);
          break;
        case 'filter':
          result = await this.executeFilterAction(action, context);
          break;
        default:
          throw new Error(`Unknown action type: ${action.action}`);
      }

      result.executionTime = Date.now() - startTime;

      // Track action completion
      this.trackActionCompletion(action, context, result);

      // Track analytics
      const analyticsService = ConversationAnalyticsService.getInstance();
      analyticsService.trackQuickAction(
        action.id,
        action.action,
        context.userId,
        context.conversationId,
        context
      );

      return result;
    } catch (error) {
      console.error('Error executing quick action:', error);
      
      const errorResult: ActionExecutionResult = {
        success: false,
        actionId: action.id,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.trackActionCompletion(action, context, errorResult);
      return errorResult;
    }
  }

  /**
   * Get action completion statistics
   */
  getActionCompletionStats(
    userId?: string,
    timeRange?: { start: Date; end: Date }
  ): {
    totalActions: number;
    successfulActions: number;
    successRate: number;
    averageExecutionTime: number;
    mostUsedActions: Array<{ actionId: string; count: number; successRate: number }>;
    actionsByType: Record<string, { count: number; successRate: number }>;
  } {
    try {
      let completions: ActionCompletion[] = [];
      
      if (userId) {
        completions = this.actionCompletions.get(userId) || [];
      } else {
        this.actionCompletions.forEach(userCompletions => {
          completions.push(...userCompletions);
        });
      }

      // Filter by time range if provided
      if (timeRange) {
        completions = completions.filter(c => 
          c.timestamp >= timeRange.start && c.timestamp <= timeRange.end
        );
      }

      const totalActions = completions.length;
      const successfulActions = completions.filter(c => c.success).length;
      const successRate = totalActions > 0 ? (successfulActions / totalActions) * 100 : 0;
      
      const executionTimes = completions.map(c => c.executionTime);
      const averageExecutionTime = executionTimes.length > 0 
        ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length 
        : 0;

      // Calculate most used actions
      const actionCounts: Record<string, { count: number; successful: number }> = {};
      completions.forEach(completion => {
        if (!actionCounts[completion.actionId]) {
          actionCounts[completion.actionId] = { count: 0, successful: 0 };
        }
        actionCounts[completion.actionId].count++;
        if (completion.success) {
          actionCounts[completion.actionId].successful++;
        }
      });

      const mostUsedActions = Object.entries(actionCounts)
        .map(([actionId, stats]) => ({
          actionId,
          count: stats.count,
          successRate: stats.count > 0 ? (stats.successful / stats.count) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate actions by type
      const actionsByType: Record<string, { count: number; successRate: number }> = {};
      completions.forEach(completion => {
        const config = this.actionConfigs.get(completion.actionId);
        const actionType = config?.action || 'unknown';
        
        if (!actionsByType[actionType]) {
          actionsByType[actionType] = { count: 0, successRate: 0 };
        }
        actionsByType[actionType].count++;
      });

      // Calculate success rates by type
      Object.keys(actionsByType).forEach(type => {
        const typeCompletions = completions.filter(c => {
          const config = this.actionConfigs.get(c.actionId);
          return config?.action === type;
        });
        const successful = typeCompletions.filter(c => c.success).length;
        actionsByType[type].successRate = typeCompletions.length > 0 
          ? (successful / typeCompletions.length) * 100 
          : 0;
      });

      return {
        totalActions,
        successfulActions,
        successRate,
        averageExecutionTime,
        mostUsedActions,
        actionsByType
      };
    } catch (error) {
      console.error('Error calculating action completion stats:', error);
      return {
        totalActions: 0,
        successfulActions: 0,
        successRate: 0,
        averageExecutionTime: 0,
        mostUsedActions: [],
        actionsByType: {}
      };
    }
  }

  /**
   * Get suggested next actions after completion
   */
  getSuggestedNextActions(
    completedAction: QuickAction,
    context: UserContext
  ): QuickAction[] {
    try {
      const suggestions: QuickAction[] = [];

      // Get logical next actions based on completed action
      const nextActionMap: Record<string, string[]> = {
        'open-buyer-discovery': ['create-quotation', 'research-market'],
        'open-market-research': ['find-buyers', 'check-compliance'],
        'create-quotation': ['find-buyers', 'export-data'],
        'check-compliance': ['create-quotation', 'find-buyers']
      };

      const nextActionIds = nextActionMap[completedAction.id] || [];
      
      nextActionIds.forEach(actionId => {
        const config = this.actionConfigs.get(actionId);
        if (config && this.checkActionConditions(config, context)) {
          suggestions.push(this.configToQuickAction(config, context));
        }
      });

      return suggestions.slice(0, 3);
    } catch (error) {
      console.error('Error getting suggested next actions:', error);
      return [];
    }
  }

  /**
   * Create custom quick action
   */
  createCustomAction(
    config: Omit<QuickActionConfig, 'id'>,
    context: UserContext
  ): QuickAction {
    const actionId = AssistantUtils.generateId();
    const fullConfig: QuickActionConfig = {
      ...config,
      id: actionId
    };

    this.actionConfigs.set(actionId, fullConfig);
    this.saveActionData();

    return this.configToQuickAction(fullConfig, context);
  }

  // Private helper methods

  private initializeActionConfigs(): void {
    // Navigation actions
    this.actionConfigs.set('open-buyer-discovery', {
      id: 'open-buyer-discovery',
      label: 'Find Buyers',
      action: 'navigate',
      icon: 'search',
      color: 'primary',
      category: 'navigation',
      priority: 10,
      parameters: { page: 'buyer-discovery' },
      formPrePopulation: {
        'searchCountry': 'businessProfile.targetMarkets[0]',
        'searchIndustry': 'businessProfile.industry'
      },
      successMetrics: ['page_visited', 'search_performed']
    });

    this.actionConfigs.set('open-market-research', {
      id: 'open-market-research',
      label: 'Research Markets',
      action: 'navigate',
      icon: 'analytics',
      color: 'secondary',
      category: 'navigation',
      priority: 9,
      parameters: { page: 'market-research' },
      formPrePopulation: {
        'targetCountry': 'businessProfile.targetMarkets[0]',
        'productCategory': 'businessProfile.primaryProducts[0]'
      }
    });

    // Search actions
    this.actionConfigs.set('search-by-country', {
      id: 'search-by-country',
      label: 'Search by Country',
      action: 'search',
      icon: 'public',
      category: 'search',
      priority: 8,
      conditions: {
        requiredEntities: ['COUNTRY']
      },
      parameters: { type: 'country' }
    });

    // Create actions
    this.actionConfigs.set('create-quotation', {
      id: 'create-quotation',
      label: 'Create Quote',
      action: 'create',
      icon: 'receipt',
      color: 'success',
      category: 'creation',
      priority: 7,
      parameters: { type: 'quotation' },
      formPrePopulation: {
        'customerCountry': 'businessProfile.targetMarkets[0]',
        'productType': 'businessProfile.primaryProducts[0]'
      }
    });

    // Analyze actions
    this.actionConfigs.set('analyze-market', {
      id: 'analyze-market',
      label: 'Analyze Market',
      action: 'analyze',
      icon: 'trending_up',
      category: 'analysis',
      priority: 6,
      parameters: { type: 'market' }
    });

    // Export actions
    this.actionConfigs.set('export-data', {
      id: 'export-data',
      label: 'Export Data',
      action: 'export',
      icon: 'download',
      category: 'export',
      priority: 5,
      parameters: { format: 'csv' }
    });
  }

  private getBaseActionsForIntent(intent: RecognizedIntent): QuickAction[] {
    const intentActionMap: Record<string, string[]> = {
      'FIND_BUYERS': ['open-buyer-discovery', 'search-by-country'],
      'MARKET_RESEARCH': ['open-market-research', 'analyze-market'],
      'QUOTATION_HELP': ['create-quotation', 'export-data'],
      'COMPLIANCE_HELP': ['open-compliance', 'check-requirements'],
      'PLATFORM_NAVIGATION': ['open-buyer-discovery', 'open-market-research']
    };

    const actionIds = intentActionMap[intent.name] || [];
    return actionIds
      .map(id => this.actionConfigs.get(id))
      .filter(config => config !== undefined)
      .map(config => this.configToQuickAction(config!, { userId: '', conversationId: '', businessProfile: {} } as UserContext));
  }

  private generateEntityBasedActions(intent: RecognizedIntent, context: UserContext): QuickAction[] {
    const actions: QuickAction[] = [];

    if (intent.entities) {
      intent.entities.forEach(entity => {
        if (entity.type === 'COUNTRY') {
          actions.push({
            id: `explore-${entity.value.toLowerCase()}`,
            label: `Explore ${entity.value}`,
            action: 'search',
            parameters: { country: entity.value, type: 'country-specific' },
            icon: 'explore'
          });
        } else if (entity.type === 'PRODUCT') {
          actions.push({
            id: `analyze-${entity.value.toLowerCase()}`,
            label: `Analyze ${entity.value}`,
            action: 'analyze',
            parameters: { product: entity.value, type: 'product-analysis' },
            icon: 'analytics'
          });
        }
      });
    }

    return actions;
  }

  private generateProfileBasedActions(context: UserContext): QuickAction[] {
    const actions: QuickAction[] = [];
    const profile = context.businessProfile;

    // Actions based on experience level
    if (profile.experienceLevel === 'beginner') {
      actions.push({
        id: 'beginner-guide',
        label: 'Export Guide',
        action: 'navigate',
        parameters: { page: 'guide', level: 'beginner' },
        icon: 'school'
      });
    }

    // Actions based on missing profile information
    if (profile.targetMarkets.length === 0) {
      actions.push({
        id: 'explore-markets',
        label: 'Explore Markets',
        action: 'navigate',
        parameters: { page: 'market-research' },
        icon: 'explore'
      });
    }

    return actions;
  }

  private generateContextualActions(context: UserContext): QuickAction[] {
    const actions: QuickAction[] = [];
    const currentPage = context.currentSession.currentPage;

    // Page-specific actions
    const pageActions: Record<string, QuickAction[]> = {
      'dashboard': [
        {
          id: 'quick-search',
          label: 'Quick Search',
          action: 'search',
          parameters: { type: 'global' },
          icon: 'search'
        }
      ],
      'buyer-discovery': [
        {
          id: 'save-search',
          label: 'Save Search',
          action: 'create',
          parameters: { type: 'saved-search' },
          icon: 'bookmark'
        }
      ]
    };

    return pageActions[currentPage] || [];
  }

  private async executeNavigationAction(
    action: QuickAction,
    context: UserContext
  ): Promise<ActionExecutionResult> {
    try {
      const navigationService = NavigationIntegrationService.getInstance();
      const page = action.parameters.page;
      
      if (!page) {
        throw new Error('Navigation action missing page parameter');
      }

      // Create navigation action
      const navAction: NavigationAction = {
        page,
        params: action.parameters,
        reason: `Quick action: ${action.label}`
      };

      // Add form pre-population if configured
      const config = this.actionConfigs.get(action.id);
      if (config?.formPrePopulation) {
        navAction.prePopulateForm = await this.resolveFormPrePopulation(
          config.formPrePopulation,
          context
        );
      }

      // Execute navigation
      const navResult = await navigationService.executeNavigation(navAction, context);

      return {
        success: navResult.success,
        actionId: action.id,
        executionTime: 0, // Will be set by caller
        result: {
          navigated: navResult.success,
          url: navResult.url,
          formPrePopulated: !!navResult.prePopulatedFields
        },
        error: navResult.success ? undefined : navResult.error
      };
    } catch (error) {
      return {
        success: false,
        actionId: action.id,
        executionTime: 0,
        error: error instanceof Error ? error.message : 'Navigation failed'
      };
    }
  }

  private async executeSearchAction(
    action: QuickAction,
    context: UserContext
  ): Promise<ActionExecutionResult> {
    try {
      const searchType = action.parameters.type;
      const searchParams = { ...action.parameters };
      
      // This would integrate with actual search functionality
      const mockSearchResult = {
        query: searchParams,
        results: [],
        totalCount: 0
      };

      return {
        success: true,
        actionId: action.id,
        executionTime: 0,
        result: {
          dataGenerated: true,
          data: mockSearchResult
        }
      };
    } catch (error) {
      return {
        success: false,
        actionId: action.id,
        executionTime: 0,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  private async executeCreateAction(
    action: QuickAction,
    context: UserContext
  ): Promise<ActionExecutionResult> {
    try {
      const createType = action.parameters.type;
      
      // This would integrate with actual creation functionality
      const mockCreateResult = {
        type: createType,
        id: AssistantUtils.generateId(),
        created: true
      };

      return {
        success: true,
        actionId: action.id,
        executionTime: 0,
        result: {
          dataGenerated: true,
          data: mockCreateResult
        },
        nextActions: this.getSuggestedNextActions(action, context)
      };
    } catch (error) {
      return {
        success: false,
        actionId: action.id,
        executionTime: 0,
        error: error instanceof Error ? error.message : 'Creation failed'
      };
    }
  }

  private async executeAnalyzeAction(
    action: QuickAction,
    context: UserContext
  ): Promise<ActionExecutionResult> {
    try {
      const analyzeType = action.parameters.type;
      
      // This would integrate with actual analysis functionality
      const mockAnalysisResult = {
        type: analyzeType,
        insights: ['Market opportunity identified', 'Growth potential: High'],
        recommendations: ['Consider expanding to this market']
      };

      return {
        success: true,
        actionId: action.id,
        executionTime: 0,
        result: {
          dataGenerated: true,
          data: mockAnalysisResult
        }
      };
    } catch (error) {
      return {
        success: false,
        actionId: action.id,
        executionTime: 0,
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
  }

  private async executeExportAction(
    action: QuickAction,
    context: UserContext
  ): Promise<ActionExecutionResult> {
    try {
      const format = action.parameters.format || 'csv';
      
      // This would integrate with actual export functionality
      const mockExportResult = {
        format,
        filename: `export_${Date.now()}.${format}`,
        size: '2.5 MB',
        downloadUrl: '#'
      };

      return {
        success: true,
        actionId: action.id,
        executionTime: 0,
        result: {
          dataGenerated: true,
          data: mockExportResult
        }
      };
    } catch (error) {
      return {
        success: false,
        actionId: action.id,
        executionTime: 0,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }

  private async executeFilterAction(
    action: QuickAction,
    context: UserContext
  ): Promise<ActionExecutionResult> {
    try {
      const filterType = action.parameters.type;
      const filterValue = action.parameters.value;
      
      // This would integrate with actual filtering functionality
      const mockFilterResult = {
        filterType,
        filterValue,
        appliedFilters: [{ type: filterType, value: filterValue }],
        resultCount: 42
      };

      return {
        success: true,
        actionId: action.id,
        executionTime: 0,
        result: {
          dataGenerated: true,
          data: mockFilterResult
        }
      };
    } catch (error) {
      return {
        success: false,
        actionId: action.id,
        executionTime: 0,
        error: error instanceof Error ? error.message : 'Filter failed'
      };
    }
  }

  private filterActionsByConditions(
    actions: QuickAction[],
    intent: RecognizedIntent,
    context: UserContext
  ): QuickAction[] {
    return actions.filter(action => {
      const config = this.actionConfigs.get(action.id);
      return !config || this.checkActionConditions(config, context, intent);
    });
  }

  private checkActionConditions(
    config: QuickActionConfig,
    context: UserContext,
    intent?: RecognizedIntent
  ): boolean {
    if (!config.conditions) return true;

    // Check required entities
    if (config.conditions.requiredEntities && intent) {
      const hasRequiredEntities = config.conditions.requiredEntities.every(entityType =>
        intent.entities?.some(e => e.type === entityType)
      );
      if (!hasRequiredEntities) return false;
    }

    // Check user experience
    if (config.conditions.userExperience) {
      if (!config.conditions.userExperience.includes(context.businessProfile.experienceLevel)) {
        return false;
      }
    }

    return true;
  }

  private configToQuickAction(config: QuickActionConfig, context: UserContext): QuickAction {
    return {
      id: config.id,
      label: config.label,
      action: config.action,
      parameters: config.parameters,
      icon: config.icon,
      color: config.color
    };
  }

  private getActionPriority(actionId: string): number {
    const config = this.actionConfigs.get(actionId);
    return config?.priority || 0;
  }

  private getFallbackActions(context: UserContext): QuickAction[] {
    return [
      {
        id: 'help',
        label: 'Get Help',
        action: 'navigate',
        parameters: { page: 'help' },
        icon: 'help'
      },
      {
        id: 'dashboard',
        label: 'Dashboard',
        action: 'navigate',
        parameters: { page: 'dashboard' },
        icon: 'dashboard'
      }
    ];
  }

  private async resolveFormPrePopulation(
    prePopulationConfig: Record<string, string>,
    context: UserContext
  ): Promise<Record<string, any>> {
    const resolved: Record<string, any> = {};

    Object.entries(prePopulationConfig).forEach(([formField, contextPath]) => {
      const value = this.getValueFromContextPath(context, contextPath);
      if (value !== undefined && value !== null) {
        resolved[formField] = value;
      }
    });

    return resolved;
  }

  private getValueFromContextPath(context: UserContext, path: string): any {
    const parts = path.split('.');
    let current: any = context;

    for (const part of parts) {
      if (part.includes('[') && part.includes(']')) {
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

  private trackActionCompletion(
    action: QuickAction,
    context: UserContext,
    result: ActionExecutionResult
  ): void {
    const completion: ActionCompletion = {
      actionId: action.id,
      userId: context.userId,
      conversationId: context.conversationId,
      timestamp: new Date(),
      success: result.success,
      executionTime: result.executionTime,
      followUpAction: result.nextActions?.[0]?.id
    };

    const userCompletions = this.actionCompletions.get(context.userId) || [];
    userCompletions.push(completion);
    
    // Keep only last 100 completions per user
    if (userCompletions.length > 100) {
      userCompletions.splice(0, userCompletions.length - 100);
    }
    
    this.actionCompletions.set(context.userId, userCompletions);
    this.saveActionData();
  }

  private loadActionData(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Load action completions
        if (data.actionCompletions) {
          Object.entries(data.actionCompletions).forEach(([userId, completions]: [string, any]) => {
            const parsedCompletions = completions.map((completion: any) => ({
              ...completion,
              timestamp: new Date(completion.timestamp)
            }));
            this.actionCompletions.set(userId, parsedCompletions);
          });
        }
      }
    } catch (error) {
      console.error('Error loading action data:', error);
    }
  }

  private saveActionData(): void {
    try {
      const data = {
        actionCompletions: Object.fromEntries(this.actionCompletions.entries()),
        lastUpdated: new Date()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving action data:', error);
    }
  }
}

export default QuickActionService;