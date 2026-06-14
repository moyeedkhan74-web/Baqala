const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'danger'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  link: {
    type: String, // Optional URL to navigate when clicked
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
