import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import axiosInstance from "../axiosConfig";

const Dashboard = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axiosInstance.get("/api/books");
        setBooks(response.data);
      } catch (error) {
        console.error("Failed to fetch books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const totalBooks = books.length;
  const borrowedBooks = books.filter(
    (book) => book.status === "borrowed"
  ).length;
  const availableBooks = books.filter(
    (book) => book.status === "available"
  ).length;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white shadow-md rounded p-6">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

        <p className="mb-2">
          <strong>Welcome:</strong> {user?.name || "User"}
        </p>
        <p className="mb-6">
          <strong>Email:</strong> {user?.email || "No email"}
        </p>

        {loading ? (
          <p className="mb-6">Loading statistics...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-100 p-4 rounded shadow">
              <h2 className="text-lg font-bold">Total Books</h2>
              <p className="text-2xl">{totalBooks}</p>
            </div>

            <div className="bg-yellow-100 p-4 rounded shadow">
              <h2 className="text-lg font-bold">Borrowed Books</h2>
              <p className="text-2xl">{borrowedBooks}</p>
            </div>

            <div className="bg-green-100 p-4 rounded shadow">
              <h2 className="text-lg font-bold">Available Books</h2>
              <p className="text-2xl">{availableBooks}</p>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Link
            to="/books"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go to Book Records Management
          </Link>

          <Link
            to="/books/add"
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Add New Book
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;