import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { HiOutlineOfficeBuilding, HiOutlinePlus, HiOutlineUserAdd, HiOutlineSearch, HiOutlineUserGroup } from 'react-icons/hi';

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
    } catch { /* Silently handle */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchClubs(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/clubs', createForm);
      toast.success('Club created!');
      setShowCreate(false);
      setCreateForm({ name: '', college: '' });
      fetchClubs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setCreating(false); }
  };

  const handleJoin = async (clubId) => {
    try {
      await api.post('/join-requests', { clubId });
      toast.success('Join request sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="page-container"><SkeletonLoader count={6} /></div>;

  const filteredClubs = clubs.filter((c) =>
    !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()) || c.college?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="page-title mb-1">
            <HiOutlineOfficeBuilding className="inline text-accent-400 mr-2" /> Clubs
          </h1>
          <p className="text-sm text-gray-500">{clubs.length} clubs available</p>
        </div>
        {user?.role === 'manager' && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
            <HiOutlinePlus size={16} /> Create Club
          </motion.button>
        )}
      </motion.div>

      <div className="relative max-w-md mb-6">
        <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-glass pl-10 text-sm" placeholder="Search clubs…" />
      </div>

      {filteredClubs.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <HiOutlineOfficeBuilding size={24} className="text-gray-500" />
            </div>
            <p className="empty-state-title">No clubs found</p>
            <p className="empty-state-text">{search ? 'Try a different search term' : 'No clubs are available yet'}</p>
            {user?.role === 'manager' && (
              <button onClick={() => setShowCreate(true)} className="btn-primary text-xs flex items-center gap-1.5">
                <HiOutlinePlus size={14} /> Create Club
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClubs.map((club, i) => {
            const isMember = club.members?.some((m) => m._id === user?._id || m === user?._id);
            const isManager = club.revenueManager?._id === user?._id || club.revenueManager === user?._id;

            return (
              <motion.div
                key={club._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -2 }}
                className="glass-card-hover p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-500 to-neon-purple flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {club.name.charAt(0).toUpperCase()}
                  </div>
                  {isManager && <span className="badge bg-accent-500/15 text-accent-300 border-accent-500/20">Manager</span>}
                  {isMember && !isManager && <span className="badge bg-neon-green/15 text-neon-green border-neon-green/20">Member</span>}
                </div>
                <h3 className="text-sm font-bold text-white mb-0.5">{club.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{club.college}</p>
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                  <span className="text-[11px] text-gray-500 flex items-center gap-1.5">
                    <HiOutlineUserGroup size={12} />
                    {club.members?.length || 0} members
                  </span>
                  {!isMember && !isManager && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleJoin(club._id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-accent-400 hover:text-accent-300 transition-colors"
                    >
                      <HiOutlineUserAdd size={12} /> Join
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Club">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label-text">Club Name</label>
            <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="input-glass text-sm" placeholder="e.g. Tech Club" required />
          </div>
          <div>
            <label className="label-text">College</label>
            <input value={createForm.college} onChange={(e) => setCreateForm({ ...createForm, college: e.target.value })} className="input-glass text-sm" placeholder="Your college" required />
          </div>
          <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={creating} className="btn-primary w-full disabled:opacity-50">
            {creating ? 'Creating...' : 'Create Club'}
          </motion.button>
        </form>
      </Modal>
    </div>
  );
};

export default Clubs;
