const express = require('express');
const App = require('../models/App');
const { 
  getAllApps, 
  getAllUsers, 
  deleteApp, 
  banUser,
  getStats,
  getAnalytics,
  updateAppStatus,
  unbanUser,
  getAllReports,
  dismissReport,
  getFlaggedApps,
  toggleFeatured,
  warnDeveloper,
  warnAppDeveloper,
  toggleUserVerified,
  manualAppScan,
  reanalyzeApp,
  getEmailLogs,
  resendEmailLog,
  testEmailConfig,
  getSystemInfo,
  uploadAppBannerAdmin,
  removeAppBannerAdmin
} = require('../controllers/adminController');
const requireAdmin = require('../middleware/requireAdmin');
const { uploadImages } = require('../middleware/upload');

const router = express.Router();

router.get('/apps/:id/banner', async (req, res, next) => {
  const https = require('https');
  const http = require('http');

  try {
    const app = await App.findById(req.params.id);
    if (!app || !app.banner) {
      return res.status(404).send('No banner configured for this app.');
    }

    // If it's a relative path, prepends the base URL
    let targetUrl = app.banner;
    if (targetUrl.startsWith('/')) {
      const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 5000}`;
      targetUrl = `${baseUrl}${targetUrl}`;
    }

    console.log(`[BANNER PROXY] Streaming banner for ${app.title}: ${targetUrl}`);

    // Stream the image through
    const protocol = targetUrl.startsWith('https') ? https : http;
    protocol.get(targetUrl, (streamRes) => {
      if (streamRes.statusCode !== 200) {
        console.error(`[BANNER PROXY] Upstream returned ${streamRes.statusCode} for ${targetUrl}`);
        // If the proxy fails, just redirect as a fallback
        return res.redirect(targetUrl);
      }

      // Forward headers
      if (streamRes.headers['content-type']) res.setHeader('Content-Type', streamRes.headers['content-type']);
      if (streamRes.headers['content-length']) res.setHeader('Content-Length', streamRes.headers['content-length']);
      if (streamRes.headers['cache-control']) res.setHeader('Cache-Control', streamRes.headers['cache-control']);
      
      streamRes.pipe(res);
    }).on('error', (err) => {
      console.error('[BANNER PROXY] Stream error:', err.message);
      if (!res.headersSent) res.redirect(targetUrl);
    });

  } catch (error) {
    console.error('[BANNER PROXY] Critical Error:', error.message);
    next(error);
  }
});

// All routes protected by admin middleware
router.use(requireAdmin);

router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/apps', getAllApps);
router.get('/apps/flagged', getFlaggedApps);
router.get('/users', getAllUsers);
router.delete('/apps/:id', deleteApp);
router.patch('/apps/:id/status', updateAppStatus);
router.patch('/apps/:id/featured', toggleFeatured);
router.post('/apps/:id/warn', warnAppDeveloper);
router.post('/users/:id/ban', banUser);
router.post('/users/:id/unban', unbanUser);
router.patch('/users/:id/verify', toggleUserVerified);
router.post('/apps/:id/scan', manualAppScan);
router.post('/apps/:id/reanalyze', reanalyzeApp);
router.post('/apps/:id/banner', uploadImages, uploadAppBannerAdmin);
router.delete('/apps/:id/banner', removeAppBannerAdmin);

// Email Management
router.get('/email-logs', getEmailLogs);
router.post('/email-logs/:id/resend', resendEmailLog);
router.get('/test-email', testEmailConfig);
router.get('/system-info', getSystemInfo);

// Reports
router.get('/reports', getAllReports);
router.patch('/reports/:id/dismiss', dismissReport);
router.post('/reports/:id/warn', warnDeveloper);

module.exports = router;
