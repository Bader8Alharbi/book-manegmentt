const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { getAllUsers, deleteUser, getBorrowedBooks, getHistory } = require('../controllers/adminController');
const { getAllRequests, approveRequest, declineRequest, confirmReturn } = require('../controllers/borrowRequestController');

// All admin routes require auth + admin role
router.use(protect, isAdmin);

router.get('/users',                                getAllUsers);
router.delete('/users/:id',                         deleteUser);
router.get('/borrowed',                             getBorrowedBooks);
router.get('/history',                              getHistory);

router.get('/borrow-requests',                      getAllRequests);
router.put('/borrow-requests/:id/approve',          approveRequest);
router.put('/borrow-requests/:id/decline',          declineRequest);
router.put('/borrow-requests/:id/confirm-return',   confirmReturn);

module.exports = router;
