const express = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const {
  getStorageMetrics,
  storageStream,
  clearCache
} = require('../controllers/monitoringController');

const router = express.Router();

// Standard admin-guarded endpoints (JWT sent via Authorization header)
router.get('/storage', requireAdmin, getStorageMetrics);
router.post('/clear-cache', requireAdmin, clearCache);

// SSE stream: EventSource cannot set headers, so the token is passed as a query param
// and verified inside the controller.
router.get('/storage/stream', storageStream);

module.exports = router;
