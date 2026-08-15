const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  // Track failed attempts — lock OTP after 3 wrong tries
  attempts: {
    type: Number,
    default: 0
  },
  // Cooldown: prevent resend within 60 seconds
  lastSentAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // MongoDB auto-deletes document after 5 minutes
  }
});

module.exports = mongoose.model('Otp', otpSchema);
