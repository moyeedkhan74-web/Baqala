const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const App = require('../models/App');
const User = require('../models/User');

async function getLiveStats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const dbStats = await mongoose.connection.db.command({ dbStats: 1 });
    
    const apps = await App.find({});
    const totalBinaryBytes = apps.reduce((sum, a) => sum + (a.fileSize || 0), 0);
    const userCount = await User.countDocuments();

    const output = {
      mongo: {
        dataSizeMB: (dbStats.dataSize / (1024 * 1024)).toFixed(2),
        storageSizeMB: (dbStats.storageSize / (1024 * 1024)).toFixed(2),
        indexSizeMB: (dbStats.indexSize / (1024 * 1024)).toFixed(2),
        collections: dbStats.collections,
        documents: dbStats.objects,
        limitMB: 512
      },
      b2: {
        totalApps: apps.length,
        apksSizeMB: (totalBinaryBytes / (1024 * 1024)).toFixed(2),
        freeStorageGB: 10,
        freeBandwidthGBPerDay: 1
      },
      users: userCount
    };

    fs.writeFileSync(path.join(__dirname, 'stats_out.json'), JSON.stringify(output, null, 2));
    process.exit(0);
  } catch (err) {
    fs.writeFileSync(path.join(__dirname, 'stats_out.json'), JSON.stringify({ error: err.message }, null, 2));
    process.exit(1);
  }
}

getLiveStats();
