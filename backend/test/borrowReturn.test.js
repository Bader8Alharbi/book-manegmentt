const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const Book = require('../models/Book');
const { borrowBook, returnBook } = require('../controllers/bookController');
const { expect } = chai;

describe('BorrowBook Function Test', () => {

    it('should borrow an available book successfully', async () => {
        const bookId = new mongoose.Types.ObjectId();
        const userId = new mongoose.Types.ObjectId();

        const book = {
            _id: bookId,
            title: 'Test Book',
            status: 'available',
            borrowedBy: null,
            borrowedAt: null,
            save: sinon.stub().resolvesThis(),
        };

        const findByIdStub = sinon.stub(Book, 'findById').resolves(book);

        const req = { params: { id: bookId }, user: { _id: userId } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await borrowBook(req, res);

        expect(book.status).to.equal('borrowed');
        expect(book.borrowedBy.toString()).to.equal(userId.toString());
        expect(book.save.calledOnce).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;

        findByIdStub.restore();
    });

    it('should return 400 if book is already borrowed', async () => {
        const book = {
            _id: new mongoose.Types.ObjectId(),
            status: 'borrowed',
            save: sinon.stub(),
        };

        const findByIdStub = sinon.stub(Book, 'findById').resolves(book);

        const req = { params: { id: book._id }, user: { _id: new mongoose.Types.ObjectId() } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await borrowBook(req, res);

        expect(res.status.calledWith(400)).to.be.true;
        expect(book.save.notCalled).to.be.true;

        findByIdStub.restore();
    });

    it('should return 404 if book not found when borrowing', async () => {
        const findByIdStub = sinon.stub(Book, 'findById').resolves(null);

        const req = { params: { id: 'nonexistent' }, user: { _id: new mongoose.Types.ObjectId() } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await borrowBook(req, res);

        expect(res.status.calledWith(404)).to.be.true;

        findByIdStub.restore();
    });

    it('should return 500 on DB error when borrowing', async () => {
        const findByIdStub = sinon.stub(Book, 'findById').throws(new Error('DB Error'));

        const req = { params: { id: 'test_id' }, user: { _id: new mongoose.Types.ObjectId() } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await borrowBook(req, res);

        expect(res.status.calledWith(500)).to.be.true;

        findByIdStub.restore();
    });
});

describe('ReturnBook Function Test', () => {

    it('should return a borrowed book successfully', async () => {
        const bookId = new mongoose.Types.ObjectId();

        const book = {
            _id: bookId,
            title: 'Test Book',
            status: 'borrowed',
            borrowedBy: new mongoose.Types.ObjectId(),
            save: sinon.stub().resolvesThis(),
        };

        const findByIdStub = sinon.stub(Book, 'findById').resolves(book);

        const req = { params: { id: bookId }, user: { _id: new mongoose.Types.ObjectId() } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await returnBook(req, res);

        expect(book.status).to.equal('available');
        expect(book.borrowedBy).to.be.null;
        expect(book.save.calledOnce).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;

        findByIdStub.restore();
    });

    it('should return 400 if book is not currently borrowed', async () => {
        const book = {
            _id: new mongoose.Types.ObjectId(),
            status: 'available',
            save: sinon.stub(),
        };

        const findByIdStub = sinon.stub(Book, 'findById').resolves(book);

        const req = { params: { id: book._id }, user: { _id: new mongoose.Types.ObjectId() } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await returnBook(req, res);

        expect(res.status.calledWith(400)).to.be.true;
        expect(book.save.notCalled).to.be.true;

        findByIdStub.restore();
    });

    it('should return 404 if book not found when returning', async () => {
        const findByIdStub = sinon.stub(Book, 'findById').resolves(null);

        const req = { params: { id: 'nonexistent' }, user: { _id: new mongoose.Types.ObjectId() } };
        const res = { status: sinon.stub().returnsThis(), json: sinon.spy() };

        await returnBook(req, res);

        expect(res.status.calledWith(404)).to.be.true;

        findByIdStub.restore();
    });
});
