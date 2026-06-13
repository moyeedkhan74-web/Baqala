const express = require('express');
const { 
  getAllApps, 
  getAllUsers, 
  deleteApp, 
  banUser,
  getStats,
  getAnalytics
} = require('../controllers/adminController');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// All routes protected by admin middleware
router.use(requireAdmin);

router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/apps', getAllApps);
router.get('/users', getAllUsers);
router.delete('/apps/:id', deleteApp);
router.post('/users/:id/ban', banUser);

module.exports = router;
