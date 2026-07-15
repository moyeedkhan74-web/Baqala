const mongoose = require('mongoose');

const appSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'App title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters'],
    default: ''
  },
  tagline: {
    type: String,
    maxlength: [100, 'Tagline cannot exceed 100 characters'],
    default: ''
  },
  category: [{
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Games', 'Social', 'Productivity', 'Education',
      'Entertainment', 'Tools', 'Finance', 'Health',
      'Music', 'Photography', 'Shopping', 'Travel',
      'Food', 'Sports', 'News', 'Developer Tools', 'Other'
    ]
  }],
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  developerName: {
    type: String,
    default: ''
  },
  fileUrl: {
    type: String,
    required: [true, 'App file URL is required']
  },
  fileName: {
    type: String,
    default: 'app_file'
  },
  fileSize: {
    type: Number,
    default: 0
  },
  icon: {
    type: String,
    default: ''
  },
  screenshots: [{
    type: String
  }],
  version: {
    type: String,
    default: '1.0.0'
  },
  platform: {
    type: String,
    enum: ['Android', 'iOS', 'Windows', 'macOS', 'Linux', 'Web', 'Cross-platform'],
    default: 'Cross-platform'
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  totalDownloads: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending_scan', 'pending_review', 'approved', 'rejected', 'auto_rejected'],
    default: 'pending_scan'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  isFeatured: {
    type: Boolean,
    default: false
  },
  // VirusTotal / Security Pipeline
  vtResult: { 
    type: String, 
    enum: ['clean', 'suspicious', 'malware', null], 
    default: null 
  },
  vtScanId: { type: String, default: null }, // Analysis ID for polling
  vtReportUrl: { type: String, default: null }, // Full permalink
  vtMaliciousCount: { type: Number, default: 0 },
  vtTotalEngines: { type: Number, default: 0 },
  
  // Moderation
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  // AI & Internal Analytics
  apkMetadata: {
    packageName: String,
    versionName: String,
    permissions: [String],
    activities: [String],
    services: [String],
    receivers: [String],
    fileCount: { type: Number, default: 0 },
    nativeLibCount: { type: Number, default: 0 },
    dexStrings: [String],
    suspiciousUrls: [String],
    extractionError: String,
  },
  aiModeration: {
    analysedAt: Date,
    appSummary: String,
    shortDescription: String,
    approvalScore: { type: Number, default: null },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical', 'pending', 'error'],
      default: 'pending',
    },
    targetAudience: String,
    keyFeatures: [String],
    permissionAnalysis: String,
    contentFlags: [String],
    suspiciousSignals: [String],
    recommendation: {
      type: String,
      enum: ['approve', 'review', 'reject', null],
      default: null,
    },
    adminNote: String,
    analysisError: String,
  },
  banner: { type: String, default: '' },
  fileHash: { type: String, default: null },
  // Security Scanning
  scanStatus: {
    type: String,
    enum: ['clean', 'scanning', 'scan_failed', 'not_scanned', null],
    default: null
  },
  scanCompletedAt: { type: Date, default: null },
  tier: {
    type: String,
    enum: ['low', 'mid', 'high', 'advance'],
    default: 'low'
  }
}, {
  timestamps: true
});

appSchema.index({ title: 'text', description: 'text', tags: 'text' });
appSchema.index({ category: 1, status: 1 });
appSchema.index({ developer: 1 });
appSchema.index({ averageRating: -1 });
appSchema.index({ totalDownloads: -1 });

module.exports = mongoose.model('App', appSchema);
