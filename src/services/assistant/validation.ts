import { 
  ConversationMessage, 
  AssistantResponse, 
  UserContext, 
  BusinessProfile,
  ValidationResult,
  ValidationError 
} from './types';

/**
 * Validation utilities for assistant data models
 */
export class AssistantValidator {
  
  /**
   * Validates a conversation message
   */
  static validateMessage(message: Partial<ConversationMessage>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!message.id || typeof message.id !== 'string') {
      errors.push({
        field: 'id',
        message: 'Message ID is required and must be a string',
        code: 'INVALID_ID'
      });
    }

    if (!message.userId || typeof message.userId !== 'string') {
      errors.push({
        field: 'userId',
        message: 'User ID is required and must be a string',
        code: 'INVALID_USER_ID'
      });
    }

    if (!message.conversationId || typeof message.conversationId !== 'string') {
      errors.push({
        field: 'conversationId',
        message: 'Conversation ID is required and must be a string',
        code: 'INVALID_CONVERSATION_ID'
      });
    }

    if (!message.content || typeof message.content !== 'string' || message.content.trim().length === 0) {
      errors.push({
        field: 'content',
        message: 'Message content is required and cannot be empty',
        code: 'INVALID_CONTENT'
      });
    }

    if (message.content && message.content.length > 5000) {
      errors.push({
        field: 'content',
        message: 'Message content cannot exceed 5000 characters',
        code: 'CONTENT_TOO_LONG'
      });
    }

    if (!message.type || !['user', 'assistant'].includes(message.type)) {
      errors.push({
        field: 'type',
        message: 'Message type must be either "user" or "assistant"',
        code: 'INVALID_TYPE'
      });
    }

    if (!message.timestamp || !(message.timestamp instanceof Date)) {
      errors.push({
        field: 'timestamp',
        message: 'Timestamp is required and must be a valid Date',
        code: 'INVALID_TIMESTAMP'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates an assistant response
   */
  static validateResponse(response: Partial<AssistantResponse>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!response.id || typeof response.id !== 'string') {
      errors.push({
        field: 'id',
        message: 'Response ID is required and must be a string',
        code: 'INVALID_ID'
      });
    }

    if (!response.text || typeof response.text !== 'string' || response.text.trim().length === 0) {
      errors.push({
        field: 'text',
        message: 'Response text is required and cannot be empty',
        code: 'INVALID_TEXT'
      });
    }

    if (!response.timestamp || !(response.timestamp instanceof Date)) {
      errors.push({
        field: 'timestamp',
        message: 'Timestamp is required and must be a valid Date',
        code: 'INVALID_TIMESTAMP'
      });
    }

    // Validate quick actions if present
    if (response.quickActions) {
      response.quickActions.forEach((action, index) => {
        if (!action.id || !action.label || !action.action) {
          errors.push({
            field: `quickActions[${index}]`,
            message: 'Quick action must have id, label, and action',
            code: 'INVALID_QUICK_ACTION'
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates user context
   */
  static validateUserContext(context: Partial<UserContext>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!context.userId || typeof context.userId !== 'string') {
      errors.push({
        field: 'userId',
        message: 'User ID is required and must be a string',
        code: 'INVALID_USER_ID'
      });
    }

    if (!context.conversationId || typeof context.conversationId !== 'string') {
      errors.push({
        field: 'conversationId',
        message: 'Conversation ID is required and must be a string',
        code: 'INVALID_CONVERSATION_ID'
      });
    }

    // Validate business profile
    if (context.businessProfile) {
      const profileValidation = this.validateBusinessProfile(context.businessProfile);
      if (!profileValidation.isValid) {
        errors.push(...profileValidation.errors.map(error => ({
          ...error,
          field: `businessProfile.${error.field}`
        })));
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates business profile
   */
  static validateBusinessProfile(profile: Partial<BusinessProfile>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!profile.industry || typeof profile.industry !== 'string') {
      errors.push({
        field: 'industry',
        message: 'Industry is required and must be a string',
        code: 'INVALID_INDUSTRY'
      });
    }

    if (!profile.experienceLevel || !['beginner', 'intermediate', 'advanced'].includes(profile.experienceLevel)) {
      errors.push({
        field: 'experienceLevel',
        message: 'Experience level must be beginner, intermediate, or advanced',
        code: 'INVALID_EXPERIENCE_LEVEL'
      });
    }

    if (!profile.businessSize || !['small', 'medium', 'large'].includes(profile.businessSize)) {
      errors.push({
        field: 'businessSize',
        message: 'Business size must be small, medium, or large',
        code: 'INVALID_BUSINESS_SIZE'
      });
    }

    if (!profile.preferredLanguage || typeof profile.preferredLanguage !== 'string') {
      errors.push({
        field: 'preferredLanguage',
        message: 'Preferred language is required and must be a string',
        code: 'INVALID_LANGUAGE'
      });
    }

    if (profile.primaryProducts && !Array.isArray(profile.primaryProducts)) {
      errors.push({
        field: 'primaryProducts',
        message: 'Primary products must be an array',
        code: 'INVALID_PRODUCTS'
      });
    }

    if (profile.targetMarkets && !Array.isArray(profile.targetMarkets)) {
      errors.push({
        field: 'targetMarkets',
        message: 'Target markets must be an array',
        code: 'INVALID_MARKETS'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitizes user input to prevent XSS and other security issues
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .substring(0, 5000); // Limit length
  }

  /**
   * Validates and sanitizes message content
   */
  static processMessageContent(content: string): { content: string; isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!content || typeof content !== 'string') {
      errors.push('Content is required and must be a string');
      return { content: '', isValid: false, errors };
    }

    const sanitized = this.sanitizeInput(content);
    
    if (sanitized.length === 0) {
      errors.push('Content cannot be empty after sanitization');
    }

    if (sanitized.length > 5000) {
      errors.push('Content exceeds maximum length of 5000 characters');
    }

    return {
      content: sanitized,
      isValid: errors.length === 0,
      errors
    };
  }
}