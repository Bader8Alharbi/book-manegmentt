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
    <div>
      {/* Hero section — replace bg-blue-800 with bg-[url('/hero.jpg')] bg-cover when you have the image */}
      <div
        className="bg-blue-800 bg-cover bg-center text-white py-20 px-6 text-center"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
      >
        <h1 className="text-5xl font-bold mb-4 drop-shadow">Welcome to the Library</h1>
        <p className="text-xl mb-8 drop-shadow">Discover, borrow, and explore thousands of books</p>
        <input
          type="text"
          placeholder="Search by title, author, or category..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full max-w-lg p-3 rounded text-gray-800 shadow"
        />
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <p className="text-lg">Loading books...</p>
        ) : filteredBooks.length === 0 ? (
          <div className="bg-white p-6 rounded shadow"><p className="text-gray-700">No matching books found.</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredBooks.map(book => (
              <Link
                to={`/books/${book._id}`}
                key={book._id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition block"
              >
                <img src={book.coverImage} alt={book.title} className="w-full h-64 object-cover rounded mb-3" />
                <h2 className="text-lg font-bold mb-1">{book.title}</h2>
                <p className="text-gray-600 text-sm mb-1">{book.author}</p>
                <p className="text-sm text-gray-500 mb-1">{book.category}</p>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  book.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {book.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
