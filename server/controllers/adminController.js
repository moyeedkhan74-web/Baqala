const App = require('../models/App');
const User = require('../models/User');
const Review = require('../models/Review');
const Download = require('../models/Download');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const { deleteFromB2, extractB2Key } = require('../utils/b2Storage');

// GET /api/admin/apps
exports.getAllApps = async (req, res) => {
  try {
    const apps = await App.find({})
      .select('title developerName status category icon developer isFeatured banner')
      .populate('developer', 'name')
      .sort({ createdAt: -1 });
    console.log(`[ADMIN] Fetched ${apps.length} apps. Featured count: ${apps.filter(a => a.isFeatured).length}`);
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
    const days = parseInt(req.query.days) || 7;
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
      reports: pendingReports > 0 ? '5' : '0' 
    };

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
      .populate('developer', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const activity = [
      ...recentApps.map(a => ({ id: `app-${a._id}`, action: 'New App Uploaded', target: a.title, admin: a.developerName || 'Developer', time: a.createdAt, type: 'info' })),
      ...recentUsers.map(u => ({ id: `user-${u._id}`, action: 'New User Joined', target: u.name, admin: 'System', time: u.createdAt, type: 'success' })),
      ...recentReports.map(r => ({ 
        id: `report-${r._id}`, 
        action: r.app ? 'App Reported' : 'Developer Reported', 
        target: r.app?.title || r.developer?.name || 'Unknown Target', 
        admin: 'User', 
        time: r.createdAt, 
        type: 'warning' 
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

    // Dynamic chart data for requested period
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
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

// GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    // 1. Top Apps by Downloads
    const topApps = await App.find({})
      .select('title totalDownloads icon category')
      .sort({ totalDownloads: -1 })
      .limit(5)
      .lean();

    // 2. Downloads Over Time (daily breakdown)
    const downloadTrend = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.setHours(0,0,0,0));
      const endOfDay = new Date(d.setHours(23,59,59,999));
      
      const dayDownloads = await Download.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      const daySignups = await User.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      const dayApps = await App.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      downloadTrend.push({
        date: new Date(startOfDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        downloads: dayDownloads,
        signups: daySignups,
        apps: dayApps
      });
    }

    // 3. Category Distribution
    const allApps = await App.find({}, 'category').lean();
    const categoryMap = {};
    allApps.forEach(app => {
      const cats = Array.isArray(app.category) ? app.category : [app.category || 'Other'];
      cats.forEach(cat => {
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      });
    });
    const categoryDistribution = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 4. Summary Stats
    const totalApps = await App.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalDownloads = allApps.length > 0
      ? (await App.aggregate([{ $group: { _id: null, total: { $sum: '$totalDownloads' } } }]))[0]?.total || 0
      : 0;
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    // 5. Recent Users
    const recentUsers = await User.find({})
      .select('name email avatar createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      topApps,
      downloadTrend,
      categoryDistribution,
      recentUsers,
      summary: { totalApps, totalUsers, totalDownloads, pendingReports }
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics.' });
  }
};

// DELETE /api/admin/apps/:id
exports.deleteApp = async (req, res) => {
  try {
    const app = await App.findById(req.params.id).populate('developer', 'name email');
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

    // 4. Delete related Reviews, Downloads, and Reports
    await Review.deleteMany({ app: req.params.id });
    await Download.deleteMany({ app: req.params.id });
    await Report.deleteMany({ app: req.params.id });

    // 5. Send In-App Notification to Developer
    if (app.developer?._id) {
      await Notification.create({
        recipient: app.developer._id,
        title: 'Application Removed',
        message: `Your application "${app.title}" has been permanently removed from the Baqala platform following a review. Repeated violations could result in account restriction.`,
        type: 'danger'
      });
    }

    res.json({ message: 'App and all associated data deleted successfully.' });
  } catch (error) {
    console.error('Admin delete app error:', error);
    res.status(500).json({ message: 'Server error during app deletion.' });
  }
};

// PATCH /api/admin/apps/:id/status
exports.updateAppStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    
    const app = await App.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'App not found.' });

    app.status = status;
    await app.save();
    
    // Notify Developer
    if (app.developer) {
      const isApproved = status === 'approved';
      await Notification.create({
        recipient: app.developer,
        title: isApproved ? '🚀 Application Approved' : '❌ Application Rejected',
        message: isApproved 
          ? `Your application "${app.title}" has been approved and is now live on the Baqala platform!` 
          : `Your application "${app.title}" was not approved. Please review our guidelines and try again.`,
        type: isApproved ? 'success' : 'danger'
      });
    }

    res.json({ message: `App status updated to ${status}.`, app });
  } catch (error) {
    console.error('Admin update app status error:', error);
    res.status(500).json({ message: 'Server error updating app status.' });
  }
};

// POST /api/admin/users/:id/ban
exports.banUser = async (req, res) => {
  try {
    const { weeks, durationDays, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot ban another admin.' });
    }

    const banUntil = new Date();
    let displayDuration = 'Permanent';

    if (durationDays === 'Permanent') {
      banUntil.setFullYear(banUntil.getFullYear() + 100);
    } else if (durationDays) {
      banUntil.setDate(banUntil.getDate() + parseInt(durationDays));
      displayDuration = durationDays;
    } else {
      // Fallback for legacy calls (from original weeks logic)
      const banDuration = parseInt(weeks) || 520; // Default ~10 years
      banUntil.setDate(banUntil.getDate() + (banDuration * 7));
      displayDuration = banDuration * 7;
    }

    user.isBanned = true;
    user.banUntil = banUntil;
    user.banReason = reason || 'Violation of community guidelines.';
    await user.save();

    // Send In-App Notification
    await Notification.create({
      recipient: user._id,
      title: 'Account Restricted',
      message: `Your account has been restricted. Reason: ${user.banReason}. Duration: ${displayDuration === 'Permanent' ? 'Permanent' : displayDuration + ' days'}.`,
      type: 'danger'
    });

    res.json({ 
      message: `User banned restrictions applied.`, 
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
// POST /api/admin/users/:id/unban
exports.unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.isBanned = false;
    user.banUntil = null;
    user.banReason = null;
    await user.save();

    // Notify User
    await Notification.create({
      recipient: user._id,
      title: '🔓 Account Reinstated',
      message: 'Great news! Your account restrictions have been lifted. You can now access all features of the Baqala platform.',
      type: 'success'
    });

    res.json({ 
      message: 'User unbanned successfully.',
      user: { _id: user._id, isBanned: user.isBanned, banUntil: user.banUntil }
    });
  } catch (error) {
    console.error('Admin unban user error:', error);
    res.status(500).json({ message: 'Server error unbanning user.' });
  }
};

// GET /api/admin/reports
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find({})
      .populate('reportedBy', 'name')
      .populate('app', 'title')
      .populate('developer', 'name')
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (error) {
    console.error('Admin get reports error:', error);
    res.status(500).json({ message: 'Server error fetching reports.' });
  }
};

// PATCH /api/admin/reports/:id/dismiss
exports.dismissReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('app', 'title')
      .populate('developer', 'name');

    if (!report) return res.status(404).json({ message: 'Report not found.' });

    report.status = 'reviewed';
    await report.save();

    // Notify Reporter In-App
    if (report.reportedBy?._id) {
      const targetName = report.app ? report.app.title : (report.developer ? report.developer.name : 'Unknown Target');
      await Notification.create({
        recipient: report.reportedBy._id,
        title: 'Report Reviewed',
        message: `Thank you for keeping Baqala safe. Your report concerning "${targetName}" has been reviewed and appropriate action has been taken.`,
        type: 'success'
      });
    }

    res.json({ message: 'Report actioned and reporter notified.', report });
  } catch (error) {
    console.error('Admin dismiss report error:', error);
    res.status(500).json({ message: 'Server error dismissing report.' });
  }
};

// GET /api/admin/apps/flagged
exports.getFlaggedApps = async (req, res) => {
  try {
    const apps = await App.find({
      $or: [
        { scanStatus: 'malicious' },
        { isFlagged: true }
      ]
    })
    .populate('developer', 'name email')
    .sort({ createdAt: -1 });

    res.json({ apps });
  } catch (error) {
    console.error('Admin get flagged apps error:', error);
    res.status(500).json({ message: 'Server error fetching flagged apps.' });
  }
};

// PATCH /api/admin/apps/:id/featured
exports.toggleFeatured = async (req, res) => {
  try {
    const app = await App.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'App not found.' });

    app.isFeatured = !app.isFeatured;
    await app.save();
    console.log(`[ADMIN] Toggled featured for ${app.title}. New state: ${app.isFeatured}`);

    res.json({ message: `App is now ${app.isFeatured ? 'featured' : 'standard'}`, isFeatured: app.isFeatured });
  } catch (error) {
    console.error('Admin toggle featured error:', error);
    res.status(500).json({ message: 'Server error toggling featured status.' });
  }
};

// POST /api/admin/reports/:id/warn
exports.warnDeveloper = async (req, res) => {
  try {
    const { warningMessage } = req.body;
    const report = await Report.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('app', 'title developer')
      .populate('developer', 'name');

    if (!report) return res.status(404).json({ message: 'Report not found.' });

    const devId = report.app ? report.app.developer : report.developer?._id;

    if (devId) {
      await Notification.create({
        recipient: devId,
        title: '⚠️ Moderation Warning',
        message: `Admin Notice: ${warningMessage}`,
        type: 'warning'
      });
    }

    report.status = 'reviewed';
    await report.save();

    // Notify Reporter In-App
    if (report.reportedBy?._id) {
      const targetName = report.app ? report.app.title : (report.developer ? report.developer.name : 'Unknown Target');
      await Notification.create({
        recipient: report.reportedBy._id,
        title: 'Report Reviewed',
        message: `Thank you for keeping Baqala safe. Your report concerning "${targetName}" has been reviewed and an official warning has been issued to the developer.`,
        type: 'success'
      });
    }

    res.json({ message: 'Warning issued to developer and report resolved.', report });
  } catch (error) {
    console.error('Admin warn developer error:', error);
    res.status(500).json({ message: 'Server error issuing warning.' });
  }
};

