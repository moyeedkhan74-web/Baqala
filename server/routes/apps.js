const express = require('express');
const {
  createApp, getApps, getApp, updateApp, deleteApp,
  getMyApps, uploadAppImages, getCategories
} = require('../controllers/appController');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { uploadApp, uploadImages } = require('../middleware/upload');

const router = express.Router();

router.get('/categories', getCategories);
router.get('/', getApps);
router.get('/my', auth, authorize('developer', 'admin'), getMyApps);
router.get('/:id', getApp);
router.post('/', auth, authorize('developer', 'admin'), uploadApp, createApp);
router.post('/:id/images', auth, authorize('developer', 'admin'), uploadImages, uploadAppImages);
router.put('/:id', auth, authorize('developer', 'admin'), updateApp);
router.delete('/:id', auth, authorize('developer', 'admin'), deleteApp);

module.exports = router;
