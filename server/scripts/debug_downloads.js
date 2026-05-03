require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function inspectDownloads() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to:', mongoose.connection.db.databaseName);
    
    const downloads = await mongoose.connection.db.collection('downloads').find({}).limit(5).toArray();
    console.log('\n--- Downloads (to find app references) ---');
    downloads.forEach(d => {
      console.log(`App ID: ${d.app}`);
      console.log(`User: ${d.user}`);
      console.log(`Created: ${d.createdAt}`);
      console.log('---');
    });

    // Check if there's any backup or versioning
    const allCollections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAll collections:', allCollections.map(c => c.name).join(', '));
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

inspectDownloads();
