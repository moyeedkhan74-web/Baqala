const express = require('express');
const { getConfig, updateConfig, toggleMaintenance } = require('../controllers/configController');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// GET is public (for home page/maintenance check)
router.get('/', getConfig);

// PATCH is admin only
router.patch('/', requireAdmin, updateConfig);

// POST /maintenance — instant toggle, admin only
router.post('/maintenance', requireAdmin, toggleMaintenance);

module.exports = router;
