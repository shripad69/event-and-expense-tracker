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
  HiOutlineUser,
  HiOutlineDocumentText,
  HiOutlineXCircle,
} from 'react-icons/hi';

// ------------------------------
// Constants
// ------------------------------
const TAB_CONFIG = {
  pending: {
    icon: HiOutlineClock,
    gradient: 'from-yellow-500 to-orange-500',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.15)]',
    label: 'Pending',
  },
  approved: {
    icon: HiOutlineCheckCircle,
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    label: 'Approved',
  },
  paid: {
    icon: HiOutlineCreditCard,
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    label: 'Paid',
  },
};

const STATUS_BADGE_CONFIG = {
  pending: { icon: HiOutlineClock, classes: 'badge-pending' },
  approved: { icon: HiOutlineCheckCircle, classes: 'badge-approved' },
  paid: { icon: HiOutlineCreditCard, classes: 'badge-paid' },
  rejected: { icon: HiOutlineXCircle, classes: 'badge-rejected' },
};

// ------------------------------
// Reusable Components
// ------------------------------

// Status badge with icon
const StatusBadge = ({ status }) => {
  const config = STATUS_BADGE_CONFIG[status] || STATUS_BADGE_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span className={`badge inline-flex items-center gap-1 ${config.classes}`}>
      <Icon size={12} />
      {status}
    </span>
  );
};

// Tab summary card
const TabSummaryCard = ({ tabKey, count, amount, isActive, onClick, index }) => {
  const config = TAB_CONFIG[tabKey];
  const Icon = config.icon;
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`stat-card text-left cursor-pointer group relative ${isActive ? config.glow : ''}`}
      style={isActive ? { borderColor: 'rgba(99, 102, 241, 0.2)' } : {}}
      aria-pressed={isActive}
    >
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
          <Icon size={18} className="text-white drop-shadow-sm" />
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-white tabular-nums">{count}</span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{config.label}</span>
        <span className="text-sm font-medium text-gray-300 tabular-nums">₹{amount.toLocaleString()}</span>
      </div>
      {isActive && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-500 to-neon-purple rounded-full"
        />
      )}
    </motion.button>
  );
};

// Filter bar with search and filter toggle
const FilterBar = ({
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  hasActiveFilters,
  onClearFilters,
  eventFilter,
  setEventFilter,
  userFilter,
  setUserFilter,
  uniqueEvents,
  uniqueUsers,
}) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mb-6 space-y-3">
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search input */}
      <div className="relative flex-1 max-w-md">
        <HiOutlineSearch
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
            searchQuery ? 'text-accent-400' : 'text-gray-500'
          }`}
          size={16}
        />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-glass pl-10 pr-4 text-sm w-full"
          placeholder="Search by title, user, or description..."
          aria-label="Search expenses"
        />
      </div>

      {/* Filter toggle button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-accent-500/50 ${
          showFilters || hasActiveFilters
            ? 'bg-accent-500/15 text-accent-300 border-accent-500/25'
            : 'bg-white/[0.04] text-gray-400 border-white/6 hover:bg-white/8'
        }`}
        aria-expanded={showFilters}
      >
        <HiOutlineFilter size={14} />
        Filters
        {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-accent-400" />}
      </motion.button>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="text-xs text-gray-400 hover:text-white transition-colors self-center font-medium flex items-center gap-1"
        >
          <HiOutlineX size={12} /> Clear all
        </button>
      )}
    </div>

    {/* Expandable filter panel */}
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <div className="flex-1 max-w-xs">
              <label className="label-text flex items-center gap-1.5 mb-1.5">
                <HiOutlineCalendar size={12} className="text-accent-400" />
                Event
              </label>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="input-glass text-sm"
              >
                <option value="all">All Events</option>
                {uniqueEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 max-w-xs">
              <label className="label-text flex items-center gap-1.5 mb-1.5">
                <HiOutlineUser size={12} className="text-accent-400" />
                User
              </label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="input-glass text-sm"
              >
                <option value="all">All Users</option>
                {uniqueUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

// Individual expense item
const ExpenseItem = ({ expense, tab, onApprove, onReject, onPay, isPaying }) => {
  const showActions = tab === 'pending';
  const showPay = tab === 'approved';
  const showPaymentRef = tab === 'paid' && expense.paymentId;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
      className="expense-row group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap mb-1">
          <h4 className="text-sm font-semibold text-white group-hover:text-accent-300 transition-colors">
            {expense.title}
          </h4>
          <StatusBadge status={expense.status} />
        </div>
        {expense.description && (
          <p className="text-xs text-gray-400 mb-1 line-clamp-1">{expense.description}</p>
        )}
        <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
          <HiOutlineUser size={12} />
          {expense.user?.name}
        </p>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <span className="text-base font-bold text-white tabular-nums tracking-tight">
          ₹{expense.amount.toLocaleString()}
        </span>

        {expense.imageUrl && (
          <a
            href={expense.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium text-accent-400 hover:text-accent-300 transition-colors flex items-center gap-1 bg-accent-500/10 px-2 py-1 rounded-md border border-accent-500/20 hover:bg-accent-500/20"
            aria-label="View receipt"
          >
            <HiOutlineDocumentText size={12} />
            Receipt
          </a>
        )}

        {showActions && (
          <div className="flex gap-1.5">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onApprove(expense._id)}
              className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all border border-emerald-500/20 hover:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              title="Approve"
              aria-label="Approve expense"
            >
              <HiOutlineCheck size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onReject(expense._id)}
              className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all border border-red-500/20 hover:border-red-500/40 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              title="Reject"
              aria-label="Reject expense"
            >
              <HiOutlineX size={16} />
            </motion.button>
          </div>
        )}

        {showPay && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPay(expense._id)}
            disabled={isPaying}
            className="btn-success text-xs py-2 px-4 flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            aria-label="Pay expense"
          >
            <HiOutlineCash size={14} />
            {isPaying ? 'Processing…' : 'Pay Now'}
          </motion.button>
        )}

        {showPaymentRef && (
          <span
            className="text-[10px] text-gray-400 font-mono bg-white/[0.04] px-2 py-1 rounded-md border border-white/5"
            title={expense.paymentId}
          >
            #{expense.paymentId.slice(-8)}
          </span>
        )}
      </div>
    </motion.div>
  );
};

// Expense group (by event) collapsible card
const ExpenseGroup = ({ group, tab, expanded, onToggle, onApprove, onReject, onPay, payingId }) => {
  const config = TAB_CONFIG[tab];
  const EventIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.03] transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent-500/50"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
            <HiOutlineCalendar size={20} className="text-white" />
          </div>
          <div className="text-left min-w-0">
            <h3 className="text-base font-bold text-white truncate">{group.eventTitle}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
              {group.eventDate && (
                <span className="flex items-center gap-1">
                  <HiOutlineCalendar size={12} />
                  {new Date(group.eventDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-gray-600" />
                {group.expenses.length} expense{group.expenses.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="text-lg font-bold text-white tabular-nums">₹{group.total.toLocaleString()}</span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <HiOutlineChevronDown size={18} className="text-gray-400" />
          </motion.div>
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-2 border-t border-white/[0.04] pt-3">
              {group.expenses.map((expense) => (
                <ExpenseItem
                  key={expense._id}
                  expense={expense}
                  tab={tab}
                  onApprove={onApprove}
                  onReject={onReject}
                  onPay={onPay}
                  isPaying={payingId === expense._id}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Empty state component
const EmptyState = ({ tab, hasActiveFilters, onClearFilters }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className="glass-card"
  >
    <div className="empty-state py-14">
      <div className="empty-state-icon mb-5">
        <HiOutlineClipboardList size={28} className="text-gray-400" />
      </div>
      <p className="empty-state-title text-lg">No {tab} expenses</p>
      <p className="empty-state-text max-w-xs mx-auto">
        {hasActiveFilters
          ? 'No expenses match your current filters. Try adjusting your search or filters.'
          : `There are no ${tab} expenses at the moment.`}
      </p>
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="mt-6 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2 mx-auto"
        >
          <HiOutlineX size={14} /> Clear filters
        </button>
      )}
    </div>
  </motion.div>
);

// Create event modal
const CreateEventModal = ({ isOpen, onClose, form, setForm, clubs, isSubmitting, onSubmit }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Create New Event">
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="label-text flex items-center gap-1.5 mb-1.5">
          <HiOutlineCalendar size={14} className="text-accent-400" />
          Event Title
        </label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="input-glass text-sm"
          placeholder="e.g., Annual Tech Fest"
          required
          autoFocus
        />
      </div>
      <div>
        <label className="label-text flex items-center gap-1.5 mb-1.5">
          <HiOutlineDocumentText size={14} className="text-accent-400" />
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input-glass min-h-[90px] resize-none text-sm"
          placeholder="Event details (optional)"
        />
      </div>
      <div>
        <label className="label-text flex items-center gap-1.5 mb-1.5">
          <HiOutlineClock size={14} className="text-accent-400" />
          Date
        </label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="input-glass text-sm"
          required
        />
      </div>
      <div>
        <label className="label-text flex items-center gap-1.5 mb-1.5">
          <HiOutlineUser size={14} className="text-accent-400" />
          Club
        </label>
        <select
          value={form.clubId}
          onChange={(e) => setForm({ ...form, clubId: e.target.value })}
          className="input-glass text-sm"
          required
        >
          <option value="">Select a club</option>
          {clubs.map((club) => (
            <option key={club._id} value={club._id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-text flex items-center gap-1.5 mb-1.5">
          <HiOutlineCash size={14} className="text-accent-400" />
          Budget (optional)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">₹</span>
          <input
            type="number"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            className="input-glass text-sm pl-8"
            placeholder="e.g., 50000"
            min="0"
            step="100"
          />
        </div>
        <p className="text-[11px] text-gray-500 mt-1.5">Set a budget to track spending against this event</p>
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating...
            </>
          ) : (
            <>
              <HiOutlinePlus size={16} /> Create Event
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
// Main ManagerPanel Component
// ------------------------------

const ManagerPanel = () => {
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [approvedExpenses, setApprovedExpenses] = useState([]);
  const [paidExpenses, setPaidExpenses] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', clubId: '', budget: '' });
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
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.put(`/expenses/${id}/approve`);
      toast.success('Expense approved');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/expenses/${id}/reject`);
      toast.success('Expense rejected');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    }
  };

  const handlePay = async (expenseId) => {
    setPayingId(expenseId);
    // Optimistic removal from approved list
    setApprovedExpenses((prev) => prev.filter((e) => e._id !== expenseId));
    try {
      const { data } = await api.post('/payments/create-checkout-session', { expenseId });
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
      fetchData(); // Revert on error
      setPayingId(null);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/events', eventForm);
      toast.success('Event created successfully!');
      setShowEventModal(false);
      setEventForm({ title: '', description: '', date: '', clubId: '', budget: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
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
    allExpenses.forEach((e) => {
      if (e.event?._id) map[e.event._id] = e.event.title;
    });
    return Object.entries(map).map(([id, title]) => ({ id, title }));
  }, [pendingExpenses, approvedExpenses, paidExpenses]);

  const uniqueUsers = useMemo(() => {
    const map = {};
    allExpenses.forEach((e) => {
      if (e.user?._id) map[e.user._id] = e.user.name;
    });
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [pendingExpenses, approvedExpenses, paidExpenses]);

  const filteredExpenses = useMemo(() => {
    let result = rawExpenses;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.user?.name?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q)
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

  // Auto-expand all groups when tab/filter changes
  useEffect(() => {
    if (groupedByEvent.length > 0) {
      const initial = {};
      groupedByEvent.forEach((g) => {
        initial[g.eventId] = true;
      });
      setExpandedEvents(initial);
    }
  }, [groupedByEvent]);

  const clearFilters = () => {
    setSearchQuery('');
    setEventFilter('all');
    setUserFilter('all');
  };

  const hasActiveFilters = searchQuery.trim() || eventFilter !== 'all' || userFilter !== 'all';
  const totalAmount = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  if (loading) {
    return (
      <div className="page-container">
        <div className="mb-8">
          <SkeletonLoader type="stat" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stat-card">
              <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
              <div className="h-6 w-12 bg-white/10 rounded animate-pulse mt-2" />
              <div className="h-4 w-20 bg-white/10 rounded animate-pulse mt-1" />
            </div>
          ))}
        </div>
        <div className="glass-card p-5">
          <SkeletonLoader count={4} />
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'pending', count: pendingExpenses.length, amount: pendingExpenses.reduce((s, e) => s + e.amount, 0) },
    { key: 'approved', count: approvedExpenses.length, amount: approvedExpenses.reduce((s, e) => s + e.amount, 0) },
    { key: 'paid', count: paidExpenses.length, amount: paidExpenses.reduce((s, e) => s + e.amount, 0) },
  ];

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
              <HiOutlineClipboardList className="text-accent-400 w-5 h-5" />
            </div>
            Manager Panel
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            {allExpenses.length} total expense{allExpenses.length !== 1 ? 's' : ''} across all statuses
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowEventModal(true)}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-accent-500/20"
        >
          <HiOutlinePlus size={16} /> Create Event
        </motion.button>
      </motion.div>

      {/* Summary Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        {tabs.map((t, i) => (
          <TabSummaryCard
            key={t.key}
            tabKey={t.key}
            count={t.count}
            amount={t.amount}
            isActive={tab === t.key}
            onClick={() => {
              setTab(t.key);
              clearFilters();
            }}
            index={i}
          />
        ))}
      </motion.div>

      {/* Filters */}
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        eventFilter={eventFilter}
        setEventFilter={setEventFilter}
        userFilter={userFilter}
        setUserFilter={setUserFilter}
        uniqueEvents={uniqueEvents}
        uniqueUsers={uniqueUsers}
      />

      {/* Expense Groups */}
      <div className="space-y-4">
        {groupedByEvent.length === 0 ? (
          <EmptyState tab={tab} hasActiveFilters={hasActiveFilters} onClearFilters={clearFilters} />
        ) : (
          <AnimatePresence mode="wait">
            {groupedByEvent.map((group) => (
              <ExpenseGroup
                key={group.eventId}
                group={group}
                tab={tab}
                expanded={expandedEvents[group.eventId] || false}
                onToggle={() => toggleEvent(group.eventId)}
                onApprove={handleApprove}
                onReject={handleReject}
                onPay={handlePay}
                payingId={payingId}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        form={eventForm}
        setForm={setEventForm}
        clubs={clubs}
        isSubmitting={creating}
        onSubmit={handleCreateEvent}
      />
    </div>
  );
};

export default ManagerPanel;