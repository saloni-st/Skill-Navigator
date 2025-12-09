require('dotenv').config();
const LLMPlanningService = require('./src/services/LLMPlanningService');

async function debugLLMExtraction() {
    console.log('🔍 Debugging LLM Extraction Process...');
    
    const llmService = new LLMPlanningService();
    
    const testAnswers = {
        education_level: 'bachelors',
        coding_experience: '2',
        weekly_hours: '10',
        web_dev_focus: 'fullstack',
        career_goal: 'job_switch',
        learning_style: ['hands_on', 'structured_course']
    };
    
    const sessionData = {
        domain: { name: 'Web Development' }
    };
    
    try {
        console.log('📝 Calling generateLearningPathFromAnswers...');
        const result = await llmService.generateLearningPathFromAnswers(testAnswers, sessionData);
        
        console.log('\n=== FINAL RESULT ===');
        console.log('Success:', result.success);
        console.log('Learning Path Keys:', Object.keys(result.learningPath || {}));
        
        if (result.learningPath) {
            console.log('\n=== LEARNING PATH DETAILS ===');
            console.log('Weekly Plan exists:', !!result.learningPath.weeklyPlan);
            console.log('Assessment exists:', !!result.learningPath.assessment);
            console.log('Career Path exists:', !!result.learningPath.careerPath);
            console.log('Real Time Resources exists:', !!result.learningPath.realTimeResources);
            
            if (result.learningPath.weeklyPlan) {
                console.log('Weekly Plan Keys:', Object.keys(result.learningPath.weeklyPlan));
                const firstWeek = Object.values(result.learningPath.weeklyPlan)[0];
                if (firstWeek) {
                    console.log('First Week Structure:', Object.keys(firstWeek));
                    console.log('First Week Topics:', firstWeek.topics);
                }
            }
            
            if (result.learningPath.careerPath) {
                console.log('Career Path Required Skills:', result.learningPath.careerPath.requiredSkills);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

debugLLMExtraction();