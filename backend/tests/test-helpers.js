const mongoose = require('mongoose');

/**
 * Connect to test database
 */
async function connectTestDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/skillnavigator_test');
  }
}

/**
 * Clear test database collections
 */
async function clearTestDB() {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
}

/**
 * Close test database connection
 */
async function closeTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

module.exports = {
  connectTestDB,
  clearTestDB,
  closeTestDB
};