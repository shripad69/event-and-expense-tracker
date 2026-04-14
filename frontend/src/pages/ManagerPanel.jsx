import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineClipboardList,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineCash,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineCreditCard,
} from 'react-icons/hi';

const TAB_CONFIG = {
  pending:  { icon: HiOutlineClock,       gradient: 'from-yellow-500 to-orange-500', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.15)]' },
  approved: { icon: HiOutlineCheckCircle,  gradient: 'from-emerald-500 to-teal-500', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]' },
  paid:     { icon: HiOutlineCreditCard,   gradient: 'from-blue-500 to-cyan-500',    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]' },
};

const ManagerPanel = () => {
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [approvedExpenses, setApprovedExpenses] = useState([]);
  const [paidExpenses, setPaidExpenses] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', clubId: '' });
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [expandedEvents, setExpandedEvents] = useState({});
  const [payingId, setPayingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = async () => {
    try {
      const [pendingRes, approvedRes, paidRes, clubsRes] = await Promise.all([
        api.get('/expenses/pending'),
        api.get('/expenses/approved'),
        api.get('/expenses/paid'),
        api.get('/clubs/my'),
      ]);
      setPendingExpenses(pendingRes.data);
      setApprovedExpenses(approvedRes.data);
      setPaidExpenses(paidRes.data);
      setClubs(clubsRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (id) => {
    try {
      await api.put(`/expenses/${id}/approve`);
      toast.success('Expense approved');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/expenses/${id}/reject`);
      toast.success('Expense rejected');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handlePay = async (expenseId) => {
    setPayingId(expenseId);
    setApprovedExpenses((prev) => prev.filter((e) => e._id !== expenseId));
    try {
      const { data } = await api.post('/payments/create-checkout-session', { expenseId });
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
      fetchData();
      setPayingId(null);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/events', eventForm);
      toast.success('Event created!');
      setShowEventModal(false);
      setEventForm({ title: '', description: '', date: '', clubId: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setCreating(false);
    }
  };

  const toggleEvent = (eventId) => {
    setExpandedEvents((prev) => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  const rawExpenses = tab === 'pending' ? pendingExpenses : tab === 'approved' ? approvedExpenses : paidExpenses;
  const allExpenses = [...pendingExpenses, ...approvedExpenses, ...paidExpenses];

  const uniqueEvents = useMemo(() => {
    const map = {};
    allExpenses.forEach((e) => { if (e.event?._id) map[e.event._id] = e.event.title; });
    return Object.entries(map).map(([id, title]) => ({ id, title }));
  }, [pendingExpenses, approvedExpenses, paidExpenses]);

  const uniqueUsers = useMemo(() => {
    const map = {};
    allExpenses.forEach((e) => { if (e.user?._id) map[e.user._id] = e.user.name; });
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [pendingExpenses, approvedExpenses, paidExpenses]);

  const filteredExpenses = useMemo(() => {
    let result = rawExpenses;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) => e.title.toLowerCase().includes(q) || e.user?.name?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q)
      );
    }
    if (eventFilter !== 'all') result = result.filter((e) => e.event?._id === eventFilter);
    if (userFilter !== 'all') result = result.filter((e) => e.user?._id === userFilter);
    return result;
  }, [rawExpenses, searchQuery, eventFilter, userFilter]);

  const groupedByEvent = useMemo(() => {
    const groups = {};
    filteredExpenses.forEach((exp) => {
      const eventId = exp.event?._id || 'other';
      const eventTitle = exp.event?.title || 'Other';
      const eventDate = exp.event?.date || null;
      if (!groups[eventId]) groups[eventId] = { eventId, eventTitle, eventDate, expenses: [], total: 0 };
      groups[eventId].expenses.push(exp);
      groups[eventId].total += exp.amount;
    });
    return Object.values(groups).sort((a, b) => {
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return new Date(b.eventDate) - new Date(a.eventDate);
    });
  }, [filteredExpenses]);

  useEffect(() => {
    if (groupedByEvent.length > 0 && Object.keys(expandedEvents).length === 0) {
      const initial = {};
      groupedByEvent.forEach((g) => { initial[g.eventId] = true; });
      setExpandedEvents(initial);
    }
  }, [groupedByEvent]);

  const clearFilters = () => { setSearchQuery(''); setEventFilter('all'); setUserFilter('all'); };
  const hasActiveFilters = searchQuery.trim() || eventFilter !== 'all' || userFilter !== 'all';
  const totalAmount = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const statusColor = {
    pending: 'badge-pending', approved: 'badge-approved', paid: 'badge-paid', rejected: 'badge-rejected',
  };

  if (loading) return (
    <div className="page-container">
      <SkeletonLoader type="stat" />
      <div className="mt-8"><SkeletonLoader count={4} /></div>
    </div>
  );

  const tabs = [
    { key: 'pending', label: 'Pending', count: pendingExpenses.length },
    { key: 'approved', label: 'Approved', count: approvedExpenses.length },
    { key: 'paid', label: 'Paid', count: paidExpenses.length },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 flex-wrap gap-4"
      >
        <div>
          <h1 className="page-title mb-1">
            <HiOutlineClipboardList className="inline text-accent-400 mr-2" />
            Manager Panel
          </h1>
          <p className="text-sm text-gray-500">{allExpenses.length} total expenses across all statuses</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowEventModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <HiOutlinePlus size={16} /> Create Event
        </motion.button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        {tabs.map((t, i) => {
          const cfg = TAB_CONFIG[t.key];
          const TabIcon = cfg.icon;
          const amount = (t.key === 'pending' ? pendingExpenses : t.key === 'approved' ? approvedExpenses : paidExpenses)
            .reduce((s, e) => s + e.amount, 0);
          return (
            <motion.button
              key={t.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setTab(t.key); clearFilters(); }}
              className={`stat-card text-left cursor-pointer group ${tab === t.key ? cfg.glow : ''}`}
              style={tab === t.key ? { borderColor: 'rgba(99, 102, 241, 0.2)' } : {}}
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${cfg.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <TabIcon size={18} className="text-white" />
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-white">{t.count}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t.label}</span>
                <span className="text-xs font-medium text-gray-500">₹{amount.toLocaleString()}</span>
              </div>
              {tab === t.key && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-500 to-neon-purple rounded-full" />
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Search + Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mb-6 space-y-3"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-glass pl-10 pr-4 text-sm"
              placeholder="Search expenses…"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border uppercase tracking-wider ${
              showFilters || hasActiveFilters
                ? 'bg-accent-500/15 text-accent-300 border-accent-500/25'
                : 'bg-white/[0.04] text-gray-400 border-white/6 hover:bg-white/8'
            }`}
          >
            <HiOutlineFilter size={14} />
            Filters
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-accent-400" />}
          </motion.button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-[11px] text-gray-500 hover:text-white transition-colors self-center font-medium">
              Clear all
            </button>
          )}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <div className="flex-1 max-w-xs">
                  <label className="label-text">Event</label>
                  <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="input-glass text-sm">
                    <option value="all" className="bg-dark-800">All Events</option>
                    {uniqueEvents.map((ev) => (
                      <option key={ev.id} value={ev.id} className="bg-dark-800">{ev.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 max-w-xs">
                  <label className="label-text">User</label>
                  <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="input-glass text-sm">
                    <option value="all" className="bg-dark-800">All Users</option>
                    {uniqueUsers.map((u) => (
                      <option key={u.id} value={u.id} className="bg-dark-800">{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Grouped Expenses */}
      <div className="space-y-4">
        {groupedByEvent.length === 0 ? (
          <div className="glass-card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <HiOutlineCash size={24} className="text-gray-500" />
              </div>
              <p className="empty-state-title">No {tab} expenses</p>
              <p className="empty-state-text">
                {hasActiveFilters ? 'Try adjusting your filters to see results' : `There are no ${tab} expenses at the moment`}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-secondary text-xs">
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {groupedByEvent.map((group, gi) => (
              <motion.div
                key={group.eventId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.04 }}
                className="glass-card overflow-hidden"
              >
                {/* Event Header */}
                <button
                  onClick={() => toggleEvent(group.eventId)}
                  className="w-full flex items-center justify-between p-5 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${TAB_CONFIG[tab].gradient} flex items-center justify-center shadow-lg`}>
                      <HiOutlineCalendar size={18} className="text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-white">{group.eventTitle}</h3>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                        {group.eventDate && (
                          <span>{new Date(group.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-gray-600" />
                          {group.expenses.length} expense{group.expenses.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-base font-bold text-white tabular-nums">₹{group.total.toLocaleString()}</span>
                    <motion.div animate={{ rotate: expandedEvents[group.eventId] ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <HiOutlineChevronDown size={16} className="text-gray-400" />
                    </motion.div>
                  </div>
                </button>

                {/* Expenses List */}
                <AnimatePresence>
                  {expandedEvents[group.eventId] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-2 border-t border-white/[0.04] pt-3">
                        {group.expenses.map((expense, ei) => (
                          <motion.div
                            key={expense._id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: ei * 0.03 }}
                            className="expense-row"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <h4 className="text-sm font-semibold text-white">{expense.title}</h4>
                                <span className={statusColor[expense.status]}>{expense.status}</span>
                              </div>
                              {expense.description && (
                                <p className="text-xs text-gray-500 mt-1 truncate">{expense.description}</p>
                              )}
                              <p className="text-[11px] text-gray-600 mt-0.5">By {expense.user?.name}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-base font-bold text-white tabular-nums">₹{expense.amount.toLocaleString()}</span>
                              {expense.imageUrl && (
                                <a href={expense.imageUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent-400 hover:text-accent-300 font-medium transition-colors">Receipt</a>
                              )}
                              {tab === 'pending' && (
                                <div className="flex gap-1.5">
                                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleApprove(expense._id)} className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all" title="Approve">
                                    <HiOutlineCheck size={16} />
                                  </motion.button>
                                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleReject(expense._id)} className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all" title="Reject">
                                    <HiOutlineX size={16} />
                                  </motion.button>
                                </div>
                              )}
                              {tab === 'approved' && (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handlePay(expense._id)}
                                  disabled={payingId === expense._id}
                                  className="btn-success text-xs py-2 px-3.5 flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  <HiOutlineCash size={14} />
                                  {payingId === expense._id ? 'Processing…' : 'Pay'}
                                </motion.button>
                              )}
                              {tab === 'paid' && expense.paymentId && (
                                <span className="text-[10px] text-gray-500 font-mono bg-white/[0.04] px-2 py-1 rounded" title={expense.paymentId}>
                                  #{expense.paymentId.slice(-8)}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Create Event Modal */}
      <Modal isOpen={showEventModal} onClose={() => setShowEventModal(false)} title="Create Event">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="label-text">Title</label>
            <input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} className="input-glass text-sm" placeholder="Event title" required />
          </div>
          <div>
            <label className="label-text">Description</label>
            <textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} className="input-glass min-h-[80px] resize-none text-sm" placeholder="Event description" />
          </div>
          <div>
            <label className="label-text">Date</label>
            <input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className="input-glass text-sm" required />
          </div>
          <div>
            <label className="label-text">Club</label>
            <select value={eventForm.clubId} onChange={(e) => setEventForm({ ...eventForm, clubId: e.target.value })} className="input-glass text-sm" required>
              <option value="" className="bg-dark-800">Select Club</option>
              {clubs.map((club) => (
                <option key={club._id} value={club._id} className="bg-dark-800">{club.name}</option>
              ))}
            </select>
          </div>
          <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={creating} className="btn-primary w-full disabled:opacity-50">
            {creating ? 'Creating...' : 'Create Event'}
          </motion.button>
        </form>
      </Modal>
    </div>
  );
};

export default ManagerPanel;