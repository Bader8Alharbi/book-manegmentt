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

const { protect, isAdmin } = require('../middleware/authMiddleware');
const reviewRoutes = require('./reviewRoutes');

// Public routes
router.get('/',    getBooks);
router.get('/:id', getBookById);

// Customer: borrow/return (any logged-in user)
router.post('/:id/borrow', protect, borrowBook);
router.post('/:id/return', protect, returnBook);

// Admin only: CRUD
router.post('/',       protect, isAdmin, createBook);
router.put('/:id',     protect, isAdmin, updateBook);
router.delete('/:id',  protect, isAdmin, deleteBook);

// Nested review routes
router.use('/:id/reviews', reviewRoutes);

module.exports = router;
