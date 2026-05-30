const express = require('express');
const { createFeedback, getFeedback, reactFeedback } = require('../controllers/feedbackController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Like or dislike a feedback (must be before /:appId to avoid route conflict)
router.post('/:feedbackId/react', auth, reactFeedback);

// Get all feedback for an app
router.get('/:appId', getFeedback);

// Create feedback or reply (requires auth)
router.post('/:appId', auth, createFeedback);

module.exports = router;
