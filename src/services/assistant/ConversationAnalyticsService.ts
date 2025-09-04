import { 
  ConversationMessage, 
  ConversationAnalytics, 
  UserContext, 
  RecognizedIntent,
  UserFeedback,
  AssistantResponse
} from './types';
import { ConversationStorageManager } from './storage';
import { AssistantUtils } from './utils';

/**
 * Analytics event types
 */
interface AnalyticsEvent {
  id: string;
  userId: string;
  conversationId: string;
  timestamp: Date;
  type: 'message_sent' | 'response_generated' | 'action_clicked' | 'navigation' | 'feedback_given' | 'task_completed';
  data: Record<string, any>;
  sessionId: string;
}

/**
 * Response accuracy metrics
 */
interface ResponseAccuracyMetrics {
  totalResponses: number;
  helpfulResponses: number;
  unhelpfulResponses: number;
  averageRating: number;
  accuracyRate: number;
  confidenceDistribution: Record<string, number>;
  intentAccuracyByType: Record<string, number>;
}

/**
 * Task completion metrics
 */
interface TaskCompletionMetrics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageTimeToComplete: number;
  taskCompletionByType: Record<string, number>;
  dropOffPoints: Array<{ step: string; dropOffRate: number }>;
}

/**
 * User interaction patterns
 */
interface UserInteractionPattern {
  userId: string;
  totalSessions: number;
  totalMessages: number;
  averageSessionLength: number;
  mostUsedIntents: Array<{ intent: string; count: number }>;
  preferredFeatures: string[];
  timeOfDayDistribution: Record<string, number>;
  deviceType?: string;
}/**
 * F
eedback collection configuration
 */
interface FeedbackConfig {
  enableRating: boolean;
  enableComments: boolean;
  ratingScale: number;
  feedbackPrompts: string[];
  collectAfterMessages: number;
}

/**
 * Analytics dashboard data
 */
interface AnalyticsDashboard {
  overview: {
    totalUsers: number;
    totalConversations: number;
    totalMessages: number;
    averageSessionLength: number;
    userRetentionRate: number;
  };
  responseMetrics: ResponseAccuracyMetrics;
  taskMetrics: TaskCompletionMetrics;
  userPatterns: UserInteractionPattern[];
  topIssues: Array<{ issue: string; frequency: number; impact: string }>;
  improvementSuggestions: string[];
  timeSeriesData: Array<{ date: Date; metrics: Record<string, number> }>;
}

/**
 * ConversationAnalyticsService tracks user interactions and provides insights
 */
export class ConversationAnalyticsService {
  private static instance: ConversationAnalyticsService;
  private events: Map<string, AnalyticsEvent[]> = new Map();
  private feedbackConfig: FeedbackConfig;
  private readonly STORAGE_KEY = 'exportguide_analytics_events';
  private readonly MAX_EVENTS_PER_USER = 1000;

  private constructor() {
    this.feedbackConfig = {
      enableRating: true,
      enableComments: true,
      ratingScale: 5,
      feedbackPrompts: [
        "Was this response helpful?",
        "How would you rate this interaction?",
        "Did I understand your question correctly?",
        "Was I able to help you accomplish your goal?"
      ],
      collectAfterMessages: 3
    };
    
    this.loadStoredEvents();
    this.startPeriodicCleanup();
  }

  public static getInstance(): ConversationAnalyticsService {
    if (!ConversationAnalyticsService.instance) {
      ConversationAnalyticsService.instance = new ConversationAnalyticsService();
    }
    return ConversationAnalyticsService.instance;
  }

  /**
   * Track user message
   */
  trackMessage(
    message: ConversationMessage,
    context: UserContext,
    intent?: RecognizedIntent
  ): void {
    try {
      const event: AnalyticsEvent = {
        id: AssistantUtils.generateId(),
        userId: message.userId,
        conversationId: message.conversationId,
        timestamp: message.timestamp,
        type: 'message_sent',
        data: {
          messageLength: message.content.length,
          intent: intent?.name,
          intentConfidence: intent?.confidence,
          entities: intent?.entities?.map(e => ({ type: e.type, confidence: e.confidence })),
          sessionPage: context.currentSession.currentPage,
          userExperience: context.businessProfile.experienceLevel
        },
        sessionId: this.getSessionId(context)
      };

      this.addEvent(event);
    } catch (error) {
      console.error('Error tracking message:', error);
    }
  }

  /**
   * Track assistant response
   */
  trackResponse(
    response: AssistantResponse,
    context: UserContext,
    responseTime: number,
    intent?: RecognizedIntent
  ): void {
    try {
      const event: AnalyticsEvent = {
        id: AssistantUtils.generateId(),
        userId: context.userId,
        conversationId: context.conversationId,
        timestamp: response.timestamp,
        type: 'response_generated',
        data: {
          responseLength: response.text.length,
          responseTime,
          hasQuickActions: !!response.quickActions && response.quickActions.length > 0,
          quickActionCount: response.quickActions?.length || 0,
          hasDataVisualization: !!response.dataVisualization,
          hasNavigationSuggestion: !!response.navigationSuggestion,
          followUpQuestionCount: response.followUpQuestions?.length || 0,
          intent: intent?.name,
          intentConfidence: intent?.confidence
        },
        sessionId: this.getSessionId(context)
      };

      this.addEvent(event);
    } catch (error) {
      console.error('Error tracking response:', error);
    }
  }

  /**
   * Track quick action click
   */
  trackQuickAction(
    actionId: string,
    actionType: string,
    userId: string,
    conversationId: string,
    context?: UserContext
  ): void {
    try {
      const event: AnalyticsEvent = {
        id: AssistantUtils.generateId(),
        userId,
        conversationId,
        timestamp: new Date(),
        type: 'action_clicked',
        data: {
          actionId,
          actionType,
          sessionPage: context?.currentSession.currentPage
        },
        sessionId: context ? this.getSessionId(context) : 'unknown'
      };

      this.addEvent(event);
    } catch (error) {
      console.error('Error tracking quick action:', error);
    }
  }

  /**
   * Track navigation event
   */
  trackNavigation(
    fromPage: string,
    toPage: string,
    userId: string,
    conversationId: string,
    trigger: 'assistant' | 'user' | 'system' = 'user'
  ): void {
    try {
      const event: AnalyticsEvent = {
        id: AssistantUtils.generateId(),
        userId,
        conversationId,
        timestamp: new Date(),
        type: 'navigation',
        data: {
          fromPage,
          toPage,
          trigger,
          navigationPath: `${fromPage} -> ${toPage}`
        },
        sessionId: `${userId}_${Date.now()}`
      };

      this.addEvent(event);
    } catch (error) {
      console.error('Error tracking navigation:', error);
    }
  }

  /**
   * Track user feedback
   */
  trackFeedback(
    feedback: UserFeedback,
    messageId: string,
    userId: string,
    conversationId: string
  ): void {
    try {
      const event: AnalyticsEvent = {
        id: AssistantUtils.generateId(),
        userId,
        conversationId,
        timestamp: feedback.timestamp,
        type: 'feedback_given',
        data: {
          messageId,
          rating: feedback.rating,
          helpful: feedback.helpful,
          comment: feedback.comment,
          feedbackType: feedback.rating >= 4 ? 'positive' : feedback.rating <= 2 ? 'negative' : 'neutral'
        },
        sessionId: `${userId}_${Date.now()}`
      };

      this.addEvent(event);
    } catch (error) {
      console.error('Error tracking feedback:', error);
    }
  }

  /**
   * Track task completion
   */
  trackTaskCompletion(
    taskType: string,
    taskId: string,
    completed: boolean,
    timeToComplete: number,
    userId: string,
    conversationId: string
  ): void {
    try {
      const event: AnalyticsEvent = {
        id: AssistantUtils.generateId(),
        userId,
        conversationId,
        timestamp: new Date(),
        type: 'task_completed',
        data: {
          taskType,
          taskId,
          completed,
          timeToComplete,
          success: completed
        },
        sessionId: `${userId}_${Date.now()}`
      };

      this.addEvent(event);
    } catch (error) {
      console.error('Error tracking task completion:', error);
    }
  }

  /**
   * Get response accuracy metrics
   */
  getResponseAccuracyMetrics(
    userId?: string,
    timeRange?: { start: Date; end: Date }
  ): ResponseAccuracyMetrics {
    try {
      const feedbackEvents = this.getFilteredEvents('feedback_given', userId, timeRange);
      const responseEvents = this.getFilteredEvents('response_generated', userId, timeRange);

      const totalResponses = responseEvents.length;
      const helpfulResponses = feedbackEvents.filter(e => e.data.helpful).length;
      const unhelpfulResponses = feedbackEvents.filter(e => !e.data.helpful).length;
      
      const ratings = feedbackEvents.map(e => e.data.rating).filter(r => r !== undefined);
      const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
      
      const accuracyRate = feedbackEvents.length > 0 ? (helpfulResponses / feedbackEvents.length) * 100 : 0;

      // Calculate confidence distribution
      const confidenceDistribution: Record<string, number> = {};
      responseEvents.forEach(event => {
        const confidence = event.data.intentConfidence;
        if (confidence !== undefined) {
          const bucket = confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low';
          confidenceDistribution[bucket] = (confidenceDistribution[bucket] || 0) + 1;
        }
      });

      // Calculate intent accuracy by type
      const intentAccuracyByType: Record<string, number> = {};
      const intentGroups = this.groupEventsByIntent(responseEvents, feedbackEvents);
      
      Object.entries(intentGroups).forEach(([intent, data]) => {
        if (data.feedbackCount > 0) {
          intentAccuracyByType[intent] = (data.helpfulCount / data.feedbackCount) * 100;
        }
      });

      return {
        totalResponses,
        helpfulResponses,
        unhelpfulResponses,
        averageRating,
        accuracyRate,
        confidenceDistribution,
        intentAccuracyByType
      };
    } catch (error) {
      console.error('Error calculating response accuracy metrics:', error);
      return this.getDefaultResponseMetrics();
    }
  }

  /**
   * Get task completion metrics
   */
  getTaskCompletionMetrics(
    userId?: string,
    timeRange?: { start: Date; end: Date }
  ): TaskCompletionMetrics {
    try {
      const taskEvents = this.getFilteredEvents('task_completed', userId, timeRange);
      
      const totalTasks = taskEvents.length;
      const completedTasks = taskEvents.filter(e => e.data.completed).length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      const completionTimes = taskEvents
        .filter(e => e.data.completed && e.data.timeToComplete)
        .map(e => e.data.timeToComplete);
      const averageTimeToComplete = completionTimes.length > 0 
        ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length 
        : 0;

      // Calculate completion rate by task type
      const taskCompletionByType: Record<string, number> = {};
      const taskGroups = this.groupBy(taskEvents, e => e.data.taskType);
      
      Object.entries(taskGroups).forEach(([taskType, events]) => {
        const completed = events.filter(e => e.data.completed).length;
        taskCompletionByType[taskType] = events.length > 0 ? (completed / events.length) * 100 : 0;
      });

      // Calculate drop-off points (simplified)
      const dropOffPoints = this.calculateDropOffPoints(taskEvents);

      return {
        totalTasks,
        completedTasks,
        completionRate,
        averageTimeToComplete,
        taskCompletionByType,
        dropOffPoints
      };
    } catch (error) {
      console.error('Error calculating task completion metrics:', error);
      return this.getDefaultTaskMetrics();
    }
  }

  /**
   * Get user interaction patterns
   */
  getUserInteractionPatterns(userId?: string): UserInteractionPattern[] {
    try {
      const allEvents = userId ? this.getUserEvents(userId) : this.getAllEvents();
      const userGroups = this.groupBy(allEvents, e => e.userId);

      return Object.entries(userGroups).map(([uid, events]) => {
        const sessions = this.groupBy(events, e => e.sessionId);
        const messageEvents = events.filter(e => e.type === 'message_sent');
        
        const sessionLengths = Object.values(sessions).map(sessionEvents => {
          const times = sessionEvents.map(e => e.timestamp.getTime());
          return Math.max(...times) - Math.min(...times);
        });
        
        const averageSessionLength = sessionLengths.length > 0 
          ? sessionLengths.reduce((sum, length) => sum + length, 0) / sessionLengths.length 
          : 0;

        // Calculate most used intents
        const intentCounts: Record<string, number> = {};
        messageEvents.forEach(event => {
          const intent = event.data.intent;
          if (intent) {
            intentCounts[intent] = (intentCounts[intent] || 0) + 1;
          }
        });

        const mostUsedIntents = Object.entries(intentCounts)
          .map(([intent, count]) => ({ intent, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Calculate time of day distribution
        const timeOfDayDistribution: Record<string, number> = {};
        events.forEach(event => {
          const hour = event.timestamp.getHours();
          const timeSlot = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
          timeOfDayDistribution[timeSlot] = (timeOfDayDistribution[timeSlot] || 0) + 1;
        });

        return {
          userId: uid,
          totalSessions: Object.keys(sessions).length,
          totalMessages: messageEvents.length,
          averageSessionLength,
          mostUsedIntents,
          preferredFeatures: this.extractPreferredFeatures(events),
          timeOfDayDistribution
        };
      });
    } catch (error) {
      console.error('Error calculating user interaction patterns:', error);
      return [];
    }
  }

  /**
   * Get analytics dashboard data
   */
  getAnalyticsDashboard(timeRange?: { start: Date; end: Date }): AnalyticsDashboard {
    try {
      const allEvents = timeRange ? this.getEventsInTimeRange(timeRange) : this.getAllEvents();
      const userPatterns = this.getUserInteractionPatterns();
      
      const overview = {
        totalUsers: new Set(allEvents.map(e => e.userId)).size,
        totalConversations: new Set(allEvents.map(e => e.conversationId)).size,
        totalMessages: allEvents.filter(e => e.type === 'message_sent').length,
        averageSessionLength: this.calculateAverageSessionLength(allEvents),
        userRetentionRate: this.calculateUserRetentionRate(allEvents)
      };

      const responseMetrics = this.getResponseAccuracyMetrics(undefined, timeRange);
      const taskMetrics = this.getTaskCompletionMetrics(undefined, timeRange);
      const topIssues = this.identifyTopIssues(allEvents);
      const improvementSuggestions = this.generateImprovementSuggestions(responseMetrics, taskMetrics);
      const timeSeriesData = this.generateTimeSeriesData(allEvents, timeRange);

      return {
        overview,
        responseMetrics,
        taskMetrics,
        userPatterns,
        topIssues,
        improvementSuggestions,
        timeSeriesData
      };
    } catch (error) {
      console.error('Error generating analytics dashboard:', error);
      return this.getDefaultDashboard();
    }
  }

  /**
   * Collect feedback from user
   */
  async collectFeedback(
    messageId: string,
    userId: string,
    conversationId: string,
    promptType: 'rating' | 'helpful' | 'comment' = 'helpful'
  ): Promise<{
    shouldCollect: boolean;
    prompt: string;
    config: Partial<FeedbackConfig>;
  }> {
    try {
      const userEvents = this.getUserEvents(userId);
      const messageCount = userEvents.filter(e => e.type === 'message_sent').length;
      
      // Check if we should collect feedback based on message count
      const shouldCollect = messageCount % this.feedbackConfig.collectAfterMessages === 0;
      
      if (!shouldCollect) {
        return { shouldCollect: false, prompt: '', config: {} };
      }

      const prompt = this.selectFeedbackPrompt(promptType);
      
      return {
        shouldCollect: true,
        prompt,
        config: {
          enableRating: this.feedbackConfig.enableRating,
          enableComments: this.feedbackConfig.enableComments,
          ratingScale: this.feedbackConfig.ratingScale
        }
      };
    } catch (error) {
      console.error('Error collecting feedback:', error);
      return { shouldCollect: false, prompt: '', config: {} };
    }
  }

  /**
   * Export analytics data
   */
  exportAnalyticsData(
    format: 'json' | 'csv' = 'json',
    userId?: string,
    timeRange?: { start: Date; end: Date }
  ): string {
    try {
      const events = this.getFilteredEvents(undefined, userId, timeRange);
      
      if (format === 'csv') {
        return this.convertToCSV(events);
      }
      
      return JSON.stringify({
        exportDate: new Date(),
        totalEvents: events.length,
        timeRange,
        userId,
        events
      }, null, 2);
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      return JSON.stringify({ error: 'Failed to export data' });
    }
  }

  // Private helper methods

  private addEvent(event: AnalyticsEvent): void {
    const userEvents = this.events.get(event.userId) || [];
    userEvents.push(event);
    
    // Limit events per user to prevent memory issues
    if (userEvents.length > this.MAX_EVENTS_PER_USER) {
      userEvents.splice(0, userEvents.length - this.MAX_EVENTS_PER_USER);
    }
    
    this.events.set(event.userId, userEvents);
    this.saveEvents();
  }

  private getSessionId(context: UserContext): string {
    return `${context.userId}_${context.currentSession.sessionStartTime.getTime()}`;
  }

  private getFilteredEvents(
    type?: string,
    userId?: string,
    timeRange?: { start: Date; end: Date }
  ): AnalyticsEvent[] {
    let events = userId ? this.getUserEvents(userId) : this.getAllEvents();
    
    if (type) {
      events = events.filter(e => e.type === type);
    }
    
    if (timeRange) {
      events = events.filter(e => 
        e.timestamp >= timeRange.start && e.timestamp <= timeRange.end
      );
    }
    
    return events;
  }

  private getUserEvents(userId: string): AnalyticsEvent[] {
    return this.events.get(userId) || [];
  }

  private getAllEvents(): AnalyticsEvent[] {
    const allEvents: AnalyticsEvent[] = [];
    this.events.forEach(userEvents => {
      allEvents.push(...userEvents);
    });
    return allEvents;
  }

  private getEventsInTimeRange(timeRange: { start: Date; end: Date }): AnalyticsEvent[] {
    return this.getAllEvents().filter(e => 
      e.timestamp >= timeRange.start && e.timestamp <= timeRange.end
    );
  }

  private groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      groups[key] = groups[key] || [];
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  private groupEventsByIntent(
    responseEvents: AnalyticsEvent[],
    feedbackEvents: AnalyticsEvent[]
  ): Record<string, { helpfulCount: number; feedbackCount: number }> {
    const groups: Record<string, { helpfulCount: number; feedbackCount: number }> = {};
    
    responseEvents.forEach(event => {
      const intent = event.data.intent;
      if (intent) {
        if (!groups[intent]) {
          groups[intent] = { helpfulCount: 0, feedbackCount: 0 };
        }
      }
    });
    
    feedbackEvents.forEach(event => {
      // This is simplified - in reality, you'd need to match feedback to specific responses
      const intent = 'general'; // Would need to track which response the feedback is for
      if (groups[intent]) {
        groups[intent].feedbackCount++;
        if (event.data.helpful) {
          groups[intent].helpfulCount++;
        }
      }
    });
    
    return groups;
  }

  private calculateDropOffPoints(taskEvents: AnalyticsEvent[]): Array<{ step: string; dropOffRate: number }> {
    // Simplified drop-off calculation
    const taskTypes = Array.from(new Set(taskEvents.map(e => e.data.taskType)));
    
    return taskTypes.map(taskType => {
      const typeEvents = taskEvents.filter(e => e.data.taskType === taskType);
      const incomplete = typeEvents.filter(e => !e.data.completed).length;
      const dropOffRate = typeEvents.length > 0 ? (incomplete / typeEvents.length) * 100 : 0;
      
      return { step: taskType, dropOffRate };
    });
  }

  private extractPreferredFeatures(events: AnalyticsEvent[]): string[] {
    const actionEvents = events.filter(e => e.type === 'action_clicked');
    const actionCounts: Record<string, number> = {};
    
    actionEvents.forEach(event => {
      const actionType = event.data.actionType;
      actionCounts[actionType] = (actionCounts[actionType] || 0) + 1;
    });
    
    return Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([action]) => action);
  }

  private calculateAverageSessionLength(events: AnalyticsEvent[]): number {
    const sessions = this.groupBy(events, e => e.sessionId);
    const sessionLengths = Object.values(sessions).map(sessionEvents => {
      const times = sessionEvents.map(e => e.timestamp.getTime());
      return Math.max(...times) - Math.min(...times);
    });
    
    return sessionLengths.length > 0 
      ? sessionLengths.reduce((sum, length) => sum + length, 0) / sessionLengths.length 
      : 0;
  }

  private calculateUserRetentionRate(events: AnalyticsEvent[]): number {
    const userSessions = this.groupBy(events, e => e.userId);
    const returningUsers = Object.values(userSessions).filter(userEvents => {
      const sessions = new Set(userEvents.map(e => e.sessionId));
      return sessions.size > 1;
    }).length;
    
    const totalUsers = Object.keys(userSessions).length;
    return totalUsers > 0 ? (returningUsers / totalUsers) * 100 : 0;
  }

  private identifyTopIssues(events: AnalyticsEvent[]): Array<{ issue: string; frequency: number; impact: string }> {
    const feedbackEvents = events.filter(e => e.type === 'feedback_given' && !e.data.helpful);
    const issueGroups: Record<string, number> = {};
    
    feedbackEvents.forEach(event => {
      const comment = event.data.comment;
      if (comment) {
        // Simplified issue categorization
        const issue = this.categorizeIssue(comment);
        issueGroups[issue] = (issueGroups[issue] || 0) + 1;
      }
    });
    
    return Object.entries(issueGroups)
      .map(([issue, frequency]) => ({
        issue,
        frequency,
        impact: frequency > 10 ? 'high' : frequency > 5 ? 'medium' : 'low'
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  private categorizeIssue(comment: string): string {
    const lowerComment = comment.toLowerCase();
    if (lowerComment.includes('understand') || lowerComment.includes('confus')) {
      return 'Understanding Issues';
    } else if (lowerComment.includes('slow') || lowerComment.includes('time')) {
      return 'Performance Issues';
    } else if (lowerComment.includes('wrong') || lowerComment.includes('incorrect')) {
      return 'Accuracy Issues';
    } else {
      return 'Other Issues';
    }
  }

  private generateImprovementSuggestions(
    responseMetrics: ResponseAccuracyMetrics,
    taskMetrics: TaskCompletionMetrics
  ): string[] {
    const suggestions: string[] = [];
    
    if (responseMetrics.accuracyRate < 70) {
      suggestions.push('Improve intent recognition accuracy through better training data');
    }
    
    if (responseMetrics.averageRating < 3.5) {
      suggestions.push('Enhance response quality and relevance');
    }
    
    if (taskMetrics.completionRate < 60) {
      suggestions.push('Simplify task flows and provide better guidance');
    }
    
    if (Object.values(responseMetrics.confidenceDistribution).some(v => v > 50)) {
      suggestions.push('Review low-confidence responses and improve training');
    }
    
    return suggestions;
  }

  private generateTimeSeriesData(
    events: AnalyticsEvent[],
    timeRange?: { start: Date; end: Date }
  ): Array<{ date: Date; metrics: Record<string, number> }> {
    const dailyGroups = this.groupBy(events, e => e.timestamp.toDateString());
    
    return Object.entries(dailyGroups).map(([dateStr, dayEvents]) => ({
      date: new Date(dateStr),
      metrics: {
        totalEvents: dayEvents.length,
        messages: dayEvents.filter(e => e.type === 'message_sent').length,
        responses: dayEvents.filter(e => e.type === 'response_generated').length,
        feedback: dayEvents.filter(e => e.type === 'feedback_given').length,
        actions: dayEvents.filter(e => e.type === 'action_clicked').length
      }
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private selectFeedbackPrompt(type: 'rating' | 'helpful' | 'comment'): string {
    const prompts = this.feedbackConfig.feedbackPrompts;
    const typeMap: Record<string, number> = {
      'helpful': 0,
      'rating': 1,
      'comment': 2
    };
    
    return prompts[typeMap[type]] || prompts[0];
  }

  private convertToCSV(events: AnalyticsEvent[]): string {
    if (events.length === 0) return '';
    
    const headers = ['id', 'userId', 'conversationId', 'timestamp', 'type', 'sessionId', 'data'];
    const rows = events.map(event => [
      event.id,
      event.userId,
      event.conversationId,
      event.timestamp.toISOString(),
      event.type,
      event.sessionId,
      JSON.stringify(event.data)
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private getDefaultResponseMetrics(): ResponseAccuracyMetrics {
    return {
      totalResponses: 0,
      helpfulResponses: 0,
      unhelpfulResponses: 0,
      averageRating: 0,
      accuracyRate: 0,
      confidenceDistribution: {},
      intentAccuracyByType: {}
    };
  }

  private getDefaultTaskMetrics(): TaskCompletionMetrics {
    return {
      totalTasks: 0,
      completedTasks: 0,
      completionRate: 0,
      averageTimeToComplete: 0,
      taskCompletionByType: {},
      dropOffPoints: []
    };
  }

  private getDefaultDashboard(): AnalyticsDashboard {
    return {
      overview: {
        totalUsers: 0,
        totalConversations: 0,
        totalMessages: 0,
        averageSessionLength: 0,
        userRetentionRate: 0
      },
      responseMetrics: this.getDefaultResponseMetrics(),
      taskMetrics: this.getDefaultTaskMetrics(),
      userPatterns: [],
      topIssues: [],
      improvementSuggestions: [],
      timeSeriesData: []
    };
  }

  private loadStoredEvents(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([userId, events]: [string, any]) => {
          const parsedEvents = events.map((event: any) => ({
            ...event,
            timestamp: new Date(event.timestamp)
          }));
          this.events.set(userId, parsedEvents);
        });
      }
    } catch (error) {
      console.error('Error loading stored events:', error);
    }
  }

  private saveEvents(): void {
    try {
      const data = Object.fromEntries(this.events.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving events:', error);
    }
  }

  private startPeriodicCleanup(): void {
    // Clean up old events every hour
    setInterval(() => {
      this.cleanupOldEvents();
    }, 60 * 60 * 1000);
  }

  private cleanupOldEvents(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.events.forEach((userEvents, userId) => {
      const filteredEvents = userEvents.filter(event => event.timestamp > thirtyDaysAgo);
      this.events.set(userId, filteredEvents);
    });
    
    this.saveEvents();
  }
}

export default ConversationAnalyticsService;