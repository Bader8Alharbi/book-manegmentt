const mongoose = require('mongoose');

const borrowRequestSchema = new mongoose.Schema(
    {
        book:   { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
        user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
            type: String,
            enum: ['pending', 'approved', 'declined', 'return_pending', 'returned'],
            default: 'pending',
        },
        decidedAt:          { type: Date, default: null },
        returnRequestedAt:  { type: Date, default: null },
        returnConfirmedAt:  { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('BorrowRequest', borrowRequestSchema);
