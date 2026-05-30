const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { generalLimiter } = require('../middleware/rateLimiter');

router.get('/:id/profile', generalLimiter, userController.getDeveloperProfile);

module.exports = router;
