const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const App = require('./models/App');

async function fixFeatured() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  // Set at least one app as featured if none exist
  const featuredCount = await App.countDocuments({ isFeatured: true });
  console.log('Current featured count:', featuredCount);
  
  if (featuredCount === 0) {
    const firstApp = await App.findOne({ status: 'approved' });
    if (firstApp) {
      firstApp.isFeatured = true;
      await firstApp.save();
      console.log(`Marked "${firstApp.title}" as featured`);
    } else {
      console.log('No approved apps found to mark as featured');
    }
  }
  
  // Also check if any banners exist
  const bannerApps = await App.find({ banner: { $ne: '' } });
  console.log('Apps with banners:', bannerApps.length);

  await mongoose.disconnect();
}

fixFeatured();
