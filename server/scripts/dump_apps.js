require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const App = require('../models/App');

async function dumpApps() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const apps = await App.find().limit(10);
    console.log(`Found ${apps.length} apps`);
    console.log('--- Sample Apps Data ---');
    apps.forEach(app => {
      console.log(`Title: ${app.title}`);
      console.log(`Icon: ${app.icon}`);
      console.log(`Screenshots: ${(app.screenshots || []).join(', ')}`);
      console.log('---');
    });
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

dumpApps();
