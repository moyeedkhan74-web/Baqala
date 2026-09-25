const mongoose = require('mongoose');

const crashLogSchema = new mongoose.Schema({
  app: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App',
    required: true,
    index: true
  },
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  logType: {
    type: String,
    enum: ['deployment_error', 'runtime_crash', 'security_warning', 'validation_failure'],
    default: 'runtime_crash'
  },
  title: {
    type: String,
    required: true
  },
  errorStack: {
    type: String,
    default: ''
  },
  deviceInfo: {
    osVersion: { type: String, default: 'Android' },
    deviceModel: { type: String, default: 'Generic Device' },
    appVersion: { type: String, default: '1.0.0' }
  },
  aiDiagnostic: {
    summary: { type: String, default: '' },
    suggestedFix: { type: String, default: '' },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' }
  },
  // Auto-expire logs after 30 days by default (can be filtered per tier)
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CrashLog', crashLogSchema);
