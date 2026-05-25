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

  if (loading) return <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-white">Manage Books</h1>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
            />
            <Link to="/admin/books/add" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl whitespace-nowrap transition">
              + Add Book
            </Link>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="text-left px-5 py-4">Cover</th>
                <th className="text-left px-5 py-4">Title</th>
                <th className="text-left px-5 py-4">Author</th>
                <th className="text-left px-5 py-4">ISBN</th>
                <th className="text-left px-5 py-4">Category</th>
                <th className="text-left px-5 py-4">Status</th>
                <th className="text-left px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(book => (
                <tr key={book._id} className="border-b border-slate-700 hover:bg-slate-700/40 transition">
                  <td className="px-5 py-4">
                    <img src={book.coverImage} alt={book.title} className="w-10 h-14 object-cover rounded-lg" />
                  </td>
                  <td className="px-5 py-4 text-white font-medium">{book.title}</td>
                  <td className="px-5 py-4 text-slate-300">{book.author}</td>
                  <td className="px-5 py-4 text-slate-400 text-sm">{book.isbn}</td>
                  <td className="px-5 py-4 text-slate-400 text-sm">{book.category}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      book.status === 'available' ? 'bg-emerald-900 text-emerald-400' : 'bg-amber-900 text-amber-400'
                    }`}>
                      {book.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Link to={`/admin/books/edit/${book._id}`} className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-sm transition">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(book._id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm transition">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="px-5 py-6 text-slate-500">No books found.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminBooks;
