const express = require('express');
const { body } = require('express-validator');
const { register, login, getProfile, updateProfile, googleLogin, firebaseLogin, firebaseRegister, sendOtp, verifyOtp } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const { sendOtpEmail } = require('../services/emailService');

const router = express.Router();

// OTP Authentication routes (Brevo Email)
router.post('/send-otp', otpLimiter, [
  body('email').isEmail().withMessage('Valid email is required')
], sendOtp);

router.post('/verify-otp', authLimiter, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP code must be 6 digits')
], verifyOtp);

router.post('/register', authLimiter, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], register);

router.post('/login', authLimiter, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], login);

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/google', authLimiter, googleLogin);

// Firebase Auth routes
router.post('/firebase-login', authLimiter, firebaseLogin);
router.post('/firebase-register', authLimiter, firebaseRegister);

// ── TEMPORARY DEBUG ROUTE — remove after email is confirmed working ──────────
// Usage: GET /api/auth/debug-email?to=anyuser@gmail.com
// Returns a JSON report of which email provider succeeded or failed.
router.get('/debug-email', async (req, res) => {
  const toEmail = req.query.to;
  if (!toEmail) return res.status(400).json({ error: 'Pass ?to=email@example.com in the query string' });

  const report = {
    targetEmail: toEmail,
    env: {
      BREVO_API_KEY:    process.env.BREVO_API_KEY    ? `set (${process.env.BREVO_API_KEY.slice(0, 8)}...)` : 'NOT SET',
      BREVO_FROM_EMAIL: process.env.BREVO_FROM_EMAIL || 'NOT SET (using default)',
      SMTP_USER:        process.env.SMTP_USER        || 'NOT SET',
      SMTP_PASS:        process.env.SMTP_PASS        ? 'set'  : 'NOT SET',
    },
    result: null,
    error: null,
  };

  try {
    report.result = await sendOtpEmail(toEmail, '000000');
  } catch (err) {
    report.error = err.message;
  }

  res.json(report);
});

module.exports = router;
