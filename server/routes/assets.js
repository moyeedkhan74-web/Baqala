const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');

// Proxy route for B2 assets: /api/assets/:folder/:filename
router.get('/:folder/:filename', assetController.proxyAsset);

module.exports = router;
