const express = require('express');
const router = express.Router();
const { submitContactForm } = require('../controllers/contactController');
const { generalLimiter } = require('../middleware/rateLimiter');

router.post('/', generalLimiter, submitContactForm);

module.exports = router;
