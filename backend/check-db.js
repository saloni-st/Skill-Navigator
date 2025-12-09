const { MongoClient } = require('mongodb');

async function checkSessions() {
  const client = new MongoClient('mongodb+srv://salonitiwari205_db_user:nSQYv2IY5xN909iH@skillnavigator.t3yag7p.mongodb.net/?retryWrites=true&w=majority&appName=SkillNavigator');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    // List all databases
    const dbs = await client.db().admin().listDatabases();
    console.log('📊 Available databases:', dbs.databases.map(db => db.name));
    
    // Try different database names
    const possibleDbs = ['skillNavigator', 'SkillNavigator', 'test', 'skill-navigator'];
    
    for (const dbName of possibleDbs) {
      try {
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        console.log(`\n📁 Database: ${dbName}`);
        console.log('Collections:', collections.map(c => c.name));
        
        if (collections.find(c => c.name === 'sessions')) {
          const sessions = db.collection('sessions');
          const sessionCount = await sessions.countDocuments();
          console.log(`📊 Total sessions in ${dbName}: ${sessionCount}`);
          
          // Find recent sessions
          const recentSessions = await sessions.find({}).sort({createdAt: -1}).limit(5).toArray();
          console.log('🕒 Recent sessions:');
          recentSessions.forEach(session => {
            console.log(`  - ID: ${session._id}, Status: ${session.status}, Created: ${session.createdAt}`);
          });
          
          // Look for our specific session
          const targetSession = await sessions.findOne({ _id: require('mongodb').ObjectId.createFromHexString('68dae6494346a2a9f8e3f69b') });
          if (targetSession) {
            console.log(`\n🎯 Found target session in ${dbName}:`, {
              id: targetSession._id,
              status: targetSession.status,
              hasLLMRecommendation: !!targetSession.llmRecommendation,
              llmRecommendationType: typeof targetSession.llmRecommendation
            });
          }
        }
      } catch (err) {
        console.log(`❌ Error checking database ${dbName}:`, err.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkSessions();