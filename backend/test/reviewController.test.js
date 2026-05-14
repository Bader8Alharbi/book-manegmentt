const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const Book = require('../models/Book');
const Review = require('../models/Review');
const { addReview, getReviews, deleteReview } = require('../controllers/reviewController');
const { expect } = chai;

describe('AddReview Function Test', () => {

    it('should add a review successfully', async () => {
        const bookId = new mongoose.Types.ObjectId();
        const userId = new mongoose.Types.ObjectId();

        const book = { _id: bookId, title: 'Test Book' };
        const review = {
            _id: new mongoose.Types.ObjectId(),
            book: bookId,
            user: userId,
            rating: 4,
            comment: 'Great book!',
            populate: sinon.stub().resolvesThis(),
        };

        const findBookStub   = sinon.stub(Book,   'findById').resolves(book);
        const findReviewStub = sinon.stub(Review, 'findOne').resolves(null);
        const createStub     = sinon.stub(Review, 'create').resolves(review);

        const req = {
            params: { id: bookId },
            user:   { _id: userId },
            body:   { rating: 4, comment: 'Great book!' },
        };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await addReview(req, res);

        expect(createStub.calledOnce).to.be.true;
        expect(res.status.calledWith(201)).to.be.true;

        findBookStub.restore();
        findReviewStub.restore();
        createStub.restore();
    });

    it('should return 404 if book not found', async () => {
        const findBookStub = sinon.stub(Book, 'findById').resolves(null);

        const req = {
            params: { id: 'nonexistent' },
            user:   { _id: new mongoose.Types.ObjectId() },
            body:   { rating: 3 },
        };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await addReview(req, res);

        expect(res.status.calledWith(404)).to.be.true;

        findBookStub.restore();
    });

    it('should return 400 for invalid rating', async () => {
        const book = { _id: new mongoose.Types.ObjectId() };
        const findBookStub = sinon.stub(Book, 'findById').resolves(book);

        const req = {
            params: { id: book._id },
            user:   { _id: new mongoose.Types.ObjectId() },
            body:   { rating: 6 },
        };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await addReview(req, res);

        expect(res.status.calledWith(400)).to.be.true;

        findBookStub.restore();
    });

    it('should return 400 if user already reviewed the book', async () => {
        const bookId = new mongoose.Types.ObjectId();
        const book = { _id: bookId };
        const existing = { _id: new mongoose.Types.ObjectId(), rating: 3 };

        const findBookStub   = sinon.stub(Book,   'findById').resolves(book);
        const findReviewStub = sinon.stub(Review, 'findOne').resolves(existing);

        const req = {
            params: { id: bookId },
            user:   { _id: new mongoose.Types.ObjectId() },
            body:   { rating: 4 },
        };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await addReview(req, res);

        expect(res.status.calledWith(400)).to.be.true;

        findBookStub.restore();
        findReviewStub.restore();
    });
});

describe('GetReviews Function Test', () => {

    it('should return reviews with average rating', async () => {
        const bookId = new mongoose.Types.ObjectId();
        const book = { _id: bookId };

        const reviews = [
            { rating: 4, comment: 'Good' },
            { rating: 2, comment: 'Okay' },
        ];

        const sortStub     = sinon.stub().resolves(reviews);
        const populateStub = sinon.stub().returns({ sort: sortStub });
        const findStub     = sinon.stub(Review, 'find').returns({ populate: populateStub });
        const findBookStub = sinon.stub(Book, 'findById').resolves(book);

        const req = { params: { id: bookId } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await getReviews(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        const jsonArg = res.json.firstCall.args[0];
        expect(jsonArg).to.have.property('reviews');
        expect(jsonArg).to.have.property('avgRating', 3);

        findBookStub.restore();
        findStub.restore();
    });

    it('should return 404 if book not found', async () => {
        const findBookStub = sinon.stub(Book, 'findById').resolves(null);

        const req = { params: { id: 'nonexistent' } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await getReviews(req, res);

        expect(res.status.calledWith(404)).to.be.true;

        findBookStub.restore();
    });
});

describe('DeleteReview Function Test', () => {

    it('should delete review successfully when user is author', async () => {
        const userId = new mongoose.Types.ObjectId();
        const review = {
            _id: new mongoose.Types.ObjectId(),
            user: userId,
            deleteOne: sinon.stub().resolves(),
        };

        const findStub = sinon.stub(Review, 'findById').resolves(review);

        const req = {
            params: { reviewId: review._id },
            user:   { _id: userId },
        };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await deleteReview(req, res);

        expect(review.deleteOne.calledOnce).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;

        findStub.restore();
    });

    it('should return 403 if user is not the review author', async () => {
        const review = {
            _id: new mongoose.Types.ObjectId(),
            user: new mongoose.Types.ObjectId(),
            deleteOne: sinon.stub(),
        };

        const findStub = sinon.stub(Review, 'findById').resolves(review);

        const req = {
            params: { reviewId: review._id },
            user:   { _id: new mongoose.Types.ObjectId() }, // different user
        };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await deleteReview(req, res);

        expect(res.status.calledWith(403)).to.be.true;
        expect(review.deleteOne.notCalled).to.be.true;

        findStub.restore();
    });

    it('should return 404 if review not found', async () => {
        const findStub = sinon.stub(Review, 'findById').resolves(null);

        const req = {
            params: { reviewId: 'nonexistent' },
            user:   { _id: new mongoose.Types.ObjectId() },
        };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await deleteReview(req, res);

        expect(res.status.calledWith(404)).to.be.true;

        findStub.restore();
    });
});
