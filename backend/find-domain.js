require('dotenv').config();
const connectDB = require('./src/utils/database');
const { Domain } = require('./src/models');

async function findDomainId() {
  console.log('🔍 Finding available domains...');
  
  try {
    await connectDB();
    
    const domains = await Domain.find();
    console.log('📚 Available domains:');
    domains.forEach(domain => {
      console.log(`- ${domain.name} (ID: ${domain._id})`);
    });
    
    // Look for web development domain
    const webDevDomain = domains.find(d => 
      d.name.toLowerCase().includes('web') || 
      d.name.toLowerCase().includes('development')
    );
    
    if (webDevDomain) {
      console.log(`✅ Found web development domain: ${webDevDomain.name} (${webDevDomain._id})`);
      return webDevDomain._id.toString();
    } else {
      console.log('⚠️ No web development domain found, using first available domain');
      return domains[0]?._id.toString();
    }
    
  } catch (error) {
    console.error('❌ Error finding domains:', error.message);
    return null;
  } finally {
    process.exit(0);
  }
}

findDomainId();