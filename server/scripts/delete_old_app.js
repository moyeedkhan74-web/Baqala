require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const App = require('../models/App');

async function deleteOldApp() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const result = await App.deleteOne({ title: 'Nice' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Success! The old app "Nice" has been removed from the database.');
    } else {
      console.log('⚠️ No app named "Nice" was found.');
    }

  } catch (error) {
    console.error('Deletion failed:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

deleteOldApp();
