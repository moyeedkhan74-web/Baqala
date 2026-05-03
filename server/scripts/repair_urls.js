require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const App = require('../models/App');

async function repairUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const apps = await App.find();
    console.log(`Found ${apps.length} apps to analyze...`);
    
    let updatedCount = 0;

    for (const app of apps) {
      let changed = false;

      // Fix Icon
      const baseUrl = 'https://baqala-kwt6.onrender.com';
      if (app.icon) {
        if (app.icon.includes('backblazeb2.com')) {
          const matchS3 = app.icon.match(/s3\.[a-z0-9-]+\.backblazeb2\.com\/[^\/]+\/(.+)/);
          const matchF = app.icon.match(/backblazeb2\.com\/file\/[^\/]+\/(.+)/);
          const path = (matchS3 && matchS3[1]) || (matchF && matchF[1]);
          if (path) {
            app.icon = `${baseUrl}/api/assets/${path}`;
            changed = true;
          }
        } else if (app.icon.startsWith('/api/assets/')) {
          app.icon = `${baseUrl}${app.icon}`;
          changed = true;
        }
      }

      // Fix Screenshots
      if (app.screenshots && app.screenshots.length > 0) {
        app.screenshots = app.screenshots.map(ss => {
          if (ss.includes('backblazeb2.com')) {
            const matchS3 = ss.match(/s3\.[a-z0-9-]+\.backblazeb2\.com\/[^\/]+\/(.+)/);
            const matchF = ss.match(/backblazeb2\.com\/file\/[^\/]+\/(.+)/);
            const path = (matchS3 && matchS3[1]) || (matchF && matchF[1]);
            if (path) {
              changed = true;
              return `${baseUrl}/api/assets/${path}`;
            }
          } else if (ss.startsWith('/api/assets/')) {
            changed = true;
            return `${baseUrl}${ss}`;
          }
          return ss;
        });
      }

      if (changed) {
        await app.save();
        updatedCount++;
        console.log(`✅ Repaired URLs for: ${app.title}`);
      }
    }
    
    console.log(`--- Migration Complete ---`);
    console.log(`Total apps updated: ${updatedCount}`);
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Migration Error:', err);
  }
}

repairUrls();
