import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const AdminBorrowed = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/api/admin/borrowed', {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(r => setBooks(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Currently Borrowed Books</h1>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="text-left px-5 py-4">Cover</th>
                <th className="text-left px-5 py-4">Title</th>
                <th className="text-left px-5 py-4">Author</th>
                <th className="text-left px-5 py-4">Borrowed By</th>
                <th className="text-left px-5 py-4">Email</th>
                <th className="text-left px-5 py-4">Borrowed At</th>
              </tr>
            </thead>
            <tbody>
              {books.map(book => (
                <tr key={book._id} className="border-b border-slate-700 hover:bg-slate-700/40 transition">
                  <td className="px-5 py-4">
                    <img src={book.coverImage} alt={book.title} className="w-10 h-14 object-cover rounded-lg" />
                  </td>
                  <td className="px-5 py-4 text-white font-medium">{book.title}</td>
                  <td className="px-5 py-4 text-slate-300">{book.author}</td>
                  <td className="px-5 py-4 text-slate-300">{book.borrowedBy?.name || 'N/A'}</td>
                  <td className="px-5 py-4 text-slate-400 text-sm">{book.borrowedBy?.email || 'N/A'}</td>
                  <td className="px-5 py-4 text-slate-400 text-sm">
                    {book.borrowedAt ? new Date(book.borrowedAt).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {books.length === 0 && <p className="px-5 py-6 text-slate-500">No books currently borrowed.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminBorrowed;
