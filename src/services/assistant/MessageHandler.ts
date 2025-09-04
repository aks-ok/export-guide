import { 
  ConversationMessage, 
  AssistantResponse, 
  UserContext, 
  RecognizedIntent,
  IntentType,
  QuickAction,
  ConversationAnalytics
} from './types';
import { AssistantValidator } from './validation';
import { ConversationStorageManager } from './storage';
import { AssistantUtils } from './utils';
import { IntentRecognizer } from './IntentRecognizer';
import { ResponseGenerator } from './ResponseGenerator';

/**
 * MessageHandler processes incoming messages and coordinates response generation
 */
export class MessageHandler {
  private static instance: MessageHandler;
  
  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): MessageHandler {
    if (!MessageHandler.instance) {
      MessageHandler.instance = new MessageHandler();
    }
    return MessageHandler.instance;
  }

  /**
   * Process an incoming message and generate a response
   */
  async processMessage(
    content: string, 
    context: UserContext
  ): Promise<{ userMessage: ConversationMessage; assistantResponse: AssistantResponse }> {
    const startTime = Date.now();

    try {
      // Validate and sanitize input
      const processedContent = AssistantValidator.processMessageContent(content);
      if (!processedContent.isValid) {
        throw new Error(`Invalid message content: ${processedContent.errors.join(', ')}`);
      }

      // Create user message
      const userMessage = this.createUserMessage(processedContent.content, context);
      
      // Validate user message
      const messageValidation = AssistantValidator.validateMessage(userMessage);
      if (!messageValidation.isValid) {
        throw new Error(`Message validation failed: ${messageValidation.errors.map(e => e.message).join(', ')}`);
      }

      // Save user message
      ConversationStorageManager.saveMessage(userMessage);

      // Update conversation history in context
      context.conversationHistory.push(userMessage);

      // Detect intent using advanced recognizer
      const intentRecognizer = IntentRecognizer.getInstance();
      const intent = intentRecognizer.recognizeIntent(processedContent.content, context);

      // Generate assistant response
      const assistantResponse = await this.generateResponse(intent, context, userMessage);

      // Create assistant message and save it
      const assistantMessage = this.createAssistantMessage(assistantResponse, context);
      ConversationStorageManager.saveMessage(assistantMessage);

      // Update conversation history
      context.conversationHistory.push(assistantMessage);

      // Update user context
      this.updateUserContext(context, userMessage, assistantResponse);
      ConversationStorageManager.saveUserContext(context);

      // Update analytics
      this.updateAnalytics(context, userMessage, assistantResponse, Date.now() - startTime);

      return { userMessage, assistantResponse };

    } catch (error) {
      console.error('Error processing message:', error);
      
      // Create error response
      const errorResponse: AssistantResponse = {
        id: AssistantUtils.generateId(),
        text: "I'm sorry, I encountered an error processing your message. Please try again or rephrase your question.",
        timestamp: new Date(),
        followUpQuestions: [
          "Can you try asking your question differently?",
          "Would you like help with a specific export topic?",
          "Should I guide you to a particular platform feature?"
        ]
      };

      // Create user message even if processing failed
      const userMessage = this.createUserMessage(content, context);
      
      return { userMessage, assistantResponse: errorResponse };
    }
  }

  /**
   * Handle quick actions from the UI
   */
  async handleQuickAction(
    action: QuickAction, 
    context: UserContext
  ): Promise<AssistantResponse> {
    try {
      switch (action.action) {
        case 'navigate':
          return this.handleNavigationAction(action, context);
        
        case 'search':
          return this.handleSearchAction(action, context);
        
        case 'create':
          return this.handleCreateAction(action, context);
        
        case 'analyze':
          return this.handleAnalyzeAction(action, context);
        
        default:
          return {
            id: AssistantUtils.generateId(),
            text: `I'll help you with "${action.label}". This feature is being implemented.`,
            timestamp: new Date()
          };
      }
    } catch (error) {
      console.error('Error handling quick action:', error);
      return {
        id: AssistantUtils.generateId(),
        text: "I encountered an error processing that action. Please try again.",
        timestamp: new Date()
      };
    }
  }

  /**
   * Get conversation history for a user
   */
  async getConversationHistory(userId: string): Promise<ConversationMessage[]> {
    try {
      const userConversations = ConversationStorageManager.getUserConversations(userId);
      const allMessages: ConversationMessage[] = [];
      
      Object.values(userConversations).forEach(messages => {
        allMessages.push(...messages);
      });
      
      // Sort by timestamp
      return allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  /**
   * Create a user message object
   */
  private createUserMessage(content: string, context: UserContext): ConversationMessage {
    return {
      id: AssistantUtils.generateId(),
      userId: context.userId,
      conversationId: context.conversationId,
      timestamp: new Date(),
      type: 'user',
      content,
      metadata: {
        userFeedback: undefined,
        confidence: 1.0
      }
    };
  }

  /**
   * Create an assistant message from a response
   */
  private createAssistantMessage(response: AssistantResponse, context: UserContext): ConversationMessage {
    return {
      id: response.id,
      userId: context.userId,
      conversationId: context.conversationId,
      timestamp: response.timestamp,
      type: 'assistant',
      content: response.text,
      metadata: {
        confidence: 0.8, // Default confidence for generated responses
        dataSource: ['assistant_engine']
      }
    };
  }



  /**
   * Generate assistant response based on intent using ResponseGenerator
   */
  private async generateResponse(
    intent: RecognizedIntent, 
    context: UserContext, 
    userMessage: ConversationMessage
  ): Promise<AssistantResponse> {
    try {
      const responseGenerator = ResponseGenerator.getInstance();
      const response = await responseGenerator.generateResponse(intent, context, userMessage.content);
      
      // Add required fields that ResponseGenerator doesn't set
      return {
        ...response,
        id: AssistantUtils.generateId(),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Fallback to basic response
      return {
        id: AssistantUtils.generateId(),
        text: "I'm having trouble generating a response right now. Please try rephrasing your question or let me know how else I can help you.",
        timestamp: new Date(),
        followUpQuestions: [
          "Can you try asking your question differently?",
          "Would you like help with finding buyers?",
          "Do you need market research assistance?"
        ]
      };
    }
  }



  /**
   * Handle navigation actions
   */
  private async handleNavigationAction(action: QuickAction, context: UserContext): Promise<AssistantResponse> {
    const page = action.parameters.page;
    
    return {
      id: AssistantUtils.generateId(),
      text: `I'm directing you to the ${page.replace('-', ' ')} section. This will help you ${this.getPageDescription(page)}.`,
      navigationSuggestion: {
        page,
        params: action.parameters,
        highlightElement: action.parameters.highlightElement
      },
      timestamp: new Date()
    };
  }

  /**
   * Handle search actions
   */
  private async handleSearchAction(action: QuickAction, context: UserContext): Promise<AssistantResponse> {
    const searchType = action.parameters.type;
    
    return {
      id: AssistantUtils.generateId(),
      text: `I'll help you search for ${searchType}. Let me prepare the search interface for you.`,
      quickActions: [
        {
          id: 'refine_search',
          label: 'Refine Search',
          action: 'search',
          parameters: { ...action.parameters, refined: true },
          icon: 'tune'
        }
      ],
      timestamp: new Date()
    };
  }

  /**
   * Handle create actions
   */
  private async handleCreateAction(action: QuickAction, context: UserContext): Promise<AssistantResponse> {
    const createType = action.parameters.type;
    
    return {
      id: AssistantUtils.generateId(),
      text: `I'll help you create a new ${createType}. Let me guide you through the process step by step.`,
      timestamp: new Date()
    };
  }

  /**
   * Handle analyze actions
   */
  private async handleAnalyzeAction(action: QuickAction, context: UserContext): Promise<AssistantResponse> {
    const analyzeType = action.parameters.type;
    
    return {
      id: AssistantUtils.generateId(),
      text: `I'll analyze the ${analyzeType} data for you. This will provide insights to help with your export decisions.`,
      timestamp: new Date()
    };
  }

  /**
   * Get description for a page
   */
  private getPageDescription(page: string): string {
    const descriptions: Record<string, string> = {
      'dashboard': 'get an overview of your export activities and key metrics',
      'buyer-discovery': 'find and connect with potential buyers for your products',
      'market-research': 'analyze market opportunities and competition in different countries',
      'export-compliance': 'understand regulatory requirements and documentation needs',
      'quotation': 'create professional quotes with accurate pricing and terms',
      'lead-generation': 'manage and track your export leads and opportunities'
    };
    
    return descriptions[page] || 'access the requested feature';
  }

  /**
   * Update user context with new interaction data
   */
  private updateUserContext(
    context: UserContext, 
    userMessage: ConversationMessage, 
    assistantResponse: AssistantResponse
  ): void {
    // Update session context
    context.currentSession.lastActivity = new Date();
    context.currentSession.actionsPerformed.push(`message_${userMessage.intent?.name || 'unknown'}`);
    
    // Add search queries if detected
    const keywords = AssistantUtils.extractKeywords(userMessage.content);
    if (keywords.length > 0) {
      context.currentSession.searchQueries.push(...keywords);
    }

    // Update business profile based on conversation
    if (userMessage.intent?.entities) {
      userMessage.intent.entities.forEach(entity => {
        if (entity.type === 'COUNTRY' && !context.businessProfile.targetMarkets.includes(entity.value)) {
          context.businessProfile.targetMarkets.push(entity.value);
        }
      });
    }
  }

  /**
   * Update conversation analytics
   */
  private updateAnalytics(
    context: UserContext,
    userMessage: ConversationMessage,
    assistantResponse: AssistantResponse,
    responseTime: number
  ): void {
    let analytics = ConversationStorageManager.getAnalytics(context.conversationId);
    
    if (!analytics) {
      analytics = {
        conversationId: context.conversationId,
        userId: context.userId,
        startTime: new Date(),
        messageCount: 0,
        intentsRecognized: [],
        actionsCompleted: [],
        issuesEncountered: []
      };
    }

    analytics.messageCount += 1;
    analytics.endTime = new Date();
    
    if (userMessage.intent) {
      analytics.intentsRecognized.push(userMessage.intent.name);
    }

    // Track response time in metadata
    if (userMessage.metadata) {
      userMessage.metadata.responseTime = responseTime;
    }

    ConversationStorageManager.saveAnalytics(analytics);
  }
}