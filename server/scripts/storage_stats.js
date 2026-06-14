const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const App = require('../models/App');
const User = require('../models/User');
const Review = require('../models/Review');
const Report = require('../models/Report');
const Download = require('../models/Download');

const getStats = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const totalApps = await App.countDocuments();
        const apps = await App.find({}, 'fileSize status');
        const totalBytes = apps.reduce((sum, app) => sum + (app.fileSize || 0), 0);
        
        const totalUsers = await User.countDocuments();
        const totalReviews = await Review.countDocuments();
        const totalReports = await Report.countDocuments();
        const totalDownloads = await Download.countDocuments();

        console.log('\n--- STORAGE STATS ---');
        console.log('Total Apps:', totalApps);
        console.log('Total App Binaries Size:', (totalBytes / (1024 * 1024)).toFixed(2), 'MB');
        console.log('Average App Size:', totalApps > 0 ? (totalBytes / totalApps / (1024 * 1024)).toFixed(2) : 0, 'MB');
        
        console.log('\n--- DATABASE STATS ---');
        console.log('Total Users:', totalUsers);
        console.log('Total Reviews:', totalReviews);
        console.log('Total Reports:', totalReports);
        console.log('Total Downloads:', totalDownloads);

        console.log('\n--- ARCHITECTURE ---');
        console.log('Metadata Storage: MongoDB Atlas');
        console.log('Binary Storage (Apps): Backblaze B2 (Bucket: ' + process.env.B2_PRIVATE_BUCKET + ')');
        console.log('Asset Storage (Images): Backblaze B2 (Bucket: ' + process.env.B2_BUCKET_NAME + ')');
        console.log('Limits: Enforced by Platform Config (Max ' + (process.env.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0) + 'MB per file)');

        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

getStats();
