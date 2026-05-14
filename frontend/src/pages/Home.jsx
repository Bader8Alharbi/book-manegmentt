import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../axiosConfig";
import { Link } from "react-router-dom";

const Home = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchBooks = async () => {
    try {
      const response = await axiosInstance.get("/api/books");
      setBooks(response.data);
    } catch (error) {
      console.error("Failed to fetch books:", error);
      alert(error.response?.data?.message || "Failed to fetch books.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const filteredBooks = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return books;

    return books.filter((book) => {
      return (
        book.title?.toLowerCase().includes(keyword) ||
        book.author?.toLowerCase().includes(keyword) ||
        book.category?.toLowerCase().includes(keyword)
      );
    });
  }, [books, searchTerm]);

  if (loading) {
    return <div className="p-6 text-lg">Loading books...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Book Index</h1>
        <p className="text-gray-600 mb-4">
          Browse the available books in the library.
        </p>

        <input
          type="text"
          placeholder="Search by title, author, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 p-3 border rounded shadow-sm"
        />
      </div>

      {filteredBooks.length === 0 ? (
        <div className="bg-white p-6 rounded shadow">
          <p className="text-gray-700">No matching books found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <Link
              to={`/books/${book._id}`}
              key={book._id}
              className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition block"
            >
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-72 object-cover rounded mb-4"
              />

              <h2 className="text-lg font-bold mb-1">{book.title}</h2>
              <p className="text-gray-700 mb-1">{book.author}</p>
              <p className="text-sm text-gray-500 mb-1">
                Category: {book.category}
              </p>
              <p className="text-sm text-gray-500">
                Status: {book.status}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;