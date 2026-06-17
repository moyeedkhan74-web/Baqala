const path = require('path');
const dotenv = require('dotenv');

// Mock environment
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.BREVO_API_KEY = 'xkeysib-test';
process.env.RESEND_API_KEY = 're_test';
process.env.SMTP_USER = 'test@gmail.com';
process.env.SMTP_PASS = 'pass';

const mongoose = require('mongoose');

// Mock mongoose connection state
Object.defineProperty(mongoose.connection, 'readyState', { value: 1 });

const { getSystemInfo } = require('../server/controllers/adminController');

async function test() {
  console.log('--- STARTING BREVO DIAGNOSTICS VERIFICATION ---');

  try {
    const info = await getSystemInfo();
    console.log('\n🔍 [SYSTEM_DIAGNOSTICS_SNAPSHOT]');
    console.log('-------------------------------------------');
    Object.entries(info).forEach(([key, value]) => {
      console.log(`${key.padEnd(20)}: ${value}`);
    });
    console.log('-------------------------------------------\n');

    if (info.brevoConfigured === 'Yes' && info.resendConfigured === 'Yes' && info.smtpConfigured === 'Yes') {
      console.log('✅ Verification passed: All providers detected correctly.');
    } else {
      console.error('❌ Verification failed: Unexpected diagnostic values.');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

test();
