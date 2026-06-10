const App = require('../models/App');
const User = require('../models/User');
const Review = require('../models/Review');
const Download = require('../models/Download');
const { deleteFromB2, extractB2Key } = require('../utils/b2Storage');

// GET /api/admin/apps
exports.getAllApps = async (req, res) => {
  try {
    const apps = await App.find({})
      .select('title developerName status category icon developer')
      .populate('developer', 'name')
      .sort({ createdAt: -1 });
    res.json({ apps });
  } catch (error) {
    console.error('Admin get apps error:', error);
    res.status(500).json({ message: 'Server error fetching apps.' });
  }
};

// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('name email role isBanned banUntil avatar createdAt')
      .sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Server error fetching users.' });
  }
};

// DELETE /api/admin/apps/:id
exports.deleteApp = async (req, res) => {
  try {
    const app = await App.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ message: 'App not found.' });
    }

    // 1. Delete binary from B2 (B2_BUCKET_NAME)
    if (app.fileUrl) {
      const binaryKey = extractB2Key(app.fileUrl);
      if (binaryKey) {
        await deleteFromB2(binaryKey, true); // true = public bucket/binary account
      }
    }

    // 2. Delete icon + screenshots from B2 (B2_IMAGES_BUCKET)
    if (app.icon) {
      const iconKey = extractB2Key(app.icon);
      if (iconKey) {
        await deleteFromB2(iconKey, false); // false = private bucket/images account
      }
    }

    if (app.screenshots && app.screenshots.length > 0) {
      for (const screenshotUrl of app.screenshots) {
        const screenshotKey = extractB2Key(screenshotUrl);
        if (screenshotKey) {
          await deleteFromB2(screenshotKey, false);
        }
      }
    }

    // 3. Delete from MongoDB
    await App.findByIdAndDelete(req.params.id);

    // 4. Delete related Reviews and Downloads
    await Review.deleteMany({ app: req.params.id });
    await Download.deleteMany({ app: req.params.id });

    res.json({ message: 'App and all associated data deleted successfully.' });
  } catch (error) {
    console.error('Admin delete app error:', error);
    res.status(500).json({ message: 'Server error during app deletion.' });
  }
};

// POST /api/admin/users/:id/ban
exports.banUser = async (req, res) => {
  try {
    const { weeks, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot ban another admin.' });
    }

    const banDuration = parseInt(weeks) || 1;
    const banUntil = new Date();
    banUntil.setDate(banUntil.getDate() + (banDuration * 7));

    user.isBanned = true;
    user.banUntil = banUntil;
    user.banReason = reason || 'No reason provided';
    await user.save();

    res.json({ 
      message: `User banned for ${banDuration} week(s).`, 
      user: {
        _id: user._id,
        isBanned: user.isBanned,
        banUntil: user.banUntil,
        banReason: user.banReason
      }
    });
  } catch (error) {
    console.error('Admin ban user error:', error);
    res.status(500).json({ message: 'Server error banning user.' });
  }
};
