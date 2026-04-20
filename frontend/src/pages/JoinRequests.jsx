import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineUserGroup,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineMailOpen,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineOfficeBuilding,
  HiOutlineUser,
} from 'react-icons/hi';

// ------------------------------
// Reusable Components
// ------------------------------

// Status badge with icon
const StatusBadge = ({ status }) => {
  const config = {
    pending: { icon: HiOutlineClock, classes: 'badge-pending', label: 'Pending' },
    approved: { icon: HiOutlineCheckCircle, classes: 'badge-approved', label: 'Approved' },
    rejected: { icon: HiOutlineXCircle, classes: 'badge-rejected', label: 'Rejected' },
  };
  const { icon: Icon, classes, label } = config[status] || config.pending;

  return (
    <span className={`badge inline-flex items-center gap-1 ${classes}`}>
      <Icon size={12} />
      {label}
    </span>
  );
};

// My request card
const MyRequestCard = ({ request, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.03, duration: 0.25 }}
    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
    className="expense-row group"
  >
    <div className="flex items-center gap-3 flex-1">
      <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
        <HiOutlineOfficeBuilding size={18} className="text-gray-400 group-hover:text-white transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-white group-hover:text-accent-300 transition-colors truncate">
          {request.club?.name}
        </h3>
        <p className="text-[11px] text-gray-500 mt-0.5">{request.club?.college}</p>
      </div>
    </div>
    <StatusBadge status={request.status} />
  </motion.div>
);

// Club request card (manager view)
const ClubRequestCard = ({ request, onApprove, onReject, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.03, duration: 0.25 }}
    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
    className="expense-row group"
  >
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-500/20 to-neon-purple/20 border border-accent-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
        <HiOutlineUser size={18} className="text-accent-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-white truncate">{request.user?.name}</h3>
        <p className="text-[11px] text-gray-500 mt-0.5 truncate">
          {request.user?.email} {request.user?.college && `· ${request.user.college}`}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2 ml-4">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onApprove(request._id)}
        className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all border border-emerald-500/20 hover:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        title="Approve"
        aria-label="Approve request"
      >
        <HiOutlineCheck size={16} />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onReject(request._id)}
        className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all border border-red-500/20 hover:border-red-500/40 focus:outline-none focus:ring-2 focus:ring-red-500/50"
        title="Reject"
        aria-label="Reject request"
      >
        <HiOutlineX size={16} />
      </motion.button>
    </div>
  </motion.div>
);

// Club tab selector
const ClubTabs = ({ clubs, selectedClub, onSelect }) => (
  <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
    {clubs.map((club) => (
      <button
        key={club._id}
        onClick={() => onSelect(club._id)}
        className={`
          px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 whitespace-nowrap
          focus:outline-none focus:ring-2 focus:ring-accent-500/50
          ${selectedClub === club._id
            ? 'bg-accent-500/15 text-accent-300 border border-accent-500/25 shadow-[0_0_10px_rgba(99,102,241,0.15)]'
            : 'bg-white/[0.04] text-gray-400 border border-white/[0.04] hover:bg-white/[0.08] hover:text-gray-300'
          }
        `}
        aria-pressed={selectedClub === club._id}
      >
        {club.name}
      </button>
    ))}
  </div>
);

// Empty state component
const EmptyState = ({ icon: Icon, title, description }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className="empty-state py-12"
  >
    <div className="empty-state-icon mb-4">
      <Icon size={24} className="text-gray-400" />
    </div>
    <p className="empty-state-title text-base">{title}</p>
    <p className="empty-state-text text-xs max-w-[220px] mx-auto">{description}</p>
  </motion.div>
);

// Section header
const SectionHeader = ({ title, icon: Icon }) => (
  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-white/[0.06]">
    <div className="p-2 rounded-lg bg-accent-500/10 border border-accent-500/20">
      <Icon size={16} className="text-accent-400" />
    </div>
    <h2 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h2>
  </div>
);

// ------------------------------
// Main Component
// ------------------------------

const JoinRequests = () => {
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState([]);
  const [clubRequests, setClubRequests] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

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
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchClubRequests = async (clubId) => {
    setSelectedClub(clubId);
    try {
      const res = await api.get(`/join-requests/club/${clubId}`);
      setClubRequests(res.data);
    } catch {
      // Silent fail
    }
  };

  const handleAction = async (requestId, action) => {
    setActionLoading(requestId);
    try {
      await api.put(`/join-requests/${requestId}`, { action });
      toast.success(`Request ${action} successfully`);
      // Refresh both my requests and club requests
      await fetchData();
      // If club tab is open, refresh that specific club's requests
      if (selectedClub) {
        const res = await api.get(`/join-requests/club/${selectedClub}`);
        setClubRequests(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process request');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Loader />
      </div>
    );
  }

  const pendingMyRequests = myRequests.filter((r) => r.status === 'pending').length;
  const pendingClubRequests = clubRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="page-container">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="page-title mb-1 flex items-center gap-3">
          <div className="bg-accent-500/10 p-2 rounded-xl border border-accent-500/20">
            <HiOutlineUserGroup className="text-accent-400 w-5 h-5" />
          </div>
          Join Requests
        </h1>
        <p className="text-sm text-gray-400 font-medium">
          Manage your club memberships and incoming requests
        </p>
      </motion.div>

      {/* My Requests Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="glass-card p-6 sm:p-7 mb-6"
      >
        <SectionHeader title="My Requests" icon={HiOutlineMailOpen} />
        {myRequests.length === 0 ? (
          <EmptyState
            icon={HiOutlineMailOpen}
            title="No requests sent"
            description="Join a club to start collaborating with others"
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">
                {myRequests.length} request{myRequests.length !== 1 ? 's' : ''} total
              </span>
              {pendingMyRequests > 0 && (
                <span className="text-xs font-medium text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full">
                  {pendingMyRequests} pending
                </span>
              )}
            </div>
            <div className="divide-y divide-white/[0.06]">
              {myRequests.map((req, i) => (
                <MyRequestCard key={req._id} request={req} index={i} />
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Manager: Club Requests Section */}
      {user?.role === 'manager' && clubs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="glass-card p-6 sm:p-7"
        >
          <SectionHeader title="Manage Club Requests" icon={HiOutlineUserGroup} />

          <ClubTabs clubs={clubs} selectedClub={selectedClub} onSelect={fetchClubRequests} />

          {clubRequests.length === 0 ? (
            <EmptyState
              icon={HiOutlineUserGroup}
              title="No pending requests"
              description="All caught up! No pending requests for this club."
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 font-medium">
                  {clubRequests.length} request{clubRequests.length !== 1 ? 's' : ''}
                </span>
                {pendingClubRequests > 0 && (
                  <span className="text-xs font-medium text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full">
                    {pendingClubRequests} pending
                  </span>
                )}
              </div>
              <div className="divide-y divide-white/[0.06]">
                <AnimatePresence>
                  {clubRequests.map((req, i) => (
                    <ClubRequestCard
                      key={req._id}
                      request={req}
                      onApprove={(id) => handleAction(id, 'approved')}
                      onReject={(id) => handleAction(id, 'rejected')}
                      index={i}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Manager but no clubs managed */}
      {user?.role === 'manager' && clubs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 sm:p-7"
        >
          <SectionHeader title="Manage Club Requests" icon={HiOutlineUserGroup} />
          <EmptyState
            icon={HiOutlineOfficeBuilding}
            title="No clubs managed"
            description="You aren't managing any clubs yet. Create or join a club to start receiving requests."
          />
        </motion.div>
      )}
    </div>
  );
};

export default JoinRequests;