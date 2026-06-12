const express = require('express');
const {
  createApp, getApps, getApp, updateApp, deleteApp, getAppDownloadLink,
  proxyDownload, getMyApps, uploadAppImages, getCategories, uploadPlaceholderImages,
  removeScreenshot, removeAllScreenshots, uploadTemp, searchApps
} = require('../controllers/appController');
const { initUpload, uploadChunk, combineChunks } = require('../controllers/chunkController');
const { auth, optionalAuth, softAuth } = require('../middleware/auth');
const requireOwner = require('../middleware/requireOwner');
const { uploadApp, uploadChunked, uploadImages, uploadAll } = require('../middleware/upload');
const { body, validationResult } = require('express-validator');
const { downloadLimiter, generalLimiter } = require('../middleware/rateLimiter');

// Validation middleware
const validateApp = [
  body('title').trim().notEmpty().withMessage('App title is required').isLength({ max: 100 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

const router = express.Router();

// --- Static/Collection Routes ---
router.get('/search', generalLimiter, searchApps);
router.get('/categories', getCategories);
router.get('/my', auth, getMyApps);
router.get('/', generalLimiter, getApps);
router.post('/', auth, uploadAll, validateApp, createApp);

// --- Action Routes (Specific) ---
router.post('/init-upload', auth, initUpload);
router.post('/upload-chunk', auth, uploadChunked, uploadChunk);
router.post('/combine-chunks', auth, combineChunks);
router.post('/placeholder-images', auth, uploadImages, uploadPlaceholderImages);
router.post('/upload-temp', auth, uploadImages, uploadTemp);

// --- Individual App Action Fallbacks (POST versions for network safety) ---
router.post('/:id/remove-screenshot', auth, removeScreenshot);
router.post('/:id/images', auth, uploadImages, uploadAppImages);

// --- Resource Routes (Individual) ---
router.get('/:id', generalLimiter, getApp);
router.get('/:id/download', downloadLimiter, getAppDownloadLink);
router.get('/:id/proxy-download', downloadLimiter, softAuth, proxyDownload);
router.put('/:id', auth, requireOwner, updateApp);
router.delete('/:id', auth, requireOwner, deleteApp);
router.delete('/:id/screenshot', auth, requireOwner, removeScreenshot);
router.delete('/:id/screenshots', auth, requireOwner, removeAllScreenshots);

module.exports = router;
