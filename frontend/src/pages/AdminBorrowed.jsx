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

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Currently Borrowed Books</h1>
      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border">Cover</th>
              <th className="p-3 border">Title</th>
              <th className="p-3 border">Author</th>
              <th className="p-3 border">Borrowed By</th>
              <th className="p-3 border">Email</th>
              <th className="p-3 border">Borrowed At</th>
            </tr>
          </thead>
          <tbody>
            {books.map(book => (
              <tr key={book._id} className="hover:bg-gray-50">
                <td className="p-3 border">
                  <img src={book.coverImage} alt={book.title} className="w-10 h-14 object-cover rounded" />
                </td>
                <td className="p-3 border">{book.title}</td>
                <td className="p-3 border">{book.author}</td>
                <td className="p-3 border">{book.borrowedBy?.name || 'N/A'}</td>
                <td className="p-3 border">{book.borrowedBy?.email || 'N/A'}</td>
                <td className="p-3 border">
                  {book.borrowedAt ? new Date(book.borrowedAt).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {books.length === 0 && <p className="p-4 text-gray-500">No books currently borrowed.</p>}
      </div>
    </div>
  );
};

export default AdminBorrowed;
