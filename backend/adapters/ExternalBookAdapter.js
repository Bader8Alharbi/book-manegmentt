// Adapter Pattern: bridges an external/legacy book data format to the
// internal Book model format, so controllers never need to know which
// data source the book came from.
class ExternalBookAdapter {
    constructor(externalBook) {
        this.externalBook = externalBook;
    }

    // Adapts external field names → internal Book schema field names
    toInternalFormat() {
        const ext = this.externalBook;
        return {
            title:       ext.bookTitle       || ext.title       || '',
            author:      ext.authorName      || ext.author      || '',
            isbn:        ext.isbnCode        || ext.isbn        || '',
            category:    ext.genre           || ext.category    || '',
            description: ext.summary         || ext.description || '',
            coverImage:  ext.thumbnailUrl    || ext.coverImage  || '',
            status:      'available',
        };
    }
}

module.exports = ExternalBookAdapter;
