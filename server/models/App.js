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
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Games', 'Social', 'Productivity', 'Education',
      'Entertainment', 'Tools', 'Finance', 'Health',
      'Music', 'Photography', 'Shopping', 'Travel',
      'Food', 'Sports', 'News', 'Developer Tools', 'Other'
    ]
  },
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
  totalReviews: {
    type: Number,
    default: 0
  },
  totalDownloads: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

appSchema.index({ title: 'text', description: 'text', tags: 'text' });
appSchema.index({ category: 1, status: 1 });
appSchema.index({ developer: 1 });
appSchema.index({ averageRating: -1 });
appSchema.index({ totalDownloads: -1 });

module.exports = mongoose.model('App', appSchema);
