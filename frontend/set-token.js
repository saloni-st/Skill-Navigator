console.log('🔧 Setting correct token...');

// Set the correct token that works
localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGIwNmNhOWRmZmQ2OGUzOTNlMzUyNyIsImVtYWlsIjoic2Fsb25pMTIzNEBnbWFpbC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc1OTc0NDA3MywiZXhwIjoxNzU5ODMwNDczfQ.Wm4XMPWsQ-5YR4cnrjIYx215RSX14WMP7_z6pCfs50c');
localStorage.setItem('skillnavigator_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGIwNmNhOWRmZmQ2OGUzOTNlMzUyNyIsImVtYWlsIjoic2Fsb25pMTIzNEBnbWFpbC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc1OTc0NDA3MywiZXhwIjoxNzU5ODMwNDczfQ.Wm4XMPWsQ-5YR4cnrjIYx215RSX14WMP7_z6pCfs50c');

console.log('✅ Updated token set! Test URLs:');
console.log('   Results: http://localhost:3000/result/68e399669db1ebf7e5ef505d');
console.log('   Web Dev: http://localhost:3000/questionnaire/68d8278a617d63626cb4a40f');

// Reload the page
window.location.reload();