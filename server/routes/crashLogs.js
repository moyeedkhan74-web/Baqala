const express = require('express');
const { createCrashLog, getAppCrashLogs, explainCrashWithAI, getDeveloperCrashLogs } = require('../controllers/crashLogController');
const { auth } = require('../middleware/auth');
const { crashLogLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/', crashLogLimiter, createCrashLog);                          // Public / SDK reporting
router.get('/', auth, getDeveloperCrashLogs);              // All logs for current developer
router.get('/app/:appId', auth, getAppCrashLogs);          // Per-app logs
router.post('/:crashId/ai-explain', auth, explainCrashWithAI);

module.exports = router;

