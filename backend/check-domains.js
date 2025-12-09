const { MongoClient } = require('mongodb');

async function checkDomains() {
  const client = new MongoClient('mongodb+srv://salonitiwari205_db_user:nSQYv2IY5xN909iH@skillnavigator.t3yag7p.mongodb.net/?retryWrites=true&w=majority&appName=SkillNavigator');
  
  try {
    await client.connect();
    const db = client.db('test');
    
    // Get all domains
    const domains = db.collection('domains');
    const allDomains = await domains.find({}).toArray();
    
    console.log('📊 All Domains:');
    allDomains.forEach((domain, index) => {
      console.log(`${index + 1}. ${domain.name}`);
      console.log(`   - ID: ${domain._id}`);
      console.log(`   - Description: ${domain.description}`);
      console.log(`   - QuestionSetId: ${domain.questionSetId}`);
      console.log('');
    });
    
    // Get all question sets
    const questionSets = db.collection('questionsets');
    const allQuestionSets = await questionSets.find({}).toArray();
    
    console.log('📝 All Question Sets:');
    allQuestionSets.forEach((qSet, index) => {
      console.log(`${index + 1}. Question Set ID: ${qSet._id}`);
      console.log(`   - Questions Count: ${qSet.questions?.length || 0}`);
      if (qSet.questions && qSet.questions.length > 0) {
        console.log(`   - First Question: ${qSet.questions[0].question}`);
        console.log(`   - Question Type: ${qSet.questions[0].type}`);
      }
      console.log('');
    });
    
    // Check which domains use which question sets
    console.log('🔗 Domain-QuestionSet Mapping:');
    allDomains.forEach(domain => {
      const matchingQSet = allQuestionSets.find(qs => qs._id.toString() === domain.questionSetId.toString());
      console.log(`Domain: ${domain.name} -> QuestionSet: ${matchingQSet ? matchingQSet._id : 'NOT FOUND'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkDomains();