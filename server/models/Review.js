const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  app: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    default: ''
  }
}, {
  timestamps: true
});

reviewSchema.index({ app: 1, user: 1 }, { unique: true });

reviewSchema.statics.calculateAverageRating = async function (appId) {
  const result = await this.aggregate([
    { $match: { app: appId } },
    {
      $group: {
        _id: '$app',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  const App = mongoose.model('App');
  if (result.length > 0) {
    await App.findByIdAndUpdate(appId, {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews
    });
  } else {
    await App.findByIdAndUpdate(appId, {
      averageRating: 0,
      totalReviews: 0
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calculateAverageRating(this.app);
});

reviewSchema.post('findOneAndDelete', function (doc) {
  if (doc) {
    doc.constructor.calculateAverageRating(doc.app);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
