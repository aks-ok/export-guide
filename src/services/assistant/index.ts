// Export all assistant-related types and utilities
export * from './types';
export * from './validation';
export * from './storage';
export * from './utils';
export * from './MessageHandler';
export * from './IntentRecognizer';
export * from './ResponseGenerator';
export * from './AssistantDataService';
export * from './UserContextManager';
export * from './NavigationIntegrationService';
export * from './OnboardingAssistantService';
export * from './RealTimeDataService';
export * from './ConversationAnalyticsService';
export * from './PersonalizationService';

// Re-export commonly used classes for convenience
export { AssistantValidator } from './validation';
export { ConversationStorageManager } from './storage';
export { AssistantUtils } from './utils';
export { MessageHandler } from './MessageHandler';
export { IntentRecognizer } from './IntentRecognizer';
export { ResponseGenerator } from './ResponseGenerator';
export { AssistantDataService } from './AssistantDataService';
export { UserContextManager } from './UserContextManager';
export { NavigationIntegrationService } from './NavigationIntegrationService';
export { OnboardingAssistantService } from './OnboardingAssistantService';
export { RealTimeDataService } from './RealTimeDataService';
export { ConversationAnalyticsService } from './ConversationAnalyticsService';
export { PersonalizationService } from './PersonalizationService';