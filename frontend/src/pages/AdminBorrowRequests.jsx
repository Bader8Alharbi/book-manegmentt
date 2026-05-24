import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  pending:        { label: 'Pending',          cls: 'bg-amber-900 text-amber-300' },
  approved:       { label: 'Approved',         cls: 'bg-emerald-900 text-emerald-300' },
  declined:       { label: 'Declined',         cls: 'bg-red-900 text-red-400' },
  return_pending: { label: 'Return Pending',   cls: 'bg-orange-900 text-orange-300' },
  returned:       { label: 'Returned',         cls: 'bg-slate-700 text-slate-400' },
};

const TABS = [
  { key: 'pending',        label: 'Pending Requests' },
  { key: 'return_pending', label: 'Pending Returns' },
  { key: 'all',            label: 'All Requests' },
];

const AdminBorrowRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  const headers = { Authorization: `Bearer ${user.token}` };

  const fetchRequests = () => {
    setLoading(true);
    axiosInstance.get('/api/admin/borrow-requests', { headers })
      .then(r => setRequests(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, [user]);

  const handleApprove = async (id) => {
    try {
      await axiosInstance.put(`/api/admin/borrow-requests/${id}/approve`, {}, { headers });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleDecline = async (id) => {
    try {
      await axiosInstance.put(`/api/admin/borrow-requests/${id}/decline`, {}, { headers });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to decline request');
    }
  };

  const handleConfirmReturn = async (id) => {
    try {
      await axiosInstance.put(`/api/admin/borrow-requests/${id}/confirm-return`, {}, { headers });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm return');
    }
  };

  const displayed = activeTab === 'all'
    ? requests
    : requests.filter(r => r.status === activeTab);

  const pendingCount       = requests.filter(r => r.status === 'pending').length;
  const returnPendingCount = requests.filter(r => r.status === 'return_pending').length;

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Borrow Requests</h1>
        <p className="text-slate-400 mb-8">Approve or decline user borrow requests and confirm returns</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium transition border-b-2 -mb-px flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.key === 'pending' && pendingCount > 0 && (
                <span className="bg-amber-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold">{pendingCount}</span>
              )}
              {tab.key === 'return_pending' && returnPendingCount > 0 && (
                <span className="bg-orange-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold">{returnPendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-slate-400">Loading requests...</p>
        ) : displayed.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center">
            <p className="text-slate-500">No requests in this category.</p>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-sm">
                  <th className="text-left px-5 py-4">Book</th>
                  <th className="text-left px-5 py-4">User</th>
                  <th className="text-left px-5 py-4">Requested</th>
                  <th className="text-left px-5 py-4">Status</th>
                  <th className="text-left px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(req => {
                  const cfg = STATUS_CONFIG[req.status];
                  return (
                    <tr key={req._id} className="border-b border-slate-700 hover:bg-slate-700/40 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {req.book?.coverImage && (
                            <img src={req.book.coverImage} alt={req.book?.title} className="w-9 h-12 object-cover rounded" />
                          )}
                          <div>
                            <p className="text-white font-medium text-sm">{req.book?.title}</p>
                            <p className="text-slate-400 text-xs">{req.book?.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-slate-200 text-sm">{req.user?.name}</p>
                        <p className="text-slate-500 text-xs">{req.user?.email}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-sm">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(req._id)}
                                className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDecline(req._id)}
                                className="bg-red-800 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg transition"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {req.status === 'return_pending' && (
                            <button
                              onClick={() => handleConfirmReturn(req._id)}
                              className="bg-orange-700 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded-lg transition"
                            >
                              Confirm Return
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBorrowRequests;
