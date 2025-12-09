const HardenedGroqService = require('../src/services/HardenedGroqService');
const GroqService = require('../src/services/GroqService');

// Mock dependencies
jest.mock('../src/services/GroqService');
jest.mock('../src/utils/featureFlags');
jest.mock('../src/utils/debugLogger', () => ({
  logInferencePipeline: {
    llmRequestPrepared: jest.fn(),
    llmResponseReceived: jest.fn()
  }
}));

/**
 * Phase 3 - LLM Integration Mocked Tests
 * Tests LLM success/failure handling and fallback behavior
 */
describe('LLM Integration - Mocked Tests', () => {
  let llmService;
  let mockGroqService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock feature flags
    const featureFlags = require('../src/utils/featureFlags');
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

    llmService = new HardenedGroqService();
  });

  describe('LLM Success Scenarios', () => {
    it('should handle valid LLM response and mark llmStatus as success', async () => {
      const mockBaseRecommendation = {
        summary: 'Learn web development fundamentals',
        skills: ['HTML', 'CSS', 'JavaScript'],
        timeline: '12 weeks',
        difficulty: 'beginner'
      };

      const mockRuleTrace = [
        {
          title: 'Beginner Web Development',
          explanation: 'Applied based on experience level',
          priority: 'high'
        }
      ];

      const mockUserProfile = {
        experienceLevel: 'beginner',
        weeklyHours: 10,
        primaryGoal: 'career_change'
      };

      const mockValidResponse = {
        roadmap: {
          skills: ['HTML5 semantics', 'CSS Grid & Flexbox', 'ES6 JavaScript'],
          resources: ['MDN Web Docs', 'FreeCodeCamp', 'Codecademy'],
          projects: ['Personal Portfolio', 'Interactive Web App'],
          timeline: 'Week 1-4: HTML/CSS basics, Week 5-8: JavaScript fundamentals, Week 9-12: Project building',
          explanation: 'This path follows the Beginner Web Development approach as indicated by your experience level and goals. The applied based on experience level strategy ensures a solid foundation.'
        }
      };

      mockGroqService.refineRecommendation.mockResolvedValue(mockValidResponse);

      const result = await llmService.refineRecommendation(
        mockBaseRecommendation,
        mockRuleTrace,
        mockUserProfile,
        'web-development',
        'test-session-success'
      );

      expect(result.llmStatus).toBe('success');
      expect(result.roadmap).toEqual(mockValidResponse.roadmap);
      expect(result.roadmap.skills).toEqual(['HTML5 semantics', 'CSS Grid & Flexbox', 'ES6 JavaScript']);
      expect(result.roadmap.explanation).toContain('Beginner Web Development');
      expect(result.baseRecommendationUsed).toBeUndefined(); // Should not fallback
    });

    it('should merge LLM refined content with base recommendation metadata', async () => {
      const mockBaseRecommendation = {
        summary: 'Backend development path',
        skills: ['Node.js', 'Express'],
        timeline: '10 weeks',
        difficulty: 'intermediate',
        metadata: {
          confidence: 0.85,
          appliedRules: ['backend_focus_rule']
        }
      };

      const mockValidResponse = {
        roadmap: {
          skills: ['Node.js ecosystem', 'Express.js framework', 'MongoDB integration'],
          resources: ['Node.js Official Docs', 'Express Guide', 'MongoDB University'],
          projects: ['REST API', 'Full-stack Application'],
          timeline: 'Weeks 1-3: Node.js fundamentals, Weeks 4-6: Express framework, Weeks 7-10: Database integration',
          explanation: 'Backend development path optimized for your intermediate experience level, following the backend focus rule approach for specialized skill development.'
        }
      };

      mockGroqService.refineRecommendation.mockResolvedValue(mockValidResponse);

      const mockRuleTrace = [
        {
          title: 'Backend Focus Rule',
          explanation: 'Backend focus rule approach for specialized skill development',
          priority: 'medium'
        }
      ];

      const result = await llmService.refineRecommendation(
        mockBaseRecommendation,
        mockRuleTrace,
        { experienceLevel: 'intermediate' },
        'backend-development',
        'test-session-merge'
      );

      expect(result.llmStatus).toBe('success');
      expect(result.roadmap.skills).toContain('Node.js ecosystem');
      expect(result.roadmap.projects).toEqual(['REST API', 'Full-stack Application']);
      expect(result.latency).toBeDefined();
      expect(result.requestHash).toBeDefined();
    });

    it('should cache successful responses and return cached on subsequent identical requests', async () => {
      const baseRec = { skills: ['React'], summary: 'Learn React' };
      const trace = [{ title: 'React Beginner', explanation: 'New to React' }];
      const profile = { experienceLevel: 'beginner' };

      const mockResponse = {
        roadmap: {
          skills: ['React hooks', 'Component lifecycle'],
          resources: ['React docs', 'React tutorial'],
          projects: ['Todo app', 'Weather app'],
          timeline: '8 weeks React learning',
          explanation: 'React Beginner learning path tailored for those new to React, following the new to React approach for structured skill building.'
        }
      };

      mockGroqService.refineRecommendation.mockResolvedValue(mockResponse);

      // First call - should hit LLM
      const result1 = await llmService.refineRecommendation(baseRec, trace, profile, 'react', 'session-1');
      expect(result1.llmStatus).toBe('success');
      expect(mockGroqService.refineRecommendation).toHaveBeenCalledTimes(1);

      // Second identical call - should return cached
      const result2 = await llmService.refineRecommendation(baseRec, trace, profile, 'react', 'session-2');
      expect(result2.llmStatus).toBe('cached');
      expect(mockGroqService.refineRecommendation).toHaveBeenCalledTimes(1); // Still only 1 call
      
      // Results should be identical except for status
      expect(result2.roadmap).toEqual(result1.roadmap);
    });
  });

  describe('LLM Failure Scenarios', () => {
    it('should handle LLM timeout and fallback to base recommendation', async () => {
      const mockBaseRecommendation = {
        summary: 'Mobile development basics',
        skills: ['React Native', 'JavaScript'],
        timeline: '14 weeks',
        difficulty: 'intermediate'
      };

      mockGroqService.refineRecommendation.mockRejectedValue(new Error('LLM call timeout'));

      const result = await llmService.refineRecommendation(
        mockBaseRecommendation,
        [],
        { experienceLevel: 'intermediate' },
        'mobile-development',
        'test-session-timeout'
      );

      expect(result.llmStatus).toBe('failed');
      expect(result.fallbackReason).toContain('LLM call timeout');
      expect(result.baseRecommendationUsed).toBe(true);
      expect(result.roadmap.skills).toEqual(['React Native', 'JavaScript']);
      expect(result.roadmap.timeline).toBe('14 weeks');
    });

    it('should handle LLM validation failure and retry then fallback', async () => {
      const mockBaseRecommendation = {
        summary: 'Data science path',
        skills: ['Python', 'Pandas'],
        timeline: '16 weeks',
        difficulty: 'beginner'
      };

      const invalidResponse = {
        roadmap: {
          skills: ['Python basics', 'Check out https://pandas.pydata.org for more info'], // Contains URL - should fail validation
          resources: ['Some resources'],
          projects: ['Some project'],
          timeline: 'Some timeline',
          explanation: 'Some explanation'
        }
      };

      // Mock all retries to return invalid response
      mockGroqService.refineRecommendation
        .mockResolvedValueOnce(invalidResponse)
        .mockResolvedValueOnce(invalidResponse)
        .mockResolvedValueOnce(invalidResponse);

      const result = await llmService.refineRecommendation(
        mockBaseRecommendation,
        [],
        { experienceLevel: 'beginner' },
        'data-science',
        'test-session-validation'
      );

      expect(result.llmStatus).toBe('failed');
      expect(result.baseRecommendationUsed).toBe(true);
      expect(result.roadmap.skills).toEqual(['Python', 'Pandas']);
      expect(mockGroqService.refineRecommendation).toHaveBeenCalledTimes(3); // Original + 2 retries
    });

    it('should handle LLM API error and provide meaningful fallback', async () => {
      const mockBaseRecommendation = {
        summary: 'DevOps learning path',
        skills: ['Docker', 'Kubernetes'],
        timeline: '12 weeks',
        difficulty: 'advanced'
      };

      mockGroqService.refineRecommendation.mockRejectedValue(new Error('API rate limit exceeded'));

      const result = await llmService.refineRecommendation(
        mockBaseRecommendation,
        [],
        { experienceLevel: 'advanced' },
        'devops',
        'test-session-api-error'
      );

      expect(result.llmStatus).toBe('failed');
      expect(result.fallbackReason).toBe('API rate limit exceeded');
      expect(result.baseRecommendationUsed).toBe(true);
      expect(result.roadmap).toBeDefined();
      expect(result.roadmap.skills).toEqual(['Docker', 'Kubernetes']);
      expect(result.roadmap.resources).toEqual(['Official documentation', 'Community tutorials', 'Practice platforms']);
    });

    it('should handle malformed LLM response structure', async () => {
      const mockBaseRecommendation = {
        summary: 'AI/ML fundamentals',
        skills: ['Python', 'NumPy', 'TensorFlow'],
        timeline: '20 weeks',
        difficulty: 'intermediate'
      };

      const malformedResponse = {
        // Missing 'roadmap' wrapper
        skills: ['Machine Learning basics'],
        // Missing other required sections
      };

      mockGroqService.refineRecommendation.mockResolvedValue(malformedResponse);

      const result = await llmService.refineRecommendation(
        mockBaseRecommendation,
        [],
        { experienceLevel: 'intermediate' },
        'ai-ml',
        'test-session-malformed'
      );

      expect(result.llmStatus).toBe('failed');
      expect(result.baseRecommendationUsed).toBe(true);
      expect(result.roadmap.skills).toEqual(['Python', 'NumPy', 'TensorFlow']);
    });

    it('should handle empty LLM response', async () => {
      const mockBaseRecommendation = {
        // No summary field - should trigger fallback explanation
        skills: ['Network security', 'Cryptography'],
        timeline: '18 weeks',
        difficulty: 'intermediate'
      };

      mockGroqService.refineRecommendation.mockResolvedValue(null);

      const result = await llmService.refineRecommendation(
        mockBaseRecommendation,
        [],
        { experienceLevel: 'intermediate' },
        'cybersecurity',
        'test-session-empty'
      );

      expect(result.llmStatus).toBe('failed');
      expect(result.baseRecommendationUsed).toBe(true);
      expect(result.roadmap.explanation).toContain('Personalized learning path');
    });
  });

  describe('LLM Retry Logic', () => {
    it('should retry on transient failures and succeed on final attempt', async () => {
      const mockBaseRecommendation = {
        summary: 'Cloud architecture path',
        skills: ['AWS', 'Azure'],
        timeline: '15 weeks',
        difficulty: 'advanced'
      };

      const mockRuleTrace = [
        {
          title: 'Advanced Cloud Architecture',
          explanation: 'Advanced cloud patterns for experienced practitioners',
          priority: 'high'
        }
      ];

      const validResponse = {
        roadmap: {
          skills: ['AWS fundamentals', 'Azure services', 'Cloud design patterns'],
          resources: ['AWS Documentation', 'Azure Learn', 'Cloud Architecture Center'],
          projects: ['Multi-cloud deployment', 'Serverless application'],
          timeline: 'Weeks 1-5: AWS basics, Weeks 6-10: Azure fundamentals, Weeks 11-15: Multi-cloud architecture',
          explanation: 'Advanced Cloud Architecture path designed for experienced practitioners, following advanced cloud patterns for comprehensive skill development.'
        }
      };

      // First two calls fail, third succeeds
      mockGroqService.refineRecommendation
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Service unavailable'))
        .mockResolvedValueOnce(validResponse);

      const result = await llmService.refineRecommendation(
        mockBaseRecommendation,
        mockRuleTrace,
        { experienceLevel: 'advanced' },
        'cloud-architecture',
        'test-session-retry-success'
      );

      expect(result.llmStatus).toBe('success');
      expect(result.roadmap.skills).toEqual(['AWS fundamentals', 'Azure services', 'Cloud design patterns']);
      expect(mockGroqService.refineRecommendation).toHaveBeenCalledTimes(3);
    });

    it('should implement progressive backoff between retries', async () => {
      const mockBaseRecommendation = {
        summary: 'Game development basics',
        skills: ['Unity', 'C#'],
        timeline: '22 weeks',
        difficulty: 'intermediate'
      };

      mockGroqService.refineRecommendation.mockRejectedValue(new Error('Persistent failure'));

      const startTime = Date.now();
      
      const result = await llmService.refineRecommendation(
        mockBaseRecommendation,
        [],
        { experienceLevel: 'intermediate' },
        'game-development',
        'test-session-backoff'
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(result.llmStatus).toBe('failed');
      expect(mockGroqService.refineRecommendation).toHaveBeenCalledTimes(3); // Original + 2 retries
      expect(totalTime).toBeGreaterThan(3000); // Should take at least 3 seconds (1s + 2s backoff)
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize user profile and limit context size', async () => {
      const mockBaseRecommendation = {
        summary: 'A'.repeat(1000), // This should be truncated
        skills: ['Web security'],
        timeline: '14 weeks',
        difficulty: 'advanced'
      };

      const mockUserProfile = {
        experienceLevel: 'beginner',
        personalInfo: 'This should be removed',
        weeklyHours: 10,
        dangerousField: '<script>alert("xss")</script>',
        educationLevel: 'bachelors'
      };

      const mockRuleTrace = [
        {
          title: 'Web Security Fundamentals',
          explanation: 'Essential security practices for web development',
          priority: 'high'
        }
      ];

      const validResponse = {
        roadmap: {
          skills: ['Sanitized skills'],
          resources: ['Safe resources'],
          projects: ['Clean projects'],
          timeline: 'Safe timeline',
          explanation: 'Web Security Fundamentals path with essential security practices for comprehensive learning'
        }
      };

      mockGroqService.refineRecommendation.mockResolvedValue(validResponse);

      const result = await llmService.refineRecommendation(
        mockBaseRecommendation,
        mockRuleTrace,
        mockUserProfile,
        'test-domain',
        'test-session-sanitization'
      );

      expect(result.llmStatus).toBe('success');
      
      // Verify the call was made with sanitized data
      const callArgs = mockGroqService.refineRecommendation.mock.calls[0];
      const sanitizedProfile = callArgs[2];
      
      expect(sanitizedProfile.personalInfo).toBeUndefined();
      expect(sanitizedProfile.dangerousField).toBeUndefined();
      expect(sanitizedProfile.experienceLevel).toBe('beginner');
      expect(sanitizedProfile.educationLevel).toBe('bachelors');
      
      // Verify summary was truncated
      const sanitizedBaseRec = callArgs[0];
      expect(sanitizedBaseRec.summary.length).toBe(500);
    });

    it('should limit rule trace to top 5 rules', async () => {
      const mockRuleTrace = [];
      for (let i = 0; i < 10; i++) {
        mockRuleTrace.push({
          title: `Rule ${i}`,
          explanation: `Explanation ${i}`,
          priority: 'medium'
        });
      }

      const validResponse = {
        roadmap: {
          skills: ['Test skills'],
          resources: ['Test resources'],
          projects: ['Test projects'],
          timeline: 'Test timeline',
          explanation: 'Learning path based on Rule 0, Rule 1, and Rule 2 guidelines for comprehensive skill development'
        }
      };

      mockGroqService.refineRecommendation.mockResolvedValue(validResponse);

      const result = await llmService.refineRecommendation(
        { summary: 'Test', skills: [] },
        mockRuleTrace,
        { experienceLevel: 'beginner' },
        'test-domain',
        'test-session-trace-limit'
      );

      expect(result.llmStatus).toBe('success');
      
      // Verify rule trace was limited
      const callArgs = mockGroqService.refineRecommendation.mock.calls[0];
      const sanitizedTrace = callArgs[1];
      expect(sanitizedTrace.length).toBe(5);
    });
  });

  describe('Response Validation', () => {
    it('should reject responses with suspicious content', async () => {
      const mockBaseRecommendation = {
        summary: 'Blockchain development',
        skills: ['Solidity', 'Web3'],
        timeline: '14 weeks',
        difficulty: 'advanced'
      };

      const suspiciousResponse = {
        roadmap: {
          skills: ['Solidity basics', 'This is FAKE information added'],
          resources: ['Ethereum docs', 'Fabricated resource'],
          projects: ['Token contract', '[INVENTED project]'],
          timeline: 'Standard timeline',
          explanation: 'Blockchain path explanation'
        }
      };

      mockGroqService.refineRecommendation.mockResolvedValue(suspiciousResponse);

      const result = await llmService.refineRecommendation(
        mockBaseRecommendation,
        [],
        { experienceLevel: 'advanced' },
        'blockchain',
        'test-session-suspicious'
      );

      expect(result.llmStatus).toBe('failed');
      expect(result.baseRecommendationUsed).toBe(true);
      expect(result.roadmap.skills).toEqual(['Solidity', 'Web3']); // Fallback to base
    });

    it('should reject responses that dont reference rule trace', async () => {
      const mockRuleTrace = [
        {
          title: 'Advanced Frontend Development',
          explanation: 'Applied due to React experience',
          priority: 'high'
        }
      ];

      const responseWithoutRuleReference = {
        roadmap: {
          skills: ['Vue.js', 'Angular'],
          resources: ['Vue docs', 'Angular guide'],
          projects: ['SPA application'],
          timeline: '12 weeks frontend',
          explanation: 'Generic frontend path with no reference to the matched rules.' // Missing rule trace reference
        }
      };

      mockGroqService.refineRecommendation.mockResolvedValue(responseWithoutRuleReference);

      const result = await llmService.refineRecommendation(
        { summary: 'Frontend path', skills: ['React'] },
        mockRuleTrace,
        { experienceLevel: 'intermediate' },
        'frontend',
        'test-session-no-rule-ref'
      );

      expect(result.llmStatus).toBe('failed');
      expect(result.baseRecommendationUsed).toBe(true);
    });
  });
});