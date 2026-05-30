const Feedback = require('../models/Feedback');
const App = require('../models/App');

// Create feedback or reply
exports.createFeedback = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { rating, comment, parentId } = req.body;
    const feedback = await Feedback.create({
      app: appId,
      user: req.user._id,
      rating,
      comment,
      parent: parentId || null
    });
    // Update app rating aggregate if top‑level feedback
    if (!parentId && rating) {
      const app = await App.findById(appId);
      const total = (app.averageRating || 0) * (app.reviewCount || 0) + Number(rating);
      const count = (app.reviewCount || 0) + 1;
      app.averageRating = Math.round((total / count) * 10) / 10;
      app.reviewCount = count;
      await app.save();
    }
    res.status(201).json({ feedback });
  } catch (err) {
    next(err);
  }
};

// Get feedback for an app (including replies)
exports.getFeedback = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const feedback = await Feedback.find({ app: appId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ feedback });
  } catch (err) {
    next(err);
  }
};

// Like / dislike a feedback
exports.reactFeedback = async (req, res, next) => {
  try {
    const { feedbackId } = req.params;
    const { type } = req.body; // "like" or "dislike"
    const update = type === 'like' ? { $inc: { likes: 1 } } : { $inc: { dislikes: 1 } };
    const fb = await Feedback.findByIdAndUpdate(feedbackId, update, { new: true });
    res.json({ feedback: fb });
  } catch (err) {
    next(err);
  }
};
