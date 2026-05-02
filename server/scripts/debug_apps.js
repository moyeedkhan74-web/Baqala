require('dotenv').config();
const mongoose = require('mongoose');
const App = require('../models/App');

async function debugApps() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const apps = await App.find({});
    console.log(`\n--- FOUND ${apps.length} APPS ---`);

    apps.forEach(app => {
      console.log(`\nTitle: ${app.title}`);
      console.log(`Icon:  ${app.icon}`);
      console.log(`File:  ${app.fileUrl}`);
      console.log(`Screenshots: ${app.screenshots.length}`);
      app.screenshots.forEach((s, i) => console.log(`  [${i}] ${s}`));
      console.log('---');
    });

  } catch (error) {
    console.error('Debug failed:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

debugApps();
