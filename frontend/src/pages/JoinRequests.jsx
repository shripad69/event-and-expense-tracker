import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { HiOutlineUserGroup, HiOutlineCheck, HiOutlineX, HiOutlineMailOpen } from 'react-icons/hi';

const JoinRequests = () => {
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState([]);
  const [clubRequests, setClubRequests] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState('');

  const fetchData = async () => {
    try {
      const myRes = await api.get('/join-requests/my');
      setMyRequests(myRes.data);

      if (user?.role === 'manager') {
        const clubsRes = await api.get('/clubs/my');
        const managedClubs = clubsRes.data.filter(
          (c) => c.revenueManager?._id === user._id || c.revenueManager === user._id
        );
        setClubs(managedClubs);
        if (managedClubs.length > 0) {
          const clubId = selectedClub || managedClubs[0]._id;
          setSelectedClub(clubId);
          const reqRes = await api.get(`/join-requests/club/${clubId}`);
          setClubRequests(reqRes.data);
        }
      }
    } catch { /* Silently handle */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchClubRequests = async (clubId) => {
    setSelectedClub(clubId);
    try {
      const res = await api.get(`/join-requests/club/${clubId}`);
      setClubRequests(res.data);
    } catch { /* Silently handle */ }
  };

  const handleAction = async (requestId, action) => {
    try {
      await api.put(`/join-requests/${requestId}`, { action });
      toast.success(`Request ${action}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const statusColor = {
    pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected',
  };

  if (loading) return <div className="page-container"><Loader /></div>;

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title mb-1">
          <HiOutlineUserGroup className="inline text-accent-400 mr-2" /> Join Requests
        </h1>
        <p className="text-sm text-gray-500 mb-8">Manage your club memberships</p>
      </motion.div>

      {/* My Requests */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 mb-6"
      >
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">My Requests</h2>
        {myRequests.length === 0 ? (
          <div className="empty-state py-10">
            <div className="empty-state-icon">
              <HiOutlineMailOpen size={20} className="text-gray-500" />
            </div>
            <p className="empty-state-title text-sm">No requests sent</p>
            <p className="empty-state-text text-xs">Join a club to start collaborating</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myRequests.map((req, i) => (
              <motion.div
                key={req._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className="expense-row"
              >
                <div>
                  <h3 className="text-sm font-semibold text-white">{req.club?.name}</h3>
                  <p className="text-[11px] text-gray-500">{req.club?.college}</p>
                </div>
                <span className={statusColor[req.status]}>{req.status}</span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Manager: Club Requests */}
      {user?.role === 'manager' && clubs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Pending Club Requests</h2>

          <div className="flex gap-1.5 mb-5 flex-wrap">
            {clubs.map((club) => (
              <button
                key={club._id}
                onClick={() => fetchClubRequests(club._id)}
                className={`px-3 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 ${
                  selectedClub === club._id
                    ? 'bg-accent-500/15 text-accent-300 border border-accent-500/25'
                    : 'bg-white/[0.04] text-gray-400 hover:text-white border border-white/[0.04]'
                }`}
              >
                {club.name}
              </button>
            ))}
          </div>

          {clubRequests.length === 0 ? (
            <div className="empty-state py-10">
              <div className="empty-state-icon">
                <HiOutlineUserGroup size={20} className="text-gray-500" />
              </div>
              <p className="empty-state-title text-sm">No pending requests</p>
              <p className="empty-state-text text-xs">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clubRequests.map((req, i) => (
                <motion.div
                  key={req._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.04 }}
                  className="expense-row"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-white">{req.user?.name}</h3>
                    <p className="text-[11px] text-gray-500">{req.user?.email} · {req.user?.college}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleAction(req._id, 'approved')} className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all" title="Approve">
                      <HiOutlineCheck size={16} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleAction(req._id, 'rejected')} className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all" title="Reject">
                      <HiOutlineX size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default JoinRequests;
