const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * ADMIN PROMOTION UTILITY
 * 
 * Usage: node scripts/make-admin.js <email>
 * 
 * This script connects directly to the database and promotes the specified
 * user to the 'admin' role. If the user doesn't exist, it creates a new
 * account with an admin role.
 */

const promoteToAdmin = async (email) => {
  if (!email) {
    console.error('Error: Please provide an email address.');
    console.log('Usage: node scripts/make-admin.js <email>');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully.');

    // Try to find the user
    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.log(`\u2139 User not found. Creating a NEW Admin account for ${email}...`);
      // Create new user with a placeholder password
      user = await User.create({
        name: 'System Admin',
        email: email.toLowerCase().trim(),
        password: 'ChangeMe123!', // Placeholder for direct DB creation
        role: 'admin'
      });
      console.log('\u2705 Created new Admin account!');
    } else {
      user.role = 'admin';
      await user.save();
      console.log(`\u2705 Success! ${user.name} is now an ADMIN.`);
    }

    console.log(`\nDetails:\n- ID: ${user._id}\n- Name: ${user.name}\n- Email: ${user.email}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  } catch (err) {
    console.error('\u274c Error during promotion:', err.message);
    process.exit(1);
  }
};

const targetEmail = process.argv[2];
promoteToAdmin(targetEmail);
