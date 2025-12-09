const mongoose = require('mongoose');
require('dotenv').config();

const { Session } = require('./src/models');
const LLMPlanningService = require('./src/services/LLMPlanningService');
const InferenceEngineModule = require('./src/services/InferenceEngine');
const InferenceEngine = InferenceEngineModule.InferenceEngine;

async function processSessionWithLLM() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('📊 Connected to MongoDB');

    const sessionId = '68dadcdc28c22c54aee92e55'; // Current session from frontend
    
    // Get the session
    const session = await Session.findById(sessionId);
    if (!session) {
      console.log('❌ Session not found');
      return;
    }

    console.log('✅ Session found, status:', session.status);

    // Sample answers for web development
    const sampleAnswers = [
      {
        questionId: 'experience',
        value: 'beginner',
        questionText: 'What is your experience level?'
      },
      {
        questionId: 'goal',
        value: 'career_change',
        questionText: 'What is your primary goal?'
      },
      {
        questionId: 'time',
        value: '10-15',
        questionText: 'How many hours per week can you dedicate?'
      }
    ];

    console.log('🎯 Generating LLM learning path...');
    const llmService = new LLMPlanningService();
    const learningPath = await llmService.generateLearningPathFromAnswers(sampleAnswers, 'web-development');
    
    console.log('✅ LLM learning path generated');
    console.log('📊 Learning path keys:', Object.keys(learningPath));

    // Process with inference engine
    console.log('🔧 Processing with simple extraction...');
    
    // Update session with LLM data (convert to string to match schema)
    session.llmRecommendation = {
      roadmap: JSON.stringify(learningPath),
      llmStatus: 'completed'
    };
    
    // Simple extraction functions (since InferenceEngine doesn't exist)
    function extractSkillsFromLearningPath(learningPath) {
      const skills = [];
      const plan = learningPath.learningPath;
      
      if (plan?.weeklyPlan?.weeklyBreakdown) {
        plan.weeklyPlan.weeklyBreakdown.forEach(week => {
          if (week.topics) {
            skills.push(...week.topics);
          }
        });
      }
      
      return [...new Set(skills)]; // Remove duplicates
    }
    
    function extractResourcesFromLearningPath(learningPath) {
      const resources = [];
      const plan = learningPath.learningPath;
      
      if (plan?.weeklyPlan?.weeklyBreakdown) {
        plan.weeklyPlan.weeklyBreakdown.forEach(week => {
          if (week.dailySchedule) {
            Object.values(week.dailySchedule).forEach(day => {
              if (day.resources) {
                resources.push(...day.resources);
              }
            });
          }
        });
      }
      
      return resources;
    }
    
    function extractProjectsFromLearningPath(learningPath) {
      const projects = [];
      const plan = learningPath.learningPath;
      
      if (plan?.weeklyPlan?.weeklyBreakdown) {
        plan.weeklyPlan.weeklyBreakdown.forEach(week => {
          if (week.milestone) {
            projects.push({
              title: week.milestone,
              week: week.week,
              description: `Week ${week.week} milestone project`
            });
          }
        });
      }
      
      return projects;
    }

    // Extract skills, resources, and projects using the simple functions
    const skills = extractSkillsFromLearningPath(learningPath);
    const resources = extractResourcesFromLearningPath(learningPath);
    const projects = extractProjectsFromLearningPath(learningPath);

    console.log('📚 Extracted skills:', skills.length);
    console.log('🔗 Extracted resources:', resources.length);
    console.log('🚀 Extracted projects:', projects.length);

    // Update baseRecommendation with extracted data
    session.baseRecommendation = {
      skills: skills,
      resources: resources,
      projects: projects,
      weeklyPlan: learningPath.weeklyPlan,
      assessment: learningPath.assessment,
      careerPath: learningPath.careerPath,
      learningRecommendations: resources.map((resource, index) => ({
        id: `rec_${index}`,
        title: resource.title || resource.name || `Resource ${index + 1}`,
        description: resource.description || 'Learning resource from AI recommendation',
        type: resource.type || 'tutorial',
        url: resource.url || '',
        difficulty: resource.difficulty || 'beginner',
        estimatedTime: resource.estimatedTime || resource.duration || '1 hour',
        priority: index < 3 ? 'high' : index < 6 ? 'medium' : 'low'
      })),
      prerequisites: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        llmModel: 'deepseek-r1-distill-llama-70b',
        confidence: 0.85
      }
    };

    // Update session status
    session.status = 'completed';
    session.completedAt = new Date();

    // Save the session
    await session.save();
    console.log('✅ Session updated with LLM data');

    // Test the updated session
    console.log('\n🧪 Testing updated session...');
    const updatedSession = await Session.findById(sessionId);
    console.log('📊 BaseRecommendation skills:', updatedSession.baseRecommendation?.skills?.length || 0);
    console.log('📊 BaseRecommendation resources:', updatedSession.baseRecommendation?.resources?.length || 0);
    console.log('📊 LLM status:', updatedSession.llmRecommendation?.llmStatus);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  }
}

processSessionWithLLM();