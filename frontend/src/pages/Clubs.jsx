import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineOfficeBuilding,
  HiOutlinePlus,
  HiOutlineUserAdd,
  HiOutlineSearch,
  HiOutlineUserGroup,
  HiOutlineX,
  HiOutlineUsers,
  HiOutlineSparkles,
} from 'react-icons/hi';

// ------------------------------
// Reusable Components
// ------------------------------

const SearchInput = ({ value, onChange, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative max-w-md">
      <div
        className={`
          absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200
          ${isFocused || value ? 'text-accent-400' : 'text-gray-500'}
        `}
      >
        <HiOutlineSearch size={16} />
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="input-glass pl-10 pr-8 text-sm w-full transition-all duration-200 focus:ring-2 focus:ring-accent-500/30"
        placeholder={placeholder}
        aria-label="Search clubs"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-0.5 rounded-full hover:bg-white/10"
          aria-label="Clear search"
        >
          <HiOutlineX size={14} />
        </button>
      )}
    </div>
  );
};

const ClubCard = ({ club, user, onJoin, index }) => {
  const isMember = club.members?.some((m) => m._id === user?._id || m === user?._id);
  const isManager = club.revenueManager?._id === user?._id || club.revenueManager === user?._id;
  const memberCount = club.members?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      className="glass-card-hover p-5 group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-neon-purple flex items-center justify-center text-white font-bold text-base shadow-lg group-hover:scale-105 transition-transform duration-300">
          {club.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex gap-1.5">
          {isManager && (
            <span className="badge bg-accent-500/15 text-accent-300 border-accent-500/20 flex items-center gap-1">
              <HiOutlineSparkles size={10} /> Manager
            </span>
          )}
          {isMember && !isManager && (
            <span className="badge bg-neon-green/15 text-neon-green border-neon-green/20">Member</span>
          )}
        </div>
      </div>

      <h3 className="text-base font-semibold text-white mb-1 group-hover:text-accent-300 transition-colors">
        {club.name}
      </h3>
      <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
        <HiOutlineOfficeBuilding size={12} className="text-gray-500" />
        {club.college}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-gray-400">
          <HiOutlineUsers size={14} />
          <span className="text-xs font-medium">
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </span>
        </div>

        {!isMember && !isManager && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onJoin(club._id);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-500/10 text-accent-400 border border-accent-500/20 hover:bg-accent-500/20 hover:text-accent-300 transition-all duration-200"
            aria-label={`Join ${club.name}`}
          >
            <HiOutlineUserAdd size={12} /> Join Club
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

const EmptyState = ({ hasSearch, onClearSearch, userRole, onCreateClick }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className="glass-card"
  >
    <div className="empty-state py-12">
      <div className="empty-state-icon mb-5">
        <HiOutlineOfficeBuilding size={28} className="text-gray-400" />
      </div>
      <p className="empty-state-title text-lg">No clubs found</p>
      <p className="empty-state-text max-w-xs mx-auto">
        {hasSearch
          ? "We couldn't find any clubs matching your search. Try a different term or clear the filter."
          : "There are no clubs available yet. Be the first to create one!"}
      </p>
      <div className="flex items-center justify-center gap-3 mt-6">
        {hasSearch && (
          <button
            onClick={onClearSearch}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            Clear search
          </button>
        )}
        {userRole === 'manager' && (
          <button onClick={onCreateClick} className="btn-primary flex items-center gap-2 text-sm">
            <HiOutlinePlus size={16} /> Create Club
          </button>
        )}
      </div>
    </div>
  </motion.div>
);

const CreateClubModal = ({ isOpen, onClose, onSubmit, form, setForm, isSubmitting }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Create a New Club">
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="label-text flex items-center gap-1.5 mb-1.5">
          <HiOutlineOfficeBuilding size={14} className="text-accent-400" />
          Club Name
        </label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input-glass text-sm"
          placeholder="e.g. Tech Club, Music Society"
          required
          autoFocus
        />
      </div>
      <div>
        <label className="label-text flex items-center gap-1.5 mb-1.5">
          <HiOutlineOfficeBuilding size={14} className="text-accent-400" />
          College / Institution
        </label>
        <input
          value={form.college}
          onChange={(e) => setForm({ ...form, college: e.target.value })}
          className="input-glass text-sm"
          placeholder="Your college or organization"
          required
        />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Creating...
            </>
          ) : (
            <>
              <HiOutlinePlus size={16} /> Create Club
            </>
          )}
        </motion.button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  </Modal>
);

// ------------------------------
// Main Clubs Component
// ------------------------------

const Clubs = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', college: '' });
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  const fetchClubs = async () => {
    try {
      const res = await api.get('/clubs');
      setClubs(res.data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/clubs', createForm);
      toast.success('Club created successfully!');
      setShowCreate(false);
      setCreateForm({ name: '', college: '' });
      fetchClubs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create club');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (clubId) => {
    try {
      await api.post('/join-requests', { clubId });
      toast.success('Join request sent!');
      // Optionally refresh clubs to update member status
      fetchClubs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  const filteredClubs = clubs.filter(
    (c) =>
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.college?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page-container">
        <SkeletonLoader count={6} />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-8 flex-wrap gap-4"
      >
        <div>
          <h1 className="page-title mb-1 flex items-center gap-3">
            <div className="bg-accent-500/10 p-2 rounded-xl border border-accent-500/20">
              <HiOutlineOfficeBuilding className="text-accent-400 w-5 h-5" />
            </div>
            Clubs
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            {clubs.length} club{clubs.length !== 1 ? 's' : ''} available
          </p>
        </div>
        {user?.role === 'manager' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2 text-sm shadow-lg shadow-accent-500/20"
          >
            <HiOutlinePlus size={16} /> Create Club
          </motion.button>
        )}
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-8"
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Search clubs by name or college..." />
      </motion.div>

      {/* Club Grid */}
      <AnimatePresence mode="wait">
        {filteredClubs.length === 0 ? (
          <EmptyState
            key="empty"
            hasSearch={!!search}
            onClearSearch={() => setSearch('')}
            userRole={user?.role}
            onCreateClick={() => setShowCreate(true)}
          />
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredClubs.map((club, i) => (
              <ClubCard
                key={club._id}
                club={club}
                user={user}
                onJoin={handleJoin}
                index={i}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Club Modal */}
      <CreateClubModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        form={createForm}
        setForm={setCreateForm}
        isSubmitting={creating}
      />
    </div>
  );
};

export default Clubs;