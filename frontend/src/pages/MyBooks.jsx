import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const MyBooks = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${user.token}` };

  useEffect(() => {
    axiosInstance.get('/api/books')
      .then(r => {
        const mine = r.data.filter(b => b.borrowedBy?._id === user.id || b.borrowedBy === user.id);
        setBooks(mine);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleReturn = async (id) => {
    try {
      await axiosInstance.post(`/api/books/${id}/return`, {}, { headers });
      setBooks(books.filter(b => b._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to return book');
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">My Borrowed Books</h1>
        <p className="text-slate-400 mb-8">Books you currently have borrowed</p>

        {books.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center">
            <p className="text-slate-400 text-lg mb-4">You have no borrowed books.</p>
            <Link to="/" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition">
              Browse Books
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {books.map(book => (
              <div key={book._id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <img src={book.coverImage} alt={book.title} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h2 className="text-white font-bold text-base mb-1">{book.title}</h2>
                  <p className="text-slate-400 text-sm mb-1">{book.author}</p>
                  <p className="text-slate-500 text-xs mb-4">
                    Borrowed: {book.borrowedAt ? new Date(book.borrowedAt).toLocaleDateString() : 'N/A'}
                  </p>
                  <button
                    onClick={() => handleReturn(book._id)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-xl transition"
                  >
                    Return Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBooks;
