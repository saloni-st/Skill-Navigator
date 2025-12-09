const { MongoClient } = require('mongodb');

async function checkDomainIDs() {
  const client = new MongoClient('mongodb+srv://salonitiwari205_db_user:nSQYv2IY5xN909iH@skillnavigator.t3yag7p.mongodb.net/?retryWrites=true&w=majority&appName=SkillNavigator');
  
  try {
    await client.connect();
    const db = client.db('test');
    const domains = db.collection('domains');
    
    console.log('📋 All Domains in Database:\n');
    
    const allDomains = await domains.find({}).toArray();
    
    allDomains.forEach(domain => {
      console.log(`🎯 ${domain.name}`);
      console.log(`   ID: ${domain._id}`);
      console.log(`   QuestionSetId: ${domain.questionSetId}`);
      console.log(`   Active: ${domain.active}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkDomainIDs();