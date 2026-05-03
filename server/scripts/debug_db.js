require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function listCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to:', mongoose.connection.db.databaseName);
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections:');
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`  ${col.name}: ${count} documents`);
    }
    
    // Try to read apps directly
    const apps = await mongoose.connection.db.collection('apps').find({}).limit(5).toArray();
    console.log('\n--- Raw Apps ---');
    apps.forEach(app => {
      console.log(`Title: ${app.title}`);
      console.log(`Icon: ${app.icon}`);
      console.log(`Screenshots: ${JSON.stringify(app.screenshots)}`);
      console.log(`Status: ${app.status}`);
      console.log('---');
    });
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listCollections();
