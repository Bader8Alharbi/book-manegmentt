const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createRequest, getUserRequests, requestReturn } = require('../controllers/borrowRequestController');

router.get('/my',                       protect, getUserRequests);
router.post('/',                        protect, createRequest);
router.post('/:id/return-request',      protect, requestReturn);

module.exports = router;
