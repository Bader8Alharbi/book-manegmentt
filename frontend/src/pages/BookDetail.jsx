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

  if (loading) return <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">Loading...</div>;
  if (!book) return (
    <div className="min-h-screen bg-slate-950 text-slate-400 flex flex-col items-center justify-center gap-4">
      <p>Book not found.</p>
      <Link to="/" className="bg-indigo-600 text-white px-4 py-2 rounded-xl">Back to Home</Link>
    </div>
  );

  const isBorrowedByMe = book.borrowedBy?._id === user?.id || book.borrowedBy === user?.id;

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="max-w-5xl mx-auto bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <img src={book.coverImage} alt={book.title} className="w-full rounded-xl shadow-lg object-cover" />
          </div>

          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold text-white mb-4">{book.title}</h1>
            <div className="space-y-3 text-slate-300">
              <p><span className="text-slate-500">Author:</span> {book.author}</p>
              <p><span className="text-slate-500">Category:</span> {book.category}</p>
              <p><span className="text-slate-500">ISBN:</span> {book.isbn}</p>
              <p>
                <span className="text-slate-500">Status: </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  book.status === 'available' ? 'bg-emerald-900 text-emerald-400' : 'bg-amber-900 text-amber-400'
                }`}>
                  {book.status}
                </span>
              </p>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold text-white mb-3">Description</h2>
              <p className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-400 leading-7">
                {book.description || 'No description available.'}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/" className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl transition">← Back</Link>

              {!user && (
                <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition">
                  Login to Borrow
                </Link>
              )}

              {user?.role === 'admin' && (
                <Link to={`/admin/books/edit/${book._id}`} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl transition">
                  Edit Book
                </Link>
              )}

              {user?.role === 'customer' && book.status === 'available' && (
                <button
                  onClick={handleBorrow}
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Borrow Book'}
                </button>
              )}

              {user?.role === 'customer' && isBorrowedByMe && (
                <button
                  onClick={handleReturn}
                  disabled={actionLoading}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl transition disabled:opacity-50"
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
