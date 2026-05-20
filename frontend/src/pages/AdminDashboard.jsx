import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, borrowed: 0, available: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const [booksRes, usersRes] = await Promise.all([
          axiosInstance.get('/api/books'),
          axiosInstance.get('/api/admin/users', { headers }),
        ]);
        const books = booksRes.data;
        setStats({
          total: books.length,
          borrowed: books.filter(b => b.status === 'borrowed').length,
          available: books.filter(b => b.status === 'available').length,
          users: usersRes.data.length,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white shadow-md rounded p-6">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 mb-6">Welcome, {user?.name}</p>

        {loading ? <p>Loading statistics...</p> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-100 p-4 rounded shadow text-center">
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-gray-600">Total Books</p>
            </div>
            <div className="bg-green-100 p-4 rounded shadow text-center">
              <p className="text-3xl font-bold">{stats.available}</p>
              <p className="text-gray-600">Available</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded shadow text-center">
              <p className="text-3xl font-bold">{stats.borrowed}</p>
              <p className="text-gray-600">Borrowed</p>
            </div>
            <div className="bg-purple-100 p-4 rounded shadow text-center">
              <p className="text-3xl font-bold">{stats.users}</p>
              <p className="text-gray-600">Users</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <Link to="/admin/books" className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">
            Manage Books
          </Link>
          <Link to="/admin/books/add" className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700">
            Add New Book
          </Link>
          <Link to="/admin/users" className="bg-purple-600 text-white px-5 py-2 rounded hover:bg-purple-700">
            Manage Users
          </Link>
          <Link to="/admin/borrowed" className="bg-yellow-600 text-white px-5 py-2 rounded hover:bg-yellow-700">
            Borrowed Books
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
