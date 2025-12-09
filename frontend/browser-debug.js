// Browser console test script - paste this in browser console
// Go to http://localhost:3000/questionnaire/68d8278a617d63626cb4a40f and paste this

console.log('🔧 Frontend Debug Script Started');

// Check if token exists
const token = localStorage.getItem('token');
console.log('🔑 Token exists:', !!token);
console.log('🔑 Token length:', token?.length || 0);

// Set the correct token
const correctToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGE3ZTY5ZmQxZGQyYWU5NGE4YTQ1NCIsImVtYWlsIjoic2Fsb25pMTIzQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU5MTc3OTE3LCJleHAiOjE7NTkyNjQzMTd9.baEt8daGhF9KjNk-MAORr0Wjf4h-RZTdBjSlNrfNTOM';
localStorage.setItem('token', correctToken);
console.log('✅ Token set in localStorage');

// Test API call manually
const testAPI = async () => {
  console.log('🧪 Testing API call...');
  
  try {
    const response = await fetch('/api/domains/68d8278a617d63626cb4a40f/questions', {
      headers: {
        'Authorization': `Bearer ${correctToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response status:', response.status);
    const data = await response.json();
    console.log('📊 Response data:', data);
    
    if (data.success && data.data.questions) {
      console.log('✅ Questions loaded successfully!');
      console.log('📝 First question:', data.data.questions[0].question);
      console.log('🎯 Question count:', data.data.questions.length);
    } else {
      console.log('❌ API call failed:', data);
    }
  } catch (error) {
    console.error('❌ API Error:', error);
  }
};

// Run the test
testAPI();

console.log('🔄 Now refresh the page to test with new token');