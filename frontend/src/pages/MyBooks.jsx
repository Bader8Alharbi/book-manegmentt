import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

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

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Borrowed Books</h1>
      {books.length === 0 ? (
        <div className="bg-white p-6 rounded shadow text-gray-600">You have no borrowed books.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {books.map(book => (
            <div key={book._id} className="bg-white rounded-lg shadow p-4">
              <img src={book.coverImage} alt={book.title} className="w-full h-48 object-cover rounded mb-3" />
              <h2 className="font-bold text-lg">{book.title}</h2>
              <p className="text-gray-600 text-sm mb-1">{book.author}</p>
              <p className="text-gray-500 text-sm mb-3">
                Borrowed: {book.borrowedAt ? new Date(book.borrowedAt).toLocaleDateString() : 'N/A'}
              </p>
              <button
                onClick={() => handleReturn(book._id)}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Return Book
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBooks;
