/**
 * Migration Script: Fix broken cdn.baqala.com image URLs in the database.
 * Replaces them with working Render proxy URLs.
 * 
 * Usage: node fix-image-urls.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const App = require('./models/App');

const BROKEN_CDN = 'https://cdn.baqala.com/file/baqalaaa/';
const RENDER_PROXY = 'https://baqala-kwt6.onrender.com/api/assets/';

async function fixUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const apps = await App.find({
      $or: [
        { icon: { $regex: 'cdn\\.baqala\\.com' } },
        { screenshots: { $regex: 'cdn\\.baqala\\.com' } }
      ]
    });

    console.log(`Found ${apps.length} app(s) with broken CDN URLs.`);

    for (const app of apps) {
      let changed = false;

      // Fix icon
      if (app.icon && app.icon.includes('cdn.baqala.com')) {
        const oldIcon = app.icon;
        app.icon = app.icon.replace(BROKEN_CDN, RENDER_PROXY);
        console.log(`  [${app.title}] Icon: ${oldIcon} -> ${app.icon}`);
        changed = true;
      }

      // Fix screenshots
      if (app.screenshots && app.screenshots.length > 0) {
        app.screenshots = app.screenshots.map((url, i) => {
          if (url.includes('cdn.baqala.com')) {
            const newUrl = url.replace(BROKEN_CDN, RENDER_PROXY);
            console.log(`  [${app.title}] Screenshot[${i}]: ${url} -> ${newUrl}`);
            changed = true;
            return newUrl;
          }
          return url;
        });
      }

      if (changed) {
        await app.save();
        console.log(`  ✅ Saved: ${app.title}`);
      }
    }

    console.log('\nMigration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

fixUrls();
