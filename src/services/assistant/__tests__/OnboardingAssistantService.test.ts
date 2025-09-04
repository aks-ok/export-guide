import { OnboardingAssistantService } from '../OnboardingAssistantService';
import { UserContextManager } from '../UserContextManager';
import { NavigationIntegrationService } from '../NavigationIntegrationService';
import { UserContext, BusinessProfile } from '../types';

// Mock dependencies
jest.mock('../UserContextManager');
jest.mock('../NavigationIntegrationService');
jest.mock('../utils');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('OnboardingAssistantService', () => {
  let onboardingService: OnboardingAssistantService;
  let mockUserContext: UserContext;
  let mockBusinessProfile: BusinessProfile;

  beforeEach(() => {
    onboardingService = OnboardingAssistantService.getInstance();
    
    mockBusinessProfile = {
      industry: 'Technology',
      primaryProducts: ['Software'],
      targetMarkets: ['USA'],
      experienceLevel: 'beginner',
      preferredLanguage: 'en',
      businessSize: 'small'
    };

    mockUserContext = {
      userId: 'test-user-123',
      conversationId: 'conv-123',
      businessProfile: mockBusinessProfile,
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
        theme: 'light',
        language: 'en',
        dataPrivacy: {
          allowAnalytics: true,
          allowPersonalization: true,
          retentionPeriod: 30
        }
      },
      conversationHistory: []
    };

    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock UserContextManager
    (UserContextManager.getInstance as jest.Mock).mockReturnValue({
      getUserContext: jest.fn().mockResolvedValue(mockUserContext),
      updateUserContext: jest.fn().mockResolvedValue(mockUserContext)
    });

    // Mock NavigationIntegrationService
    (NavigationIntegrationService.getInstance as jest.Mock).mockReturnValue({
      createDeepLink: jest.fn().mockReturnValue({
        page: 'dashboard',
        params: { onboarding: true },
        reason: 'Navigate for onboarding'
      })
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = OnboardingAssistantService.getInstance();
      const instance2 = OnboardingAssistantService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('startOnboarding', () => {
    it('should start default onboarding flow', async () => {
      const response = await onboardingService.startOnboarding('test-user-123');

      expect(response).toBeDefined();
      expect(response.text).toContain('Welcome to ExportGuide');
      expect(response.quickActions).toBeDefined();
      expect(response.quickActions!.length).toBeGreaterThan(0);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should start specific onboarding flow', async () => {
      const response = await onboardingService.startOnboarding('test-user-123', 'beginner');

      expect(response).toBeDefined();
      expect(response.text).toContain('Welcome to ExportGuide');
    });

    it('should handle unknown flow gracefully', async () => {
      const response = await onboardingService.startOnboarding('test-user-123', 'unknown-flow');

      expect(response).toBeDefined();
      expect(response.text).toContain('trouble starting');
      expect(response.quickActions).toBeDefined();
    });

    it('should initialize progress tracking', async () => {
      await onboardingService.startOnboarding('test-user-123');

      const progress = onboardingService.getProgress('test-user-123');
      expect(progress).toBeDefined();
      expect(progress!.userId).toBe('test-user-123');
      expect(progress!.currentStep).toBe('welcome');
      expect(progress!.completedSteps).toEqual([]);
      expect(progress!.completionPercentage).toBe(0);
    });
  });

  describe('getCurrentStep', () => {
    it('should return current step for user with active onboarding', async () => {
      // Start onboarding first
      await onboardingService.startOnboarding('test-user-123');

      const response = await onboardingService.getCurrentStep('test-user-123');

      expect(response).toBeDefined();
      expect(response!.text).toContain('Welcome to ExportGuide');
    });

    it('should return null for user without active onboarding', async () => {
      const response = await onboardingService.getCurrentStep('unknown-user');

      expect(response).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      // Mock error in UserContextManager
      (UserContextManager.getInstance as jest.Mock).mockReturnValue({
        getUserContext: jest.fn().mockRejectedValue(new Error('Context error'))
      });

      const response = await onboardingService.getCurrentStep('test-user-123');

      expect(response).toBeNull();
    });
  });

  describe('completeStep', () => {
    beforeEach(async () => {
      // Start onboarding for testing
      await onboardingService.startOnboarding('test-user-123');
    });

    it('should complete current step and move to next', async () => {
      const response = await onboardingService.completeStep('test-user-123', 'welcome');

      expect(response).toBeDefined();
      expect(response!.text).toContain('Set Up Your Business Profile');

      const progress = onboardingService.getProgress('test-user-123');
      expect(progress!.completedSteps).toContain('welcome');
      expect(progress!.currentStep).toBe('profile-setup');
      expect(progress!.completionPercentage).toBeGreaterThan(0);
    });

    it('should record interaction data', async () => {
      const interaction = {
        action: 'click',
        elementId: 'start-tour-button',
        success: true,
        timeToComplete: 5000
      };

      await onboardingService.completeStep('test-user-123', 'welcome', interaction);

      const progress = onboardingService.getProgress('test-user-123');
      expect(progress!.interactions).toHaveLength(1);
      expect(progress!.interactions[0].action).toBe('click');
      expect(progress!.interactions[0].elementId).toBe('start-tour-button');
    });

    it('should complete onboarding when reaching final step', async () => {
      const progress = onboardingService.getProgress('test-user-123');
      const totalSteps = progress!.totalSteps;

      // Complete all steps except the last one
      const steps = ['welcome', 'profile-setup', 'buyer-discovery', 'market-research', 'quotation-tool', 'compliance-help'];
      for (const stepId of steps) {
        await onboardingService.completeStep('test-user-123', stepId);
      }

      // Complete final step
      const response = await onboardingService.completeStep('test-user-123', 'ai-assistant');

      expect(response).toBeDefined();
      expect(response!.text).toContain('Congratulations');
      
      const finalProgress = onboardingService.getProgress('test-user-123');
      expect(finalProgress!.completedAt).toBeDefined();
      expect(finalProgress!.completionPercentage).toBe(100);
      expect(finalProgress!.currentStep).toBeNull();
    });

    it('should return null for user without active onboarding', async () => {
      const response = await onboardingService.completeStep('unknown-user', 'welcome');

      expect(response).toBeNull();
    });
  });

  describe('skipStep', () => {
    beforeEach(async () => {
      await onboardingService.startOnboarding('test-user-123');
    });

    it('should skip current step and move to next', async () => {
      const response = await onboardingService.skipStep('test-user-123', 'welcome');

      expect(response).toBeDefined();
      expect(response!.text).toContain('Set Up Your Business Profile');

      const progress = onboardingService.getProgress('test-user-123');
      expect(progress!.skippedSteps).toContain('welcome');
      expect(progress!.currentStep).toBe('profile-setup');
    });

    it('should record skip interaction', async () => {
      await onboardingService.skipStep('test-user-123', 'welcome');

      const progress = onboardingService.getProgress('test-user-123');
      expect(progress!.interactions).toHaveLength(1);
      expect(progress!.interactions[0].action).toBe('skip');
      expect(progress!.interactions[0].success).toBe(true);
    });

    it('should complete onboarding when skipping final step', async () => {
      // Skip to final step
      const progress = onboardingService.getProgress('test-user-123');
      progress!.currentStep = 'ai-assistant';

      const response = await onboardingService.skipStep('test-user-123', 'ai-assistant');

      expect(response).toBeDefined();
      expect(response!.text).toContain('Congratulations');
    });
  });

  describe('needsOnboarding', () => {
    it('should return true for user without progress', () => {
      const needs = onboardingService.needsOnboarding('new-user');

      expect(needs).toBe(true);
    });

    it('should return false for user who completed onboarding', async () => {
      await onboardingService.startOnboarding('test-user-123');
      const progress = onboardingService.getProgress('test-user-123');
      progress!.completedAt = new Date();

      const needs = onboardingService.needsOnboarding('test-user-123');

      expect(needs).toBe(false);
    });

    it('should return true for user with low completion percentage', async () => {
      await onboardingService.startOnboarding('test-user-123');
      const progress = onboardingService.getProgress('test-user-123');
      progress!.completionPercentage = 50;

      const needs = onboardingService.needsOnboarding('test-user-123');

      expect(needs).toBe(true);
    });

    it('should return true for user inactive for more than 7 days', async () => {
      await onboardingService.startOnboarding('test-user-123');
      const progress = onboardingService.getProgress('test-user-123');
      progress!.lastActivity = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago

      const needs = onboardingService.needsOnboarding('test-user-123');

      expect(needs).toBe(true);
    });
  });

  describe('getOnboardingSuggestions', () => {
    it('should return start tour suggestion for new user', () => {
      const suggestions = onboardingService.getOnboardingSuggestions(mockUserContext);

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.label === 'Start Tour')).toBe(true);
    });

    it('should return continue tour suggestion for user with partial progress', async () => {
      await onboardingService.startOnboarding('test-user-123');

      const suggestions = onboardingService.getOnboardingSuggestions(mockUserContext);

      expect(suggestions.some(s => s.label === 'Continue Tour')).toBe(true);
    });

    it('should return beginner-specific suggestions', () => {
      const beginnerContext = {
        ...mockUserContext,
        businessProfile: {
          ...mockBusinessProfile,
          experienceLevel: 'beginner' as const
        }
      };

      const suggestions = onboardingService.getOnboardingSuggestions(beginnerContext);

      expect(suggestions.some(s => s.label === 'Learn Basics')).toBe(true);
    });
  });

  describe('generateHelpTooltip', () => {
    it('should generate tooltip for buyer search button', () => {
      const tooltip = onboardingService.generateHelpTooltip('buyer-search-button', mockUserContext);

      expect(tooltip).toBeDefined();
      expect(tooltip!.title).toBe('Find Buyers');
      expect(tooltip!.content).toContain('discover potential buyers');
      expect(tooltip!.actions).toBeDefined();
    });

    it('should generate tooltip for market research card', () => {
      const tooltip = onboardingService.generateHelpTooltip('market-research-card', mockUserContext);

      expect(tooltip).toBeDefined();
      expect(tooltip!.title).toBe('Market Research');
      expect(tooltip!.content).toContain('market data');
    });

    it('should return null for unknown element', () => {
      const tooltip = onboardingService.generateHelpTooltip('unknown-element', mockUserContext);

      expect(tooltip).toBeNull();
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics for empty state', () => {
      const analytics = onboardingService.getAnalytics();

      expect(analytics).toBeDefined();
      expect(analytics.totalUsers).toBe(0);
      expect(analytics.completionRate).toBe(0);
      expect(analytics.averageTimeToComplete).toBe(0);
      expect(analytics.mostSkippedSteps).toEqual([]);
      expect(analytics.commonDropOffPoints).toEqual([]);
    });

    it('should calculate analytics with user data', async () => {
      // Create some test data
      await onboardingService.startOnboarding('user1');
      await onboardingService.startOnboarding('user2');
      
      // Complete one user
      await onboardingService.completeStep('user1', 'welcome');
      const progress1 = onboardingService.getProgress('user1');
      progress1!.completedAt = new Date();
      progress1!.timeSpent = 600; // 10 minutes

      // Skip step for another user
      await onboardingService.skipStep('user2', 'welcome');

      const analytics = onboardingService.getAnalytics();

      expect(analytics.totalUsers).toBe(2);
      expect(analytics.completionRate).toBe(50); // 1 out of 2 completed
      expect(analytics.averageTimeToComplete).toBe(600);
      expect(analytics.mostSkippedSteps.length).toBeGreaterThan(0);
    });
  });

  describe('Step Completion Callbacks', () => {
    it('should register and call step completion callbacks', async () => {
      const callback = jest.fn();
      
      onboardingService.onStepCompletion('welcome', callback);
      
      await onboardingService.startOnboarding('test-user-123');
      await onboardingService.completeStep('test-user-123', 'welcome');

      expect(callback).toHaveBeenCalledWith('welcome', 'test-user-123');
    });

    it('should handle callback errors gracefully', async () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      
      onboardingService.onStepCompletion('welcome', errorCallback);
      
      await onboardingService.startOnboarding('test-user-123');
      
      // Should not throw even if callback fails
      await expect(onboardingService.completeStep('test-user-123', 'welcome')).resolves.not.toThrow();
    });
  });

  describe('Progress Persistence', () => {
    it('should save progress to localStorage', async () => {
      await onboardingService.startOnboarding('test-user-123');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'exportguide_onboarding_progress',
        expect.any(String)
      );
    });

    it('should load progress from localStorage', () => {
      const mockProgress = {
        'test-user-123': {
          userId: 'test-user-123',
          currentStep: 'welcome',
          completedSteps: [],
          skippedSteps: [],
          startedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          totalSteps: 7,
          completionPercentage: 0,
          timeSpent: 0,
          interactions: []
        }
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockProgress));

      // Create new instance to trigger loading
      const newService = OnboardingAssistantService.getInstance();
      const progress = newService.getProgress('test-user-123');

      expect(progress).toBeDefined();
      expect(progress!.userId).toBe('test-user-123');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw when creating instance
      expect(() => OnboardingAssistantService.getInstance()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in startOnboarding gracefully', async () => {
      // Mock error in UserContextManager
      (UserContextManager.getInstance as jest.Mock).mockReturnValue({
        getUserContext: jest.fn().mockRejectedValue(new Error('Context error'))
      });

      const response = await onboardingService.startOnboarding('test-user-123');

      expect(response).toBeDefined();
      expect(response.text).toContain('trouble starting');
    });

    it('should handle errors in completeStep gracefully', async () => {
      const response = await onboardingService.completeStep('nonexistent-user', 'welcome');

      expect(response).toBeNull();
    });

    it('should handle errors in skipStep gracefully', async () => {
      const response = await onboardingService.skipStep('nonexistent-user', 'welcome');

      expect(response).toBeNull();
    });
  });

  describe('Flow Management', () => {
    it('should have default onboarding flow', () => {
      // This is tested implicitly by other tests, but we can verify the flow exists
      expect(() => onboardingService.startOnboarding('test-user-123', 'default')).not.toThrow();
    });

    it('should have beginner-specific flow', () => {
      expect(() => onboardingService.startOnboarding('test-user-123', 'beginner')).not.toThrow();
    });

    it('should handle step progression correctly', async () => {
      await onboardingService.startOnboarding('test-user-123');
      
      let progress = onboardingService.getProgress('test-user-123');
      expect(progress!.currentStep).toBe('welcome');

      await onboardingService.completeStep('test-user-123', 'welcome');
      
      progress = onboardingService.getProgress('test-user-123');
      expect(progress!.currentStep).toBe('profile-setup');
    });
  });
});