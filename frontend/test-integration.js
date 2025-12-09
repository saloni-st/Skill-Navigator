// Test script to verify the frontend is working correctly
const testDomainQuestions = async () => {
  const baseURL = 'http://localhost:3000';
  
  // Test if the API endpoint is accessible
  try {
    console.log('🧪 Testing Frontend API Integration...\n');
    
    // Test the three domains
    const domains = [
      { id: '68d8278a617d63626cb4a40f', name: 'Web Development' },
      { id: '68d85afdf29ae039c6022acf', name: 'Cybersecurity' },  
      { id: '68d85b2700709ff6946998dd', name: 'Data Science' }
    ];
    
    for (const domain of domains) {
      console.log(`🔍 Testing ${domain.name} (${domain.id}):`);
      
      try {
        const response = await fetch(`http://localhost:3001/api/domains/${domain.id}/questions`);
        const data = await response.json();
        
        if (data.success && data.data.questions) {
          console.log(`  ✅ ${data.data.questions.length} questions loaded`);
          console.log(`  📝 First question: "${data.data.questions[0].question}"`);
          console.log(`  🏷️  Question type: ${data.data.questions[0].type}`);
          console.log(`  🎯 Options count: ${data.data.questions[0].options?.length || 0}`);
        } else {
          console.log(`  ❌ Failed to load questions: ${data.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.log(`  ❌ API Error: ${error.message}`);
      }
      console.log('');
    }
    
    console.log('🎯 Test URLs to check manually:');
    domains.forEach(domain => {
      console.log(`  ${domain.name}: http://localhost:3000/questionnaire/${domain.id}`);
    });
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
};

testDomainQuestions();