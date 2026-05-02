const express = require('express');
const {
  createApp, getApps, getApp, updateApp, deleteApp, getAppDownloadLink,
  getMyApps, uploadAppImages, getCategories, uploadPlaceholderImages,
  removeScreenshot, removeAllScreenshots
} = require('../controllers/appController');
const { initUpload, uploadChunk, combineChunks } = require('../controllers/chunkController');
const { auth } = require('../middleware/auth');
const { uploadApp, uploadImages, uploadAll } = require('../middleware/upload');

const router = express.Router();

// --- Static/Collection Routes ---
router.get('/categories', getCategories);
router.get('/my', auth, getMyApps);
router.get('/', getApps);
router.post('/', auth, uploadAll, createApp);

// --- Action Routes (Specific) ---
router.post('/init-upload', auth, initUpload);
router.post('/upload-chunk', auth, uploadChunked, uploadChunk);
router.post('/combine-chunks', auth, combineChunks);
router.post('/placeholder-images', auth, uploadImages, uploadPlaceholderImages);

// --- Individual App Action Fallbacks (POST versions for network safety) ---
router.post('/:id/remove-screenshot', auth, removeScreenshot);
router.post('/:id/images', auth, uploadImages, uploadAppImages);

// --- Resource Routes (Individual) ---
router.get('/:id', getApp);
router.get('/:id/download', getAppDownloadLink);
router.put('/:id', auth, updateApp);
router.delete('/:id', auth, deleteApp);
router.delete('/:id/screenshot', auth, removeScreenshot);
router.delete('/:id/screenshots', auth, removeAllScreenshots);

module.exports = router;
