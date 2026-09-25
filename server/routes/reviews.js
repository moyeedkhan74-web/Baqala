const express = require('express');
const { createReview, getReviews, deleteReview, replyToReview } = require('../controllers/reviewController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/:appId', auth, createReview);
router.get('/:appId', getReviews);
router.post('/:id/reply', auth, replyToReview);
router.delete('/:id', auth, deleteReview);

module.exports = router;

