import { 
  UserContext, 
  BusinessProfile, 
  QuickAction,
  AssistantResponse 
} from './types';
import { UserContextManager } from './UserContextManager';
import { NavigationIntegrationService } from './NavigationIntegrationService';
import { AssistantUtils } from './utils';

/**
 * Onboarding step configuration
 */
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  page: string;
  targetElement?: string;
  content: {
    message: string;
    tips?: string[];
    actions: QuickAction[];
  };
  completionCriteria: {
    type: 'interaction' | 'navigation' | 'form_completion' | 'time_based';
    target?: string;
    duration?: number; // in seconds
    formFields?: string[];
  };
  prerequisites?: string[];
  optional?: boolean;
}

/**
 * Onboarding progress tracking
 */
interface OnboardingProgress {
  userId: string;
  currentStep: string | null;
  completedSteps: string[];
  skippedSteps: string[];
  startedAt: Date;
  lastActivity: Date;
  completedAt?: Date;
  totalSteps: number;
  completionPercentage: number;
  timeSpent: number; // in seconds
  interactions: OnboardingInteraction[];
}

/**
 * Onboarding interaction tracking
 */
interface OnboardingInteraction {
  stepId: string;
  action: string;
  timestamp: Date;
  elementId?: string;
  success: boolean;
  timeToComplete?: number;
}

/**
 * Onboarding flow configuration
 */
interface OnboardingFlow {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
  estimatedDuration: number; // in minutes
  targetAudience: 'beginner' | 'intermediate' | 'advanced' | 'all';
}

/**
 * OnboardingAssistantService manages guided tours and user onboarding
 */
export class OnboardingAssistantService {
  private static instance: OnboardingAssistantService;
  private onboardingFlows: Map<string, OnboardingFlow> = new Map();
  private userProgress: Map<string, OnboardingProgress> = new Map();
  private stepCompletionCallbacks: Map<string, ((stepId: string, userId: string) => void)[]> = new Map();
  private readonly STORAGE_KEY = 'exportguide_onboarding_progress';

  private constructor() {
    this.initializeOnboardingFlows();
    this.loadUserProgress();
  }

  public static getInstance(): OnboardingAssistantService {
    if (!OnboardingAssistantService.instance) {
      OnboardingAssistantService.instance = new OnboardingAssistantService();
    }
    return OnboardingAssistantService.instance;
  }

  /**
   * Start onboarding flow for user
   */
  async startOnboarding(
    userId: string,
    flowId: string = 'default',
    context?: UserContext
  ): Promise<AssistantResponse> {
    try {
      const flow = this.onboardingFlows.get(flowId);
      if (!flow) {
        throw new Error(`Onboarding flow not found: ${flowId}`);
      }

      // Initialize progress tracking
      const progress: OnboardingProgress = {
        userId,
        currentStep: flow.steps[0].id,
        completedSteps: [],
        skippedSteps: [],
        startedAt: new Date(),
        lastActivity: new Date(),
        totalSteps: flow.steps.length,
        completionPercentage: 0,
        timeSpent: 0,
        interactions: []
      };

      this.userProgress.set(userId, progress);
      this.saveUserProgress();

      // Get first step
      const firstStep = flow.steps[0];
      return await this.generateStepResponse(firstStep, progress, context);
    } catch (error) {
      console.error('Error starting onboarding:', error);
      return {
        id: AssistantUtils.generateId(),
        text: "I'm having trouble starting the onboarding process. Let me help you get started manually.",
        quickActions: [
          {
            id: 'manual-tour',
            label: 'Manual Tour',
            action: 'navigate',
            parameters: { page: 'dashboard', tour: true },
            icon: 'tour'
          }
        ],
        timestamp: new Date()
      };
    }
  }

  /**
   * Get current onboarding step for user
   */
  async getCurrentStep(userId: string): Promise<AssistantResponse | null> {
    try {
      const progress = this.userProgress.get(userId);
      if (!progress || !progress.currentStep) {
        return null;
      }

      const step = this.findStepById(progress.currentStep);
      if (!step) {
        return null;
      }

      const userContext = await UserContextManager.getInstance().getUserContext(userId);
      return await this.generateStepResponse(step, progress, userContext);
    } catch (error) {
      console.error('Error getting current step:', error);
      return null;
    }
  }

  /**
   * Complete current step and move to next
   */
  async completeStep(
    userId: string,
    stepId: string,
    interaction?: Partial<OnboardingInteraction>
  ): Promise<AssistantResponse | null> {
    try {
      const progress = this.userProgress.get(userId);
      if (!progress) {
        return null;
      }

      // Record interaction
      if (interaction) {
        const fullInteraction: OnboardingInteraction = {
          stepId,
          action: interaction.action || 'complete',
          timestamp: new Date(),
          elementId: interaction.elementId,
          success: interaction.success !== false,
          timeToComplete: interaction.timeToComplete
        };
        progress.interactions.push(fullInteraction);
      }

      // Mark step as completed
      if (!progress.completedSteps.includes(stepId)) {
        progress.completedSteps.push(stepId);
      }

      // Update progress
      progress.completionPercentage = (progress.completedSteps.length / progress.totalSteps) * 100;
      progress.lastActivity = new Date();
      progress.timeSpent = Math.floor((progress.lastActivity.getTime() - progress.startedAt.getTime()) / 1000);

      // Notify completion callbacks
      this.notifyStepCompletion(stepId, userId);

      // Find next step
      const nextStep = this.getNextStep(stepId, progress);
      
      if (nextStep) {
        progress.currentStep = nextStep.id;
        this.saveUserProgress();
        
        const userContext = await UserContextManager.getInstance().getUserContext(userId);
        return await this.generateStepResponse(nextStep, progress, userContext);
      } else {
        // Onboarding completed
        return await this.completeOnboarding(userId, progress);
      }
    } catch (error) {
      console.error('Error completing step:', error);
      return null;
    }
  }

  /**
   * Skip current step
   */
  async skipStep(userId: string, stepId: string): Promise<AssistantResponse | null> {
    try {
      const progress = this.userProgress.get(userId);
      if (!progress) {
        return null;
      }

      // Mark step as skipped
      if (!progress.skippedSteps.includes(stepId)) {
        progress.skippedSteps.push(stepId);
      }

      // Record interaction
      const interaction: OnboardingInteraction = {
        stepId,
        action: 'skip',
        timestamp: new Date(),
        success: true
      };
      progress.interactions.push(interaction);

      // Find next step
      const nextStep = this.getNextStep(stepId, progress);
      
      if (nextStep) {
        progress.currentStep = nextStep.id;
        progress.lastActivity = new Date();
        this.saveUserProgress();
        
        const userContext = await UserContextManager.getInstance().getUserContext(userId);
        return await this.generateStepResponse(nextStep, progress, userContext);
      } else {
        // Onboarding completed
        return await this.completeOnboarding(userId, progress);
      }
    } catch (error) {
      console.error('Error skipping step:', error);
      return null;
    }
  }

  /**
   * Get onboarding progress for user
   */
  getProgress(userId: string): OnboardingProgress | null {
    return this.userProgress.get(userId) || null;
  }

  /**
   * Check if user needs onboarding
   */
  needsOnboarding(userId: string, context?: UserContext): boolean {
    const progress = this.userProgress.get(userId);
    
    // No progress means needs onboarding
    if (!progress) {
      return true;
    }

    // Already completed
    if (progress.completedAt) {
      return false;
    }

    // Check if user has been inactive for too long (7 days)
    const daysSinceLastActivity = Math.floor(
      (Date.now() - progress.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastActivity > 7) {
      return true;
    }

    // Check completion percentage
    return progress.completionPercentage < 80;
  }

  /**
   * Get onboarding suggestions based on user context
   */
  getOnboardingSuggestions(context: UserContext): QuickAction[] {
    const suggestions: QuickAction[] = [];
    const progress = this.userProgress.get(context.userId);

    if (!progress || progress.completionPercentage < 100) {
      suggestions.push({
        id: 'start-onboarding',
        label: progress ? 'Continue Tour' : 'Start Tour',
        action: 'navigate',
        parameters: { action: 'start-onboarding' },
        icon: 'tour'
      });
    }

    // Suggest specific features based on profile
    if (context.businessProfile.experienceLevel === 'beginner') {
      suggestions.push({
        id: 'basic-features-tour',
        label: 'Learn Basics',
        action: 'navigate',
        parameters: { action: 'basic-tour' },
        icon: 'school'
      });
    }

    return suggestions;
  }

  /**
   * Generate help tooltip for specific element
   */
  generateHelpTooltip(
    elementId: string,
    context: UserContext
  ): {
    title: string;
    content: string;
    actions?: QuickAction[];
  } | null {
    const tooltips: Record<string, any> = {
      'buyer-search-button': {
        title: 'Find Buyers',
        content: 'Use this tool to discover potential buyers for your products in target markets.',
        actions: [
          {
            id: 'demo-buyer-search',
            label: 'Try Demo',
            action: 'navigate',
            parameters: { page: 'buyer-discovery', demo: true },
            icon: 'play'
          }
        ]
      },
      'market-research-card': {
        title: 'Market Research',
        content: 'Access comprehensive market data and analysis to identify opportunities.',
        actions: [
          {
            id: 'view-sample-research',
            label: 'View Sample',
            action: 'navigate',
            parameters: { page: 'market-research', sample: true },
            icon: 'visibility'
          }
        ]
      },
      'quotation-tool': {
        title: 'Quotation Tool',
        content: 'Create professional export quotations with accurate pricing and terms.',
        actions: [
          {
            id: 'create-sample-quote',
            label: 'Create Sample',
            action: 'navigate',
            parameters: { page: 'quotation', template: 'sample' },
            icon: 'add'
          }
        ]
      }
    };

    return tooltips[elementId] || null;
  }

  /**
   * Register step completion callback
   */
  onStepCompletion(stepId: string, callback: (stepId: string, userId: string) => void): void {
    if (!this.stepCompletionCallbacks.has(stepId)) {
      this.stepCompletionCallbacks.set(stepId, []);
    }
    this.stepCompletionCallbacks.get(stepId)!.push(callback);
  }

  /**
   * Get onboarding analytics
   */
  getAnalytics(): {
    totalUsers: number;
    completionRate: number;
    averageTimeToComplete: number;
    mostSkippedSteps: Array<{ stepId: string; skipCount: number }>;
    commonDropOffPoints: Array<{ stepId: string; dropOffCount: number }>;
  } {
    const allProgress = Array.from(this.userProgress.values());
    
    const totalUsers = allProgress.length;
    const completedUsers = allProgress.filter(p => p.completedAt).length;
    const completionRate = totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0;
    
    const completedTimes = allProgress
      .filter(p => p.completedAt)
      .map(p => p.timeSpent);
    const averageTimeToComplete = completedTimes.length > 0 
      ? completedTimes.reduce((sum, time) => sum + time, 0) / completedTimes.length 
      : 0;

    // Calculate most skipped steps
    const skipCounts = new Map<string, number>();
    allProgress.forEach(progress => {
      progress.skippedSteps.forEach(stepId => {
        skipCounts.set(stepId, (skipCounts.get(stepId) || 0) + 1);
      });
    });

    const mostSkippedSteps = Array.from(skipCounts.entries())
      .map(([stepId, skipCount]) => ({ stepId, skipCount }))
      .sort((a, b) => b.skipCount - a.skipCount)
      .slice(0, 5);

    // Calculate drop-off points (users who stopped at a step)
    const dropOffCounts = new Map<string, number>();
    allProgress
      .filter(p => !p.completedAt && p.currentStep)
      .forEach(progress => {
        if (progress.currentStep) {
          dropOffCounts.set(progress.currentStep, (dropOffCounts.get(progress.currentStep) || 0) + 1);
        }
      });

    const commonDropOffPoints = Array.from(dropOffCounts.entries())
      .map(([stepId, dropOffCount]) => ({ stepId, dropOffCount }))
      .sort((a, b) => b.dropOffCount - a.dropOffCount)
      .slice(0, 5);

    return {
      totalUsers,
      completionRate,
      averageTimeToComplete,
      mostSkippedSteps,
      commonDropOffPoints
    };
  }

  // Private helper methods

  private initializeOnboardingFlows(): void {
    const defaultFlow: OnboardingFlow = {
      id: 'default',
      name: 'ExportGuide Platform Tour',
      description: 'Complete introduction to ExportGuide features and tools',
      estimatedDuration: 15,
      targetAudience: 'all',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to ExportGuide',
          description: 'Introduction to the platform',
          page: 'dashboard',
          content: {
            message: "Welcome to ExportGuide! I'm your AI assistant, and I'll help you discover all the powerful tools available to grow your export business. Let's start with a quick tour!",
            tips: [
              "This tour will take about 15 minutes",
              "You can skip any step or pause anytime",
              "I'll be here to help throughout your journey"
            ],
            actions: [
              {
                id: 'start-tour',
                label: 'Start Tour',
                action: 'navigate',
                parameters: { action: 'next-step' },
                icon: 'play'
              },
              {
                id: 'skip-tour',
                label: 'Skip Tour',
                action: 'navigate',
                parameters: { action: 'skip-onboarding' },
                icon: 'skip_next'
              }
            ]
          },
          completionCriteria: {
            type: 'interaction',
            target: 'start-tour'
          }
        },
        {
          id: 'profile-setup',
          title: 'Set Up Your Business Profile',
          description: 'Tell us about your business for personalized recommendations',
          page: 'dashboard',
          targetElement: 'profile-section',
          content: {
            message: "Let's start by setting up your business profile. This helps me provide personalized recommendations and relevant market data for your industry and target markets.",
            tips: [
              "Complete profiles get better recommendations",
              "You can update this information anytime",
              "All information is kept secure and private"
            ],
            actions: [
              {
                id: 'setup-profile',
                label: 'Setup Profile',
                action: 'navigate',
                parameters: { page: 'profile-setup' },
                icon: 'person'
              },
              {
                id: 'skip-profile',
                label: 'Skip for Now',
                action: 'navigate',
                parameters: { action: 'skip-step' },
                icon: 'skip_next'
              }
            ]
          },
          completionCriteria: {
            type: 'form_completion',
            formFields: ['industry', 'businessSize', 'targetMarkets']
          },
          optional: true
        },
        {
          id: 'buyer-discovery',
          title: 'Discover Potential Buyers',
          description: 'Learn how to find and connect with buyers',
          page: 'buyer-discovery',
          targetElement: 'search-filters',
          content: {
            message: "The Buyer Discovery tool helps you find potential customers for your products. You can search by country, industry, company size, and more to find the perfect matches.",
            tips: [
              "Use specific filters for better results",
              "Save interesting companies for follow-up",
              "Export contact lists for your sales team"
            ],
            actions: [
              {
                id: 'try-buyer-search',
                label: 'Try Search',
                action: 'navigate',
                parameters: { page: 'buyer-discovery', demo: true },
                icon: 'search'
              },
              {
                id: 'next-feature',
                label: 'Next Feature',
                action: 'navigate',
                parameters: { action: 'next-step' },
                icon: 'arrow_forward'
              }
            ]
          },
          completionCriteria: {
            type: 'interaction',
            target: 'search-button'
          }
        },
        {
          id: 'market-research',
          title: 'Market Research & Analysis',
          description: 'Access comprehensive market data',
          page: 'market-research',
          targetElement: 'research-tools',
          content: {
            message: "Our Market Research tool provides real-time data from World Bank and other sources. Analyze market opportunities, growth trends, and competition in your target countries.",
            tips: [
              "Data is updated regularly from official sources",
              "Compare multiple markets side by side",
              "Export reports for presentations"
            ],
            actions: [
              {
                id: 'explore-data',
                label: 'Explore Data',
                action: 'navigate',
                parameters: { page: 'market-research', sample: true },
                icon: 'analytics'
              },
              {
                id: 'next-feature',
                label: 'Next Feature',
                action: 'navigate',
                parameters: { action: 'next-step' },
                icon: 'arrow_forward'
              }
            ]
          },
          completionCriteria: {
            type: 'navigation',
            target: 'market-research'
          }
        },
        {
          id: 'quotation-tool',
          title: 'Professional Quotations',
          description: 'Create accurate export quotations',
          page: 'quotation',
          targetElement: 'quotation-form',
          content: {
            message: "The Quotation tool helps you create professional quotes with accurate pricing, shipping costs, and terms. Choose from templates or create custom quotations.",
            tips: [
              "Include all costs for accurate pricing",
              "Use Incoterms for clear responsibilities",
              "Save templates for repeat customers"
            ],
            actions: [
              {
                id: 'create-sample-quote',
                label: 'Create Sample',
                action: 'navigate',
                parameters: { page: 'quotation', template: 'sample' },
                icon: 'receipt'
              },
              {
                id: 'next-feature',
                label: 'Next Feature',
                action: 'navigate',
                parameters: { action: 'next-step' },
                icon: 'arrow_forward'
              }
            ]
          },
          completionCriteria: {
            type: 'interaction',
            target: 'create-quotation'
          }
        },
        {
          id: 'compliance-help',
          title: 'Export Compliance',
          description: 'Understand regulatory requirements',
          page: 'compliance',
          targetElement: 'compliance-checker',
          content: {
            message: "Export compliance is crucial for successful international trade. Our compliance tool helps you understand documentation requirements, regulations, and certification needs.",
            tips: [
              "Requirements vary by country and product",
              "Keep documentation organized",
              "Check for updates regularly"
            ],
            actions: [
              {
                id: 'check-compliance',
                label: 'Check Requirements',
                action: 'navigate',
                parameters: { page: 'compliance', demo: true },
                icon: 'verified'
              },
              {
                id: 'next-feature',
                label: 'Next Feature',
                action: 'navigate',
                parameters: { action: 'next-step' },
                icon: 'arrow_forward'
              }
            ]
          },
          completionCriteria: {
            type: 'navigation',
            target: 'compliance'
          }
        },
        {
          id: 'ai-assistant',
          title: 'Your AI Assistant',
          description: 'Learn how to use the AI assistant effectively',
          page: 'dashboard',
          targetElement: 'chat-widget',
          content: {
            message: "I'm your AI assistant, always here to help! You can ask me questions about exports, get recommendations, or navigate to specific features. Just type naturally - I understand context and can help with complex queries.",
            tips: [
              "Ask questions in natural language",
              "I can help with navigation and recommendations",
              "I learn from your interactions to provide better help"
            ],
            actions: [
              {
                id: 'try-assistant',
                label: 'Ask Me Something',
                action: 'navigate',
                parameters: { action: 'open-chat' },
                icon: 'chat'
              },
              {
                id: 'finish-tour',
                label: 'Finish Tour',
                action: 'navigate',
                parameters: { action: 'complete-onboarding' },
                icon: 'check'
              }
            ]
          },
          completionCriteria: {
            type: 'interaction',
            target: 'chat-input'
          }
        }
      ]
    };

    this.onboardingFlows.set('default', defaultFlow);

    // Beginner-specific flow
    const beginnerFlow: OnboardingFlow = {
      id: 'beginner',
      name: 'Export Basics Tour',
      description: 'Essential features for export beginners',
      estimatedDuration: 10,
      targetAudience: 'beginner',
      steps: defaultFlow.steps.filter(step => 
        ['welcome', 'profile-setup', 'market-research', 'compliance-help', 'ai-assistant'].includes(step.id)
      )
    };

    this.onboardingFlows.set('beginner', beginnerFlow);
  }

  private async generateStepResponse(
    step: OnboardingStep,
    progress: OnboardingProgress,
    context?: UserContext
  ): Promise<AssistantResponse> {
    const navigationService = NavigationIntegrationService.getInstance();
    
    // Create navigation action if needed
    let navigationSuggestion;
    if (step.page !== context?.currentSession.currentPage) {
      navigationSuggestion = navigationService.createDeepLink(step.page, {
        onboarding: true,
        step: step.id
      });
    }

    return {
      id: AssistantUtils.generateId(),
      text: `**${step.title}** (Step ${progress.completedSteps.length + 1} of ${progress.totalSteps})\n\n${step.content.message}`,
      quickActions: step.content.actions,
      navigationSuggestion,
      followUpQuestions: step.content.tips,
      timestamp: new Date()
    };
  }

  private findStepById(stepId: string): OnboardingStep | null {
    for (const flow of Array.from(this.onboardingFlows.values())) {
      const step = flow.steps.find((s: OnboardingStep) => s.id === stepId);
      if (step) return step;
    }
    return null;
  }

  private getNextStep(currentStepId: string, progress: OnboardingProgress): OnboardingStep | null {
    for (const flow of Array.from(this.onboardingFlows.values())) {
      const currentIndex = flow.steps.findIndex((s: OnboardingStep) => s.id === currentStepId);
      if (currentIndex !== -1 && currentIndex < flow.steps.length - 1) {
        return flow.steps[currentIndex + 1];
      }
    }
    return null;
  }

  private async completeOnboarding(userId: string, progress: OnboardingProgress): Promise<AssistantResponse> {
    progress.completedAt = new Date();
    progress.currentStep = null;
    progress.completionPercentage = 100;
    progress.timeSpent = Math.floor((progress.completedAt.getTime() - progress.startedAt.getTime()) / 1000);
    
    this.saveUserProgress();

    // Update user context to mark onboarding as completed
    const userContextManager = UserContextManager.getInstance();
    await userContextManager.updateUserContext(userId, {
      currentSession: {
        currentPage: 'dashboard',
        sessionStartTime: new Date(),
        lastActivity: new Date(),
        pagesVisited: ['onboarding'],
        searchQueries: [],
        actionsPerformed: ['onboarding_completed']
      }
    });

    return {
      id: AssistantUtils.generateId(),
      text: "🎉 Congratulations! You've completed the ExportGuide tour. You're now ready to start growing your export business with our powerful tools. I'm always here if you need help!",
      quickActions: [
        {
          id: 'start-exploring',
          label: 'Start Exploring',
          action: 'navigate',
          parameters: { page: 'dashboard' },
          icon: 'explore'
        },
        {
          id: 'find-buyers',
          label: 'Find Buyers',
          action: 'navigate',
          parameters: { page: 'buyer-discovery' },
          icon: 'search'
        },
        {
          id: 'research-markets',
          label: 'Research Markets',
          action: 'navigate',
          parameters: { page: 'market-research' },
          icon: 'analytics'
        }
      ],
      followUpQuestions: [
        "What would you like to explore first?",
        "Do you have specific markets in mind?",
        "Would you like help setting up your first search?"
      ],
      timestamp: new Date()
    };
  }

  private notifyStepCompletion(stepId: string, userId: string): void {
    const callbacks = this.stepCompletionCallbacks.get(stepId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(stepId, userId);
        } catch (error) {
          console.error('Error in step completion callback:', error);
        }
      });
    }
  }

  private loadUserProgress(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([userId, progress]: [string, any]) => {
          // Convert date strings back to Date objects
          progress.startedAt = new Date(progress.startedAt);
          progress.lastActivity = new Date(progress.lastActivity);
          if (progress.completedAt) {
            progress.completedAt = new Date(progress.completedAt);
          }
          progress.interactions.forEach((interaction: any) => {
            interaction.timestamp = new Date(interaction.timestamp);
          });
          
          this.userProgress.set(userId, progress);
        });
      }
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
    }
  }

  private saveUserProgress(): void {
    try {
      const data = Object.fromEntries(this.userProgress.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving onboarding progress:', error);
    }
  }
}

export default OnboardingAssistantService;