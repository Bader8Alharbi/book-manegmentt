const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
    {
        title:       { type: String, required: true },
        author:      { type: String, required: true },
        coverImage:  { type: String, default: '' },
        isbn:        { type: String, required: true, unique: true },
        category:    { type: String, required: true },
        description: { type: String, default: '' },
        status:      { type: String, enum: ['available', 'borrowed'], default: 'available' },
        createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        // Borrow tracking (new functionality #2)
        borrowedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        borrowedAt:  { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);
