const request = require('supertest');
const mongoose = require('mongoose');

// Mock LLM service for predictable testing
jest.mock('../src/services/HardenedGroqService');

// Mock auth middleware BEFORE importing app
jest.mock('../src/middleware/auth', () => ({
  authMiddleware: jest.fn((req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      req.user = { 
        _id: '507f1f77bcf86cd799439011', // Mock ObjectId string
        id: '507f1f77bcf86cd799439011',
        email: 'testuser@example.com',
        name: 'Test User'
      };
      return next();
    }
    return res.status(401).json({ success: false, message: 'No token provided' });
  }),
  adminMiddleware: jest.fn((req, res, next) => next()),
  auditMiddleware: jest.fn(() => (req, res, next) => next())
}));

const app = require('../src/app');
const { User, Session, Domain, Rule } = require('../src/models');
const HardenedGroqService = require('../src/services/HardenedGroqService');

// Increase timeout for API tests
jest.setTimeout(30000);

describe('API Integration Tests - Fixed Expectations', () => {
  let mockUser, authToken, testDomain;

  // Test profiles with REALISTIC confidence expectations
  const testProfiles = [
    {
      name: 'Complete Beginner - Career Changer',
      answers: {
        education_level: 'high_school',
        coding_experience: '0',
        weekly_hours: '20',
        primary_goal: 'career_change',
        web_dev_focus: 'fullstack',
        timeframe: '12_months',
        learning_style: 'structured'
      },
      expectedConfidenceRange: [0.2, 0.5] // Realistic for beginners
    },
    {
      name: 'Some Experience - Skill Builder',
      answers: {
        education_level: 'some_college',
        coding_experience: '2',
        weekly_hours: '15',
        primary_goal: 'skill_building',
        web_dev_focus: 'frontend',
        timeframe: '6_months',
        learning_style: 'hands_on'
      },
      expectedConfidenceRange: [0.2, 0.5]
    },
    {
      name: 'Intensive Learner - High Commitment',
      answers: {
        education_level: 'bachelors',
        coding_experience: '3',
        weekly_hours: '35',
        primary_goal: 'career_change',
        web_dev_focus: 'fullstack',
        timeframe: '6_months',
        learning_style: 'structured'
      },
      expectedConfidenceRange: [0.3, 0.6] // Higher commitment = better matching
    },
    {
      name: 'Casual Learner - Low Hours',
      answers: {
        education_level: 'high_school',
        coding_experience: '1',
        weekly_hours: '5',
        primary_goal: 'hobby',
        web_dev_focus: 'frontend',
        timeframe: '12_months',
        learning_style: 'flexible'
      },
      expectedConfidenceRange: [0.2, 0.4] // Low commitment = lower confidence
    }
  ];

  beforeAll(async () => {
    // Set up HardenedGroqService mock
    HardenedGroqService.mockImplementation(() => ({
      refineRecommendation: jest.fn().mockResolvedValue({
        success: true,
        llmStatus: 'success',
        explanation: 'Mock refined recommendation based on your profile.',
        learningPath: 'Mock learning path with structured approach.',
        nextSteps: ['Mock step 1', 'Mock step 2'],
        resources: ['Mock resource 1', 'Mock resource 2'],
        timeline: 'Mock 16-20 weeks timeline'
      }),
      answerClarifyingQuestion: jest.fn().mockResolvedValue({
        success: true,
        answer: 'Mock clarifying response'
      })
    }));

    // Create test domain
    testDomain = await Domain.create({
      name: 'Web Development Test',
      description: 'Test domain for API integration',
      questionSetId: new mongoose.Types.ObjectId(),
      isActive: true
    });
  });

  afterAll(async () => {
    // Clean up
    await Session.deleteMany({});
    await Domain.deleteMany({});
    await mongoose.disconnect();
  });

  describe('Happy Path - Complete Flow (Fixed)', () => {
    testProfiles.forEach((profile) => {
      test(`should complete full flow for ${profile.name}`, async () => {
        const authToken = 'Bearer mock-token';

        // Step 1: Create session
        const sessionResponse = await request(app)
          .post('/api/sessions')
          .set('Authorization', authToken)
          .send({ domainId: testDomain._id })
          .expect(201);

        expect(sessionResponse.body.success).toBe(true);
        const sessionId = sessionResponse.body.data.sessionId;
        expect(sessionId).toBeDefined();

        // Step 2: Submit answers
        const answersResponse = await request(app)
          .put(`/api/sessions/${sessionId}/submit`)
          .set('Authorization', authToken)
          .send({ answers: profile.answers })
          .expect(200);

        expect(answersResponse.body.success).toBe(true);

        // Step 3: Generate recommendation
        const recommendResponse = await request(app)
          .post(`/api/inference/${sessionId}/recommend`)
          .set('Authorization', authToken)
          .expect(200);

        expect(recommendResponse.body.success).toBe(true);
        expect(recommendResponse.body.data.confidence).toBeDefined();
        expect(recommendResponse.body.data.confidence).toBeGreaterThanOrEqual(profile.expectedConfidenceRange[0]);
        expect(recommendResponse.body.data.confidence).toBeLessThanOrEqual(profile.expectedConfidenceRange[1]);

        // Step 4: Get session results
        const resultsResponse = await request(app)
          .get(`/api/results/${sessionId}`)
          .set('Authorization', authToken)
          .expect(200);

        expect(resultsResponse.body.success).toBe(true);
        expect(resultsResponse.body.data.sessionId).toBeDefined();
        expect(resultsResponse.body.data.session.id).toBeDefined();
      });
    });
  });

  describe('Error Handling (Fixed)', () => {
    test('should return error for non-existent session', async () => {
      const fakeSessionId = new mongoose.Types.ObjectId();
      const authToken = 'Bearer mock-token';

      const response = await request(app)
        .post(`/api/inference/${fakeSessionId}/recommend`)
        .set('Authorization', authToken)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Session not found');
    });

    test('should require authentication for all endpoints', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({ domainId: testDomain._id })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });
  });

  describe('System Performance', () => {
    test('should handle session creation and completion within reasonable time', async () => {
      const authToken = 'Bearer mock-token';
      const startTime = Date.now();

      // Full flow
      const sessionResponse = await request(app)
        .post('/api/sessions')
        .set('Authorization', authToken)
        .send({ domainId: testDomain._id })
        .expect(201);

      const sessionId = sessionResponse.body.data.sessionId;

      await request(app)
        .put(`/api/sessions/${sessionId}/submit`)
        .set('Authorization', authToken)
        .send({ answers: testProfiles[0].answers })
        .expect(200);

      await request(app)
        .post(`/api/inference/${sessionId}/recommend`)
        .set('Authorization', authToken)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
    });
  });
});