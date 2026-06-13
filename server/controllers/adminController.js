const App = require('../models/App');
const User = require('../models/User');
const Review = require('../models/Review');
const Download = require('../models/Download');
const Report = require('../models/Report');
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

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const totalApps = await App.countDocuments();
    const appsLast24h = await App.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } });
    
    const totalUsers = await User.countDocuments();
    const usersLast24h = await User.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } });
    
    const pendingApps = await App.countDocuments({ status: 'pending' });
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    
    // Sum up all totalDownloads from App model
    const appsData = await App.find({}, 'totalDownloads');
    const totalDownloadsCount = appsData.reduce((sum, app) => sum + (app.totalDownloads || 0), 0);
    
    // Get downloads in last 24h from Download model
    const downloadsLast24h = await Download.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } });

    // Calculate percentage changes
    const calculateChange = (current, last24h) => {
      const previousTotal = current - last24h;
      if (previousTotal <= 0) return last24h > 0 ? 100 : 0;
      return ((last24h / previousTotal) * 100).toFixed(1);
    };

    const changes = {
      apps: calculateChange(totalApps, appsLast24h),
      users: calculateChange(totalUsers, usersLast24h),
      downloads: calculateChange(totalDownloadsCount, downloadsLast24h),
      reports: pendingReports > 0 ? '5' : '0' // Placeholder for reports change
    };

    // Get recent activity (last 5)
    const recentApps = await App.find({})
      .select('title developerName createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentUsers = await User.find({})
      .select('name createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentReports = await Report.find({})
      .populate('app', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    const activity = [
      ...recentApps.map(a => ({ id: `app-${a._id}`, action: 'New App Uploaded', target: a.title, admin: a.developerName || 'Developer', time: a.createdAt, type: 'info' })),
      ...recentUsers.map(u => ({ id: `user-${u._id}`, action: 'New User Joined', target: u.name, admin: 'System', time: u.createdAt, type: 'success' })),
      ...recentReports.map(r => ({ id: `report-${r._id}`, action: 'App Reported', target: r.app?.title || 'Unknown App', admin: 'User', time: r.createdAt, type: 'warning' }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

    // Dynamic chart data (last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.setHours(0,0,0,0));
      const endOfDay = new Date(d.setHours(23,59,59,999));
      
      const dayDownloads = await Download.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      chartData.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        downloads: dayDownloads
      });
    }

    res.json({
      stats: {
        totalApps,
        totalUsers,
        pendingApps,
        pendingReports,
        totalDownloads: totalDownloadsCount
      },
      changes,
      activity,
      chartData
    });
  } catch (error) {
    console.error('Admin get stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats.' });
  }
};

// DELETE /api/admin/apps/:id
exports.deleteApp = async (req, res) => {
  try {
    const app = await App.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ message: 'App not found.' });
    }

    // 1. Delete binary from B2
    if (app.fileUrl) {
      const binaryKey = extractB2Key(app.fileUrl);
      if (binaryKey) {
        await deleteFromB2(binaryKey, true);
      }
    }

    // 2. Delete icon + screenshots from B2
    if (app.icon) {
      const iconKey = extractB2Key(app.icon);
      if (iconKey) {
        await deleteFromB2(iconKey, false);
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
