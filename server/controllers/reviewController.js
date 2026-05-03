const Review = require('../models/Review');
const App = require('../models/App');

exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const appId = req.params.appId;

    const app = await App.findById(appId);
    if (!app) {
      return res.status(404).json({ message: 'App not found.' });
    }

    if (app.status !== 'approved') {
      return res.status(400).json({ message: 'Cannot review an unapproved app.' });
    }

    // Prevent developer from reviewing their own app
    if (app.developer.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot review your own app.' });
    }

    // Check if user already reviewed this app
    const existingReview = await Review.findOne({ user: req.user._id, app: appId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this app.' });
    }

    const review = await Review.create({
      user: req.user._id,
      app: appId,
      rating: parseInt(rating),
      comment: comment || ''
    });

    await review.populate('user', 'name avatar');

    res.status(201).json({ review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const appId = req.params.appId;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const rawReviews = await Review.find({ app: appId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter out reviews from deleted/orphaned users (only show real users)
    const reviews = rawReviews.filter(r => r.user && r.user.name);

    const total = await Review.countDocuments({ app: appId });

    res.json({
      reviews,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total: reviews.length
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review.' });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
