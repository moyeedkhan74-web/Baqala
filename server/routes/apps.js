const express = require('express');
const {
  createApp, getApps, getApp, updateApp, deleteApp,
  getMyApps, uploadAppImages, getCategories, uploadPlaceholderImages
} = require('../controllers/appController');
const { uploadChunk, combineChunks } = require('../controllers/chunkController');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { uploadApp, uploadImages, uploadAll } = require('../middleware/upload');

const router = express.Router();

router.get('/categories', getCategories);
router.get('/', getApps);
router.get('/my', auth, getMyApps);
router.get('/:id', getApp);
router.post('/', auth, uploadAll, createApp);
router.post('/upload-chunk', auth, uploadApp, uploadChunk);
router.post('/combine-chunks', auth, combineChunks);
router.post('/placeholder-images', auth, uploadImages, uploadPlaceholderImages);
router.post('/:id/images', auth, uploadImages, uploadAppImages);
router.put('/:id', auth, updateApp);
router.delete('/:id', auth, deleteApp);

module.exports = router;
