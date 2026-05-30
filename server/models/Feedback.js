const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  app: { type: mongoose.Schema.Types.ObjectId, ref: 'App', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5 },
  comment: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Feedback', default: null }, // for replies
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
