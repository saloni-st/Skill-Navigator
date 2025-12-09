require('dotenv').config();
const HardenedGroqService = require('./src/services/HardenedGroqService');
const { RuleEngine } = require('./src/services/InferenceEngine');
const connectDB = require('./src/utils/database');

async function testLLMWithToken() {
  console.log('🚀 Testing LLM Integration with User Token...');
  
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

  // Test sample questionnaire answers
  const sampleAnswers = {
    education_level: 'bachelors',
    coding_experience: '2', // 1-2 years
    weekly_hours: '10',     // 10 hours per week
    web_dev_focus: 'fullstack',
    career_goal: 'job_switch',
    primary_goal: 'web_development'
  };

  console.log('\n📝 Sample User Answers:', sampleAnswers);

  try {
    // Connect to database
    await connectDB();
    console.log('📊 Connected to database');
    
    // Initialize services
    const llmService = new HardenedGroqService();
    const ruleEngine = new RuleEngine();
    
    console.log('\n⚙️ Running Inference Engine...');
    const result = await ruleEngine.infer('68d8278a617d63626cb4a40f', sampleAnswers);
    
    console.log('\n📊 Inference Results:');
    console.log('Facts:', result.facts);
    console.log('Confidence:', result.metadata?.confidence);
    console.log('Matched Rules:', result.metadata?.rulesMatched || 0);
    console.log('Recommendation Preview:', result.recommendation?.summary?.substring(0, 200) + '...' || 'No summary available');

    // Test LLM refinement
    console.log('\n🤖 Testing LLM Refinement...');
    
    const refinementPrompt = `
    Based on the following user profile and initial recommendation, provide an enhanced learning path:
    
    User Profile:
    - Education: ${sampleAnswers.education_level}
    - Experience: ${sampleAnswers.coding_experience} years
    - Weekly Hours: ${sampleAnswers.weekly_hours}
    - Focus: ${sampleAnswers.web_dev_focus}
    - Goal: ${sampleAnswers.career_goal}
    
    Initial Skills: ${result.recommendation?.skills?.join(', ') || 'HTML, CSS, JavaScript'}
    
    Please provide a refined, personalized learning path with specific milestones.
    `;

    const refinedResult = await llmService.generateResponse(refinementPrompt, {
      maxTokens: 500,
      temperature: 0.7
    });

    console.log('\n✨ LLM Refined Recommendation:');
    console.log(refinedResult);

    console.log('\n✅ LLM Integration Test Completed Successfully!');
    
  } catch (error) {
    console.error('\n❌ Error during LLM testing:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testLLMWithToken().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});