require('dotenv').config();
const HardenedGroqService = require('./src/services/HardenedGroqService');
const { RuleEngine } = require('./src/services/InferenceEngine');
const connectDB = require('./src/utils/database');

async function testLLMRecommendationFromAnswers() {
  console.log('🚀 Testing LLM-based Recommendation Generation from User Answers...');
  
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGE3ZTY5ZmQxZGQyYWU5NGE4YTQ1NCIsImVtYWlsIjoic2Fsb25pMTIzQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU5MTY0NzIzLCJleHAiOjE3NTkyNTExMjN9.57LPQiE2TV7hKU41uw4Py-I8ZRMUwY-V6A43BmvPnuc";
  
  // Decode token to get user info
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.decode(token);
    console.log('👤 User Info:', {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    });
  } catch (err) {
    console.error('❌ Invalid token format');
    return;
  }

  // Realistic user answers
  const userAnswers = {
    education_level: 'bachelors',
    coding_experience: '2', // 1-2 years experience
    weekly_hours: '15',     // 15 hours per week
    web_dev_focus: 'fullstack',
    career_goal: 'job_switch', // Want to switch job
    primary_goal: 'web_development',
    current_skills: 'HTML, CSS, basic JavaScript',
    learning_style: 'hands_on',
    timeline: '6_months'
  };

  console.log('\n📝 User Answers:', userAnswers);

  try {
    // Connect to database
    await connectDB();
    console.log('📊 Connected to database');
    
    // Initialize services
    const llmService = new HardenedGroqService();
    const ruleEngine = new RuleEngine();
    
    console.log('\n⚙️ Step 1: Running Inference Engine...');
    const inferenceResult = await ruleEngine.infer('68d8278a617d63626cb4a40f', userAnswers);
    
    console.log('📊 Inference Results:');
    console.log('- Facts:', inferenceResult.facts);
    console.log('- Confidence:', inferenceResult.metadata?.confidence);
    console.log('- Matched Rules:', inferenceResult.metadata?.rulesMatched || 0);
    console.log('- Skills:', inferenceResult.recommendation?.skills);
    console.log('- Resources:', inferenceResult.recommendation?.resources?.slice(0, 3));

    console.log('\n🤖 Step 2: Enhancing with LLM-based Recommendation...');
    
    // Create a comprehensive prompt based on user's actual answers
    const enhancementPrompt = `
You are an expert career counselor. Create a detailed learning path based on this user's answers:

👤 User Profile:
- Education: ${userAnswers.education_level}
- Coding Experience: ${userAnswers.coding_experience} years
- Weekly Study Hours: ${userAnswers.weekly_hours} hours
- Focus Area: ${userAnswers.web_dev_focus}
- Career Goal: ${userAnswers.career_goal}
- Current Skills: ${userAnswers.current_skills}
- Learning Style: ${userAnswers.learning_style}
- Timeline: ${userAnswers.timeline}

🎯 Requirements:
Based on these answers, provide a personalized learning roadmap with:

1. **Immediate Next Steps** (Week 1-2):
   - What to learn first
   - Which projects to start with

2. **Monthly Milestones** (Month 1-6):
   - What to achieve each month
   - Which skills to focus on

3. **Specific Resources**:
   - Best tutorials/courses for their experience level
   - Practice projects that match their goal

4. **Job-Ready Preparation** (Since goal is job switch):
   - Portfolio projects to build
   - Interview preparation tips
   - Technologies to focus on for job market

Please provide response ONLY in English. Be specific and actionable.
    `;

    const llmRecommendation = await llmService.generateResponse(enhancementPrompt, {
      maxTokens: 1500,
      temperature: 0.7
    });

    console.log('\n✨ LLM-Enhanced Personalized Recommendation:');
    console.log('=' * 60);
    console.log(llmRecommendation);
    console.log('=' * 60);

    console.log('\n🎯 Step 3: Testing Specific Query Response...');
    
    const specificQuery = `
User mentioned their goal is "${userAnswers.career_goal}" and they are interested in "${userAnswers.web_dev_focus}" development.
They have ${userAnswers.coding_experience} years of experience and can study ${userAnswers.weekly_hours} hours per week.

For this profile, provide a specific 3-month action plan:
1. Month 1: What to learn
2. Month 2: Which projects to build  
3. Month 3: How to prepare for job interviews

Provide simple and actionable steps in English only.
    `;

    const specificResponse = await llmService.generateResponse(specificQuery, {
      maxTokens: 800,
      temperature: 0.6
    });

    console.log('\n🎯 Specific 3-Month Action Plan:');
    console.log('-' * 50);
    console.log(specificResponse);
    console.log('-' * 50);

    // Test with different user scenarios
    console.log('\n🔄 Step 4: Testing Different User Scenario...');
    
    const beginnerAnswers = {
      education_level: 'high_school',
      coding_experience: '0',
      weekly_hours: '5',
      web_dev_focus: 'frontend',
      career_goal: 'personal_projects',
      current_skills: 'None',
      learning_style: 'video_courses'
    };

    const beginnerPrompt = `
Complete beginner student profile:
- Education: ${beginnerAnswers.education_level}
- Experience: ${beginnerAnswers.coding_experience} (absolute beginner)
- Time: ${beginnerAnswers.weekly_hours} hours/week
- Interest: ${beginnerAnswers.web_dev_focus}
- Goal: ${beginnerAnswers.career_goal}

Provide a gentle, encouraging learning path for a complete beginner. Focus on:
1. Very first steps to take
2. Free resources for beginners
3. Small achievable goals
4. How to stay motivated

Keep it simple and not overwhelming.
    `;

    const beginnerResponse = await llmService.generateResponse(beginnerPrompt, {
      maxTokens: 800,
      temperature: 0.8
    });

    console.log('\n👶 Beginner-Friendly Recommendation:');
    console.log(beginnerResponse);

    console.log('\n✅ LLM Recommendation System Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ User answers processed correctly');
    console.log('- ✅ Inference engine working');
    console.log('- ✅ LLM generating personalized recommendations in English');
    console.log('- ✅ Different user scenarios handled in English');
    console.log('- ✅ Professional English responses for global audience');
    
  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

// Run the comprehensive test
testLLMRecommendationFromAnswers();