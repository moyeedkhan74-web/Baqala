const express = require('express');
const { body } = require('express-validator');
const { register, login, getProfile, updateProfile, googleLogin, firebaseLogin, firebaseRegister, sendOtp, verifyOtp } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// OTP Authentication routes (Brevo Email)
router.post('/send-otp', authLimiter, [
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

module.exports = router;

