import axiosInstance from "../axiosConfig";

const BookList = ({ books, setBooks, setEditingBook, user }) => {
  const handleDelete = async (bookId) => {
    if (!user?.token) {
      alert("Please login first.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this book?");
    if (!confirmed) return;

    try {
      await axiosInstance.delete(`/api/books/${bookId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      setBooks(books.filter((book) => book._id !== bookId));
    } catch (error) {
      console.error("Failed to delete book:", error);
      alert(error.response?.data?.message || "Failed to delete book.");
    }
  };

  if (!books.length) {
    return <p className="text-gray-600">No books found.</p>;
  }

  return (
    <div>
      {books.map((book) => (
        <div key={book._id} className="bg-gray-100 p-4 mb-4 rounded shadow">
          <h2 className="text-xl font-bold">{book.title}</h2>
          <p><strong>Author:</strong> {book.author}</p>
          <p><strong>ISBN:</strong> {book.isbn}</p>
          <p><strong>Category:</strong> {book.category}</p>
          <p><strong>Description:</strong> {book.description || "No description"}</p>
          <p><strong>Status:</strong> {book.status}</p>

          {book.createdBy && (
            <p className="text-sm text-gray-500">
              Created by: {book.createdBy.name} ({book.createdBy.email})
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setEditingBook(book)}
              className="bg-yellow-500 text-white px-4 py-2 rounded"
            >
              Edit
            </button>

            <button
              onClick={() => handleDelete(book._id)}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookList;