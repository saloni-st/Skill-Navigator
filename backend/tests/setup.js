/**
 * Jest Test Setup
 * Phase 3 - Automated Test Suite Setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/skillnavigator_test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.GROQ_API_KEY = 'test-groq-api-key';
process.env.GROQ_MODEL = 'deepseek-r1-distill-llama-70b';
process.env.ENABLE_LLM_REFINEMENT = 'true';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.testHelpers = {
  createMockUser: () => ({
    _id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isVerified: true
  }),

  createMockSession: () => ({
    _id: 'test-session-id',
    userId: 'test-user-id',
    domainId: 'test-domain-id',
    status: 'in_progress',
    answers: new Map(),
    createdAt: new Date(),
    updatedAt: new Date()
  }),

  createMockRecommendation: () => ({
    summary: 'Test learning path for web development',
    skills: ['HTML', 'CSS', 'JavaScript'],
    timeline: '12 weeks structured learning',
    difficulty: 'beginner',
    metadata: {
      confidence: 0.75,
      appliedRules: ['rule_1', 'rule_2'],
      rulesEvaluated: 5,
      rulesMatched: 2
    }
  }),

  createMockRuleScore: (overrides = {}) => ({
    ruleId: 'test-rule-id',
    title: 'Test Rule',
    priority: 'high',
    weight: 0.8,
    matchStrength: 1.0,
    ruleScore: 1.2,
    ...overrides
  })
};

// Console output suppression for cleaner test output
const originalConsole = console;
global.console = {
  ...originalConsole,
  // Suppress routine log messages during tests
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error and debug for troubleshooting
  error: originalConsole.error,
  debug: originalConsole.debug
};

// Cleanup function for tests
global.afterEach(() => {
  jest.clearAllMocks();
});

// Graceful error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});