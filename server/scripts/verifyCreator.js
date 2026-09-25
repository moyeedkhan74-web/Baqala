const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const verifyCreator = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const creatorEmail = process.env.OWNER_EMAIL || process.env.ADMIN_EMAIL;
    if (!creatorEmail) {
      console.error('❌ Please set OWNER_EMAIL in environment.');
      process.exit(1);
    }
    const user = await User.findOne({ email: creatorEmail });

    if (!user) {
      console.log(`User with email ${creatorEmail} not found. Please sign up first.`);
      process.exit(0);
    }

    user.role = 'admin';
    user.isVerified = true;
    await user.save();

    console.log(`Success! ${creatorEmail} is now an Admin and Verified Developer.`);
    process.exit(0);
  } catch (error) {
    console.error('Error verifying creator:', error);
    process.exit(1);
  }
};

verifyCreator();
