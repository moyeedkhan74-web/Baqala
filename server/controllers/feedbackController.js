const Feedback = require('../models/Feedback');
const App = require('../models/App');

// Create feedback or reply
exports.createFeedback = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { rating, comment, parentId } = req.body;
    const userId = req.user._id;

    // If it's a top-level review (not a reply), check for existing review
    if (!parentId) {
      const existing = await Feedback.findOne({ app: appId, user: userId, parent: null });
      if (existing) {
        return res.status(400).json({ message: 'You have already reviewed this app. Please edit your existing review.' });
      }
    }

    const feedback = await Feedback.create({
      app: appId,
      user: userId,
      rating: parentId ? 0 : Number(rating) || 1, // Replies don't carry ratings
      comment,
      parent: parentId || null
    });

    // Update app rating aggregate ONLY if top‑level feedback
    if (!parentId) {
      const feedbacks = await Feedback.find({ app: appId, parent: null });
      const totalRatings = feedbacks.length;
      const sumRatings = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
      
      const averageRating = totalRatings > 0 ? (sumRatings / totalRatings) : 0;

      await App.findByIdAndUpdate(appId, {
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: totalRatings
      });
    }

    await feedback.populate('user', 'name avatar');
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
