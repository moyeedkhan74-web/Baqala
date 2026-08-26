const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  recipient: {
    type: String,
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    enum: ['brevo', 'resend', 'smtp', 'simulated'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'timeout'],
    default: 'pending',
    index: true
  },
  error: {
    type: String,
    default: null
  },
  relatedAppId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App',
    index: true
  },
  attemptedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  // Native MongoDB TTL: Auto-deletes email delivery logs after 14 days
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 14 * 24 * 60 * 60 // 14 Days (1,209,600 seconds)
  }
});

module.exports = mongoose.model('EmailLog', emailLogSchema);
