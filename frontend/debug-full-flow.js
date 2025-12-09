const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGE3ZTY5ZmQxZGQyYWU5NGE4YTQ1NCIsImVtYWlsIjoic2Fsb25pMTIzQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU5MTc3OTE3LCJleHAiOjE3NTkyNjQzMTd9.baEt8daGhF9KjNk-MAORr0Wjf4h-RZTdBjSlNrfNTOM';

console.log('🔍 DEEP DEBUG - Frontend API Analysis\n');

// Test the exact API calls that frontend makes
const testFullFlow = async () => {
  const domainId = '68d8278a617d63626cb4a40f';
  
  console.log('1️⃣ Testing domainsAPI.getById (what frontend tries first)...');
  try {
    const response = await fetch(`http://localhost:3000/api/domains/${domainId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   📊 Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   📋 Domain found: ${data.data?.domain?.name || 'Unknown'}`);
      console.log(`   📝 Domain has questions: ${!!data.data?.domain?.questions}`);
      if (data.data?.domain?.questions) {
        console.log(`   🔢 Question count: ${data.data.domain.questions.length}`);
        console.log(`   📄 First question: "${data.data.domain.questions[0]?.text || data.data.domain.questions[0]?.question || 'No text'}"`);
      }
    } else {
      const error = await response.text();
      console.log(`   ❌ Failed: ${error.substring(0, 100)}...`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n2️⃣ Testing domainsAPI.getQuestions (fallback method)...');
  try {
    const response = await fetch(`http://localhost:3000/api/domains/${domainId}/questions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   📊 Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Questions loaded: ${data.data?.questions?.length || 0}`);
      if (data.data?.questions && data.data.questions.length > 0) {
        console.log(`   📄 First question: "${data.data.questions[0]?.question || data.data.questions[0]?.text || 'No text'}"`);
        console.log(`   🏷️  Question type: ${data.data.questions[0]?.type}`);
        console.log(`   🔑 Question key: ${data.data.questions[0]?.key}`);
        
        // Check if these are the new questions
        const allContent = data.data.questions.flatMap(q => [
          q.question || '',
          ...(q.options?.map(opt => opt.label) || [])
        ]).join(' ');
        
        const modernKeywords = ['React', 'TypeScript', 'DevOps', 'Node.js', 'experience level'];
        const foundKeywords = modernKeywords.filter(keyword => allContent.includes(keyword));
        
        if (foundKeywords.length > 0) {
          console.log(`   🚀 DOMAIN-SPECIFIC CONTENT FOUND: ${foundKeywords.join(', ')}`);
          console.log(`   ✅ NEW QUESTIONS ARE BEING RETURNED!`);
        } else {
          console.log(`   ⚠️  OLD EDUCATION QUESTIONS DETECTED`);
          console.log(`   🔍 Sample content: ${allContent.substring(0, 150)}...`);
        }
      }
    } else {
      const error = await response.text();
      console.log(`   ❌ Failed: ${error.substring(0, 100)}...`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n3️⃣ Testing backend directly (bypass frontend)...');
  try {
    const response = await fetch(`http://localhost:3001/api/domains/${domainId}/questions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   📊 Backend Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   📄 Backend first question: "${data.data?.questions?.[0]?.question || 'No question'}"`);
      
      // Check for modern content in backend
      const allContent = data.data.questions.flatMap(q => [
        q.question || '',
        ...(q.options?.map(opt => opt.label) || [])
      ]).join(' ');
      
      const modernKeywords = ['React', 'TypeScript', 'DevOps'];
      const foundKeywords = modernKeywords.filter(keyword => allContent.includes(keyword));
      
      if (foundKeywords.length > 0) {
        console.log(`   ✅ Backend has NEW questions with: ${foundKeywords.join(', ')}`);
      } else {
        console.log(`   ❌ Backend still has OLD questions`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Backend Error: ${error.message}`);
  }
  
  console.log('\n📋 SUMMARY:');
  console.log('   - Check if frontend API routes are working');
  console.log('   - Check if backend is returning new questions');
  console.log('   - Check if frontend transformation is working');
  console.log('   - Browser should show NEW questions, not education questions');
};

testFullFlow();