import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const BookDetail = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    axiosInstance.get(`/api/books/${id}`)
      .then(r => setBook(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleBorrow = async () => {
    setActionLoading(true);
    try {
      const res = await axiosInstance.post(`/api/books/${id}/borrow`, {}, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setBook(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to borrow book');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async () => {
    setActionLoading(true);
    try {
      const res = await axiosInstance.post(`/api/books/${id}/return`, {}, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setBook(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to return book');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="max-w-6xl mx-auto p-6">Loading book details...</div>;
  if (!book) return (
    <div className="max-w-6xl mx-auto p-6">
      <p className="mb-4">Book not found.</p>
      <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded">Back to Home</Link>
    </div>
  );

  const isBorrowedByMe = book.borrowedBy?._id === user?.id || book.borrowedBy === user?.id;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <img src={book.coverImage} alt={book.title} className="w-full max-w-xs mx-auto rounded-lg shadow object-cover" />
          </div>

          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold mb-4">{book.title}</h1>
            <div className="space-y-3 text-lg">
              <p><strong>Author:</strong> {book.author}</p>
              <p><strong>Category:</strong> {book.category}</p>
              <p><strong>ISBN:</strong> {book.isbn}</p>
              <p>
                <strong>Status:</strong>{' '}
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  book.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {book.status}
                </span>
              </p>
            </div>

            <div className="mt-6">
              <h2 className="text-2xl font-semibold mb-3">Description</h2>
              <div className="bg-gray-50 border rounded-lg p-4 text-gray-700 leading-7">
                {book.description || 'No description available.'}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded">Back to Home</Link>

              {!user && (
                <Link to="/login" className="bg-green-600 text-white px-4 py-2 rounded">
                  Login to Borrow
                </Link>
              )}

              {user && user.role === 'admin' && (
                <Link to={`/admin/books/edit/${book._id}`} className="bg-yellow-500 text-white px-4 py-2 rounded">
                  Edit Book
                </Link>
              )}

              {user && user.role === 'customer' && book.status === 'available' && (
                <button
                  onClick={handleBorrow}
                  disabled={actionLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Borrow Book'}
                </button>
              )}

              {user && user.role === 'customer' && isBorrowedByMe && (
                <button
                  onClick={handleReturn}
                  disabled={actionLoading}
                  className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Return Book'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
