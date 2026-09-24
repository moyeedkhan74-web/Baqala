const Feedback = require('../models/Feedback');
const App = require('../models/App');
const User = require('../models/User');

// 2-minute in-memory cache for getFeedback
const feedbackCache = new Map();

const getCacheKey = (appId) => `feedback:${appId}`;

const cacheSet = (key, value) => {
  feedbackCache.set(key, { value, expiry: Date.now() + 120000 }); // 2 minutes TTL
};

const cacheGet = (key) => {
  const entry = feedbackCache.get(key);
  if (entry && Date.now() < entry.expiry) return entry.value;
  if (entry && Date.now() >= entry.expiry) {
    feedbackCache.delete(key);
  }
  return null;
};

// Create feedback or reply (MongoDB version)
exports.createFeedback = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { rating, comment, parentId } = req.body;
    const userId = req.user._id.toString();

    // 500-character limit on comment
    if (comment && comment.length > 500) {
      return res.status(400).json({ message: 'Comment must be at most 500 characters.' });
    }

    // If top-level, check for existing review
    if (!parentId) {
      const existing = await Feedback.findOne({ app: appId, user: userId, parent: null });
      if (existing) {
        return res.status(400).json({ message: 'You have already reviewed this app.' });
      }
    }

    // Create new feedback document
    const newFeedback = new Feedback({
      app: appId,
      user: userId,
      rating: parentId ? 0 : Number(rating) || 1,
      comment,
      parent: parentId || null
    });

    await newFeedback.save();

    // Populate user details
    const populated = await newFeedback.populate('user', 'name avatar');

    // If top-level feedback, recalculate App averageRating and reviewCount
    if (!parentId) {
      const allTopLevel = await Feedback.find({ app: appId, parent: null }).select('rating');
      const totalRatings = allTopLevel.length;
      const sumRatings = allTopLevel.reduce((acc, f) => acc + (f.rating || 0), 0);
      const averageRating = totalRatings > 0 ? Math.round((sumRatings / totalRatings) * 10) / 10 : 0;

      await App.findByIdAndUpdate(appId, {
        averageRating,
        reviewCount: totalRatings
      });
    }

    res.status(201).json({ feedback: populated });
  } catch (err) {
    console.error('[CREATE_FEEDBACK_ERROR] Exception:', err.message);
    res.status(500).json({ message: 'Server error during feedback creation.' });
  }
};

// Get feedback for an app (with 2-minute in-memory cache)
exports.getFeedback = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const cacheKey = getCacheKey(appId);
    const cached = cacheGet(cacheKey);

    if (cached) {
      return res.json({ feedback: cached });
    }

    const feedbacks = await Feedback.find({ app: appId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    // Store in cache
    cacheSet(cacheKey, feedbacks);

    res.json({ feedback: feedbacks });
  } catch (err) {
    console.error('[GET_FEEDBACK_ERROR] Exception:', err.message);
    res.json({ feedback: [], warning: 'Feedbacks are temporarily unavailable.' });
  }
};

// Like / dislike a feedback (MongoDB version)
exports.reactFeedback = async (req, res, next) => {
  try {
    const { feedbackId } = req.params;
    const { type } = req.body;
    const userId = req.user._id.toString();

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found.' });

    let likedBy = feedback.likedBy || [];
    let dislikedBy = feedback.dislikedBy || [];

    if (type === 'like') {
      if (likedBy.includes(userId)) {
        likedBy = likedBy.filter(id => id !== userId);
      } else {
        likedBy.push(userId);
        // Remove from disliked if present
        dislikedBy = dislikedBy.filter(id => id !== userId);
      }
    } else if (type === 'dislike') {
      if (dislikedBy.includes(userId)) {
        dislikedBy = dislikedBy.filter(id => id !== userId);
      } else {
        dislikedBy.push(userId);
        // Remove from liked if present
        likedBy = likedBy.filter(id => id !== userId);
      }
    }

    // Update the feedback document
    feedback.likedBy = likedBy;
    feedback.dislikedBy = dislikedBy;
    feedback.likes = likedBy.length;
    feedback.dislikes = dislikedBy.length;

    await feedback.save();

    // Populate user details for response
    const populated = await feedback.populate('user', 'name avatar');
    res.json({ feedback: populated });
  } catch (err) {
    console.error('[REACT_FEEDBACK_ERROR] Exception:', err.message);
    next(err);
  }
};