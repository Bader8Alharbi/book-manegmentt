const chai = require('chai');
const chaiHttp = require('chai-http');
const http = require('http');
const app = require('../server');
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const sinon = require('sinon');

const Book = require('../models/Book');
const DeletedRecord = require('../models/DeletedRecord');
const { createBook, getBooks, getBookById, updateBook, deleteBook } = require('../controllers/bookController');
const { expect } = chai;

chai.use(chaiHttp);
let server;
let port;


describe('CreateBook Function Test', () => {

    it('should create a new book successfully', async () => {

        // Mock request data
        const req = {
            user: { _id: new mongoose.Types.ObjectId() },
            body: {
                title: "The Lord of the Rings",
                author: "J.R.R. Tolkien",
                coverImage: "../frontend\public\lord of ring cover imange.jpg",
                isbn: "114514",
                category: "Fantasy",
                description: "Magic book",
                status: "available"
            }
        };

        // Mock task that would be created
        const createdBook = {
            _id: new mongoose.Types.ObjectId(),
            ...req.body,
            createdBy: req.user._id
        };

        // Stub Task.create to return the createdTask
        const createStub = sinon.stub(Book, 'create').resolves(createdBook);

        // Mock response object    
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy()
        };

        // Call function
        await createBook(req, res);

        // Assertions
        expect(createStub.calledOnce).to.be.true;
        expect(res.status.calledWith(201)).to.be.true;
        expect(res.json.calledWith(createdBook)).to.be.true;

        createStub.restore();
    });

    it('should return 500 if an error occurs', async () => {

        const createStub = sinon.stub(Book, 'create').throws(new Error('DB Error'));

        const req = {
            user: { _id: new mongoose.Types.ObjectId() },
            body: {
                title: "The Lord of the Rings",
                author: "J.R.R. Tolkien",
                isbn: "114514",
                category: "Fantasy",
                description: "Magic book",
                status: "available"
            }
        };

        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy()
        };

        await createBook(req, res);

        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;

        createStub.restore();
    });

});

describe('GetBooks Function Test', () => {

    it('should return all books', async () => {

        const books = [
            { title: "Book 1" },
            { title: "Book 2" }
        ];

        const populateStub = sinon.stub().resolves(books);
        const findBookListStub = sinon.stub(Book, 'find').returns({ populate: populateStub });

        const req = {};
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy()
        };

        await getBooks(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledWith(books)).to.be.true;

        findBookListStub.restore();
    });

    it('should return 500 if error occurs', async () => {
        const findBookListStub = sinon.stub(Book, 'find').throws(new Error('DB Error'));

        const req = {};
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy()
        };

        await getBooks(req, res);

        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;

        findBookListStub.restore();
    });

});

describe('GetBookById Function Test', () => {

    it('should return a book', async () => {

        const book = { title: "The Lord of the Rings" };

        const populateStub = sinon.stub().resolves(book);
        const findByIdStub = sinon.stub(Book, 'findById').returns({ populate: populateStub });

        const req = { params: { id: new mongoose.Types.ObjectId() } };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy()
        };

        await getBookById(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledWith(book)).to.be.true;

        findByIdStub.restore();
    });

    it("should return 404 if book is not found", async () => {
        const populateStub = sinon.stub().resolves(null);
        const findByIdStub = sinon.stub(Book, "findById").returns({ populate: populateStub });

        const req = { params: { id: "999" } };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy()
        };

        await getBookById(req, res);

        expect(res.status.calledWith(404)).to.equal(true);
        expect(res.json.calledWith({ message: "Book not found" })).to.equal(true);

        findByIdStub.restore();
    });

    it('should return 500 if error occurs', async () => {
        const findByIdStub = sinon.stub(Book, 'findById').throws(new Error('DB Error'));

        const req = { params: { id: "test_id" } };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy()
        };

        await getBookById(req, res);

        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;

        findByIdStub.restore();
    });

});

describe('UpdateBook Function Test', () => {

    it('should update book successfully', async () => {
        const bookId = new mongoose.Types.ObjectId();

        const existingBook = {
            _id: bookId,
            title: "Old Book",
            author: "Old Author",
            isbn: "111",
            category: "Old Category",
            description: "Old Description",
            status: "available",
            save: sinon.stub().resolvesThis()
        };

        const findByIdStub = sinon.stub(Book, 'findById').resolves(existingBook);

        const req = {
            params: { id: bookId },
            body: { title: "New Book", status: "borrowed" }
        };

        const res = {
            json: sinon.spy(),
            status: sinon.stub().returnsThis()
        };

        await updateBook(req, res);

        expect(existingBook.title).to.equal("New Book");
        expect(existingBook.status).to.equal("borrowed");
        expect(existingBook.save.calledOnce).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledOnce).to.be.true;

        findByIdStub.restore();
    });

    it('should return 404 if book to update is not found', async () => {
        const findByIdStub = sinon.stub(Book, 'findById').resolves(null);

        const req = {
            params: { id: "test_id" },
            body: {}
        };

        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy()
        };

        await updateBook(req, res);

        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({ message: 'Book not found' })).to.be.true;

        findByIdStub.restore();
    });
});

describe('DeleteBook Function Test', () => {

    it('should delete book successfully', async () => {
        const book = {
            deleteOne: sinon.stub().resolves(),
            toObject:  sinon.stub().returns({ title: 'Test' }),
        };

        const findByIdStub    = sinon.stub(Book, 'findById').resolves(book);
        const createRecordStub = sinon.stub(DeletedRecord, 'create').resolves({});

        const req = { params: { id: new mongoose.Types.ObjectId() }, user: { _id: new mongoose.Types.ObjectId() } };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy()
        };

        await deleteBook(req, res);

        expect(book.deleteOne.calledOnce).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledWith({ message: 'Book deleted successfully' })).to.be.true;

        findByIdStub.restore();
        createRecordStub.restore();
    });

    it('should return 404 if book not found', async () => {
        const findByIdStub = sinon.stub(Book, 'findById').resolves(null);

        const req = { params: { id: "test_id" } };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy()
        };

        await deleteBook(req, res);

        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({ message: 'Book not found' })).to.be.true;

        findByIdStub.restore();
    });

    it('should return 500 if error occurs', async () => {
        const findByIdStub = sinon.stub(Book, 'findById').throws(new Error('DB Error'));

        const req = { params: { id: "test_id" } };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy()
        };

        await deleteBook(req, res);

        expect(res.status.calledWith(500)).to.be.true;

        findByIdStub.restore();
    });
});
