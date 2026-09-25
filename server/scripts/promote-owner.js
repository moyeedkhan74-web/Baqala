/**
 * promote-owner.js
 * Run once: node scripts/promote-owner.js
 * Grants the platform owner full admin + pro + verified status.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const OWNER_EMAIL = 'moyeedkhan74@gmail.com';

async function promote() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const result = await User.findOneAndUpdate(
    { email: OWNER_EMAIL },
    {
      role: 'admin',
      tier: 'enterprise',
      isVerified: true,
      isPlatformOwner: true,
      isBanned: false,
      banUntil: null,
      banReason: null,
    },
    { new: true }
  );

  if (!result) {
    console.error(`❌ No user found with email: ${OWNER_EMAIL}`);
    console.log('   Make sure you have registered first, then re-run this script.');
  } else {
    console.log('\n🎉 Platform Owner promotion complete!');
    console.log('   Name          :', result.name);
    console.log('   Email         :', result.email);
    console.log('   Role          :', result.role);
    console.log('   Tier          :', result.tier);
    console.log('   Verified      :', result.isVerified);
    console.log('   Platform Owner:', result.isPlatformOwner);
  }

  await mongoose.disconnect();
  process.exit(0);
}

promote().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
