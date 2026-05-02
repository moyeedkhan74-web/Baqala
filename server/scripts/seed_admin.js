require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function seedAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const adminEmail = 'admin@baqala.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin already exists.');
    } else {
      await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: 'admin123',
        role: 'admin'
      });
      console.log('✅ Admin created successfully!');
      console.log('Email: admin@baqala.com');
      console.log('Pass: admin123');
    }
  } catch (error) {
    console.error('Seeding failed:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

seedAdmin();
