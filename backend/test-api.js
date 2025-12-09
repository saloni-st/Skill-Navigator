const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGE3ZTY5ZmQxZGQyYWU5NGE4YTQ1NCIsImVtYWlsIjoic2Fsb25pMTIzQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU5MTY0NzIzLCJleHAiOjE3NTkyNTExMjN9.57LPQiE2TV7hKU41uw4Py-I8ZRMUwY-V6A43BmvPnuc";

async function testQuestions() {
  try {
    const response = await fetch('http://localhost:3001/api/domains/68d8278a617d63626cb4a40f/questions', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('📊 API Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data.questions) {
      console.log('\n🔍 First Question Analysis:');
      console.log('Question:', data.data.questions[0].question || data.data.questions[0].text);
      console.log('Type:', data.data.questions[0].type);
      console.log('Key:', data.data.questions[0].key);
      console.log('Options count:', data.data.questions[0].options?.length);
      
      if (data.data.questions[0].options && data.data.questions[0].options.length > 0) {
        console.log('First option:', data.data.questions[0].options[0]);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testQuestions();