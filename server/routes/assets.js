const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');

// Proxy route for B2 assets: /api/assets/*
router.get('/*', assetController.proxyAsset);

module.exports = router;
