const mongoose = require('mongoose');
require('dotenv').config();
const App = require('../models/App');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const apps = await App.find({}, 'title icon banner screenshots').lean();
    apps.forEach(app => {
      console.log(`\n=== ${app.title} ===`);
      console.log(`  icon:    ${app.icon}`);
      console.log(`  banner:  ${app.banner || '(none)'}`);
      if (app.screenshots?.length) {
        app.screenshots.forEach((ss, i) => console.log(`  ss[${i}]:  ${ss}`));
      }
    });
  } catch (err) { console.error(err); }
  finally { await mongoose.disconnect(); }
}
run();
