const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  app: { type: mongoose.Schema.Types.ObjectId, ref: 'App', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 0, max: 5 },
  comment: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Feedback', default: null }, // for replies
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for efficient queries
feedbackSchema.index({ app: 1, createdAt: -1 });
feedbackSchema.index({ app: 1, user: 1, parent: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
