const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  app: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App',
    required: true
  },
  ip: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

downloadSchema.index({ app: 1 });
downloadSchema.index({ user: 1 });
downloadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Download', downloadSchema);
