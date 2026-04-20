import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineCash,
  HiOutlinePlus,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineTrendingUp,
} from 'react-icons/hi';

// ------------------------------
// Reusable Components
// ------------------------------

const StatusBadge = ({ status }) => {
  const config = {
    pending: { icon: HiOutlineClock, classes: 'badge-pending', label: 'Pending' },
    approved: { icon: HiOutlineCheckCircle, classes: 'badge-approved', label: 'Approved' },
    paid: { icon: HiOutlineCheckCircle, classes: 'badge-paid', label: 'Paid' },
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

const StatItem = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-3 group">
    <div
      className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${color}-500/20 to-${color}-500/10 flex items-center justify-center border border-${color}-500/20 group-hover:scale-105 transition-transform duration-300`}
    >
      <Icon size={18} className={`text-${color}-400`} />
    </div>
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-base font-bold text-white tabular-nums">{value}</p>
    </div>
  </div>
);

const ExpenseItem = ({ expense, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.03, duration: 0.25 }}
    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
    className="expense-row group"
  >
    <div className="flex items-start gap-4 flex-1 min-w-0">
      <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors">
        <HiOutlineCash size={18} className="text-gray-400 group-hover:text-accent-400 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap mb-1">
          <h3 className="text-sm font-semibold text-white group-hover:text-accent-300 transition-colors truncate">
            {expense.title}
          </h3>
          <StatusBadge status={expense.status} />
        </div>
        {expense.description && (
          <p className="text-xs text-gray-400 mb-1.5 line-clamp-1">{expense.description}</p>
        )}
        <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
          <HiOutlineUsers size={12} />
          {expense.user?.name}
        </p>
      </div>
    </div>
    <div className="text-right ml-4 flex flex-col items-end gap-1.5">
      <p className="text-base font-bold text-white tabular-nums tracking-tight">
        ₹{expense.amount.toLocaleString()}
      </p>
      {expense.imageUrl && (
        <a
          href={expense.imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-medium text-accent-400 hover:text-accent-300 transition-colors flex items-center gap-1 bg-accent-500/10 px-2 py-1 rounded-md border border-accent-500/20 hover:bg-accent-500/20"
        >
          <HiOutlineDocumentText size={12} />
          Receipt
        </a>
      )}
    </div>
  </motion.div>
);

const EmptyExpenses = ({ eventId }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className="empty-state py-12"
  >
    <div className="empty-state-icon mb-5">
      <HiOutlineCash size={28} className="text-gray-400" />
    </div>
    <p className="empty-state-title text-lg">No expenses yet</p>
    <p className="empty-state-text max-w-xs mx-auto">
      Be the first to submit an expense for this event.
    </p>
    <Link
      to={`/add-expense/${eventId}`}
      className="btn-primary inline-flex items-center gap-2 mt-6 shadow-lg shadow-accent-500/20"
    >
      <HiOutlinePlus size={16} /> Add Expense
    </Link>
  </motion.div>
);

// ------------------------------
// Main Component
// ------------------------------

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, expensesRes] = await Promise.all([
          api.get(`/events/${id}`),
          api.get(`/expenses/event/${id}`),
        ]);
        setEvent(eventRes.data);
        setExpenses(expensesRes.data);
      } catch {
        toast.error('Failed to load event');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  if (loading) return <Loader />;
  if (!event) return null;

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const paidCount = expenses.filter((e) => e.status === 'paid').length;
  const pendingCount = expenses.filter((e) => e.status === 'pending').length;
  const approvedCount = expenses.filter((e) => e.status === 'approved').length;

  const stats = [
    { icon: HiOutlineCalendar, label: 'Date', value: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), color: 'accent' },
    { icon: HiOutlineUserGroup, label: 'Club', value: event.club?.name || '—', color: 'neon-cyan' },
    { icon: HiOutlineCash, label: 'Total', value: `₹${totalAmount.toLocaleString()}`, color: 'neon-green' },
    { icon: HiOutlineTrendingUp, label: 'Paid', value: `${paidCount}/${expenses.length}`, color: 'emerald' },
  ];

  return (
    <div className="page-container">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-xs font-semibold mb-8 transition-colors uppercase tracking-wider group"
      >
        <HiOutlineArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        Back
      </motion.button>

      {/* Event Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card p-6 sm:p-8 mb-6"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-500 to-neon-purple flex items-center justify-center shadow-xl flex-shrink-0">
              <HiOutlineCalendar size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">{event.title}</h1>
              {event.description && (
                <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">{event.description}</p>
              )}
            </div>
          </div>
          <Link
            to={`/add-expense/${event._id}`}
            className="btn-primary flex items-center gap-2 self-start whitespace-nowrap shadow-lg shadow-accent-500/20"
          >
            <HiOutlinePlus size={16} /> Add Expense
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/[0.06]">
          {stats.map((stat, i) => (
            <StatItem key={i} {...stat} />
          ))}
        </div>
      </motion.div>

      {/* Expenses Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="glass-card p-6 sm:p-7"
      >
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/[0.06]">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-3">
            <div className="bg-accent-500/10 p-1.5 rounded-lg border border-accent-500/20">
              <HiOutlineCash size={16} className="text-accent-400" />
            </div>
            Expenses
            <span className="text-gray-400 font-medium text-xs ml-2">
              {expenses.length} total
            </span>
          </h2>
          {expenses.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-yellow-400">
                <HiOutlineClock size={12} /> {pendingCount} pending
              </span>
              <span className="flex items-center gap-1 text-blue-400">
                <HiOutlineCheckCircle size={12} /> {approvedCount} approved
              </span>
              <span className="flex items-center gap-1 text-green-400">
                <HiOutlineCheckCircle size={12} /> {paidCount} paid
              </span>
            </div>
          )}
        </div>

        {expenses.length === 0 ? (
          <EmptyExpenses eventId={event._id} />
        ) : (
          <div className="divide-y divide-white/[0.06]">
            <AnimatePresence>
              {expenses.map((expense, i) => (
                <ExpenseItem key={expense._id} expense={expense} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EventDetails;