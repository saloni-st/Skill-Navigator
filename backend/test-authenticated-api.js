const fetch = require('node-fetch');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGE3ZTY5ZmQxZGQyYWU5NGE4YTQ1NCIsImVtYWlsIjoic2Fsb25pMTIzQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU5MTc3OTE3LCJleHAiOjE3NTkyNjQzMTd9.baEt8daGhF9KjNk-MAORr0Wjf4h-RZTdBjSlNrfNTOM';

const testAuthenticatedAPI = async () => {
  console.log('🔐 Testing Authenticated API with User Token...\n');
  
  const domains = [
    { id: '68d8278a617d63626cb4a40f', name: 'Web Development' },
    { id: '68d85afdf29ae039c6022af3', name: 'Cybersecurity' },  
    { id: '68d85b2700709ff694699900', name: 'Data Science' }
  ];
  
  for (const domain of domains) {
    console.log(`🎯 Testing ${domain.name}:`);
    
    try {
      const response = await fetch(`http://localhost:3001/api/domains/${domain.id}/questions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.data.questions) {
        console.log(`  ✅ SUCCESS: ${data.data.questions.length} questions loaded`);
        console.log(`  📝 First question: "${data.data.questions[0].question}"`);
        console.log(`  🏷️  Question type: ${data.data.questions[0].type}`);
        console.log(`  🔑 Question key: ${data.data.questions[0].key}`);
        console.log(`  🎯 Options count: ${data.data.questions[0].options?.length || 0}`);
        
        if (data.data.questions[0].options && data.data.questions[0].options.length > 0) {
          console.log(`  💡 First option: "${data.data.questions[0].options[0].label}"`);
        }
        
        // Check if questions are domain-specific by looking for modern tech keywords
        const allQuestions = data.data.questions.map(q => q.question).join(' ');
        const allOptions = data.data.questions.flatMap(q => 
          q.options?.map(opt => opt.label) || []
        ).join(' ');
        const allContent = allQuestions + ' ' + allOptions;
        
        const modernKeywords = ['React', 'TypeScript', 'CEH', 'OSCP', 'TensorFlow', 'Python', 'DevOps', 'Angular', 'Vue', 'Node.js'];
        const foundKeywords = modernKeywords.filter(keyword => allContent.includes(keyword));
        
        if (foundKeywords.length > 0) {
          console.log(`  🚀 MODERN TECH DETECTED: ${foundKeywords.join(', ')}`);
        } else {
          console.log(`  ⚠️  No modern tech keywords found - might be fallback questions`);
        }
        
      } else {
        console.log(`  ❌ FAILED: ${data.message || 'Unknown error'}`);
        console.log(`  📊 Response:`, JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.log(`  ❌ API ERROR: ${error.message}`);
    }
    console.log('');
  }
};

testAuthenticatedAPI();