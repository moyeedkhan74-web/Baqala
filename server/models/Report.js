const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  app: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App',
    required: true
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

// Unique compound index on { app, reportedBy }
reportSchema.index({ app: 1, reportedBy: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
