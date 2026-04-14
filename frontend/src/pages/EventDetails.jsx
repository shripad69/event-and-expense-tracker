import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineCash,
  HiOutlinePlus,
  HiOutlineArrowLeft,
} from 'react-icons/hi';

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
  }, [id]);

  if (loading) return <Loader />;
  if (!event) return null;

  const statusColor = {
    pending: 'badge-pending', approved: 'badge-approved', paid: 'badge-paid', rejected: 'badge-rejected',
  };

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const paidCount = expenses.filter(e => e.status === 'paid').length;

  return (
    <div className="page-container">
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-xs font-semibold mb-6 transition-colors uppercase tracking-wider"
      >
        <HiOutlineArrowLeft size={14} /> Back
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 md:p-8 mb-6"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-neon-purple flex items-center justify-center shadow-lg flex-shrink-0">
              <HiOutlineCalendar size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-white mb-1">{event.title}</h1>
              {event.description && <p className="text-sm text-gray-400 max-w-xl">{event.description}</p>}
            </div>
          </div>
          <Link to={`/add-expense/${event._id}`} className="btn-primary flex items-center gap-2 self-start whitespace-nowrap text-sm">
            <HiOutlinePlus size={16} /> Add Expense
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/[0.04]">
          {[
            { icon: HiOutlineCalendar, label: 'Date', value: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), color: 'accent' },
            { icon: HiOutlineUserGroup, label: 'Club', value: event.club?.name, color: 'neon-cyan' },
            { icon: HiOutlineCash, label: 'Total', value: `₹${totalAmount.toLocaleString()}`, color: 'neon-green' },
            { icon: HiOutlineCash, label: 'Paid', value: `${paidCount}/${expenses.length}`, color: 'neon-blue' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg bg-${item.color}-500/15 flex items-center justify-center`}>
                <item.icon size={14} className={`text-${item.color}-400`} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{item.label}</p>
                <p className="text-sm font-bold text-white">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Expenses List */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5">
          Expenses ({expenses.length})
        </h2>
        {expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <HiOutlineCash size={24} className="text-gray-500" />
            </div>
            <p className="empty-state-title">No expenses yet</p>
            <p className="empty-state-text">Be the first to submit an expense for this event</p>
            <Link to={`/add-expense/${event._id}`} className="btn-primary text-xs flex items-center gap-1.5">
              <HiOutlinePlus size={14} /> Add Expense
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense, i) => (
              <motion.div
                key={expense._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className="expense-row"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-sm font-semibold text-white">{expense.title}</h3>
                    <span className={statusColor[expense.status]}>{expense.status}</span>
                  </div>
                  {expense.description && <p className="text-xs text-gray-500 mt-1 truncate">{expense.description}</p>}
                  <p className="text-[11px] text-gray-600 mt-0.5">By {expense.user?.name}</p>
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
      </motion.div>
    </div>
  );
};

export default EventDetails;
