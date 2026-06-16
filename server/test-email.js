require('dotenv').config({ path: 'd:/baqala project/server/.env' });
const { sendEmail } = require('./services/emailService');

async function testEmailService() {
  console.log('--- Email Service Test Started ---');
  console.log('User:', process.env.SMTP_USER);
  
  if (!process.env.SMTP_USER) {
    console.error('SMTP_USER not found in .env');
    return;
  }

  const result = await sendEmail({
    to: process.env.SMTP_USER,
    subject: 'Baqala Email Service Test',
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h1 style="color: #6366f1;">Connectivity Test</h1>
        <p>This email verifies that the <strong>Baqala Email Service</strong> is properly configured.</p>
        <p>If you see this, SMTP is working!</p>
      </div>
    `
  });

  if (result.success) {
    console.log('Test Passed: Email delivery handled.');
  } else {
    console.error('Test Failed: Email delivery failed.');
  }
}

testEmailService();
