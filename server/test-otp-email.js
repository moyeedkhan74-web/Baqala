/**
 * OTP Email Diagnostic Script
 * Run: node test-otp-email.js <target-email>
 * Example: node test-otp-email.js someuser@gmail.com
 */
require('dotenv').config();

const nodemailer = require('nodemailer');

const targetEmail = process.argv[2];
if (!targetEmail) {
  console.error('Usage: node test-otp-email.js <target-email>');
  process.exit(1);
}

const testOtp = '987654';

console.log('\n========================================');
console.log('  OTP EMAIL DIAGNOSTIC');
console.log('========================================');
console.log(`Target email : ${targetEmail}`);
console.log(`Test OTP     : ${testOtp}`);
console.log('');
console.log('ENV check:');
console.log(`  BREVO_API_KEY   : ${process.env.BREVO_API_KEY ? '✅ set (' + process.env.BREVO_API_KEY.slice(0,8) + '...)' : '❌ NOT SET'}`);
console.log(`  BREVO_FROM_EMAIL: ${process.env.BREVO_FROM_EMAIL || '❌ NOT SET (will use default)'}`);
console.log(`  RESEND_API_KEY  : ${process.env.RESEND_API_KEY ? '✅ set' : '❌ NOT SET (skipped for OTP)'}`);
console.log(`  SMTP_USER       : ${process.env.SMTP_USER || '❌ NOT SET'}`);
console.log(`  SMTP_PASS       : ${process.env.SMTP_PASS ? '✅ set' : '❌ NOT SET'}`);
console.log('========================================\n');

async function testBrevo() {
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
  const fromEmail   = (process.env.BREVO_FROM_EMAIL || 'legalbaqala@gmail.com').trim();

  if (!brevoApiKey) {
    console.log('[BREVO] ⏭️  Skipped — BREVO_API_KEY not set.\n');
    return false;
  }

  console.log(`[BREVO] Sending test OTP to: ${targetEmail} ...`);
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Baqala', email: fromEmail },
        to: [{ email: targetEmail }],
        subject: `${testOtp} is your Baqala verification code [TEST]`,
        htmlContent: `<h2>Test OTP: <strong>${testOtp}</strong></h2><p>This is a diagnostic email from test-otp-email.js</p>`,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`[BREVO] ✅ SUCCESS! Response:`, JSON.stringify(data));
      return true;
    } else {
      console.error(`[BREVO] ❌ FAILED (HTTP ${res.status}):`, JSON.stringify(data));
      if (res.status === 401) console.error('         → API Key is invalid or expired.');
      if (res.status === 403) console.error('         → Sender email not verified in Brevo dashboard.');
      if (res.status === 400) console.error('         → Bad request — check sender/recipient format.');
      return false;
    }
  } catch (err) {
    console.error(`[BREVO] ❌ Network Error:`, err.message);
    return false;
  }
}

async function testSmtp() {
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').replace(/[\s"']/g, '');

  if (!smtpUser || !smtpPass) {
    console.log('[SMTP]  ⏭️  Skipped — SMTP_USER or SMTP_PASS not set.\n');
    return false;
  }

  console.log(`[SMTP]  Sending test OTP to: ${targetEmail} ...`);
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass },
    });

    const info = await transporter.sendMail({
      from: `"Baqala" <${smtpUser}>`,
      to: targetEmail,
      subject: `${testOtp} is your Baqala verification code [TEST]`,
      html: `<h2>Test OTP: <strong>${testOtp}</strong></h2><p>This is a diagnostic email from test-otp-email.js</p>`,
    });

    console.log(`[SMTP]  ✅ SUCCESS! messageId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`[SMTP]  ❌ FAILED:`, err.message);
    if (err.message.includes('Invalid login')) console.error('         → Gmail App Password is wrong.');
    if (err.message.includes('Username and Password')) console.error('         → Enable 2FA and use an App Password, not your Gmail password.');
    return false;
  }
}

(async () => {
  console.log('--- Testing Brevo ---');
  const brevoOk = await testBrevo();

  if (!brevoOk) {
    console.log('\n--- Testing SMTP (Gmail fallback) ---');
    const smtpOk = await testSmtp();

    if (!smtpOk) {
      console.log('\n========================================');
      console.log('❌ ALL PROVIDERS FAILED');
      console.log('   OTP would land in server logs only.');
      console.log('   Fix your env vars on Render!');
      console.log('========================================\n');
    }
  } else {
    console.log('\n✅ Brevo is working — OTPs will be delivered correctly.');
    console.log(`   Check ${targetEmail} inbox (and spam folder).\n`);
  }
})();
