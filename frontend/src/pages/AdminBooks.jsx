import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const AdminBooks = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const headers = { Authorization: `Bearer ${user.token}` };

  useEffect(() => {
    axiosInstance.get('/api/books')
      .then(r => setBooks(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await axiosInstance.delete(`/api/books/${id}`, { headers });
      setBooks(books.filter(b => b._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const filtered = books.filter(b =>
    [b.title, b.author, b.isbn, b.category, b.status]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Manage Books</h1>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="p-2 border rounded w-64"
          />
          <Link to="/admin/books/add" className="bg-green-600 text-white px-4 py-2 rounded whitespace-nowrap">
            + Add Book
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border">Cover</th>
              <th className="p-3 border">Title</th>
              <th className="p-3 border">Author</th>
              <th className="p-3 border">ISBN</th>
              <th className="p-3 border">Category</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(book => (
              <tr key={book._id} className="hover:bg-gray-50">
                <td className="p-3 border">
                  <img src={book.coverImage} alt={book.title} className="w-10 h-14 object-cover rounded" />
                </td>
                <td className="p-3 border">{book.title}</td>
                <td className="p-3 border">{book.author}</td>
                <td className="p-3 border">{book.isbn}</td>
                <td className="p-3 border">{book.category}</td>
                <td className="p-3 border">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    book.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {book.status}
                  </span>
                </td>
                <td className="p-3 border">
                  <div className="flex gap-2">
                    <Link to={`/admin/books/edit/${book._id}`} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(book._id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-4 text-gray-500">No books found.</p>}
      </div>
    </div>
  );
};

export default AdminBooks;
