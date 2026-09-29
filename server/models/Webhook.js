const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  app: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App',
    index: true,
    default: null
  },
  url: {
    type: String,
    required: [true, 'Webhook URL is required'],
    trim: true
  },
  events: [{
    type: String,
    enum: ['crash_critical', 'new_review', 'milestone_download'],
    default: ['crash_critical']
  }],
  secret: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

webhookSchema.index({ developer: 1, isActive: 1 });
webhookSchema.index({ app: 1 });

module.exports = mongoose.model('Webhook', webhookSchema);
