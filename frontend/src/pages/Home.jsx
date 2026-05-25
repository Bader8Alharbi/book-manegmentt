import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { Link } from 'react-router-dom';

const Home = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    axiosInstance.get('/api/books')
      .then(r => setBooks(r.data))
      .catch(() => alert('Failed to fetch books.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredBooks = useMemo(() => {
    const kw = searchTerm.trim().toLowerCase();
    if (!kw) return books;
    return books.filter(b =>
      b.title?.toLowerCase().includes(kw) ||
      b.author?.toLowerCase().includes(kw) ||
      b.category?.toLowerCase().includes(kw)
    );
  }, [books, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-24 px-6 text-center">
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Discover Your Next Book</h1>
        <p className="text-indigo-300 text-xl mb-10">Browse, borrow, and explore our collection</p>
        <input
          type="text"
          placeholder="Search by title, author, or category..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full max-w-xl px-5 py-3 rounded-xl bg-slate-800 text-white placeholder-slate-400 border border-slate-700 focus:outline-none focus:border-indigo-500 shadow-lg"
        />
      </div>

      {/* Books Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <p className="text-slate-400 text-center text-lg">Loading books...</p>
        ) : filteredBooks.length === 0 ? (
          <p className="text-slate-400 text-center text-lg">No matching books found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredBooks.map(book => (
              <Link
                to={`/books/${book._id}`}
                key={book._id}
                className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-900/30 transition block"
              >
                <img src={book.coverImage} alt={book.title} className="w-full h-52 object-cover" />
                <div className="p-4">
                  <h2 className="text-white font-bold text-base mb-1 truncate">{book.title}</h2>
                  <p className="text-slate-400 text-sm mb-1">{book.author}</p>
                  <p className="text-slate-500 text-xs mb-3">{book.category}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    book.status === 'available'
                      ? 'bg-emerald-900 text-emerald-400'
                      : 'bg-amber-900 text-amber-400'
                  }`}>
                    {book.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
