const path = require('path');

// Mock environment
process.env.SMTP_USER = ''; 
process.env.RESEND_API_KEY = '';

// Mocking EmailLog before importing service
const mockLogs = [];
const mockModel = {
  create: async (data) => {
    console.log(`[MOCK_DB] Creating log: ${data.recipient} (${data.provider})`);
    const entry = { ...data, _id: 'mock_' + Math.random(), save: async function() { 
      console.log(`[MOCK_DB] Updating log: ${this.recipient} -> ${this.status}`);
      return this; 
    } };
    mockLogs.push(entry);
    return entry;
  },
  findOne: () => ({ sort: () => mockLogs[mockLogs.length - 1] }),
  find: () => mockLogs
};

// Hack to inject mock model into emailService
require('module').prototype.require = (function(originalRequire) {
  return function(name) {
    if (name.includes('models/EmailLog')) return mockModel;
    return originalRequire.apply(this, arguments);
  };
})(require('module').prototype.require);

const { sendEmail } = require('../server/services/emailService');
const { queueNotification } = require('../server/utils/notificationQueue');

async function test() {
  try {
    console.log('--- STARTING VERIFICATION (MOCKED DB) ---');

    // 1. Test direct sendEmail (Simulated)
    console.log('\n--- Testing sendEmail (Simulated) ---');
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Verification Test',
      html: '<p>Test content</p>'
    });
    console.log('Result:', result);

    const log = mockLogs.find(l => l.recipient === 'test@example.com');
    console.log('Log entry status:', log ? log.status : 'NOT FOUND');

    // 2. Test queueNotification
    console.log('\n--- Testing queueNotification ---');
    queueNotification(async () => {
      console.log('Queue job 1 executing...');
      await sendEmail({
        to: 'queue1@example.com',
        subject: 'Queue Test 1',
        html: 'Task 1'
      });
    });

    queueNotification(async () => {
      console.log('Queue job 2 executing...');
      await sendEmail({
        to: 'queue2@example.com',
        subject: 'Queue Test 2',
        html: 'Task 2'
      });
    });

    console.log('Waiting for queue to drain (3 seconds)...');
    await new Promise(r => setTimeout(r, 3000));

    console.log('\nFinal Mock Logs Summary:');
    mockLogs.forEach(l => {
      console.log(`- ${l.recipient}: ${l.status} (${l.provider})`);
    });

    console.log('\nVerification complete.');
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

test();
