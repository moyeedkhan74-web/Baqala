const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const App = require('./server/models/App');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const featuredApps = await App.find({ isFeatured: true });
    console.log('Featured Apps Count:', featuredApps.length);
    featuredApps.forEach(app => {
        console.log(`- ${app.title} (Status: ${app.status}, Banner: ${!!app.banner})`);
    });

    const totalApps = await App.countDocuments();
    console.log('Total Apps:', totalApps);

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();
