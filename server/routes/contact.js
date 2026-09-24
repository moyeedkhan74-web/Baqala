const express = require('express');
const router = express.Router();
const { submitContactForm } = require('../controllers/contactController');
const { generalLimiter } = require('../middleware/rateLimiter');
const { optionalAuth } = require('../middleware/auth');

router.post('/', generalLimiter, optionalAuth, submitContactForm);

module.exports = router;
