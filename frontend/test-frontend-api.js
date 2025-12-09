const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Your authentication token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGE3ZTY5ZmQxZGQyYWU5NGE4YTQ1NCIsImVtYWlsIjoic2Fsb25pMTIzQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU5MTc3OTE3LCJleHAiOjE3NTkyNjQzMTd9.baEt8daGhF9KjNk-MAORr0Wjf4h-RZTdBjSlNrfNTOM';

// Test if frontend is fetching new questions from backend
const testFrontendAPI = async () => {
  try {
    console.log('🧪 Testing Frontend API - Questions from Backend...\n');
    
    // Test all three domains with correct IDs
    const domains = [
      { id: '68d8278a617d63626cb4a40f', name: 'Web Development' },
      { id: '68d85afdf29ae039c6022af3', name: 'Cybersecurity' },
      { id: '68d85b2700709ff694699900', name: 'Data Science' }
    ];
                                                                                                                                                                                                          
    for (const domain of domains) {
      console.log(`🎯 Testing ${domain.name} (${domain.id}):`);
      
      // Test via frontend API (port 3000) - this goes through Next.js API routes
      const frontendURL = `http://localhost:3000/api/domains/${domain.id}/questions`;
      
      const response = await fetch(frontendURL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`  📊 Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data.questions) {
          console.log(`  ✅ Questions loaded: ${data.data.questions.length}`);
          console.log(`  � First question: "${data.data.questions[0].question}"`);
          console.log(`  🏷️  Type: ${data.data.questions[0].type}`);
          console.log(`  🔑 Key: ${data.data.questions[0].key}`);
          
          // Check for domain-specific content
          const allContent = data.data.questions.flatMap(q => [
            q.question,
            ...(q.options?.map(opt => opt.label) || [])
          ]).join(' ');
          
          const modernKeywords = ['React', 'TypeScript', 'DevOps', 'CEH', 'OSCP', 'TensorFlow', 'Python', 'Node.js'];
          const foundKeywords = modernKeywords.filter(keyword => allContent.includes(keyword));
          
          if (foundKeywords.length > 0) {
            console.log(`  🚀 Domain-specific tech found: ${foundKeywords.join(', ')}`);
            console.log(`  ✅ NEW QUESTIONS CONFIRMED!`);
          } else {
            console.log(`  ⚠️  No domain-specific keywords - might be fallback questions`);
            console.log(`  🔍 Sample content: ${allContent.substring(0, 100)}...`);
          }
        } else {
          console.log(`  ❌ No questions in response: ${data.message || 'Unknown error'}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`  ❌ Request failed: ${errorText}`);
      }
      
      console.log('');
    }
    
    console.log('🎯 Frontend URLs to test manually:');
    domains.forEach(domain => {
      console.log(`  ${domain.name}: http://localhost:3000/questionnaire/${domain.id}`);
    });
    
  } catch (error) {
    console.error('❌ Error testing frontend API:', error);
  }
};

// Run test
testFrontendAPI();