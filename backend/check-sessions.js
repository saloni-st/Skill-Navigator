const mongoose = require('mongoose');
require('dotenv').config();

const { Session } = require('./src/models');

async function checkSessions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log('📊 Connected to MongoDB');

    const sessions = await Session.find({}, 'id status createdAt llmRecommendation').limit(5).sort({ createdAt: -1 });
    console.log('Recent sessions:');
    sessions.forEach(s => {
      const hasLLM = !!s.llmRecommendation?.roadmap;
      console.log(`${s._id} - ${s.status} - ${s.createdAt.toISOString().split('T')[0]} - LLM: ${hasLLM}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  }
}

checkSessions();