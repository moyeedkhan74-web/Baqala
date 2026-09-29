const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'API key name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  prefix: {
    type: String,
    required: true
  },
  keyHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  scopes: [{
    type: String,
    enum: ['read:analytics', 'write:apps', 'read:crash_logs', 'read:releases', 'write:releases']
  }],
  lastUsedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'revoked'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

apiKeySchema.index({ developer: 1, status: 1 });

module.exports = mongoose.model('ApiKey', apiKeySchema);
