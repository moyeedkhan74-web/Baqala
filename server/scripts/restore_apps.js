require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function restoreApps() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to:', mongoose.connection.db.databaseName);

    const db = mongoose.connection.db;
    const appsCollection = db.collection('apps');

    // Check existing
    const count = await appsCollection.countDocuments();
    console.log(`Current apps count: ${count}`);

    if (count > 0) {
      console.log('Apps already exist, skipping restoration.');
      await mongoose.connection.close();
      return;
    }

    // We know from the downloads collection these app IDs existed:
    // 69d913c4882bd91a6e4430c9 and 69d914fa882bd91a6e4430d8
    // From earlier dumps we know their titles were "l." and "werfwerw"
    // And from the migration script we know their icon/screenshot paths

    // Get developer user ID
    const users = await db.collection('users').find({}).limit(1).toArray();
    const developerId = users.length > 0 ? users[0]._id : null;
    console.log('Developer ID:', developerId);

    if (!developerId) {
      console.error('No users found to assign as developer!');
      await mongoose.connection.close();
      return;
    }

    const baseUrl = 'https://baqala-kwt6.onrender.com';

    const appsToRestore = [
      {
        _id: new mongoose.Types.ObjectId('69d913c4882bd91a6e4430c9'),
        title: 'l.',
        description: 'A test application',
        shortDescription: '',
        tagline: ';m',
        category: 'Games',
        developer: developerId,
        developerName: users[0].name || 'Unknown',
        fileUrl: 'apps/test_app.exe',
        fileName: 'test_app.exe',
        fileSize: 0,
        icon: `${baseUrl}/api/assets/icons/1777790820834_novaplay_icon.png.webp`,
        screenshots: [
          `${baseUrl}/api/assets/screenshots/1777791142951_Screenshot_(57).png.webp`,
          `${baseUrl}/api/assets/screenshots/1777791144032_Screenshot_(58).png.webp`,
          `${baseUrl}/api/assets/screenshots/1777791144972_Screenshot_(59).png.webp`,
          `${baseUrl}/api/assets/screenshots/1777791146174_Screenshot_(60).png.webp`
        ],
        version: '1.0.0',
        platform: 'Windows',
        averageRating: 0,
        totalReviews: 0,
        totalDownloads: 0,
        status: 'approved',
        rejectionReason: '',
        tags: [],
        createdAt: new Date('2026-05-02T10:00:00Z'),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId('69d914fa882bd91a6e4430d8'),
        title: 'werfwerw',
        description: 'Another test application',
        shortDescription: '',
        tagline: 'we',
        category: 'Games',
        developer: developerId,
        developerName: users[0].name || 'Unknown',
        fileUrl: 'apps/test_app2.exe',
        fileName: 'test_app2.exe',
        fileSize: 0,
        icon: `${baseUrl}/api/assets/icons/1777793091199_novaplay_icon.png.webp`,
        screenshots: [
          `${baseUrl}/api/assets/screenshots/1777793092518_Screenshot_(57).png.webp`,
          `${baseUrl}/api/assets/screenshots/1777793093250_Screenshot_(58).png.webp`,
          `${baseUrl}/api/assets/screenshots/1777793094058_Screenshot_(59).png.webp`,
          `${baseUrl}/api/assets/screenshots/1777793094796_Screenshot_(60).png.webp`
        ],
        version: '1.0.0',
        platform: 'Windows',
        averageRating: 0,
        totalReviews: 0,
        totalDownloads: 0,
        status: 'approved',
        rejectionReason: '',
        tags: [],
        createdAt: new Date('2026-05-02T12:00:00Z'),
        updatedAt: new Date()
      }
    ];

    const result = await appsCollection.insertMany(appsToRestore);
    console.log(`✅ Restored ${result.insertedCount} apps!`);

    // Verify
    const restored = await appsCollection.find({}).toArray();
    restored.forEach(app => {
      console.log(`  Title: ${app.title}, Icon: ${app.icon}`);
    });

    await mongoose.connection.close();
  } catch (err) {
    console.error('Restore Error:', err.message);
  }
}

restoreApps();
