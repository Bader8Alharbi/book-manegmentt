import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';

const StatCard = ({ value, label, color }) => (
  <div className={`${color} rounded-xl p-5 text-center border border-slate-700`}>
    <p className="text-4xl font-bold text-white mb-1">{value}</p>
    <p className="text-slate-300 text-sm">{label}</p>
  </div>
);

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
    <div className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-1">Admin Dashboard</h1>
        <p className="text-slate-400 mb-10">Welcome back, {user?.name}</p>

        {loading ? (
          <p className="text-slate-400">Loading statistics...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatCard value={stats.total} label="Total Books" color="bg-indigo-900/50" />
            <StatCard value={stats.available} label="Available" color="bg-emerald-900/50" />
            <StatCard value={stats.borrowed} label="Borrowed" color="bg-amber-900/50" />
            <StatCard value={stats.users} label="Users" color="bg-purple-900/50" />
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link to="/admin/books" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition">
            Manage Books
          </Link>
          <Link to="/admin/books/add" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition">
            Add New Book
          </Link>
          <Link to="/admin/users" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium transition">
            Manage Users
          </Link>
          <Link to="/admin/borrowed" className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-medium transition">
            Borrowed Books
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
