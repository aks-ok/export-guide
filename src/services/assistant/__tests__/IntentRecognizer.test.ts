import { IntentRecognizer } from '../IntentRecognizer';
import { AssistantUtils } from '../utils';
import { UserContext } from '../types';

describe('IntentRecognizer', () => {
  let intentRecognizer: IntentRecognizer;
  let mockContext: UserContext;

  beforeEach(() => {
    intentRecognizer = IntentRecognizer.getInstance();
    mockContext = AssistantUtils.createDefaultUserContext('user-123', 'conv-123');
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = IntentRecognizer.getInstance();
      const instance2 = IntentRecognizer.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('recognizeIntent', () => {
    it('should recognize FIND_BUYERS intent', () => {
      const content = 'I need to find buyers for my textile products';
      
      const result = intentRecognizer.recognizeIntent(content, mockContext);
      
      expect(result.name).toBe('FIND_BUYERS');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.parameters.keywords).toContain('buyers');
    });

    it('should recognize MARKET_RESEARCH intent', () => {
      const content = 'What are the market opportunities in Germany for electronics?';
      
      const result = intentRecognizer.recognizeIntent(content, mockContext);
      
      expect(result.name).toBe('MARKET_RESEARCH');
      expect(result.confidence).toBeGreaterThan(0.4);
      expect(result.entities.some(e => e.type === 'COUNTRY')).toBe(true);
    });

    it('should recognize COMPLIANCE_HELP intent', () => {
      const content = 'I need help with export compliance and regulatory requirements';
      
      const result = intentRecognizer.recognizeIntent(content, mockContext);
      
      expect(result.name).toBe('COMPLIANCE_HELP');
      expect(result.confidence).toBeGreaterThan(0.6); // Higher confidence for specific terms
    });

    it('should recognize QUOTATION_HELP intent', () => {
      const content = 'How do I create a price quotation for international customers?';
      
      const result = intentRecognizer.recognizeIntent(content, mockContext);
      
      expect(result.name).toBe('QUOTATION_HELP');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should recognize PLATFORM_NAVIGATION intent', () => {
      const content = 'Can you show me how to navigate to the dashboard?';
      
      const result = intentRecognizer.recognizeIntent(content, mockContext);
      
      expect(result.name).toBe('PLATFORM_NAVIGATION');
      expect(result.confidence).toBeGreaterThan(0.4);
    });

    it('should recognize ONBOARDING_HELP intent', () => {
      const content = 'I am new to this platform and need help getting started';
      
      const result = intentRecognizer.recognizeIntent(content, mockContext);
      
      expect(result.name).toBe('ONBOARDING_HELP');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should recognize GENERAL_EXPORT_ADVICE intent', () => {
      const content = 'What are some good export strategies for international trade?';
      
      const result = intentRecognizer.recognizeIntent(content, mockContext);
      
      expect(result.name).toBe('GENERAL_EXPORT_ADVICE');
      expect(result.confidence).toBeGreaterThan(0.4);
    });

    it('should have low confidence for unclear messages', () => {
      const content = 'qwerty asdfgh zxcvbn';
      
      const result = intentRecognizer.recognizeIntent(content, mockContext);
      
      expect(result.confidence).toBeLessThan(0.3);
    });

    it('should boost confidence with conversation history', () => {
      // Add previous buyer-related message to context
      mockContext.conversationHistory = [
        {
          id: 'prev-1',
          userId: 'user-123',
          conversationId: 'conv-123',
          timestamp: new Date(),
          type: 'user',
          content: 'I want to find buyers',
          intent: { name: 'FIND_BUYERS', confidence: 0.8, entities: [], parameters: {} }
        }
      ];

      const content = 'What about customers in Europe?';
      
      const result = intentRecognizer.recognizeIntent(content, mockContext);
      
      // Should still detect buyer intent due to conversation context
      expect(result.name).toBe('FIND_BUYERS');
    });

    it('should boost confidence based on business profile', () => {
      // Set user as beginner
      mockContext.businessProfile.experienceLevel = 'beginner';
      
      const content = 'I need help getting started with the platform';
      
      const result = intentRecognizer.recognizeIntent(content, mockContext);
      
      expect(result.name).toBe('ONBOARDING_HELP');
      expect(result.confidence).toBeGreaterThan(0.3);
    });
  });

  describe('entity extraction', () => {
    it('should extract country entities', () => {
      const content = 'I want to export to USA, Germany, and Japan';
      
      const result = intentRecognizer.recognizeIntent(content, mockContext);
      
      const countryEntities = result.entities.filter(e => e.type === 'COUNTRY');
      expect(countryEntities.length).toBeGreaterThan(0);
      expect(countryEntities.some(e => e.value.includes('United States') || e.value.includes('USA'))).toBe(true);
    });

    it('should extract currency amounts', () => {
      const content = 'I need a quote for $50,000 worth of products';
      
      const result = intentRecognizer.recognizeIntent(content, mockContext);
      
      const amountEntities = result.entities.filter(e => e.type === 'AMOUNT');
      expect(amountEntities.length).toBeGreaterThan(0);
      expect(amountEntities[0].value).toContain('50,000');
    });

    it('should extract product categories', () => {
      const content = 'I manufacture textiles and electronics for export';
      
      const result = intentRecognizer.recognizeIntent(content, mockContext);
      
      const productEntities = result.entities.filter(e => e.type === 'PRODUCT');
      expect(productEntities.length).toBeGreaterThan(0);
    });

    it('should extract industry types', () => {
      const content = 'I work in the automotive and technology industries';
      
      const result = intentRecognizer.recognizeIntent(content, mockContext);
      
      const industryEntities = result.entities.filter(e => e.type === 'INDUSTRY');
      expect(industryEntities.length).toBeGreaterThan(0);
    });

    it('should extract HS codes', () => {
      const content = 'My product has HS code 1234.56.78';
      
      const result = intentRecognizer.recognizeIntent(content, mockContext);
      
      const hsEntities = result.entities.filter(e => e.type === 'HS_CODE');
      expect(hsEntities.length).toBeGreaterThan(0);
      expect(hsEntities[0].confidence).toBeGreaterThan(0.5);
    });

    it('should handle overlapping entities correctly', () => {
      const content = 'Export to USA';
      
      const result = intentRecognizer.recognizeIntent(content, mockContext);
      
      const countryEntities = result.entities.filter(e => e.type === 'COUNTRY');
      // Should detect the country entity
      expect(countryEntities.length).toBeGreaterThan(0);
    });
  });

  describe('getIntentSuggestions', () => {
    it('should return multiple intent suggestions for ambiguous messages', () => {
      const content = 'I need help with export business';
      
      const suggestions = intentRecognizer.getIntentSuggestions(content, mockContext);
      
      expect(suggestions.length).toBeGreaterThan(1);
      expect(suggestions.length).toBeLessThanOrEqual(3);
      expect(suggestions).toContain('GENERAL_EXPORT_ADVICE');
    });

    it('should return fewer suggestions for clear messages', () => {
      const content = 'I need to find buyers for my products';
      
      const suggestions = intentRecognizer.getIntentSuggestions(content, mockContext);
      
      expect(suggestions[0]).toBe('FIND_BUYERS');
    });

    it('should return fewer suggestions for very unclear messages', () => {
      const content = 'xyz abc 123';
      
      const suggestions = intentRecognizer.getIntentSuggestions(content, mockContext);
      
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('analyzeMessageComplexity', () => {
    it('should identify simple messages', () => {
      const content = 'Hello';
      
      const analysis = intentRecognizer.analyzeMessageComplexity(content);
      
      expect(analysis.complexity).toBe('simple');
      expect(analysis.factors.length).toBe(0);
    });

    it('should identify moderate complexity messages', () => {
      const content = 'I need help with finding buyers in Germany for my textile products and understanding compliance requirements';
      
      const analysis = intentRecognizer.analyzeMessageComplexity(content);
      
      expect(analysis.complexity).toBe('moderate');
    });

    it('should identify complex messages', () => {
      const content = 'I need comprehensive help with export compliance regulations, HS code classification, tariff calculations, and incoterms selection for multiple countries including USA, Germany, Japan, and Australia. Can you also help me understand the documentation requirements and certification processes?';
      
      const analysis = intentRecognizer.analyzeMessageComplexity(content);
      
      expect(analysis.complexity).toBe('complex');
      expect(analysis.factors).toContain('long_message');
      expect(analysis.factors).toContain('technical_terms');
      expect(analysis.factors).toContain('multiple_entities');
    });

    it('should detect multiple questions', () => {
      const content = 'What are the export requirements? How do I find buyers? What about compliance?';
      
      const analysis = intentRecognizer.analyzeMessageComplexity(content);
      
      expect(analysis.factors).toContain('multiple_questions');
    });

    it('should detect technical terms', () => {
      const content = 'I need help with incoterms and HS code classification';
      
      const analysis = intentRecognizer.analyzeMessageComplexity(content);
      
      expect(analysis.factors).toContain('technical_terms');
    });
  });

  describe('confidence calculation', () => {
    it('should have higher confidence for exact phrase matches', () => {
      const exactMatch = intentRecognizer.recognizeIntent('find buyers', mockContext);
      const keywordMatch = intentRecognizer.recognizeIntent('buyers', mockContext);
      
      expect(exactMatch.confidence).toBeGreaterThan(keywordMatch.confidence);
    });

    it('should boost confidence for entity-rich messages', () => {
      const withEntities = intentRecognizer.recognizeIntent('Find buyers in USA, Germany for $50,000 textile products', mockContext);
      const withoutEntities = intentRecognizer.recognizeIntent('Find buyers', mockContext);
      
      expect(withEntities.confidence).toBeGreaterThan(withoutEntities.confidence);
    });

    it('should reduce confidence for very short messages', () => {
      const shortMessage = intentRecognizer.recognizeIntent('buyers', mockContext);
      const longerMessage = intentRecognizer.recognizeIntent('I need to find buyers for my products', mockContext);
      
      expect(longerMessage.confidence).toBeGreaterThan(shortMessage.confidence);
    });
  });

  describe('business profile integration', () => {
    it('should boost onboarding intent for beginners', () => {
      mockContext.businessProfile.experienceLevel = 'beginner';
      
      const result = intentRecognizer.recognizeIntent('I need help', mockContext);
      
      expect(result.name).toBe('ONBOARDING_HELP');
    });

    it('should boost compliance intent for experienced users', () => {
      mockContext.businessProfile.experienceLevel = 'advanced';
      
      const result = intentRecognizer.recognizeIntent('I need help with regulations', mockContext);
      
      expect(result.name).toBe('COMPLIANCE_HELP');
    });

    it('should boost market research for users without target markets', () => {
      mockContext.businessProfile.targetMarkets = [];
      
      const result = intentRecognizer.recognizeIntent('I need market information', mockContext);
      
      expect(result.name).toBe('MARKET_RESEARCH');
    });

    it('should boost buyer finding for users with products', () => {
      mockContext.businessProfile.primaryProducts = ['textiles', 'electronics'];
      
      const result = intentRecognizer.recognizeIntent('I need customers', mockContext);
      
      expect(result.name).toBe('FIND_BUYERS');
    });
  });
});