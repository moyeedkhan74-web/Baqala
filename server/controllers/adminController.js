const mongoose = require('mongoose');
const App = require('../models/App');
const User = require('../models/User');
const Review = require('../models/Review');
const Download = require('../models/Download');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const EmailLog = require('../models/EmailLog');
const { deleteBinary, deleteImage, extractB2Key } = require('../utils/b2Storage');
const { queueNotification } = require('../utils/notificationQueue');

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

    // Delete all assets from B2 in parallel
    const deletePromises = [];
    
    if (app.fileUrl) {
      const binaryKey = extractB2Key(app.fileUrl);
      if (binaryKey) deletePromises.push(deleteBinary(binaryKey));
    }

    if (app.icon) {
      const iconKey = extractB2Key(app.icon);
      if (iconKey) deletePromises.push(deleteImage(iconKey));
    }

    if (app.screenshots && app.screenshots.length > 0) {
      app.screenshots.forEach(url => {
        const key = extractB2Key(url);
        if (key) deletePromises.push(deleteImage(key));
      });
    }

    // Fire and forget deletions (or await in parallel)
    Promise.all(deletePromises).catch(err => console.error('[B2_CLEANUP_ERR]:', err));

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
    const { status, rejectionReason } = req.body;
    const validStatuses = ['approved', 'rejected', 'pending_review', 'pending_scan', 'auto_rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    
    const app = await App.findById(req.params.id).populate('developer', 'name email');
    if (!app) return res.status(404).json({ message: 'App not found.' });

    const previousStatus = app.status;
    app.status = status;
    app.rejectionReason = rejectionReason || '';
    app.reviewedBy = req.user._id;
    app.reviewedAt = new Date();
    await app.save();
    
    // Notify Developer - BACKGROUND TASK (Queued to prevent process exit)
    const { 
      sendApprovalEmail, 
      sendAdminRejectEmail,
      sendUploadConfirmationEmail 
    } = require('../services/emailService');
    
    if (app.developer && app.developer.email) {
      queueNotification(async () => {
        try {
          if (status === 'approved' && previousStatus !== 'approved') {
            await sendApprovalEmail(app.developer.email, app.title, app._id);
          } else if (status === 'rejected') {
            await sendAdminRejectEmail(app.developer.email, app.title, app.rejectionReason, app._id);
          }

          // Also send In-App Notification (Awaited within queue worker)
          const isApproved = status === 'approved';
          await Notification.create({
            recipient: app.developer._id,
            title: isApproved ? '🚀 Application Approved' : '❌ Application Rejected',
            message: isApproved 
              ? `Your application "${app.title}" has been approved and is now live on the Baqala platform!` 
              : `Your application "${app.title}" was not approved. Reason: ${app.rejectionReason}`,
            type: isApproved ? 'success' : 'danger'
          });
        } catch (err) {
          console.error('[NOTIFY_QUEUED_ERR]:', err.message);
        }
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
    user.tokenVersion = (user.tokenVersion || 0) + 1;
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
    user.tokenVersion = (user.tokenVersion || 0) + 1;
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
      .populate('app', 'title developer')
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
      const targetName = report.app ? `App "${report.app.title}"` : `Developer Profile`;
      const categoryLabel = report.category.replace(/_/g, ' ').toUpperCase();
      
      await Notification.create({
        recipient: devId,
        title: '⚠️ Moderation Warning',
        message: `Violation Identified: [${categoryLabel}] regarding ${targetName}. Admin Note: ${warningMessage}`,
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

// POST /api/admin/apps/:id/warn
exports.warnAppDeveloper = async (req, res) => {
  try {
    const { warningMessage } = req.body;
    const app = await App.findById(req.params.id);
    
    if (!app) return res.status(404).json({ message: 'App not found.' });

    if (app.developer) {
      await Notification.create({
        recipient: app.developer,
        title: '⚠️ Moderation Warning',
        message: `Admin Notice regarding "${app.title}": ${warningMessage}`,
        type: 'warning'
      });
    }

    res.json({ message: 'Warning issued to developer successfully.' });
  } catch (error) {
    console.error('Admin warn app dev error:', error);
    res.status(500).json({ message: 'Server error issuing warning.' });
  }
};

// PATCH /api/admin/users/:id/verify
exports.toggleUserVerified = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Ensure we don't accidentally unverify the site creator if that's the logic (though admin can toggle)
    // But generally, admins can manage this.
    
    user.isVerified = !user.isVerified;
    await user.save();

    // Notify User
    await Notification.create({
      recipient: user._id,
      title: user.isVerified ? '🛡️ Identity Verified' : 'ℹ️ Verification Updated',
      message: user.isVerified 
        ? 'Congratulations! Your developer identity has been officially verified by the Baqala team. A verification badge has been added to your profile.'
        : 'Your developer verification status has been updated. Contact support if you believe this is an error.',
      type: user.isVerified ? 'success' : 'info'
    });

    res.json({ 
      message: `User is now ${user.isVerified ? 'verified' : 'unverified'}.`, 
      isVerified: user.isVerified 
    });
  } catch (error) {
    console.error('Admin toggle verify error:', error);
    res.status(500).json({ message: 'Server error toggling verification.' });
  }
};

// POST /api/admin/apps/:id/scan
exports.manualAppScan = async (req, res) => {
  try {
    const app = await App.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'App not found.' });

    if (!app.fileUrl) {
      return res.status(400).json({ message: 'App has no binary file to scan.' });
    }

    // Trigger in backgound immediately
    res.json({ message: 'Manual security scan initiated. Results will appear shortly.' });

    const { getFileBuffer } = require('../utils/b2Storage');
    const { runBackgroundScan } = require('../services/backgroundScan');

    setImmediate(async () => {
      try {
        console.log(`[MANUAL_SCAN] Fetching cloud buffer for ${app.title}...`);
        const buffer = await getFileBuffer(app.fileUrl);
        const filename = `${app.title.replace(/\s+/g, '_')}_${app._id}.apk`;
        
        console.log(`[MANUAL_SCAN] Starting engine for ${app._id}`);
        await runBackgroundScan(app._id, buffer, filename);
      } catch (scanError) {
        console.error(`[MANUAL_SCAN_ERROR] Detached scan failed for ${app._id}:`, scanError.message);
      }
    });

  } catch (error) {
    console.error('Admin manual scan error:', error);
    res.status(500).json({ message: 'Server error initiating scan.' });
  }
};

// GET /api/admin/email-logs
exports.getEmailLogs = async (req, res) => {
  try {
    const logs = await EmailLog.find({})
      .populate('relatedAppId', 'title')
      .sort({ attemptedAt: -1 })
      .limit(50);
    res.json({ logs });
  } catch (error) {
    console.error('Get email logs error:', error);
    res.status(500).json({ message: 'Server error fetching email logs.' });
  }
};

// POST /api/admin/email-logs/:id/resend
exports.resendEmailLog = async (req, res) => {
  try {
    const oldLog = await EmailLog.findById(req.params.id);
    if (!oldLog) return res.status(404).json({ message: 'Log entry not found.' });

    const { sendEmail } = require('../services/emailService');
    
    // We re-attempt by calling sendEmail directly. 
    // It will create its own NEW log entries for the attempt.
    queueNotification(async () => {
      console.log(`[ADMIN] [RESEND_TRIGGER] Re-attempting email to: ${oldLog.recipient}`);
      await sendEmail({
        to: oldLog.recipient,
        subject: oldLog.subject,
        html: `(Resend Attempt) ${oldLog.subject}`, // In a real case we might want to re-derive the template
        appId: oldLog.relatedAppId
      });
    });

    res.json({ message: 'Resend task queued successfully.' });
  } catch (error) {
    console.error('Resend email error:', error);
    res.status(500).json({ message: 'Server error during resend.' });
  }
};

// GET /api/admin/test-email
exports.testEmailConfig = async (req, res) => {
  try {
    const { to } = req.query;
    if (!to) return res.status(400).json({ message: 'Recipient "to" is required.' });

    const { sendEmail } = require('../services/emailService');
    
    console.log(`[ADMIN] [TEST_EMAIL] Sending test to: ${to}`);
    const result = await sendEmail({
      to,
      subject: 'Baqala Backend: System Test',
      html: `
        <div style="font-family: sans-serif;">
          <h1>System Configuration Test</h1>
          <p>This is a manual test triggered by an administrator.</p>
          <ul>
            <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
            <li><strong>Requested by:</strong> ${req.user.email}</li>
          </ul>
        </div>
      `
    });

    if (result.success) {
      res.json({ message: 'Test email sent successfully.', result });
    } else {
      res.status(500).json({ message: 'Test email failed.', error: result.error });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ message: 'Server error during test email.' });
  }
};

// GET /api/admin/system-info
// Diagnostic helper usable as a route or internal utility
exports.getSystemInfo = async (req = null, res = null) => {
  try {
    const info = {
      nodeEnv: process.env.NODE_ENV || 'development',
      mongoConnected: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      resendConfigured: !!process.env.RESEND_API_KEY ? 'Yes' : 'No',
      smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS) ? 'Yes' : 'No',
      timestamp: new Date().toLocaleString(),
      uptime: `${Math.floor(process.uptime())}s`
    };

    if (res) {
      return res.json({ diagnostics: info });
    }
    return info;
  } catch (error) {
    if (res) {
      return res.status(500).json({ message: 'Error collecting diagnostics' });
    }
    return { error: error.message };
  }
};
