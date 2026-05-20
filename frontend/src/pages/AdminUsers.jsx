import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${user.token}` };

  useEffect(() => {
    axiosInstance.get('/api/admin/users', { headers })
      .then(r => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await axiosInstance.delete(`/api/admin/users/${id}`, { headers });
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Manage Users</h1>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="text-left px-5 py-4">Name</th>
                <th className="text-left px-5 py-4">Email</th>
                <th className="text-left px-5 py-4">Role</th>
                <th className="text-left px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-b border-slate-700 hover:bg-slate-700/40 transition">
                  <td className="px-5 py-4 text-white">{u.name}</td>
                  <td className="px-5 py-4 text-slate-300">{u.email}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      u.role === 'admin' ? 'bg-indigo-900 text-indigo-400' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleDelete(u._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm transition"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="px-5 py-6 text-slate-500">No users found.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
