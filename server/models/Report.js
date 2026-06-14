const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  app: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App',
    required: false
  },
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: [
      'malware_virus', 
      'scam_fake', 
      'inappropriate_content', 
      'copyright_violation', 
      'misleading_description', 
      'spam', 
      'harassment',
      'impersonation',
      'other'
    ],
    required: true
  },
  customReason: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed', 'actioned'],
    default: 'pending'
  },
  adminNote: {
    type: String
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Validation: Ensure either app or developer is provided
reportSchema.pre('validate', function(next) {
  if (!this.app && !this.developer) {
    next(new Error('Report must target either an app or a developer account.'));
  } else {
    next();
  }
});

// Unique compound index: One user can report a specific target once
reportSchema.index({ app: 1, reportedBy: 1 }, { unique: true, sparse: true });
reportSchema.index({ developer: 1, reportedBy: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Report', reportSchema);
