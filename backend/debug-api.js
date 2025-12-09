const { MongoClient, ObjectId } = require('mongodb');

async function debugAPI() {
  const client = new MongoClient('mongodb+srv://salonitiwari205_db_user:nSQYv2IY5xN909iH@skillnavigator.t3yag7p.mongodb.net/?retryWrites=true&w=majority&appName=SkillNavigator');
  
  try {
    await client.connect();
    const db = client.db('test');
    
    const domains = db.collection('domains');
    const questionSets = db.collection('questionsets');
    
    // Get Web Development domain
    const webDevDomain = await domains.findOne({ name: 'Web Development' });
    console.log('🔍 Domain:', webDevDomain);
    
    if (webDevDomain) {
      const questionSet = await questionSets.findOne({ _id: webDevDomain.questionSetId });
      console.log('\n📋 QuestionSet:', questionSet);
      
      if (questionSet && questionSet.questions) {
        console.log('\n🎯 First Question Structure:');
        console.log(JSON.stringify(questionSet.questions[0], null, 2));
        
        console.log('\n🔧 Simulating Controller Mapping:');
        const q = questionSet.questions[0];
        const mapped = {
          questionId: q.questionId || q.key || 'question_0',
          question: q.question || q.text || '',
          text: q.question || q.text || '',
          type: q.type,
          key: q.key,
          options: q.options || [],
          required: q.required !== false,
          order: q.order || 1
        };
        console.log(JSON.stringify(mapped, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugAPI();