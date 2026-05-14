// OOP – Inheritance: ReviewController extends BaseController.
// OOP – Polymorphism: handleError is overridden to add review-specific logging.
// New functionality #1: Book Reviews & Ratings.
const BaseController = require('./BaseController');
const Review = require('../models/Review');
const Book = require('../models/Book');
const bookEvents = require('../events/bookEvents');

class ReviewController extends BaseController {
    // Polymorphism: overrides BaseController.handleError with specialised behaviour
    handleError(res, error) {
        console.error('[ReviewController Error]', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }

    // POST /api/books/:id/reviews
    async addReview(req, res) {
        try {
            const book = await Book.findById(req.params.id);
            if (!book) return this.notFound(res, 'Book');

            const { rating, comment } = req.body;
            if (!rating || rating < 1 || rating > 5) {
                return this.badRequest(res, 'Rating must be between 1 and 5');
            }

            const existing = await Review.findOne({ book: req.params.id, user: req.user._id });
            if (existing) return this.badRequest(res, 'You have already reviewed this book');

            const review = await Review.create({
                book: req.params.id,
                user: req.user._id,
                rating,
                comment,
            });

            const populated = await review.populate('user', 'name email');
            bookEvents.emit('review:added', { bookId: req.params.id, review: populated });
            res.status(201).json(populated);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // GET /api/books/:id/reviews
    async getReviews(req, res) {
        try {
            const book = await Book.findById(req.params.id);
            if (!book) return this.notFound(res, 'Book');

            const reviews = await Review.find({ book: req.params.id })
                .populate('user', 'name email')
                .sort({ createdAt: -1 });

            const avgRating = reviews.length
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0;

            res.status(200).json({ reviews, avgRating: Math.round(avgRating * 10) / 10 });
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // DELETE /api/books/:bookId/reviews/:reviewId
    async deleteReview(req, res) {
        try {
            const review = await Review.findById(req.params.reviewId);
            if (!review) return this.notFound(res, 'Review');

            // Only the author may delete their own review
            if (review.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorised to delete this review' });
            }

            await review.deleteOne();
            res.status(200).json({ message: 'Review deleted successfully' });
        } catch (error) {
            this.handleError(res, error);
        }
    }
}

const controller = new ReviewController();

module.exports = {
    addReview:    controller.addReview.bind(controller),
    getReviews:   controller.getReviews.bind(controller),
    deleteReview: controller.deleteReview.bind(controller),
};
