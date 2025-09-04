// Core data types for the AI Export Assistant

export interface ConversationMessage {
  id: string;
  userId: string;
  conversationId: string;
  timestamp: Date;
  type: 'user' | 'assistant';
  content: string;
  intent?: RecognizedIntent;
  metadata?: MessageMetadata;
}

export interface RecognizedIntent {
  name: IntentType;
  confidence: number;
  entities: ExtractedEntity[];
  parameters: Record<string, any>;
}

export type IntentType = 
  | 'FIND_BUYERS'
  | 'MARKET_RESEARCH'
  | 'COMPLIANCE_HELP'
  | 'QUOTATION_HELP'
  | 'PLATFORM_NAVIGATION'
  | 'GENERAL_EXPORT_ADVICE'
  | 'ONBOARDING_HELP'
  | 'UNKNOWN';

export interface ExtractedEntity {
  type: EntityType;
  value: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export type EntityType = 
  | 'COUNTRY'
  | 'PRODUCT'
  | 'INDUSTRY'
  | 'CURRENCY'
  | 'AMOUNT'
  | 'DATE'
  | 'HS_CODE';

export interface AssistantResponse {
  id: string;
  text: string;
  quickActions?: QuickAction[];
  dataVisualization?: DataVisualization;
  navigationSuggestion?: NavigationAction;
  followUpQuestions?: string[];
  timestamp: Date;
}

export interface QuickAction {
  id: string;
  label: string;
  action: ActionType;
  parameters: Record<string, any>;
  icon?: string;
  color?: string;
}

export type ActionType = 
  | 'navigate'
  | 'search'
  | 'create'
  | 'analyze'
  | 'export'
  | 'filter';

export interface DataVisualization {
  type: 'chart' | 'table' | 'map' | 'metric';
  data: any;
  config: Record<string, any>;
  title?: string;
  description?: string;
}

export interface NavigationAction {
  page: string;
  params?: Record<string, any>;
  prePopulateForm?: Record<string, any>;
  highlightElement?: string;
  reason?: string;
}

export interface UserContext {
  userId: string;
  conversationId: string;
  businessProfile: BusinessProfile;
  currentSession: SessionContext;
  preferences: UserPreferences;
  conversationHistory: ConversationMessage[];
}

export interface BusinessProfile {
  industry: string;
  primaryProducts: string[];
  targetMarkets: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredLanguage: string;
  businessSize: 'small' | 'medium' | 'large';
  companyName?: string;
  establishedYear?: number;
}

export interface SessionContext {
  currentPage: string;
  sessionStartTime: Date;
  lastActivity: Date;
  pagesVisited: string[];
  actionsPerformed: string[];
  searchQueries: string[];
}

export interface UserPreferences {
  chatPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoExpand: boolean;
  soundEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  dataPrivacy: {
    allowAnalytics: boolean;
    allowPersonalization: boolean;
    retentionPeriod: number; // days
  };
}

export interface MessageMetadata {
  responseTime?: number;
  confidence?: number;
  dataSource?: string[];
  errorCode?: string;
  retryCount?: number;
  userFeedback?: UserFeedback;
}

export interface UserFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  helpful: boolean;
  comment?: string;
  timestamp: Date;
}

export interface ConversationAnalytics {
  conversationId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  intentsRecognized: IntentType[];
  actionsCompleted: string[];
  userSatisfaction?: number;
  issuesEncountered: string[];
}

// Validation schemas
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Storage interfaces
export interface ConversationStorage {
  conversations: Record<string, ConversationMessage[]>;
  userContexts: Record<string, UserContext>;
  analytics: Record<string, ConversationAnalytics>;
  lastUpdated: Date;
}

// API response types
export interface AssistantApiResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    responseTime: number;
    source: string;
    cached: boolean;
  };
}