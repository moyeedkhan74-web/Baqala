const User = require('../models/User');
const App = require('../models/App');

exports.getDeveloperProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch User details
    const user = await User.findById(id).select('name bio avatar createdAt role specialization tagline');
    if (!user) {
      return res.status(404).json({ message: 'Developer not found.' });
    }

    // 2. Aggregate stats from App collection
    const mongoose = require('mongoose');
    const stats = await App.aggregate([
      { $match: { developer: new mongoose.Types.ObjectId(id), status: 'approved' } },
      {
        $group: {
          _id: null,
          totalApps: { $sum: 1 },
          totalDownloads: { $sum: '$totalDownloads' }
        }
      }
    ]);

    const developerStats = stats.length > 0 ? stats[0] : { totalApps: 0, totalDownloads: 0 };

    // 3. Fetch Developer's apps
    const apps = await App.find({ developer: user._id, status: 'approved' })
      .sort({ totalDownloads: -1 })
      .select('_id title icon category averageRating reviewCount totalDownloads');

    res.json({
      developer: {
        _id: user._id,
        name: user.name,
        bio: user.bio,
        specialization: user.specialization,
        tagline: user.tagline,
        avatar: user.avatar,
        joinDate: user.createdAt,
        role: user.role
      },
      stats: {
        totalApps: developerStats.totalApps,
        totalDownloads: developerStats.totalDownloads
      },
      apps
    });
  } catch (error) {
    console.error('Error fetching developer profile:', error);
    res.status(500).json({ message: 'Server error while fetching profile.' });
  }
};
