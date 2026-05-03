const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const App = require('../models/App');

const fixUrls = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const apps = await App.find({ fileUrl: { $regex: /\/api\/assets\/apps\// } });
    console.log(`Found ${apps.length} apps with proxy URLs.`);

    for (const app of apps) {
      const oldUrl = app.fileUrl;
      // Example proxy URL: https://baqala-kwt6.onrender.com/api/assets/apps/1714732323_app.apk
      // Target direct URL: https://s3.us-east-005.backblazeb2.com/baqala/apps/1714732323_app.apk
      
      const fileName = oldUrl.split('/api/assets/apps/')[1];
      const newUrl = `https://${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/apps/${fileName}`;
      
      console.log(`Updating: ${app.title}`);
      console.log(`  From: ${oldUrl}`);
      console.log(`  To:   ${newUrl}`);
      
      app.fileUrl = newUrl;
      await app.save();
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

fixUrls();
