const HardenedGroqService = require('../src/services/HardenedGroqService');
const GroqService = require('../src/services/GroqService');
const featureFlags = require('../src/utils/featureFlags');

// Mock dependencies
jest.mock('../src/services/GroqService');
jest.mock('../src/utils/featureFlags');
jest.mock('../src/utils/debugLogger', () => ({
  logInferencePipeline: {
    llmRequestPrepared: jest.fn(),
    llmResponseReceived: jest.fn()
  }
}));

describe('HardenedGroqService', () => {
  let service;
  let mockGroqService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock feature flags
    featureFlags.getLLMConfig.mockReturnValue({
      timeout: 30000,
      maxRetries: 2,
      model: 'deepseek-r1-distill-llama-70b'
    });

    // Mock GroqService
    mockGroqService = {
      refineRecommendation: jest.fn(),
      answerClarifyingQuestion: jest.fn()
    };
    GroqService.mockImplementation(() => mockGroqService);

    service = new HardenedGroqService();
  });

  describe('constructor', () => {
    it('should initialize with correct dependencies', () => {
      expect(service.baseGroqService).toBeDefined();
      expect(service.config).toBeDefined();
      expect(service.responseCache).toBeDefined();
      expect(service.validationPatterns).toBeDefined();
    });

    it('should set up validation patterns correctly', () => {
      expect(service.validationPatterns.urls).toBeInstanceOf(RegExp);
      expect(service.validationPatterns.suspiciousContent).toBeInstanceOf(RegExp);
      expect(service.validationPatterns.requiredSections).toBeInstanceOf(Array);
    });
  });

  describe('refineRecommendation', () => {
    const mockBaseRecommendation = {
      summary: 'Learn web development fundamentals',
      skills: ['HTML', 'CSS', 'JavaScript'],
      timeline: '12 weeks',
      difficulty: 'beginner'
    };

    const mockRuleTrace = [
      {
        title: 'Beginner Web Development',
        explanation: 'Matched based on zero experience',
        priority: 'high'
      }
    ];

    const mockUserProfile = {
      experienceLevel: 'beginner',
      weeklyHours: 10,
      primaryGoal: 'career_change'
    };

    const mockDomain = 'web-development';
    const mockSessionId = 'session123';

    it('should return cached response if available', async () => {
      const cachedResponse = {
        roadmap: { skills: ['Cached'], resources: ['Cached'] },
        llmStatus: 'cached'
      };

      // Pre-populate cache
      const requestHash = service.createRequestHash(
        service.sanitizeContext(mockBaseRecommendation, mockRuleTrace, mockUserProfile), 
        mockDomain
      );
      service.responseCache.set(requestHash, cachedResponse);

      const result = await service.refineRecommendation(
        mockBaseRecommendation, 
        mockRuleTrace, 
        mockUserProfile, 
        mockDomain, 
        mockSessionId
      );

      expect(result.llmStatus).toBe('cached');
      expect(mockGroqService.refineRecommendation).not.toHaveBeenCalled();
    });

    it('should call base GroqService and return successful response', async () => {
      const mockGroqResponse = {
        roadmap: {
          skills: ['HTML5', 'CSS3', 'JavaScript ES6'],
          resources: ['MDN Documentation', 'FreeCodeCamp', 'Codecademy'],
          projects: ['Portfolio Website', 'Interactive Calculator'],
          timeline: 'Week 1-4: HTML/CSS, Week 5-8: JavaScript, Week 9-12: Projects',
          explanation: 'This path focuses on Beginner Web Development fundamentals as recommended by our matching algorithm.'
        }
      };

      mockGroqService.refineRecommendation.mockResolvedValue(mockGroqResponse);

      const result = await service.refineRecommendation(
        mockBaseRecommendation, 
        mockRuleTrace, 
        mockUserProfile, 
        mockDomain, 
        mockSessionId
      );

      expect(result.llmStatus).toBe('success');
      expect(result.roadmap.skills).toEqual(['HTML5', 'CSS3', 'JavaScript ES6']);
      expect(mockGroqService.refineRecommendation).toHaveBeenCalledWith(
        expect.any(Object), // baseRecommendation
        expect.any(Array),  // ruleTrace
        expect.any(Object), // userProfile
        mockDomain          // domain
      );
    });

    it('should handle validation failure and retry', async () => {
      const invalidResponse = {
        roadmap: {
          skills: ['HTML', 'Check out https://example.com for more info'], // Contains URL - should fail validation
          resources: ['Some resources'],
          projects: ['Some project'],
          timeline: 'Some timeline',
          explanation: 'Some explanation'
        }
      };

      const validResponse = {
        roadmap: {
          skills: ['HTML5', 'CSS3', 'JavaScript'],
          resources: ['MDN Documentation', 'FreeCodeCamp', 'Codecademy'],
          projects: ['Portfolio Website', 'Interactive Calculator'],
          timeline: 'Week 1-4: HTML/CSS, Week 5-8: JavaScript, Week 9-12: Projects',
          explanation: 'This path focuses on Beginner Web Development fundamentals as recommended.'
        }
      };

      mockGroqService.refineRecommendation
        .mockResolvedValueOnce(invalidResponse)  // First call fails validation
        .mockResolvedValueOnce(validResponse);   // Second call succeeds

      const result = await service.refineRecommendation(
        mockBaseRecommendation, 
        mockRuleTrace, 
        mockUserProfile, 
        mockDomain, 
        mockSessionId
      );

      expect(result.llmStatus).toBe('success');
      expect(mockGroqService.refineRecommendation).toHaveBeenCalledTimes(2);
    });

    it('should return fallback response after max retries', async () => {
      mockGroqService.refineRecommendation.mockRejectedValue(new Error('API Error'));

      const result = await service.refineRecommendation(
        mockBaseRecommendation, 
        mockRuleTrace, 
        mockUserProfile, 
        mockDomain, 
        mockSessionId
      );

      expect(result.llmStatus).toBe('failed');
      expect(result.baseRecommendationUsed).toBe(true);
      expect(result.roadmap.skills).toEqual(['HTML', 'CSS', 'JavaScript']); // From base recommendation
      expect(mockGroqService.refineRecommendation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle timeout correctly', async () => {
      // Mock timeout behavior by rejecting with timeout error
      mockGroqService.refineRecommendation.mockRejectedValue(new Error('LLM call timeout'));

      const result = await service.refineRecommendation(
        mockBaseRecommendation, 
        mockRuleTrace, 
        mockUserProfile, 
        mockDomain, 
        mockSessionId
      );

      expect(result.llmStatus).toBe('failed');
      expect(result.fallbackReason).toContain('LLM call timeout');
    });
  });

  describe('sanitizeContext', () => {
    it('should limit user profile to safe fields only', () => {
      const unsafeProfile = {
        experienceLevel: 'beginner',
        personalInfo: 'This should be removed',
        weeklyHours: 10,
        secretKey: 'dangerous',
        educationLevel: 'bachelor'
      };

      const result = service.sanitizeContext({}, [], unsafeProfile);

      expect(result.userProfile).toEqual({
        experienceLevel: 'beginner',
        educationLevel: 'bachelor',
        weeklyHours: 10,
        primaryGoal: 'unknown',
        timeframe: 'unknown',
        learningStyle: 'unknown'
      });
      expect(result.userProfile.personalInfo).toBeUndefined();
      expect(result.userProfile.secretKey).toBeUndefined();
    });

    it('should limit rule trace to top 5 rules', () => {
      const longRuleTrace = Array.from({ length: 10 }, (_, i) => ({
        title: `Rule ${i}`,
        explanation: `Explanation ${i}`,
        priority: 'medium'
      }));

      const result = service.sanitizeContext({}, longRuleTrace, {});

      expect(result.ruleTrace).toHaveLength(5);
    });

    it('should truncate long base recommendation summary', () => {
      const longSummary = 'x'.repeat(1000); // 1000 characters
      const baseRec = { summary: longSummary, skills: ['skill1'] };

      const result = service.sanitizeContext(baseRec, [], {});

      expect(result.baseRecommendation.summary).toHaveLength(500);
    });
  });

  describe('validateResponse', () => {
    it('should pass validation for correct response', () => {
      const validResponse = {
        roadmap: {
          skills: ['HTML5', 'CSS3', 'JavaScript'],
          resources: ['MDN Documentation', 'Codecademy', 'FreeCodeCamp'],
          projects: ['Portfolio Website', 'ToDo App'],
          timeline: 'Week 1-4: Fundamentals, Week 5-8: Practice, Week 9-12: Projects',
          explanation: 'This path matches the Beginner Web Development rule you qualified for.'
        }
      };

      const ruleTrace = [{
        title: 'Beginner Web Development',
        explanation: 'Applied based on experience level'
      }];

      const result = service.validateResponse(validResponse, ruleTrace, 'session123');

      expect(result.valid).toBe(true);
      expect(result.reason).toBe('Response validated successfully');
    });

    it('should fail validation for missing required sections', () => {
      const invalidResponse = {
        roadmap: {
          skills: ['HTML'],
          resources: ['Some resource']
          // Missing projects, timeline, explanation
        }
      };

      const result = service.validateResponse(invalidResponse, [], 'session123');

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Missing required section');
    });

    it('should fail validation for URLs in content', () => {
      const responseWithURL = {
        roadmap: {
          skills: ['HTML'],
          resources: ['Check out https://example.com'],
          projects: ['Portfolio'],
          timeline: 'Flexible',
          explanation: 'Some explanation'
        }
      };

      const result = service.validateResponse(responseWithURL, [], 'session123');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Contains generated URLs');
    });

    it('should fail validation for suspicious fabricated content', () => {
      const suspiciousResponse = {
        roadmap: {
          skills: ['HTML', '[FABRICATED skill]'],
          resources: ['Real resource'],
          projects: ['Portfolio'],
          timeline: 'Timeline',
          explanation: 'This contains FAKE information'
        }
      };

      const result = service.validateResponse(suspiciousResponse, [], 'session123');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Contains suspicious/fabricated content');
    });

    it('should fail validation if explanation doesn\'t reference rule trace', () => {
      const response = {
        roadmap: {
          skills: ['HTML'],
          resources: ['Some resource'],
          projects: ['Portfolio'],
          timeline: 'Timeline',
          explanation: 'Generic explanation with no rule reference'
        }
      };

      const ruleTrace = [{
        title: 'Beginner Path',
        explanation: 'Applied based on zero experience'
      }];

      const result = service.validateResponse(response, ruleTrace, 'session123');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Explanation does not reference rule trace');
    });
  });

  describe('answerClarifyingQuestion', () => {
    it('should delegate to base Groq service if method exists', async () => {
      const mockAnswer = {
        answer: 'Your learning timeline can be adjusted based on your weekly availability.',
        confidence: 0.8,
        llmStatus: 'success'
      };

      mockGroqService.answerClarifyingQuestion.mockResolvedValue(mockAnswer);

      const result = await service.answerClarifyingQuestion(
        'How flexible is the timeline?', 
        { session: {}, recommendation: {} },
        'session123'
      );

      expect(result).toEqual(mockAnswer);
      expect(mockGroqService.answerClarifyingQuestion).toHaveBeenCalled();
    });

    it('should provide fallback if base service method doesn\'t exist', async () => {
      delete mockGroqService.answerClarifyingQuestion;

      const result = await service.answerClarifyingQuestion(
        'How flexible is the timeline?', 
        { session: {}, recommendation: {} },
        'session123'
      );

      expect(result.llmStatus).toBe('fallback_method');
      expect(result.confidence).toBe(0.5);
    });

    it('should handle errors gracefully', async () => {
      mockGroqService.answerClarifyingQuestion.mockRejectedValue(new Error('API failure'));

      const result = await service.answerClarifyingQuestion(
        'How flexible is the timeline?', 
        { session: {}, recommendation: {} },
        'session123'
      );

      expect(result.llmStatus).toBe('error');
      expect(result.confidence).toBe(0.3);
      expect(result.error).toBe('API failure');
    });
  });

  describe('caching functionality', () => {
    it('should cache successful responses', async () => {
      const mockResponse = {
        roadmap: {
          skills: ['HTML5', 'CSS3'],
          resources: ['MDN', 'W3Schools'],
          projects: ['Portfolio'],
          timeline: 'Flexible',
          explanation: 'Based on beginner level'
        }
      };

      mockGroqService.refineRecommendation.mockResolvedValue(mockResponse);

      const baseRec = { skills: ['HTML'], summary: 'Learn web dev' };
      const trace = [{ title: 'Beginner', explanation: 'Zero experience' }];
      const profile = { experienceLevel: 'beginner' };

      // First call - should hit API
      await service.refineRecommendation(baseRec, trace, profile, 'web-dev', 'session1');
      expect(mockGroqService.refineRecommendation).toHaveBeenCalledTimes(1);

      // Second identical call - should use cache
      const cachedResult = await service.refineRecommendation(baseRec, trace, profile, 'web-dev', 'session2');
      expect(mockGroqService.refineRecommendation).toHaveBeenCalledTimes(1); // Still 1
      expect(cachedResult.llmStatus).toBe('cached');
    });

    it('should provide cache statistics', () => {
      const stats = service.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(typeof stats.size).toBe('number');
    });

    it('should clear cache when requested', () => {
      service.responseCache.set('test-key', 'test-value');
      expect(service.responseCache.size).toBe(1);
      
      service.clearCache();
      expect(service.responseCache.size).toBe(0);
    });
  });

  describe('request hash generation', () => {
    it('should generate consistent hashes for identical requests', () => {
      const context1 = { test: 'data', order: ['a', 'b'] };
      const context2 = { test: 'data', order: ['a', 'b'] };
      
      const hash1 = service.createRequestHash(context1, 'domain');
      const hash2 = service.createRequestHash(context2, 'domain');
      
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different requests', () => {
      const context1 = { baseRecommendation: { skills: ['A'] }, userProfile: { level: 'beginner' } };
      const context2 = { baseRecommendation: { skills: ['B'] }, userProfile: { level: 'advanced' } };
      
      const hash1 = service.createRequestHash(context1, 'domain1');
      const hash2 = service.createRequestHash(context2, 'domain2');
      
      expect(hash1).not.toBe(hash2);
    });
  });
});