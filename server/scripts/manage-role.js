const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * USER ROLE MANAGEMENT UTILITY
 * 
 * Usage: node scripts/manage-role.js <email> <role>
 * 
 * Example:
 * node scripts/manage-role.js test@example.com admin
 * node scripts/manage-role.js test@example.com user
 */

const manageRole = async (email, role) => {
  if (!email || !role) {
    console.error('Error: Please provide both an email and a role.');
    console.log('Usage: node scripts/manage-role.js <email> <role>');
    process.exit(1);
  }

  const allowedRoles = ['user', 'developer', 'admin'];
  if (!allowedRoles.includes(role)) {
    console.error(`Error: Invalid role. Allowed roles: ${allowedRoles.join(', ')}`);
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { role: role },
      { new: true, runValidators: true }
    );

    if (!user) {
      console.error(`\u274c User with email "${email}" not found.`);
    } else {
      console.log(`\u2705 Success! ${user.name}'s role is now "${role}".`);
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error('\u274c Error:', err.message);
    process.exit(1);
  }
};

const targetEmail = process.argv[2];
const targetRole = process.argv[3];
manageRole(targetEmail, targetRole);
