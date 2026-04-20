import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCash,
  HiOutlineSearch,
  HiOutlineCalendar,
  HiOutlineX,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineFilter,
  HiOutlineReceiptTax,
} from 'react-icons/hi';

// ------------------------------
// Reusable Components
// ------------------------------

// Status badge with appropriate icon and color
const StatusBadge = ({ status }) => {
  const config = {
    pending: { icon: HiOutlineClock, classes: 'badge-pending' },
    approved: { icon: HiOutlineCheckCircle, classes: 'badge-approved' },
    paid: { icon: HiOutlineCheckCircle, classes: 'badge-paid' },
    rejected: { icon: HiOutlineXCircle, classes: 'badge-rejected' },
  };
  const { icon: Icon, classes } = config[status] || config.pending;

  return (
    <span className={`badge inline-flex items-center gap-1 ${classes}`}>
      <Icon size={12} />
      {status}
    </span>
  );
};

// Summary statistic card
const StatCard = ({ label, value, icon: Icon, gradient, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.3 }}
    whileHover={{ y: -2 }}
    className="stat-card group"
  >
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
      <Icon size={18} className="text-white drop-shadow-sm" />
    </div>
    <p className="text-2xl font-bold text-white tabular-nums mt-2 tracking-tight">{value}</p>
    <p className="text-[10px] sm:text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
  </motion.div>
);

// Filter button component
const FilterButton = ({ status, currentFilter, onClick, count }) => (
  <button
    onClick={() => onClick(status)}
    className={`
      relative px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-accent-500/50
      ${currentFilter === status
        ? 'bg-accent-500/15 text-accent-300 border border-accent-500/25 shadow-[0_0_10px_rgba(99,102,241,0.15)]'
        : 'bg-white/[0.04] text-gray-400 border border-white/[0.04] hover:bg-white/[0.08] hover:text-gray-300'
      }
    `}
    aria-pressed={currentFilter === status}
  >
    {status === 'all' ? 'All' : status}
    {count !== undefined && currentFilter === status && (
      <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-accent-500/20 text-accent-300 text-[10px] font-bold">
        {count}
      </span>
    )}
  </button>
);

// Expense list item
const ExpenseListItem = ({ expense, index }) => {
  const statusConfig = {
    pending: { icon: HiOutlineClock, color: 'text-yellow-400' },
    approved: { icon: HiOutlineCheckCircle, color: 'text-blue-400' },
    paid: { icon: HiOutlineCheckCircle, color: 'text-green-400' },
    rejected: { icon: HiOutlineXCircle, color: 'text-red-400' },
  };
  const StatusIcon = statusConfig[expense.status]?.icon || HiOutlineClock;
  const statusColor = statusConfig[expense.status]?.color || 'text-yellow-400';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.02, duration: 0.25 }}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      className="expense-row group"
    >
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className={`p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors`}>
          <StatusIcon size={18} className={statusColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-white group-hover:text-accent-300 transition-colors truncate">
              {expense.title}
            </h3>
            <StatusBadge status={expense.status} />
          </div>
          {expense.event?.title && (
            <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
              <HiOutlineCalendar size={12} className="text-gray-500" />
              {expense.event.title}
            </p>
          )}
          <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
            <HiOutlineClock size={12} />
            {new Date(expense.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
      <div className="text-right ml-4 flex flex-col items-end gap-1.5">
        <p className="text-lg font-bold text-white tabular-nums tracking-tight">
          ₹{expense.amount.toLocaleString()}
        </p>
        {expense.imageUrl && (
          <a
            href={expense.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium text-accent-400 hover:text-accent-300 transition-colors flex items-center gap-1 bg-accent-500/10 px-2 py-1 rounded-md border border-accent-500/20 hover:bg-accent-500/20"
          >
            <HiOutlineReceiptTax size={12} />
            Receipt
          </a>
        )}
      </div>
    </motion.div>
  );
};

// Empty state component
const EmptyState = ({ hasFilters, onClearFilters }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className="empty-state py-12"
  >
    <div className="empty-state-icon mb-5">
      <HiOutlineDocumentText size={28} className="text-gray-400" />
    </div>
    <p className="empty-state-title text-lg">No expenses found</p>
    <p className="empty-state-text max-w-xs mx-auto">
      {hasFilters
        ? "No expenses match your current filters. Try adjusting your search or status filter."
        : "You haven't submitted any expenses yet. Start tracking your spending."}
    </p>
    {hasFilters && (
      <button
        onClick={onClearFilters}
        className="mt-6 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2 mx-auto"
      >
        <HiOutlineX size={14} /> Clear all filters
      </button>
    )}
  </motion.div>
);

// Search input with clear button
const SearchInput = ({ value, onChange, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative flex-1 max-w-md">
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
        aria-label="Search expenses"
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

// ------------------------------
// Main Component
// ------------------------------

const MyExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await api.get('/expenses/my');
        setExpenses(res.data);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        !search.trim() ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.event?.title?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [expenses, search, statusFilter]);

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);
  const paidAmount = filtered.filter((e) => e.status === 'paid').reduce((s, e) => s + e.amount, 0);

  // Count for each status to show in filter pills
  const statusCounts = useMemo(() => {
    const counts = { all: expenses.length };
    expenses.forEach((e) => {
      counts[e.status] = (counts[e.status] || 0) + 1;
    });
    return counts;
  }, [expenses]);

  const statuses = ['all', 'pending', 'approved', 'paid', 'rejected'];

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all';

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
              <div className="h-8 w-24 bg-white/10 rounded animate-pulse mt-2" />
              <div className="h-3 w-16 bg-white/10 rounded animate-pulse mt-1" />
            </div>
          ))}
        </div>
        <div className="glass-card p-5">
          <SkeletonLoader count={4} />
        </div>
      </div>
    );
  }

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
            <HiOutlineCash className="text-accent-400 w-5 h-5" />
          </div>
          My Expenses
        </h1>
        <p className="text-sm text-gray-400 font-medium">
          {expenses.length} total submission{expenses.length !== 1 ? 's' : ''}
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Submitted"
          value={`₹${totalAmount.toLocaleString()}`}
          icon={HiOutlineCash}
          gradient="from-accent-500 to-neon-purple"
          index={0}
        />
        <StatCard
          label="Paid Amount"
          value={`₹${paidAmount.toLocaleString()}`}
          icon={HiOutlineCheckCircle}
          gradient="from-neon-green to-teal-400"
          index={1}
        />
        <StatCard
          label="Submissions"
          value={filtered.length}
          icon={HiOutlineDocumentText}
          gradient="from-neon-cyan to-blue-500"
          index={2}
        />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Search expenses by title or event..." />

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <HiOutlineFilter size={16} className="text-gray-500 flex-shrink-0" />
          <div className="flex gap-1.5">
            {statuses.map((status) => (
              <FilterButton
                key={status}
                status={status}
                currentFilter={statusFilter}
                onClick={setStatusFilter}
                count={statusCounts[status]}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Expenses List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="glass-card p-5 sm:p-6"
      >
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <EmptyState key="empty" hasFilters={hasActiveFilters} onClearFilters={clearFilters} />
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="divide-y divide-white/[0.06] -my-1"
            >
              {filtered.map((expense, i) => (
                <ExpenseListItem key={expense._id} expense={expense} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default MyExpenses;