import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  HiOutlineCalendar,
  HiOutlineCash,
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineTrendingUp,
} from 'react-icons/hi';

const CHART_COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#ec4899', '#f59e0b'];
const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    events: 0, clubs: 0, totalExpenses: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0, pendingCount: 0,
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, clubsRes, expensesRes] = await Promise.all([
          api.get('/events'), api.get('/clubs/my'), api.get('/expenses/my'),
        ]);
        const expenses = expensesRes.data;
        const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
        const paidAmount = expenses.filter((e) => e.status === 'paid').reduce((s, e) => s + e.amount, 0);
        const pendingAmount = expenses.filter((e) => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
        const approvedAmount = expenses.filter((e) => e.status === 'approved').reduce((s, e) => s + e.amount, 0);

        setRecentEvents(eventsRes.data.slice(0, 5));
        setStats({
          events: eventsRes.data.length, clubs: clubsRes.data.length, totalExpenses: expenses.length,
          totalAmount, paidAmount, pendingAmount: pendingAmount + approvedAmount,
          pendingCount: expenses.filter((e) => e.status === 'pending').length,
        });

        const paid = expenses.filter((e) => e.status === 'paid').length;
        const pending = expenses.filter((e) => e.status === 'pending' || e.status === 'approved').length;
        const rejected = expenses.filter((e) => e.status === 'rejected').length;
        setPieData([
          { name: 'Paid', value: paid }, { name: 'Pending', value: pending }, { name: 'Rejected', value: rejected },
        ].filter(d => d.value > 0));

        const eventMap = {};
        expenses.forEach((exp) => {
          const key = exp.event?.title || 'Other';
          eventMap[key] = (eventMap[key] || 0) + exp.amount;
        });
        setBarData(
          Object.entries(eventMap)
            .map(([name, amount]) => ({ name: name.length > 12 ? name.slice(0, 12) + '…' : name, amount }))
            .slice(0, 8)
        );
      } catch { /* Silently handle */ } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="page-container">
      <SkeletonLoader type="stat" />
      <div className="mt-8"><SkeletonLoader count={3} /></div>
    </div>
  );

  const statCards = [
    { label: 'Total Events', value: stats.events, icon: HiOutlineCalendar, gradient: 'from-accent-500 to-neon-purple' },
    { label: 'My Clubs', value: stats.clubs, icon: HiOutlineOfficeBuilding, gradient: 'from-neon-cyan to-neon-blue' },
    { label: 'Total Expenses', value: `₹${stats.totalAmount.toLocaleString()}`, icon: HiOutlineCash, gradient: 'from-neon-green to-teal-400' },
    { label: 'Paid', value: `₹${stats.paidAmount.toLocaleString()}`, icon: HiOutlineCheckCircle, gradient: 'from-emerald-500 to-green-400' },
    { label: 'Pending', value: `₹${stats.pendingAmount.toLocaleString()}`, icon: HiOutlineClock, gradient: 'from-yellow-500 to-orange-500' },
    { label: 'Pending Count', value: stats.pendingCount, icon: HiOutlineTrendingUp, gradient: 'from-pink-500 to-rose-400' },
  ];

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="page-title mb-1">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-gray-500">Here's an overview of your activity</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {statCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="stat-card group"
          >
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
              <card.icon size={18} className="text-white" />
            </div>
            <span className="text-xl font-extrabold text-white tabular-nums mt-1">{card.value}</span>
            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="glass-card p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Status Breakdown</h2>
          {pieData.length > 0 ? (
            <div className="flex items-center justify-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(10,10,30,0.92)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#e0e7ff', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2.5">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-gray-400 text-xs">{d.name}</span>
                    <span className="text-white text-xs font-bold ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state py-10">
              <p className="text-gray-500 text-sm">No expense data yet</p>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Event-wise Expenses</h2>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(10,10,30,0.92)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#e0e7ff', fontSize: '12px' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state py-10">
              <p className="text-gray-500 text-sm">No expense data yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Events + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Events</h2>
            <Link to="/calendar" className="text-accent-400 hover:text-accent-300 text-xs font-semibold flex items-center gap-1 transition-colors">
              View All <HiOutlineArrowRight size={12} />
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-state-icon">
                <HiOutlineCalendar size={20} className="text-gray-500" />
              </div>
              <p className="empty-state-text text-xs">No events yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentEvents.map((event, i) => (
                <motion.div key={event._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.04 }}>
                  <Link
                    to={`/events/${event._id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/8 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-400" />
                      <div>
                        <h3 className="text-sm font-medium text-white group-hover:text-accent-300 transition-colors">{event.title}</h3>
                        <p className="text-[11px] text-gray-500">{event.club?.name}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium tabular-nums">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Quick Actions</h2>
          <div className="space-y-2.5">
            {[
              { to: '/calendar', icon: HiOutlineCalendar, color: 'accent', title: 'View Calendar', sub: 'See all upcoming events' },
              { to: '/clubs', icon: HiOutlineOfficeBuilding, color: 'neon-cyan', title: 'Browse Clubs', sub: 'Discover and join clubs' },
              { to: '/my-expenses', icon: HiOutlineCash, color: 'neon-green', title: 'My Expenses', sub: 'Track your submissions' },
            ].map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/8 transition-all duration-200 group"
              >
                <div className={`w-9 h-9 rounded-lg bg-${action.color}-500/15 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon size={18} className={`text-${action.color}-400`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{action.title}</p>
                  <p className="text-[11px] text-gray-500">{action.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
