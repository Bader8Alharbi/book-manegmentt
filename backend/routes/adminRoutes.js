const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { getAllUsers, deleteUser, getBorrowedBooks } = require('../controllers/adminController');

// All admin routes require auth + admin role
router.use(protect, isAdmin);

router.get('/users',         getAllUsers);
router.delete('/users/:id',  deleteUser);
router.get('/borrowed',      getBorrowedBooks);

module.exports = router;
