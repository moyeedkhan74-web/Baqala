const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });
const App = require('../server/models/App');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const appId = '6a3594960c30e221c3cb5da1';
    const app = await App.findById(appId).lean();
    if (!app) {
      console.log('App not found!');
    } else {
      console.log('App Details:');
      console.log(JSON.stringify(app, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
check();
