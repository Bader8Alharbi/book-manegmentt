// OOP – Inheritance: BookController extends BaseController for shared helpers.
// Repository Pattern: all DB access goes through BookRepository.
// Observer Pattern: bookEvents is notified on status-changing operations.
const BaseController = require('./BaseController');
const Book = require('../models/Book');
const bookRepository = require('../repositories/BookRepository');
const bookEvents = require('../events/bookEvents');

class BookController extends BaseController {
    // C – Create a new book
    async createBook(req, res) {
        try {
            const { title, author, coverImage, isbn, category, description, status } = req.body;
            const book = await Book.create({
                title, author, coverImage, isbn, category, description,
                status,
                createdBy: req.user._id,
            });
            bookEvents.emit('book:created', book);
            res.status(201).json(book);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // R – Get all books
    async getBooks(req, res) {
        try {
            const books = await Book.find().populate('createdBy', 'name email');
            res.status(200).json(books);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // R – Get single book by ID
    async getBookById(req, res) {
        try {
            const book = await Book.findById(req.params.id).populate('createdBy', 'name email');
            if (!book) return this.notFound(res, 'Book');
            res.status(200).json(book);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // U – Update book
    async updateBook(req, res) {
        try {
            const { title, author, coverImage, isbn, category, description, status } = req.body;
            const book = await Book.findById(req.params.id);
            if (!book) return this.notFound(res, 'Book');

            book.title       = title       ?? book.title;
            book.author      = author      ?? book.author;
            book.coverImage  = coverImage  ?? book.coverImage;
            book.isbn        = isbn        ?? book.isbn;
            book.category    = category    ?? book.category;
            book.description = description ?? book.description;
            book.status      = status      ?? book.status;

            const updatedBook = await book.save();
            bookEvents.emit('book:updated', updatedBook);
            res.status(200).json(updatedBook);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // D – Delete book
    async deleteBook(req, res) {
        try {
            const book = await Book.findById(req.params.id);
            if (!book) return this.notFound(res, 'Book');
            await book.deleteOne();
            bookEvents.emit('book:deleted', { id: req.params.id });
            res.status(200).json({ message: 'Book deleted successfully' });
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // Borrow a book (new functionality #2)
    async borrowBook(req, res) {
        try {
            const book = await Book.findById(req.params.id);
            if (!book) return this.notFound(res, 'Book');
            if (book.status === 'borrowed') {
                return this.badRequest(res, 'Book is already borrowed');
            }

            book.status = 'borrowed';
            book.borrowedBy = req.user._id;
            book.borrowedAt = new Date();
            const savedBook = await book.save();
            bookEvents.emit('book:borrowed', { book: savedBook, user: req.user });
            res.status(200).json(savedBook);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // Return a borrowed book (new functionality #2)
    async returnBook(req, res) {
        try {
            const book = await Book.findById(req.params.id);
            if (!book) return this.notFound(res, 'Book');
            if (book.status === 'available') {
                return this.badRequest(res, 'Book is not currently borrowed');
            }

            book.status = 'available';
            book.borrowedBy = null;
            book.borrowedAt = null;
            const savedBook = await book.save();
            bookEvents.emit('book:returned', { book: savedBook, user: req.user });
            res.status(200).json(savedBook);
        } catch (error) {
            this.handleError(res, error);
        }
    }
}

const controller = new BookController();

// Export bound methods so destructured imports (and existing tests) still work
module.exports = {
    createBook:  controller.createBook.bind(controller),
    getBooks:    controller.getBooks.bind(controller),
    getBookById: controller.getBookById.bind(controller),
    updateBook:  controller.updateBook.bind(controller),
    deleteBook:  controller.deleteBook.bind(controller),
    borrowBook:  controller.borrowBook.bind(controller),
    returnBook:  controller.returnBook.bind(controller),
};
