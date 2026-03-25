const express = require('express');
const { downloadApp, getDownloadStats } = require('../controllers/downloadController');
const { optionalAuth } = require('../middleware/auth');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { downloadLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/:appId', downloadLimiter, optionalAuth, downloadApp);
router.get('/:appId/stats', auth, authorize('developer', 'admin'), getDownloadStats);

module.exports = router;
