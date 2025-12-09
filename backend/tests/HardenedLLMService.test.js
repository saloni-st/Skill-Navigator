const HardenedLLMService = require('../src/services/HardenedLLMService');
const { debugLoggers } = require('../src/utils/debugLogger');

// Mock Groq SDK
jest.mock('groq-sdk');
const Groq = require('groq-sdk');

// Mock debug logger
jest.mock('../src/utils/debugLogger', () => ({
  debugLoggers: {
    llm: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }
  }
}));

describe('HardenedLLMService', () => {
  let service;
  let mockGroq;
  let mockChatCompletions;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Groq mocks
    mockChatCompletions = {
      create: jest.fn()
    };
    
    mockGroq = {
      chat: {
        completions: mockChatCompletions
      }
    };
    
    Groq.mockImplementation(() => mockGroq);
    
    // Set API key for tests
    process.env.GROQ_API_KEY = 'test-api-key';
    
    service = new HardenedLLMService();
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  describe('Initialization', () => {
    test('should initialize with Groq API key', () => {
      expect(Groq).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
      expect(service.groq).toBe(mockGroq);
    });

    test('should handle missing API key gracefully', () => {
      delete process.env.GROQ_API_KEY;
      const serviceWithoutKey = new HardenedLLMService();
      expect(serviceWithoutKey.groq).toBeNull();
    });

    test('should set correct configuration constants', () => {
      expect(service.MAX_RETRIES).toBe(3);
      expect(service.TIMEOUT_MS).toBe(30000);
      expect(service.MAX_CONTEXT_LENGTH).toBe(4000);
      expect(service.MAX_USER_INPUT_LENGTH).toBe(500);
    });
  });

  describe('Input Sanitization - Step B', () => {
    test('should sanitize user profile correctly', () => {
      const mockSession = {
        profile: {
          domain: 'Web Development with <script>alert("xss")</script>',
          experienceYears: '3.5',
          educationLevel: 'bachelors',
          focusArea: 'frontend',
          careerGoal: 'job_switch',
          weeklyCommitment: '15',
          learningStyle: ['visual', 'hands_on', 'invalid_style']
        }
      };

      const sanitized = service.sanitizeUserProfile(mockSession);

      expect(sanitized.domain).toBe('Web Development with alert("xss")');
      expect(sanitized.experienceYears).toBe(3);
      expect(sanitized.educationLevel).toBe('bachelors');
      expect(sanitized.focusArea).toBe('frontend');
      expect(sanitized.careerGoal).toBe('job_switch');
      expect(sanitized.weeklyCommitment).toBe(15);
      expect(sanitized.learningStyle).toEqual(['visual', 'hands_on']);
    });

    test('should handle empty user profile', () => {
      const mockSession = { profile: {} };
      const sanitized = service.sanitizeUserProfile(mockSession);

      expect(sanitized.domain).toBe('');
      expect(sanitized.experienceYears).toBe(0);
      expect(sanitized.educationLevel).toBe('high_school');
      expect(sanitized.focusArea).toBe('frontend');
    });

    test('should sanitize inference trace', () => {
      const mockTrace = {
        appliedRules: Array(15).fill('test rule'), // More than limit
        matchCount: '42.7'
      };

      const sanitized = service.sanitizeInferenceTrace(mockTrace);

      expect(sanitized.appliedRules).toHaveLength(10); // Capped at 10
      expect(sanitized.matchCount).toBe(42);
    });

    test('should handle null inference trace', () => {
      const sanitized = service.sanitizeInferenceTrace(null);
      
      expect(sanitized.appliedRules).toEqual([]);
      expect(sanitized.matchCount).toBe(0);
    });
  });

  describe('Utility Sanitization Methods', () => {
    test('sanitizeString should remove dangerous characters', () => {
      const input = '<script>alert("xss")</script>javascript:void(0)onclick="alert(1)"';
      const result = service.sanitizeString(input, 100);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('onclick=');
    });

    test('sanitizeNumber should enforce bounds', () => {
      expect(service.sanitizeNumber('5', 0, 10)).toBe(5);
      expect(service.sanitizeNumber('-5', 0, 10)).toBe(0);
      expect(service.sanitizeNumber('15', 0, 10)).toBe(10);
      expect(service.sanitizeNumber('invalid', 0, 10)).toBe(0);
    });

    test('sanitizeEnum should validate allowed values', () => {
      const allowed = ['frontend', 'backend', 'fullstack'];
      
      expect(service.sanitizeEnum('frontend', allowed)).toBe('frontend');
      expect(service.sanitizeEnum('invalid', allowed)).toBe('frontend');
    });

    test('sanitizeArray should filter and limit items', () => {
      const allowed = ['a', 'b', 'c'];
      const input = ['a', 'invalid', 'b', 'c', 'invalid2'];
      
      const result = service.sanitizeArray(input, allowed);
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Safe Prompt Engineering - Step A', () => {
    test('should build structured prompt with system instructions', () => {
      const mockProfile = {
        domain: 'Web Development',
        experienceYears: 2,
        educationLevel: 'bachelors',
        focusArea: 'frontend'
      };

      const mockRecommendation = {
        skills: ['JavaScript', 'React', 'CSS'],
        resources: ['MDN Web Docs', 'React Documentation'],
        projects: ['Todo App', 'Portfolio Website'],
        timeline: '12 weeks'
      };

      const mockTrace = {
        appliedRules: ['rule1', 'rule2'],
        matchCount: 5
      };

      const prompt = service.buildSafePrompt(mockProfile, mockRecommendation, mockTrace);

      expect(prompt.messages).toHaveLength(2);
      expect(prompt.messages[0].role).toBe('system');
      expect(prompt.messages[0].content).toContain('career guidance counselor');
      expect(prompt.messages[1].role).toBe('user');
      expect(prompt.messages[1].content).toContain('JavaScript, React, CSS');
    });

    test('should enforce context limits', () => {
      const longPrompt = 'a'.repeat(5000); // Exceeds MAX_CONTEXT_LENGTH
      const truncated = service.enforceContextLimits(longPrompt);
      
      expect(truncated.length).toBeLessThanOrEqual(service.MAX_CONTEXT_LENGTH);
    });

    test('should truncate at sentence boundaries when possible', () => {
      const promptWithSentences = 'First sentence. Second sentence. ' + 'a'.repeat(4000);
      const truncated = service.enforceContextLimits(promptWithSentences);
      
      expect(truncated).toMatch(/\.$$/); // Should end with period
    });
  });

  describe('LLM Response Validation - Step C', () => {
    test('should validate correct LLM response', () => {
      const mockResponse = JSON.stringify({
        prioritySkills: '• JavaScript fundamentals\n• React components',
        learningResources: '• MDN Web Docs\n• React official tutorial',
        practiceProjects: '• Todo application\n• Personal portfolio',
        timeline: 'Week 1-2: JavaScript basics\nWeek 3-4: React introduction',
        whyThisPath: 'This path builds fundamental skills progressively.',
        assumptions: 'User has basic HTML/CSS knowledge.'
      });

      const mockBase = { skills: ['JavaScript'] };
      const result = service.validateLLMResponse(mockResponse, mockBase);

      expect(result.prioritySkills).toContain('JavaScript');
      expect(result.fallback).toBe(false);
      expect(result.validationPassed).toBe(true);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    test('should reject response missing required fields', () => {
      const incompleteResponse = JSON.stringify({
        prioritySkills: '• JavaScript',
        // Missing other required fields
      });

      const mockBase = { skills: ['JavaScript'] };
      
      expect(() => {
        service.validateLLMResponse(incompleteResponse, mockBase);
      }).toThrow('Invalid or missing field');
    });

    test('should reject response with too short fields', () => {
      const shortResponse = JSON.stringify({
        prioritySkills: 'JS', // Too short
        learningResources: 'Very brief content here for testing',
        practiceProjects: 'Short project description here',
        timeline: 'Week 1: Basic setup and learning',
        whyThisPath: 'Brief explanation of the path',
        assumptions: 'Basic assumptions about the user'
      });

      const mockBase = { skills: ['JavaScript'] };
      
      expect(() => {
        service.validateLLMResponse(shortResponse, mockBase);
      }).toThrow('Invalid or missing field: prioritySkills');
    });

    test('should reject non-JSON response', () => {
      const nonJsonResponse = 'This is not a JSON response';
      const mockBase = { skills: ['JavaScript'] };
      
      expect(() => {
        service.validateLLMResponse(nonJsonResponse, mockBase);
      }).toThrow('No JSON found in LLM response');
    });

    test('should handle malformed JSON', () => {
      const malformedJson = '{"prioritySkills": "test", "invalid": }';
      const mockBase = { skills: ['JavaScript'] };
      
      expect(() => {
        service.validateLLMResponse(malformedJson, mockBase);
      }).toThrow('Response validation failed');
    });
  });

  describe('Retry Logic and Circuit Breaker - Step C', () => {
    test('should succeed on first attempt', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              prioritySkills: '• JavaScript fundamentals and core concepts',
              learningResources: '• MDN Web Docs for comprehensive reference',
              practiceProjects: '• Build a todo application with vanilla JS',
              timeline: 'Week 1-2: JavaScript basics and syntax overview',
              whyThisPath: 'This path provides solid foundation for web development',
              assumptions: 'User has basic computer literacy and motivation'
            })
          }
        }]
      };

      mockChatCompletions.create.mockResolvedValueOnce(mockResponse);

      const prompt = { messages: [] };
      const result = await service.executeWithRetry(prompt, 'test-op');

      expect(mockChatCompletions.create).toHaveBeenCalledTimes(1);
      expect(result).toContain('prioritySkills');
    });

    test('should retry on failure and eventually succeed', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              prioritySkills: '• JavaScript fundamentals and core concepts',
              learningResources: '• MDN Web Docs for comprehensive reference',
              practiceProjects: '• Build a todo application with vanilla JS',
              timeline: 'Week 1-2: JavaScript basics and syntax overview',
              whyThisPath: 'This path provides solid foundation for web development',
              assumptions: 'User has basic computer literacy and motivation'
            })
          }
        }]
      };

      mockChatCompletions.create
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(mockResponse);

      const prompt = { messages: [] };
      const result = await service.executeWithRetry(prompt, 'test-op');

      expect(mockChatCompletions.create).toHaveBeenCalledTimes(2);
      expect(result).toContain('prioritySkills');
    });

    test('should fail after max retries', async () => {
      mockChatCompletions.create.mockRejectedValue(new Error('Persistent API Error'));

      const prompt = { messages: [] };
      
      await expect(service.executeWithRetry(prompt, 'test-op')).rejects.toThrow(
        'LLM failed after 3 attempts'
      );

      expect(mockChatCompletions.create).toHaveBeenCalledTimes(3);
    });

    test('should handle invalid response structure', async () => {
      const invalidResponse = {
        choices: [] // Empty choices array
      };

      mockChatCompletions.create.mockResolvedValueOnce(invalidResponse);

      const prompt = { messages: [] };
      
      await expect(service.executeWithRetry(prompt, 'test-op')).rejects.toThrow(
        'Invalid response structure from LLM'
      );
    });
  });

  describe('Fallback Response Creation', () => {
    test('should create fallback with base recommendation data', () => {
      const mockBase = {
        skills: ['JavaScript', 'React', 'Node.js'],
        resources: ['MDN Web Docs', 'React Docs', 'Node.js Guide'],
        projects: ['Todo App', 'Blog Platform'],
        timeline: '12 weeks total'
      };

      const mockTrace = {
        appliedRules: ['rule1', 'rule2'],
        matchCount: 5
      };

      const fallback = service.createFallbackResponse(mockBase, mockTrace, 'api_timeout');

      expect(fallback.prioritySkills).toContain('JavaScript');
      expect(fallback.learningResources).toContain('MDN Web Docs');
      expect(fallback.practiceProjects).toContain('Todo App');
      expect(fallback.timeline).toBe('12 weeks total');
      expect(fallback.fallback).toBe(true);
      expect(fallback.fallbackReason).toBe('api_timeout');
    });

    test('should create fallback with defaults when base is empty', () => {
      const emptyBase = {};
      const emptyTrace = {};

      const fallback = service.createFallbackResponse(emptyBase, emptyTrace, 'no_data');

      expect(fallback.prioritySkills).toContain('Fundamental programming');
      expect(fallback.learningResources).toContain('Official documentation');
      expect(fallback.practiceProjects).toContain('personal portfolio');
      expect(fallback.timeline).toContain('Week 1-2');
      expect(fallback.fallback).toBe(true);
    });
  });

  describe('End-to-End Refinement', () => {
    test('should complete full refinement successfully', async () => {
      const mockSession = {
        id: 'test-session',
        profile: {
          domain: 'Web Development',
          experienceYears: 2,
          educationLevel: 'bachelors',
          focusArea: 'frontend',
          careerGoal: 'job_switch',
          weeklyCommitment: 15,
          learningStyle: ['visual', 'hands_on']
        }
      };

      const mockBase = {
        skills: ['JavaScript', 'React'],
        resources: ['MDN', 'React Docs'],
        projects: ['Todo App'],
        timeline: '8 weeks'
      };

      const mockTrace = {
        appliedRules: ['rule1'],
        matchCount: 3
      };

      const mockLLMResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              prioritySkills: '• JavaScript ES6+ features and modern syntax\n• React components and hooks',
              learningResources: '• MDN Web Docs for JavaScript reference\n• Official React documentation',
              practiceProjects: '• Interactive todo application with state management\n• Personal portfolio website',
              timeline: 'Week 1-2: JavaScript fundamentals\nWeek 3-4: React basics\nWeek 5-6: State management\nWeek 7-8: Portfolio project',
              whyThisPath: 'This path builds solid frontend foundations with practical projects.',
              assumptions: 'User has basic HTML/CSS knowledge and wants to transition careers.'
            })
          }
        }]
      };

      mockChatCompletions.create.mockResolvedValueOnce(mockLLMResponse);

      const result = await service.refineRecommendation(mockSession, mockBase, mockTrace);

      expect(result.prioritySkills).toContain('JavaScript ES6+');
      expect(result.fallback).toBe(false);
      expect(result.validationPassed).toBe(true);
      expect(debugLoggers.llm.info).toHaveBeenCalledWith(
        'LLM refinement completed successfully',
        expect.any(Object)
      );
    });

    test('should return fallback when LLM unavailable', async () => {
      service.groq = null; // Simulate no LLM

      const mockSession = { id: 'test-session', profile: {} };
      const mockBase = { skills: ['JavaScript'] };
      const mockTrace = {};

      const result = await service.refineRecommendation(mockSession, mockBase, mockTrace);

      expect(result.fallback).toBe(true);
      expect(result.fallbackReason).toBe('llm_unavailable');
      expect(debugLoggers.llm.warn).toHaveBeenCalledWith(
        'LLM unavailable - returning fallback',
        expect.any(Object)
      );
    });

    test('should return fallback when LLM fails validation', async () => {
      const mockSession = {
        id: 'test-session',
        profile: { domain: 'Web Development' }
      };
      
      const mockBase = { skills: ['JavaScript'] };
      const mockTrace = {};

      // Mock invalid response
      const invalidResponse = {
        choices: [{
          message: {
            content: 'Invalid non-JSON response from LLM'
          }
        }]
      };

      mockChatCompletions.create.mockResolvedValueOnce(invalidResponse);

      const result = await service.refineRecommendation(mockSession, mockBase, mockTrace);

      expect(result.fallback).toBe(true);
      expect(result.fallbackReason).toBe('llm_error');
      expect(debugLoggers.llm.error).toHaveBeenCalledWith(
        'LLM refinement failed - using fallback',
        expect.any(Object)
      );
    });
  });

  describe('Health Check', () => {
    test('should return correct health status', async () => {
      const health = await service.healthCheck();

      expect(health.llmAvailable).toBe(true);
      expect(health.apiKeyConfigured).toBe(true);
      expect(health.maxRetries).toBe(3);
      expect(health.timeoutMs).toBe(30000);
      expect(health.contextLimits.maxContext).toBe(4000);
    });

    test('should reflect LLM unavailable status', async () => {
      service.groq = null;
      delete process.env.GROQ_API_KEY;

      const health = await service.healthCheck();

      expect(health.llmAvailable).toBe(false);
      expect(health.apiKeyConfigured).toBe(false);
    });
  });

  describe('Label Formatting', () => {
    test('should format education labels correctly', () => {
      expect(service.getEducationLabel('bachelors')).toBe('Bachelor\'s Degree');
      expect(service.getEducationLabel('invalid')).toBe('Not specified');
    });

    test('should format experience labels correctly', () => {
      expect(service.getExperienceLabel(0)).toBe('Complete Beginner');
      expect(service.getExperienceLabel(1)).toBe('Beginner (0-2 years)');
      expect(service.getExperienceLabel(3)).toBe('Intermediate (2-5 years)');
      expect(service.getExperienceLabel(10)).toBe('Advanced (5+ years)');
    });

    test('should format commitment labels correctly', () => {
      expect(service.getCommitmentLabel(3)).toBe('Light (≤5 hours/week)');
      expect(service.getCommitmentLabel(10)).toBe('Moderate (6-15 hours/week)');
      expect(service.getCommitmentLabel(20)).toBe('Serious (16-25 hours/week)');
      expect(service.getCommitmentLabel(30)).toBe('Intensive (25+ hours/week)');
    });
  });
});