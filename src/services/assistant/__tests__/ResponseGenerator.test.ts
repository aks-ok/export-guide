import { ResponseGenerator } from '../ResponseGenerator';
import { RecognizedIntent, UserContext, BusinessProfile, SessionContext, UserPreferences } from '../types';

describe('ResponseGenerator', () => {
  let responseGenerator: ResponseGenerator;
  let mockUserContext: UserContext;
  let mockBusinessProfile: BusinessProfile;

  beforeEach(() => {
    responseGenerator = ResponseGenerator.getInstance();
    
    mockBusinessProfile = {
      industry: 'Manufacturing',
      primaryProducts: ['Electronics', 'Components'],
      targetMarkets: ['USA', 'Germany'],
      experienceLevel: 'intermediate',
      preferredLanguage: 'en',
      businessSize: 'medium',
      companyName: 'Test Company',
      establishedYear: 2020
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
      } as SessionContext,
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
      } as UserPreferences,
      conversationHistory: []
    };
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ResponseGenerator.getInstance();
      const instance2 = ResponseGenerator.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateResponse', () => {
    it('should generate response for FIND_BUYERS intent', async () => {
      const intent: RecognizedIntent = {
        name: 'FIND_BUYERS',
        confidence: 0.9,
        entities: [
          {
            type: 'COUNTRY',
            value: 'Germany',
            confidence: 0.8,
            startIndex: 0,
            endIndex: 7
          }
        ],
        parameters: {}
      };

      const response = await responseGenerator.generateResponse(intent, mockUserContext, 'Find buyers in Germany');

      expect(response.text).toContain('buyer');
      expect(response.quickActions).toBeDefined();
      expect(response.quickActions!.length).toBeGreaterThan(0);
      expect(response.navigationSuggestion).toBeDefined();
      expect(response.navigationSuggestion!.page).toBe('buyer-discovery');
      expect(response.followUpQuestions).toBeDefined();
      expect(response.dataVisualization).toBeDefined();
    });

    it('should generate response for MARKET_RESEARCH intent', async () => {
      const intent: RecognizedIntent = {
        name: 'MARKET_RESEARCH',
        confidence: 0.85,
        entities: [
          {
            type: 'PRODUCT',
            value: 'Electronics',
            confidence: 0.9,
            startIndex: 0,
            endIndex: 11
          }
        ],
        parameters: {}
      };

      const response = await responseGenerator.generateResponse(intent, mockUserContext, 'Market research for electronics');

      expect(response.text).toContain('market');
      expect(response.quickActions).toBeDefined();
      expect(response.navigationSuggestion).toBeDefined();
      expect(response.navigationSuggestion!.page).toBe('market-research');
      expect(response.dataVisualization).toBeDefined();
      expect(response.dataVisualization!.type).toBe('chart');
    });

    it('should generate response for COMPLIANCE_HELP intent', async () => {
      const intent: RecognizedIntent = {
        name: 'COMPLIANCE_HELP',
        confidence: 0.8,
        entities: [],
        parameters: {}
      };

      const response = await responseGenerator.generateResponse(intent, mockUserContext, 'Help with compliance');

      expect(response.text).toContain('compliance');
      expect(response.quickActions).toBeDefined();
      expect(response.navigationSuggestion).toBeDefined();
      expect(response.navigationSuggestion!.page).toBe('compliance');
      expect(response.followUpQuestions).toBeDefined();
    });

    it('should generate response for QUOTATION_HELP intent', async () => {
      const intent: RecognizedIntent = {
        name: 'QUOTATION_HELP',
        confidence: 0.9,
        entities: [],
        parameters: {}
      };

      const response = await responseGenerator.generateResponse(intent, mockUserContext, 'Help with quotations');

      expect(response.text).toContain('quotation');
      expect(response.quickActions).toBeDefined();
      expect(response.navigationSuggestion).toBeDefined();
      expect(response.navigationSuggestion!.page).toBe('quotation');
    });

    it('should generate response for PLATFORM_NAVIGATION intent', async () => {
      const intent: RecognizedIntent = {
        name: 'PLATFORM_NAVIGATION',
        confidence: 0.7,
        entities: [],
        parameters: {}
      };

      const response = await responseGenerator.generateResponse(intent, mockUserContext, 'How do I use this platform?');

      expect(response.text).toContain('platform');
      expect(response.quickActions).toBeDefined();
      expect(response.followUpQuestions).toBeDefined();
    });

    it('should generate response for GENERAL_EXPORT_ADVICE intent', async () => {
      const intent: RecognizedIntent = {
        name: 'GENERAL_EXPORT_ADVICE',
        confidence: 0.8,
        entities: [],
        parameters: {}
      };

      const response = await responseGenerator.generateResponse(intent, mockUserContext, 'Export advice needed');

      expect(response.text).toContain('export');
      expect(response.quickActions).toBeDefined();
      expect(response.followUpQuestions).toBeDefined();
    });

    it('should generate response for ONBOARDING_HELP intent', async () => {
      const intent: RecognizedIntent = {
        name: 'ONBOARDING_HELP',
        confidence: 0.9,
        entities: [],
        parameters: {}
      };

      const response = await responseGenerator.generateResponse(intent, mockUserContext, 'I need help getting started');

      expect(response.text).toContain('Welcome') || expect(response.text).toContain('started');
      expect(response.quickActions).toBeDefined();
      expect(response.followUpQuestions).toBeDefined();
    });

    it('should generate fallback response for unknown intent', async () => {
      const intent: RecognizedIntent = {
        name: 'UNKNOWN',
        confidence: 0.3,
        entities: [],
        parameters: {}
      };

      const response = await responseGenerator.generateResponse(intent, mockUserContext, 'Random unclear message');

      expect(response.text).toContain('understand') || expect(response.text).toContain('help');
      expect(response.quickActions).toBeDefined();
      expect(response.followUpQuestions).toBeDefined();
    });

    it('should include entity-based quick actions', async () => {
      const intent: RecognizedIntent = {
        name: 'FIND_BUYERS',
        confidence: 0.9,
        entities: [
          {
            type: 'COUNTRY',
            value: 'Japan',
            confidence: 0.9,
            startIndex: 0,
            endIndex: 5
          },
          {
            type: 'PRODUCT',
            value: 'Machinery',
            confidence: 0.8,
            startIndex: 6,
            endIndex: 15
          }
        ],
        parameters: {}
      };

      const response = await responseGenerator.generateResponse(intent, mockUserContext, 'Find buyers in Japan for machinery');

      expect(response.quickActions).toBeDefined();
      const actionLabels = response.quickActions!.map(action => action.label);
      expect(actionLabels.some(label => label.includes('Japan'))).toBe(true);
      expect(actionLabels.some(label => label.includes('Machinery'))).toBe(true);
    });

    it('should adapt text template based on user experience level', async () => {
      const intent: RecognizedIntent = {
        name: 'FIND_BUYERS',
        confidence: 0.9,
        entities: [],
        parameters: {}
      };

      // Test with beginner user
      const beginnerContext = {
        ...mockUserContext,
        businessProfile: {
          ...mockBusinessProfile,
          experienceLevel: 'beginner' as const
        }
      };

      const beginnerResponse = await responseGenerator.generateResponse(intent, beginnerContext, 'Find buyers');

      // Test with advanced user
      const advancedContext = {
        ...mockUserContext,
        businessProfile: {
          ...mockBusinessProfile,
          experienceLevel: 'advanced' as const
        }
      };

      const advancedResponse = await responseGenerator.generateResponse(intent, advancedContext, 'Find buyers');

      expect(beginnerResponse.text).toBeDefined();
      expect(advancedResponse.text).toBeDefined();
      // Both should be valid responses but potentially different
      expect(beginnerResponse.text.length).toBeGreaterThan(0);
      expect(advancedResponse.text.length).toBeGreaterThan(0);
    });

    it('should limit quick actions to maximum of 4', async () => {
      const intent: RecognizedIntent = {
        name: 'FIND_BUYERS',
        confidence: 0.9,
        entities: [
          { type: 'COUNTRY', value: 'USA', confidence: 0.9, startIndex: 0, endIndex: 3 },
          { type: 'COUNTRY', value: 'Germany', confidence: 0.9, startIndex: 4, endIndex: 11 },
          { type: 'PRODUCT', value: 'Electronics', confidence: 0.9, startIndex: 12, endIndex: 23 },
          { type: 'PRODUCT', value: 'Components', confidence: 0.9, startIndex: 24, endIndex: 34 }
        ],
        parameters: {}
      };

      const response = await responseGenerator.generateResponse(intent, mockUserContext, 'Find buyers in USA and Germany for electronics and components');

      expect(response.quickActions).toBeDefined();
      expect(response.quickActions!.length).toBeLessThanOrEqual(4);
    });

    it('should handle errors gracefully', async () => {
      // Mock an error by passing invalid intent
      const invalidIntent = null as any;

      const response = await responseGenerator.generateResponse(invalidIntent, mockUserContext, 'Test message');

      expect(response.text).toContain('technical difficulties') || expect(response.text).toContain('error');
      expect(response.quickActions).toBeDefined();
      expect(response.quickActions!.some(action => action.label === 'Try Again')).toBe(true);
    });
  });

  describe('formatResponse', () => {
    let sampleResponse: any;

    beforeEach(() => {
      sampleResponse = {
        text: 'This is a test response',
        quickActions: [
          {
            id: 'test-action',
            label: 'Test Action',
            action: 'navigate',
            parameters: { page: 'test' }
          }
        ],
        followUpQuestions: ['What else can I help with?']
      };
    });

    it('should format response as text by default', () => {
      const formatted = responseGenerator.formatResponse(sampleResponse);
      expect(formatted).toBe('This is a test response');
    });

    it('should format response as HTML', () => {
      const formatted = responseGenerator.formatResponse(sampleResponse, 'html');
      expect(formatted).toContain('<p>This is a test response</p>');
      expect(formatted).toContain('<div class="quick-actions">');
      expect(formatted).toContain('<button class="quick-action"');
      expect(formatted).toContain('Test Action');
    });

    it('should format response as Markdown', () => {
      const formatted = responseGenerator.formatResponse(sampleResponse, 'markdown');
      expect(formatted).toContain('This is a test response');
      expect(formatted).toContain('**Quick Actions:**');
      expect(formatted).toContain('- Test Action');
      expect(formatted).toContain('**You might also ask:**');
      expect(formatted).toContain('- What else can I help with?');
    });

    it('should handle response without quick actions', () => {
      const simpleResponse = {
        text: 'Simple response',
        quickActions: undefined,
        followUpQuestions: undefined
      };

      const htmlFormatted = responseGenerator.formatResponse(simpleResponse, 'html');
      const markdownFormatted = responseGenerator.formatResponse(simpleResponse, 'markdown');

      expect(htmlFormatted).toBe('<p>Simple response</p>');
      expect(markdownFormatted).toBe('Simple response');
    });
  });

  describe('Navigation Parameter Extraction', () => {
    it('should extract navigation parameters from entities', async () => {
      const intent: RecognizedIntent = {
        name: 'MARKET_RESEARCH',
        confidence: 0.9,
        entities: [
          {
            type: 'COUNTRY',
            value: 'Brazil',
            confidence: 0.9,
            startIndex: 0,
            endIndex: 6
          },
          {
            type: 'PRODUCT',
            value: 'Coffee',
            confidence: 0.8,
            startIndex: 7,
            endIndex: 13
          }
        ],
        parameters: {}
      };

      const response = await responseGenerator.generateResponse(intent, mockUserContext, 'Market research for coffee in Brazil');

      expect(response.navigationSuggestion).toBeDefined();
      expect(response.navigationSuggestion!.params).toBeDefined();
      expect(response.navigationSuggestion!.params!.country).toBe('Brazil');
      expect(response.navigationSuggestion!.params!.product).toBe('Coffee');
    });
  });

  describe('Follow-up Questions Generation', () => {
    it('should generate contextual follow-up questions based on missing entities', async () => {
      const intentWithoutCountry: RecognizedIntent = {
        name: 'FIND_BUYERS',
        confidence: 0.9,
        entities: [
          {
            type: 'PRODUCT',
            value: 'Textiles',
            confidence: 0.8,
            startIndex: 0,
            endIndex: 8
          }
        ],
        parameters: {}
      };

      const response = await responseGenerator.generateResponse(intentWithoutCountry, mockUserContext, 'Find buyers for textiles');

      expect(response.followUpQuestions).toBeDefined();
      expect(response.followUpQuestions!.some(q => q.toLowerCase().includes('countries') || q.toLowerCase().includes('targeting'))).toBe(true);
    });

    it('should limit follow-up questions to maximum of 3', async () => {
      const intent: RecognizedIntent = {
        name: 'GENERAL_EXPORT_ADVICE',
        confidence: 0.8,
        entities: [],
        parameters: {}
      };

      const response = await responseGenerator.generateResponse(intent, mockUserContext, 'Export advice');

      expect(response.followUpQuestions).toBeDefined();
      expect(response.followUpQuestions!.length).toBeLessThanOrEqual(3);
    });
  });
});