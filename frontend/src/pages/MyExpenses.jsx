import { useState, useEffect } from 'react';
import api from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion } from 'framer-motion';
import { HiOutlineCash, HiOutlineSearch, HiOutlineCalendar } from 'react-icons/hi';

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
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    fetchExpenses();
  }, []);

  const statusColor = {
    pending: 'badge-pending', approved: 'badge-approved', paid: 'badge-paid', rejected: 'badge-rejected',
  };

  if (loading) return (
    <div className="page-container">
      <SkeletonLoader type="stat" />
      <div className="mt-6"><SkeletonLoader count={4} /></div>
    </div>
  );

  const filtered = expenses.filter((e) => {
    const matchSearch = !search.trim() || e.title.toLowerCase().includes(search.toLowerCase()) || e.event?.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);
  const paidAmount = filtered.filter((e) => e.status === 'paid').reduce((s, e) => s + e.amount, 0);

  const statuses = ['all', 'pending', 'approved', 'paid', 'rejected'];

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title mb-1">
          <HiOutlineCash className="inline text-accent-400 mr-2" /> My Expenses
        </h1>
        <p className="text-sm text-gray-500 mb-8">{expenses.length} total submissions</p>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Submitted', value: `₹${totalAmount.toLocaleString()}`, gradient: 'from-accent-500 to-neon-purple' },
          { label: 'Paid', value: `₹${paidAmount.toLocaleString()}`, gradient: 'from-neon-green to-teal-400' },
          { label: 'Count', value: filtered.length, gradient: 'from-neon-cyan to-neon-blue' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="stat-card">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
              <HiOutlineCash size={16} className="text-white" />
            </div>
            <p className="text-xl font-extrabold text-white tabular-nums mt-1">{s.value}</p>
            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter Row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-glass pl-10 text-sm" placeholder="Search expenses…" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 ${
                statusFilter === s
                  ? 'bg-accent-500/15 text-accent-300 border border-accent-500/25'
                  : 'bg-white/[0.04] text-gray-400 border border-white/[0.04] hover:bg-white/[0.06]'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Expenses */}
      <div className="glass-card p-5">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <HiOutlineCash size={24} className="text-gray-500" />
            </div>
            <p className="empty-state-title">No expenses found</p>
            <p className="empty-state-text">
              {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Submit your first expense to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((expense, i) => (
              <motion.div
                key={expense._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.03 }}
                className="expense-row"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-sm font-semibold text-white">{expense.title}</h3>
                    <span className={statusColor[expense.status]}>{expense.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{expense.event?.title}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5 flex items-center gap-1.5">
                    <HiOutlineCalendar size={12} />
                    {new Date(expense.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right ml-4 flex flex-col items-end gap-1">
                  <p className="text-base font-bold text-white tabular-nums">₹{expense.amount.toLocaleString()}</p>
                  {expense.imageUrl && (
                    <a href={expense.imageUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent-400 hover:text-accent-300 font-medium transition-colors">
                      Receipt
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyExpenses;
