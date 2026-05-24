import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { key: 'all',  label: 'All' },
  { key: 'book', label: 'Deleted Books' },
  { key: 'user', label: 'Deleted Users' },
];

const AdminHistory = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    axiosInstance.get('/api/admin/history', {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(r => setRecords(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const displayed = activeTab === 'all'
    ? records
    : records.filter(r => r.recordType === activeTab);

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Deletion History</h1>
        <p className="text-slate-400 mb-8">Audit log of all deleted books and users</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium transition border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-slate-400">Loading history...</p>
        ) : displayed.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center">
            <p className="text-slate-500">No deletion records found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(record => (
              <div key={record._id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-start gap-5">

                {/* Type badge */}
                <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                  record.recordType === 'book'
                    ? 'bg-indigo-900 text-indigo-300'
                    : 'bg-purple-900 text-purple-300'
                }`}>
                  {record.recordType}
                </span>

                {/* Data summary */}
                <div className="flex-1 min-w-0">
                  {record.recordType === 'book' ? (
                    <div>
                      <p className="text-white font-semibold truncate">{record.data?.title}</p>
                      <p className="text-slate-400 text-sm">
                        by {record.data?.author} &mdash; ISBN: {record.data?.isbn} &mdash; Category: {record.data?.category}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white font-semibold">{record.data?.name}</p>
                      <p className="text-slate-400 text-sm">{record.data?.email} &mdash; Role: {record.data?.role}</p>
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="shrink-0 text-right">
                  <p className="text-slate-400 text-xs">
                    Deleted by <span className="text-slate-300">{record.deletedBy?.name || 'admin'}</span>
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {new Date(record.createdAt).toLocaleString()}
                  </p>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHistory;
