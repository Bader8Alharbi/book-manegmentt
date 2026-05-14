// Repository Pattern: abstracts all Book data-access logic away from controllers
const Book = require('../models/Book');

class BookRepository {
    findAll() {
        return Book.find().populate('createdBy', 'name email');
    }

    findById(id) {
        return Book.findById(id).populate('createdBy', 'name email');
    }

    create(data) {
        return Book.create(data);
    }

    save(book) {
        return book.save();
    }

    delete(book) {
        return book.deleteOne();
    }
}

// Export a single shared instance (leverages Node module-cache Singleton)
module.exports = new BookRepository();
