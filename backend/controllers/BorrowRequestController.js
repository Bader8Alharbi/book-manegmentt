// OOP – Inheritance: BorrowRequestController extends BaseController.
// New functionality #3: Request-based borrow/return workflow with admin approval.
const BaseController = require('./BaseController');
const BorrowRequest = require('../models/BorrowRequest');
const Book = require('../models/Book');
const bookEvents = require('../events/bookEvents');

class BorrowRequestController extends BaseController {

    // POST /api/borrow-requests  (body: { bookId })
    async createRequest(req, res) {
        try {
            const { bookId } = req.body;
            const book = await Book.findById(bookId);
            if (!book) return this.notFound(res, 'Book');

            if (book.status !== 'available') {
                return this.badRequest(res, 'Book is not available for borrowing');
            }

            const existing = await BorrowRequest.findOne({
                book: book._id,
                user: req.user._id,
                status: { $in: ['pending', 'approved', 'return_pending'] },
            });
            if (existing) {
                return this.badRequest(res, 'You already have an active request for this book');
            }

            const request = await BorrowRequest.create({ book: book._id, user: req.user._id });
            const populated = await BorrowRequest.findById(request._id)
                .populate('book')
                .populate('user', 'name email');
            res.status(201).json(populated);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // GET /api/borrow-requests/my
    async getUserRequests(req, res) {
        try {
            const requests = await BorrowRequest.find({ user: req.user._id })
                .populate('book')
                .sort({ createdAt: -1 });
            res.status(200).json(requests);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // POST /api/borrow-requests/:id/return-request
    async requestReturn(req, res) {
        try {
            const request = await BorrowRequest.findById(req.params.id);
            if (!request) return this.notFound(res, 'Borrow request');

            if (request.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorised' });
            }
            if (request.status !== 'approved') {
                return this.badRequest(res, 'Request is not in approved state');
            }

            request.status = 'return_pending';
            request.returnRequestedAt = new Date();
            await request.save();
            res.status(200).json(request);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // GET /api/admin/borrow-requests
    async getAllRequests(req, res) {
        try {
            const requests = await BorrowRequest.find()
                .populate('book')
                .populate('user', 'name email')
                .sort({ createdAt: -1 });
            res.status(200).json(requests);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // PUT /api/admin/borrow-requests/:id/approve
    async approveRequest(req, res) {
        try {
            const request = await BorrowRequest.findById(req.params.id);
            if (!request) return this.notFound(res, 'Borrow request');
            if (request.status !== 'pending') {
                return this.badRequest(res, 'Request is not pending');
            }

            const book = await Book.findById(request.book);
            if (!book) return this.notFound(res, 'Book');
            if (book.status !== 'available') {
                return this.badRequest(res, 'Book is no longer available');
            }

            book.status = 'borrowed';
            book.borrowedBy = request.user;
            book.borrowedAt = new Date();
            await book.save();

            request.status = 'approved';
            request.decidedAt = new Date();
            await request.save();

            bookEvents.emit('book:borrowed', { book, user: request.user });
            const populated = await BorrowRequest.findById(request._id)
                .populate('book')
                .populate('user', 'name email');
            res.status(200).json(populated);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // PUT /api/admin/borrow-requests/:id/decline
    async declineRequest(req, res) {
        try {
            const request = await BorrowRequest.findById(req.params.id);
            if (!request) return this.notFound(res, 'Borrow request');
            if (request.status !== 'pending') {
                return this.badRequest(res, 'Request is not pending');
            }

            request.status = 'declined';
            request.decidedAt = new Date();
            await request.save();
            const populated = await BorrowRequest.findById(request._id)
                .populate('book')
                .populate('user', 'name email');
            res.status(200).json(populated);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // PUT /api/admin/borrow-requests/:id/confirm-return
    async confirmReturn(req, res) {
        try {
            const request = await BorrowRequest.findById(req.params.id);
            if (!request) return this.notFound(res, 'Borrow request');
            if (request.status !== 'return_pending') {
                return this.badRequest(res, 'No return pending for this request');
            }

            const book = await Book.findById(request.book);
            if (!book) return this.notFound(res, 'Book');

            book.status = 'available';
            book.borrowedBy = null;
            book.borrowedAt = null;
            await book.save();

            request.status = 'returned';
            request.returnConfirmedAt = new Date();
            await request.save();

            bookEvents.emit('book:returned', { book, user: request.user });
            const populated = await BorrowRequest.findById(request._id)
                .populate('book')
                .populate('user', 'name email');
            res.status(200).json(populated);
        } catch (error) {
            this.handleError(res, error);
        }
    }
}

const controller = new BorrowRequestController();

module.exports = {
    createRequest:  controller.createRequest.bind(controller),
    getUserRequests: controller.getUserRequests.bind(controller),
    requestReturn:  controller.requestReturn.bind(controller),
    getAllRequests:  controller.getAllRequests.bind(controller),
    approveRequest: controller.approveRequest.bind(controller),
    declineRequest: controller.declineRequest.bind(controller),
    confirmReturn:  controller.confirmReturn.bind(controller),
};
