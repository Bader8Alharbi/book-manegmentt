const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Book = require('../models/Book');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// All admin routes require auth + admin role
router.use(protect, isAdmin);

// GET all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE a user
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin' });
        await user.deleteOne();
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET all borrowed books with borrower info
router.get('/borrowed', async (req, res) => {
    try {
        const books = await Book.find({ status: 'borrowed' })
            .populate('borrowedBy', 'name email')
            .populate('createdBy', 'name email');
        res.json(books);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
