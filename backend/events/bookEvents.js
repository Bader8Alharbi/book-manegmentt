// Observer Pattern: bookEvents is a shared EventEmitter (Singleton via Node
// module cache). Controllers emit events; any listener can react without the
// controller knowing who is observing — decoupling producers from consumers.
const EventEmitter = require('events');

class BookEventEmitter extends EventEmitter {}

const bookEvents = new BookEventEmitter();

// Default observers — log every significant book lifecycle event
bookEvents.on('book:created',  (book)         => console.log(`[Event] Book created: "${book.title}"`));
bookEvents.on('book:updated',  (book)         => console.log(`[Event] Book updated: "${book.title}"`));
bookEvents.on('book:deleted',  ({ id })       => console.log(`[Event] Book deleted: id=${id}`));
bookEvents.on('book:borrowed', ({ book })     => console.log(`[Event] Book borrowed: "${book.title}"`));
bookEvents.on('book:returned', ({ book })     => console.log(`[Event] Book returned: "${book.title}"`));
bookEvents.on('review:added',  ({ bookId })   => console.log(`[Event] Review added to book: id=${bookId}`));

module.exports = bookEvents;
