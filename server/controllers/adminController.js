const App = require('../models/App');
const User = require('../models/User');
const Review = require('../models/Review');
const Download = require('../models/Download');

exports.getPendingApps = async (req, res) => {
  try {
    const apps = await App.find({ status: 'pending' })
      .populate('developer', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json({ apps });
  } catch (error) {
    console.error('Get pending apps error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateAppStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected.' });
    }

    const updates = { status };
    if (status === 'rejected' && rejectionReason) {
      updates.rejectionReason = rejectionReason;
    }

    const app = await App.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('developer', 'name email avatar');

    if (!app) {
      return res.status(404).json({ message: 'App not found.' });
    }

    res.json({ app });
  } catch (error) {
    console.error('Update app status error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.toggleBanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot ban an admin.' });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({ user, message: user.isBanned ? 'User banned.' : 'User unbanned.' });
  } catch (error) {
    console.error('Toggle ban error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalDevelopers,
      totalApps,
      pendingApps,
      approvedApps,
      totalDownloads,
      totalReviews
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'developer' }),
      App.countDocuments(),
      App.countDocuments({ status: 'pending' }),
      App.countDocuments({ status: 'approved' }),
      Download.countDocuments(),
      Review.countDocuments()
    ]);

    // Recent activity
    const recentApps = await App.find()
      .populate('developer', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalUsers,
        totalDevelopers,
        totalApps,
        pendingApps,
        approvedApps,
        totalDownloads,
        totalReviews
      },
      recentApps
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getAllApps = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [apps, total] = await Promise.all([
      App.find(query)
        .populate('developer', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      App.countDocuments(query)
    ]);

    res.json({
      apps,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get all apps error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
