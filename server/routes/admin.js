const express = require('express');
const {
  getPendingApps, updateAppStatus, getAllUsers,
  toggleBanUser, getDashboardStats, getAllApps
} = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(auth, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/apps', getAllApps);
router.get('/apps/pending', getPendingApps);
router.put('/apps/:id/status', updateAppStatus);
router.get('/users', getAllUsers);
router.put('/users/:id/ban', toggleBanUser);

module.exports = router;
