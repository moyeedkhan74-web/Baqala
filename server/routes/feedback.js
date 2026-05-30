const express = require('express');
const { createFeedback, getFeedback, reactFeedback } = require('../controllers/feedbackController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all feedback for an app
router.get('/:appId', getFeedback);

// Create feedback or reply (requires auth)
router.post('/:appId', auth, createFeedback);

// Like or dislike a feedback
router.post('/:feedbackId/react', auth, reactFeedback);

module.exports = router;
