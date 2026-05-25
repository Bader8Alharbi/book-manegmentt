import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  pending:        { label: 'Awaiting Approval',           cls: 'bg-amber-900 text-amber-300',   icon: '⏳' },
  approved:       { label: 'Approved — Visit Library',    cls: 'bg-emerald-900 text-emerald-300', icon: '✓' },
  return_pending: { label: 'Return Pending Confirmation', cls: 'bg-orange-900 text-orange-300',  icon: '↩' },
  returned:       { label: 'Returned',                    cls: 'bg-slate-700 text-slate-400',    icon: '✔' },
  declined:       { label: 'Declined',                    cls: 'bg-red-900 text-red-400',        icon: '✕' },
};

const MyBooks = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  const headers = { Authorization: `Bearer ${user.token}` };

  const fetchRequests = () => {
    axiosInstance.get('/api/borrow-requests/my', { headers })
      .then(r => setRequests(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, [user]);

  const handleRequestReturn = async (requestId) => {
    try {
      await axiosInstance.post(`/api/borrow-requests/${requestId}/return-request`, {}, { headers });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit return request');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">Loading...</div>
  );

  const active   = requests.filter(r => ['pending', 'approved', 'return_pending'].includes(r.status));
  const history  = requests.filter(r => ['returned', 'declined'].includes(r.status));

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">My Borrow Requests</h1>
        <p className="text-slate-400 mb-8">Track the status of your library requests</p>

        {requests.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center">
            <p className="text-slate-400 text-lg mb-4">You have no borrow requests yet.</p>
            <Link to="/browse" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition">
              Browse Books
            </Link>
          </div>
        ) : (
          <>
            {/* Active requests */}
            {active.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xl font-semibold text-white mb-4">Active Requests</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {active.map(req => {
                    const cfg = STATUS_CONFIG[req.status];
                    return (
                      <div key={req._id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
                        {req.book?.coverImage && (
                          <img src={req.book.coverImage} alt={req.book?.title} className="w-full h-44 object-cover" />
                        )}
                        <div className="p-4 flex flex-col flex-1">
                          <Link to={`/books/${req.book?._id}`} className="text-white font-bold text-base mb-1 hover:text-indigo-300 transition">
                            {req.book?.title}
                          </Link>
                          <p className="text-slate-400 text-sm mb-1">{req.book?.author}</p>
                          <p className="text-slate-500 text-xs mb-3">
                            Requested: {new Date(req.createdAt).toLocaleDateString()}
                          </p>

                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 ${cfg.cls}`}>
                            {cfg.icon} {cfg.label}
                          </span>

                          {req.status === 'approved' && (
                            <button
                              onClick={() => handleRequestReturn(req._id)}
                              className="mt-auto w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-xl transition text-sm"
                            >
                              Request Return
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Past requests */}
            {history.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-slate-400 mb-4">Past Requests</h2>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400 text-sm">
                        <th className="text-left px-5 py-4">Book</th>
                        <th className="text-left px-5 py-4">Author</th>
                        <th className="text-left px-5 py-4">Requested</th>
                        <th className="text-left px-5 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(req => {
                        const cfg = STATUS_CONFIG[req.status];
                        return (
                          <tr key={req._id} className="border-b border-slate-700 hover:bg-slate-700/40 transition">
                            <td className="px-5 py-4 text-white font-medium">
                              <Link to={`/books/${req.book?._id}`} className="hover:text-indigo-300 transition">
                                {req.book?.title}
                              </Link>
                            </td>
                            <td className="px-5 py-4 text-slate-300">{req.book?.author}</td>
                            <td className="px-5 py-4 text-slate-400 text-sm">
                              {new Date(req.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
                                {cfg.icon} {cfg.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyBooks;
