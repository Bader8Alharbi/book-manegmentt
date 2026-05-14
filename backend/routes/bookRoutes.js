const express = require('express');
const router = express.Router();

const {
    createBook,
    getBooks,
    getBookById,
    updateBook,
    deleteBook,
    borrowBook,
    returnBook,
} = require('../controllers/bookController');

const { protect } = require('../middleware/authMiddleware');
const reviewRoutes = require('./reviewRoutes');

// Public routes
router.get('/',    getBooks);
router.get('/:id', getBookById);

// Protected CRUD routes
router.post('/',       protect, createBook);
router.put('/:id',     protect, updateBook);
router.delete('/:id',  protect, deleteBook);

// Protected borrow/return routes (new functionality #2)
router.post('/:id/borrow', protect, borrowBook);
router.post('/:id/return', protect, returnBook);

// Nested review routes (new functionality #1)
router.use('/:id/reviews', reviewRoutes);

module.exports = router;
