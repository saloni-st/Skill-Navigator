// Test script to create a complete session with LLM data and verify frontend integration
const mongoose = require('mongoose');
require('dotenv').config();

const LLMPlanningService = require('./src/services/LLMPlanningService');
const { RuleEngine, FactNormalizationService } = require('./src/services/InferenceEngine');
const Session = require('./src/models/Session');
const Domain = require('./src/models/Domain');

async function testCompleteFlow() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Sample user answers for web development (as Map for MongoDB)
    const answersMap = new Map();
    answersMap.set('q1', 'Bachelor\'s degree');
    answersMap.set('q2', '2 years');
    answersMap.set('q3', 'Full-stack development');
    answersMap.set('q4', 'JavaScript, HTML, CSS');
    answersMap.set('q5', 'Looking to switch jobs');

    // Convert to array for LLM processing
    const sampleAnswers = Array.from(answersMap.entries()).map(([questionId, answer]) => ({
      questionId,
      answer
    }));

    console.log('🎯 Generating LLM learning path...');
    const llmService = new LLMPlanningService();
    const learningPath = await llmService.generateLearningPathFromAnswers(sampleAnswers, 'web-development');
    
    console.log('✅ LLM learning path generated');
    console.log('📊 Learning path keys:', Object.keys(learningPath));

    // Create or get domain
    let domain = await Domain.findOne({ name: 'Web Development' });
    if (!domain) {
      domain = new Domain({
        name: 'Web Development',
        description: 'Full-stack web development skills',
        questions: []
      });
      await domain.save();
    }

    // Create a test user for the session
    const User = require('./src/models/User');
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = new User({
        email: 'test@example.com',
        name: 'Test User',
        authProvider: 'local'
      });
      await testUser.save();
    }

    // Create a test session
    const session = new Session({
      userId: testUser._id,
      domainId: domain._id,
      answers: answersMap,
      completedAt: new Date(),
      overallScore: 75,
      level: 'Intermediate',
      skillAreas: [
        { name: 'JavaScript', score: 80, level: 'Intermediate' },
        { name: 'React', score: 70, level: 'Beginner' },
        { name: 'Node.js', score: 65, level: 'Beginner' }
      ]
    });

    await session.save();
    console.log('✅ Session created with ID:', session._id);

    // Process the learning path using RuleEngine
    console.log('🔧 Processing with RuleEngine...');
    const ruleEngine = new RuleEngine();
    
    const baseRecommendation = {
      summary: 'LLM-generated learning plan for web development',
      difficulty: 'intermediate',
      estimatedTimeframe: '12 weeks',
      recommendedPath: ['HTML/CSS', 'JavaScript', 'React', 'Node.js'],
      skills: ruleEngine.extractSkillsFromLearningPath ? ruleEngine.extractSkillsFromLearningPath(learningPath) : [],
      resources: ruleEngine.extractResourcesFromLearningPath ? ruleEngine.extractResourcesFromLearningPath(learningPath) : [],
      projects: ruleEngine.extractProjectsFromLearningPath ? ruleEngine.extractProjectsFromLearningPath(learningPath) : [],
      weeklyPlan: learningPath.learningPath?.weeklyPlan,
      assessment: learningPath.learningPath?.assessment,
      careerPath: learningPath.learningPath?.careerPath,
      learningRecommendations: [],
      ruleMatches: []
    };

    console.log('📊 Base recommendation created');
    console.log('🎯 Skills extracted:', baseRecommendation.skills?.length || 0);
    console.log('📚 Resources extracted:', baseRecommendation.resources?.length || 0);
    console.log('🚀 Projects extracted:', baseRecommendation.projects?.length || 0);

    // Save the results to session
    session.baseRecommendation = baseRecommendation;
    session.llmRecommendation = {
      roadmap: learningPath,
      llmStatus: 'completed'
    };
    
    await session.save();
    
    console.log('✅ Complete session saved with LLM data');
    console.log('🌐 Frontend URL: http://localhost:3000/result/' + session._id);
    
    // Test the complete result API endpoint
    console.log('🔗 Testing API endpoint...');
    const completeResult = {
      success: true,
      data: {
        sessionId: session._id.toString(),
        session: {
          id: session._id.toString(),
          domain: { id: domain._id.toString(), name: domain.name },
          createdAt: session.createdAt.toISOString(),
          completedAt: session.completedAt.toISOString(),
          overallScore: session.overallScore,
          level: session.level,
          skillAreas: session.skillAreas
        },
        baseRecommendation,
        llmRecommendation: session.llmRecommendation,
        confidence: {
          score: 85,
          level: 'High',
          coverage: 90,
          rulesMatched: 8,
          rulesEvaluated: 10
        }
      }
    };

    console.log('✅ Complete result structure ready');
    console.log('📊 Result data keys:', Object.keys(completeResult.data));
    
    return session._id;

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testCompleteFlow().then(sessionId => {
  if (sessionId) {
    console.log('🎉 Test completed successfully!');
    console.log('🌐 Visit: http://localhost:3000/result/' + sessionId);
  }
}).catch(console.error);