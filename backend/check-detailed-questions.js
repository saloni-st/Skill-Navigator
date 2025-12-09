const { MongoClient } = require('mongodb');

async function checkDetailedQuestions() {
  const client = new MongoClient('mongodb+srv://salonitiwari205_db_user:nSQYv2IY5xN909iH@skillnavigator.t3yag7p.mongodb.net/?retryWrites=true&w=majority&appName=SkillNavigator');
  
  try {
    await client.connect();
    const db = client.db('test');
    
    const questionSets = db.collection('questionsets');
    const domains = db.collection('domains');
    
    const allDomains = await domains.find({}).toArray();
    
    console.log('🔍 Detailed Question Analysis:\n');
    
    for (const domain of allDomains) {
      console.log(`🌟 DOMAIN: ${domain.name}`);
      console.log(`📋 QuestionSetId: ${domain.questionSetId}`);
      
      const questionSet = await questionSets.findOne({ _id: domain.questionSetId });
      
      if (questionSet) {
        console.log(`📊 Questions Count: ${questionSet.questions?.length || 0}`);
        
        if (questionSet.questions && questionSet.questions.length > 0) {
          questionSet.questions.forEach((q, index) => {
            console.log(`\n   Q${index + 1}: ${q.question || q.text || 'NO QUESTION TEXT'}`);
            console.log(`   Type: ${q.type}`);
            console.log(`   Key: ${q.key}`);
            if (q.options) {
              console.log(`   Options:`, q.options.map(opt => `${opt.value}: ${opt.label}`));
            }
          });
        } else {
          console.log('   ❌ NO QUESTIONS FOUND');
        }
      } else {
        console.log('   ❌ QUESTION SET NOT FOUND');
      }
      
      console.log('\n' + '='.repeat(80) + '\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkDetailedQuestions();