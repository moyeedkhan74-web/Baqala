const mongoose = require('mongoose');
const App = require('../server/models/App');
require('dotenv').config({ path: '../server/.env' });

async function checkLastApp() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const lastApp = await App.findOne().sort({ createdAt: -1 });
    if (!lastApp) {
      console.log('No apps found');
      return;
    }
    
    console.log('--- LAST APP DETAILS ---');
    console.log(`Title: ${lastApp.title}`);
    console.log(`File URL: ${lastApp.fileUrl}`);
    console.log(`File Size: ${lastApp.fileSize}`);
    console.log(`Bucket Name (.env): ${process.env.B2_BUCKET_NAME}`);
    console.log('------------------------');
    
    const { extractB2Key } = require('../server/utils/b2Storage');
    const key = extractB2Key(lastApp.fileUrl);
    console.log(`Extracted Key: "${key}"`);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkLastApp();
