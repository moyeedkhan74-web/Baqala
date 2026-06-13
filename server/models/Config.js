const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  // Upload Limits
  maxApkSize: { type: Number, default: 500 }, // in MB
  maxImageSize: { type: Number, default: 5 }, // in MB

  // Global Announcement
  announcement: {
    enabled: { type: Boolean, default: false },
    text: { type: String, default: '' },
    level: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' }
  },

  // Maintenance & System
  isMaintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'Baqala is currently under maintenance. We will be back shortly!' },

  // Section Controls (for Home page)
  sections: {
    trending: { type: Boolean, default: true },
    newReleases: { type: Boolean, default: true },
    categoryBrowsing: { type: Boolean, default: true },
    featuredCarousel: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Config', ConfigSchema);
