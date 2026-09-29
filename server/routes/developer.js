const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getAnalytics,
  getReleases,
  updateRollout,
  promoteRelease,
  generateApiKey,
  getApiKeys,
  revokeApiKey,
  createWebhook,
  getWebhooks,
  deleteWebhook,
  testWebhook,
  cliDeploy,
  updateAbTest,
  getAbTest,
  getRevenue,
  requestPayout
} = require('../controllers/developerController');

const { developerLimiter } = require('../middleware/rateLimiter');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

const router = express.Router();

router.use(auth);
router.use(developerLimiter);

router.get('/analytics', getAnalytics);
router.get('/releases', getReleases);
router.post('/releases/:id/rollout', updateRollout);
router.post('/releases/:id/promote', promoteRelease);

// API Keys
router.post('/keys/generate', generateApiKey);
router.get('/keys', getApiKeys);
router.post('/keys/:id/revoke', revokeApiKey);

// Webhooks
router.post('/webhooks', createWebhook);
router.get('/webhooks', getWebhooks);
router.delete('/webhooks/:id', deleteWebhook);
router.post('/webhooks/:id/test', testWebhook);

// CLI Deploy
router.post('/cli-deploy', upload.single('apk'), cliDeploy);

// A/B Testing
router.post('/apps/:id/ab-test', updateAbTest);
router.get('/apps/:id/ab-test', getAbTest);

// Revenue
router.get('/revenue', getRevenue);
router.post('/revenue/payout', requestPayout);

module.exports = router;
