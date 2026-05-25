const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams gives access to :id from parent router
const { addReview, getReviews, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',                  getReviews);
router.post('/',   protect,      addReview);
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;
