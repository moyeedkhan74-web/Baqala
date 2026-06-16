require('dotenv').config({ path: 'd:/baqala project/server/.env' });
const nodemailer = require('nodemailer');

async function testSMTP() {
  console.log('--- SMTP Test Started ---');
  console.log('User:', process.env.SMTP_USER);
  console.log('Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
  console.log('Port:', process.env.SMTP_PORT || 587);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('Connection verified successfully!');

    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Baqala Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to self
      subject: 'SMTP Connectivity Test',
      text: 'If you receive this, your SMTP settings are correct!',
    });
    console.log('Test email sent! Message ID:', info.messageId);
  } catch (error) {
    console.error('SMTP Test Failed:');
    console.error(error);
  }
}

testSMTP();
