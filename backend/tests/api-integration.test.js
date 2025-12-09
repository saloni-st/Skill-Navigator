const request = require('supertest');
const mongoose = require('mongoose');

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
const Domain = require('../src/models/Domain');
const User = require('../src/models/User');
const Rule = require('../src/models/Rule');

// Mock the LLM services
jest.mock('../src/services/HardenedLLMService');
jest.mock('../src/services/HardenedGroqService');

describe('API Integration Tests', () => {
  let testDomain;
  let testUser;
  let authToken = 'mock-jwt-token'; // Simple mock token

  const testProfiles = [
    {
      name: 'Beginner - No Experience',
      answers: {
        education_level: 'high_school',
        coding_experience: '0',
        weekly_hours: '5',
        primary_goal: 'personal_interest',
        web_dev_focus: 'frontend',
        timeframe: '6_months',
        learning_style: 'self_paced'
      },
      expectedRules: ['beginner_friendly', 'personal_interest'],
      expectedConfidenceRange: [0.2, 0.5]
    },
    {
      name: 'Backend Developer - Career Switch',
      answers: {
        education_level: 'some_college',
        coding_experience: '2',
        weekly_hours: '15',
        primary_goal: 'skill_building',
        web_dev_focus: 'backend',
        timeframe: '3_months',
        learning_style: 'hands_on'
      },
      expectedRules: ['intermediate_backend', 'skill_building'],
      expectedConfidenceRange: [0.2, 0.5]
    },
    {
      name: 'Intensive Learner - High Commitment',
      answers: {
        education_level: 'masters',
        coding_experience: '1',
        weekly_hours: '30',
        primary_goal: 'career_change',
        web_dev_focus: 'fullstack',
        timeframe: '6_months',
        learning_style: 'intensive'
      },
      expectedRules: ['intensive_high_commitment', 'career_change_support'],
      expectedConfidenceRange: [0.3, 0.6]
    },
    {
      name: 'Casual Learner - Low Hours',
      answers: {
        education_level: 'high_school',
        coding_experience: '0',
        weekly_hours: '5',
        primary_goal: 'personal_interest',
        web_dev_focus: 'frontend',
        timeframe: '12_months',
        learning_style: 'self_paced'
      },
      expectedRules: ['casual_beginner', 'personal_interest'],
      expectedConfidenceRange: [0.2, 0.4]
    },
    {
      name: 'Experienced Developer - Specialization',
      answers: {
        education_level: 'bachelors',
        coding_experience: '5',
        weekly_hours: '20',
        primary_goal: 'specialization',
        web_dev_focus: 'backend',
        timeframe: '3_months',
        learning_style: 'project_based'
      },
      expectedRules: ['experienced_specialization', 'backend_focus'],
      expectedConfidenceRange: [0.2, 0.5]
    },
    {
      name: 'Mobile App Focus',
      answers: {
        education_level: 'bachelors',
        coding_experience: '3',
        weekly_hours: '15',
        primary_goal: 'career_change',
        web_dev_focus: 'mobile',
        timeframe: '6_months',
        learning_style: 'structured'
      },
      expectedRules: ['mobile_development', 'career_change_support'],
      expectedConfidenceRange: [0.2, 0.5]
    },
    {
      name: 'Data Science Beginner',
      answers: {
        education_level: 'masters',
        coding_experience: '1',
        weekly_hours: '12',
        primary_goal: 'career_change',
        web_dev_focus: 'data_science',
        timeframe: '9_months',
        learning_style: 'structured'
      },
      expectedRules: ['data_science_beginner', 'career_change_support'],
      expectedConfidenceRange: [0.2, 0.5]
    },
    {
      name: 'Full-Stack Intermediate',
      answers: {
        education_level: 'some_college',
        coding_experience: '3',
        weekly_hours: '18',
        primary_goal: 'skill_building',
        web_dev_focus: 'fullstack',
        timeframe: '4_months',
        learning_style: 'hands_on'
      },
      expectedRules: ['fullstack_intermediate', 'skill_building'],
      expectedConfidenceRange: [0.3, 0.6]
    }
  ];

  beforeAll(async () => {
    // Setup test domain and user
    testDomain = await Domain.findOneAndUpdate(
      { name: 'Web Development' },
      { 
        name: 'Web Development',
        description: 'Full-stack web development skills',
        isActive: true
      },
      { upsert: true, new: true }
    );

    testUser = await User.findOneAndUpdate(
      { email: 'test@example.com' },
      { 
        email: 'test@example.com',
        name: 'Test User',
        isActive: true
      },
      { upsert: true, new: true }
    );

    // authToken is already set as mock token

    // Ensure we have the basic rules for testing
    const basicRules = [
      {
        name: 'beginner_friendly',
        domainId: testDomain._id,
        conditions: [{ field: 'coding_experience', operator: 'eq', value: '0' }],
        recommendations: ['Start with HTML basics', 'Learn CSS fundamentals'],
        priority: 1,
        isActive: true
      },
      {
        name: 'intermediate_backend',
        domainId: testDomain._id,
        conditions: [
          { field: 'coding_experience', operator: 'gte', value: '2' },
          { field: 'web_dev_focus', operator: 'eq', value: 'backend' }
        ],
        recommendations: ['Learn Node.js', 'Study database design'],
        priority: 2,
        isActive: true
      }
    ];

    for (const rule of basicRules) {
      await Rule.findOneAndUpdate(
        { name: rule.name, domainId: rule.domainId },
        rule,
        { upsert: true, new: true }
      );
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) await User.deleteOne({ _id: testUser._id });
    if (testDomain) {
      await Rule.deleteMany({ domainId: testDomain._id });
      await Domain.deleteOne({ _id: testDomain._id });
    }
  });

  describe('Complete User Journey Tests', () => {
    testProfiles.forEach((profile) => {
      test(`${profile.name} - Complete Journey`, async () => {
        // Step 1: Start assessment session
        const sessionResponse = await request(app)
          .post('/api/assessment/start')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ domainId: testDomain._id.toString() })
          .expect(201);

        expect(sessionResponse.body.success).toBe(true);
        expect(sessionResponse.body.data.sessionId).toBeDefined();
        const sessionId = sessionResponse.body.data.sessionId;

        // Step 2: Submit answers
        const answersResponse = await request(app)
          .post(`/api/assessment/submit-answers/${sessionId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ answers: profile.answers })
          .expect(200);

        expect(answersResponse.body.success).toBe(true);

        // Step 3: Get recommendations
        const recommendationsResponse = await request(app)
          .get(`/api/assessment/results/${sessionId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(recommendationsResponse.body.success).toBe(true);
        expect(recommendationsResponse.body.data).toBeDefined();
        
        const { confidence, appliedRules, recommendations } = recommendationsResponse.body.data;
        
        // Validate confidence is in realistic range
        expect(confidence).toBeGreaterThanOrEqual(profile.expectedConfidenceRange[0]);
        expect(confidence).toBeLessThanOrEqual(profile.expectedConfidenceRange[1]);
        
        // Validate we got some rules applied
        expect(appliedRules).toBeDefined();
        expect(Array.isArray(appliedRules)).toBe(true);
        
        // Validate we got recommendations
        expect(recommendations).toBeDefined();
        expect(Array.isArray(recommendations)).toBe(true);
      });
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle invalid session ID', async () => {
      const invalidSessionId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/assessment/results/${invalidSessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Session not found');
    });

    test('should handle missing authentication', async () => {
      const response = await request(app)
        .post('/api/assessment/start')
        .send({ domainId: testDomain._id.toString() })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle invalid domain ID', async () => {
      const invalidDomainId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post('/api/assessment/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ domainId: invalidDomainId.toString() })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    test('should complete full assessment within reasonable time', async () => {
      const startTime = Date.now();
      
      // Use a simple profile for performance testing
      const testProfile = testProfiles[0];
      
      // Complete full journey
      const sessionResponse = await request(app)
        .post('/api/assessment/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ domainId: testDomain._id.toString() });
      
      const sessionId = sessionResponse.body.data.sessionId;
      
      await request(app)
        .post(`/api/assessment/submit-answers/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answers: testProfile.answers });
      
      await request(app)
        .get(`/api/assessment/results/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });
});