const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getAnalytics,
  getReleases,
  updateRollout,
  promoteRelease
} = require('../controllers/developerController');

const { developerLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(auth);
router.use(developerLimiter);

router.get('/analytics', getAnalytics);
router.get('/releases', getReleases);
router.post('/releases/:id/rollout', updateRollout);
router.post('/releases/:id/promote', promoteRelease);

module.exports = router;
