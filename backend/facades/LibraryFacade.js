// Facade Pattern: provides one simplified interface to the complex
// multi-step operations that involve Books, Reviews, and borrow tracking.
// Clients call a single method instead of orchestrating multiple model queries.
const Book = require('../models/Book');
const Review = require('../models/Review');

class LibraryFacade {
    // Combines: find book → validate availability → mark borrowed → save
    async checkoutBook(bookId, userId) {
        const book = await Book.findById(bookId);
        if (!book) throw new Error('Book not found');
        if (book.status === 'borrowed') throw new Error('Book is not available');
        book.status = 'borrowed';
        book.borrowedBy = userId;
        book.borrowedAt = new Date();
        return book.save();
    }

    // Combines: find book → validate status → clear borrow info → save
    async returnBook(bookId) {
        const book = await Book.findById(bookId);
        if (!book) throw new Error('Book not found');
        if (book.status === 'available') throw new Error('Book is not currently borrowed');
        book.status = 'available';
        book.borrowedBy = null;
        book.borrowedAt = null;
        return book.save();
    }

    // Combines: fetch book + all its reviews + compute average rating in one call
    async getBookSummary(bookId) {
        const book = await Book.findById(bookId).populate('createdBy', 'name email');
        if (!book) throw new Error('Book not found');
        const reviews = await Review.find({ book: bookId }).populate('user', 'name');
        const avgRating = reviews.length
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        return { book, reviews, avgRating: Math.round(avgRating * 10) / 10 };
    }
}

module.exports = new LibraryFacade();
