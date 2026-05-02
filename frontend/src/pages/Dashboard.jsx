import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion, AnimatePresence } from 'framer-motion';
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

// ------------------------------
// Reusable Components
// ------------------------------

const StatCard = ({ label, value, icon: Icon, gradient, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="relative overflow-hidden bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/[0.04] hover:border-white/20 hover:shadow-[0_12px_30px_-8px_rgba(0,0,0,0.3)] transition-all duration-300 group flex flex-col focus-within:ring-2 focus-within:ring-accent-500/50"
    role="status"
    aria-label={`${label}: ${value}`}
  >
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
      <Icon size={20} className="text-white drop-shadow-sm" />
    </div>
    <div className="flex flex-col flex-grow justify-end">
      <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight mb-1 leading-none">
        {value}
      </span>
      <p className="text-[10px] sm:text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
        {label}
      </p>
    </div>
  </motion.div>
);

const ChartCard = ({ title, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col hover:border-white/15 transition-colors duration-300"
  >
    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
      <h2 className="text-xs sm:text-sm font-bold text-gray-300 uppercase tracking-widest">{title}</h2>
    </div>
    <div className="flex-1">{children}</div>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0B0F19]/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl">
        <p className="text-gray-300 text-xs font-semibold mb-1">{label || payload[0].name}</p>
        <p className="text-white text-sm font-bold">
          {formatter ? formatter(payload[0].value)[0] : payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const EmptyState = ({ icon: Icon, message }) => (
  <div className="flex flex-col items-center justify-center h-40 text-center w-full">
    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
      <Icon size={24} className="text-gray-500" />
    </div>
    <p className="text-gray-500 text-sm font-medium">{message}</p>
  </div>
);

const RecentEventItem = ({ event, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.5 + index * 0.05 }}
  >
    <Link
      to={`/events/${event._id}`}
      className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-accent-500/50"
      aria-label={`View event: ${event.title}`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
          <HiOutlineCalendar className="text-gray-400 group-hover:text-white transition-colors" size={20} />
        </div>
        <div className="flex flex-col min-w-0">
          <h3 className="text-sm font-semibold text-gray-200 group-hover:text-accent-300 transition-colors truncate">
            {event.title}
          </h3>
          <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
            {event.club?.name || 'General'}
          </p>
        </div>
      </div>
      <div className="ml-4 flex-shrink-0 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[11px] font-bold text-gray-400 uppercase tracking-wider group-hover:border-white/10 group-hover:text-gray-300 transition-all">
        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>
    </Link>
  </motion.div>
);

const QuickActionCard = ({ action, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.6 + index * 0.05 }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <Link
      to={action.to}
      className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-accent-500/50"
      aria-label={action.title}
    >
      <div
        className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg ${action.styles}`}
      >
        <action.icon size={22} />
      </div>
      <div className="flex flex-col min-w-0">
        <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">
          {action.title}
        </p>
        <p className="text-[11px] text-gray-500 font-medium mt-0.5">{action.sub}</p>
      </div>
    </Link>
  </motion.div>
);

// ------------------------------
// Main Dashboard Component
// ------------------------------

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    events: 0,
    clubs: 0,
    totalExpenses: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    pendingCount: 0,
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, clubsRes, expensesRes] = await Promise.all([
          api.get('/events'),
          api.get('/clubs/my'),
          api.get('/expenses/my'),
        ]);
        const expenses = expensesRes.data;
        const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
        const paidAmount = expenses.filter((e) => e.status === 'paid').reduce((s, e) => s + e.amount, 0);
        const pendingAmount = expenses
          .filter((e) => e.status === 'pending')
          .reduce((s, e) => s + e.amount, 0);
        const approvedAmount = expenses
          .filter((e) => e.status === 'approved')
          .reduce((s, e) => s + e.amount, 0);

        setRecentEvents(eventsRes.data.slice(0, 5));
        setStats({
          events: eventsRes.data.length,
          clubs: clubsRes.data.length,
          totalExpenses: expenses.length,
          totalAmount,
          paidAmount,
          pendingAmount: pendingAmount + approvedAmount,
          pendingCount: expenses.filter((e) => e.status === 'pending').length,
        });

        const paid = expenses.filter((e) => e.status === 'paid').length;
        const pending = expenses.filter((e) => e.status === 'pending' || e.status === 'approved').length;
        const rejected = expenses.filter((e) => e.status === 'rejected').length;
        setPieData(
          [
            { name: 'Paid', value: paid },
            { name: 'Pending', value: pending },
            { name: 'Rejected', value: rejected },
          ].filter((d) => d.value > 0)
        );

        const eventMap = {};
        expenses.forEach((exp) => {
          const key = exp.event?.title || 'Other';
          eventMap[key] = (eventMap[key] || 0) + exp.amount;
        });
        setBarData(
          Object.entries(eventMap)
            .map(([name, amount]) => ({
              name: name.length > 12 ? name.slice(0, 12) + '…' : name,
              amount,
            }))
            .slice(0, 8)
        );
      } catch {
        // Silently handle errors
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <SkeletonLoader type="stat" />
        <div className="mt-8">
          <SkeletonLoader count={3} />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Events',
      value: stats.events,
      icon: HiOutlineCalendar,
      gradient: 'from-accent-500 to-neon-purple',
    },
    {
      label: 'My Clubs',
      value: stats.clubs,
      icon: HiOutlineOfficeBuilding,
      gradient: 'from-neon-cyan to-blue-500',
    },
    {
      label: 'Total Expenses',
      value: `₹${stats.totalAmount.toLocaleString()}`,
      icon: HiOutlineCash,
      gradient: 'from-neon-green to-teal-400',
    },
    {
      label: 'Paid',
      value: `₹${stats.paidAmount.toLocaleString()}`,
      icon: HiOutlineCheckCircle,
      gradient: 'from-emerald-500 to-green-400',
    },
    {
      label: 'Pending',
      value: `₹${stats.pendingAmount.toLocaleString()}`,
      icon: HiOutlineClock,
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      label: 'Pending Count',
      value: stats.pendingCount,
      icon: HiOutlineTrendingUp,
      gradient: 'from-pink-500 to-rose-400',
    },
  ];

  const quickActions = [
    {
      to: '/calendar',
      icon: HiOutlineCalendar,
      styles: 'bg-accent-500/10 text-accent-400 border-accent-500/20',
      title: 'View Calendar',
      sub: 'See all upcoming events',
    },
    {
      to: '/clubs',
      icon: HiOutlineOfficeBuilding,
      styles: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      title: 'Browse Clubs',
      sub: 'Discover and join clubs',
    },
    {
      to: '/my-expenses',
      icon: HiOutlineCash,
      styles: 'bg-green-500/10 text-green-400 border-green-500/20',
      title: 'My Expenses',
      sub: 'Track your submissions',
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen text-gray-100">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-10"
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          Welcome back, {user?.name?.split(' ')[0]}{' '}
          <span className="text-2xl animate-wave origin-bottom-right" role="img" aria-label="waving hand">
            👋
          </span>
        </h1>
        <p className="text-sm sm:text-base text-gray-400 font-medium">
          Here's an overview of your recent activity and expenses.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5 mb-8">
        <AnimatePresence>
          {statCards.map((card, i) => (
            <StatCard key={card.label} {...card} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Pie Chart */}
        <ChartCard title="Expense Status" delay={0.2}>
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12">
            {pieData.length > 0 ? (
              <>
                <div className="relative w-40 h-40 flex-shrink-0 drop-shadow-2xl">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        dataKey="value"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth={2}
                        animationBegin={200}
                        animationDuration={800}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-col gap-3.5 w-full sm:w-auto">
                  {pieData.map((d, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-center justify-between sm:justify-start gap-4 p-2 sm:p-0 rounded-lg sm:rounded-none hover:bg-white/[0.02] sm:hover:bg-transparent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="text-gray-400 text-sm font-medium">{d.name}</span>
                      </div>
                      <span className="text-white text-sm font-bold tabular-nums bg-white/5 px-2 py-0.5 rounded-md">
                        {d.value}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState icon={HiOutlineCash} message="No expense data available" />
            )}
          </div>
        </ChartCard>

        {/* Bar Chart */}
        <ChartCard title="Event-wise Expenses" delay={0.3}>
          <div className="w-full mt-2" style={{ height: 220 }}>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}`}
                    dx={-10}
                  />
                  <Tooltip
                    content={
                      <CustomTooltip
                        formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                      />
                    }
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Bar
                    dataKey="amount"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                    animationBegin={300}
                    animationDuration={800}
                  >
                    {barData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={HiOutlineTrendingUp} message="No expense data available" />
            )}
          </div>
        </ChartCard>
      </div>

      {/* Bottom Row: Recent Events + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Events List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="lg:col-span-2 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col hover:border-white/15 transition-colors duration-300"
        >
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <h2 className="text-xs sm:text-sm font-bold text-gray-300 uppercase tracking-widest">
              Recent Events
            </h2>
            <Link
              to="/calendar"
              className="text-accent-400 hover:text-accent-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors group focus:outline-none focus:ring-2 focus:ring-accent-500/50 rounded-md px-2 py-1 -mr-2"
              aria-label="View all events"
            >
              View All{' '}
              <HiOutlineArrowRight
                size={14}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </div>

          {recentEvents.length === 0 ? (
            <EmptyState icon={HiOutlineCalendar} message="No events scheduled yet" />
          ) : (
            <div className="flex flex-col gap-2.5">
              {recentEvents.map((event, i) => (
                <RecentEventItem key={event._id} event={event} index={i} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col hover:border-white/15 transition-colors duration-300"
        >
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <h2 className="text-xs sm:text-sm font-bold text-gray-300 uppercase tracking-widest">
              Quick Actions
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {quickActions.map((action, i) => (
              <QuickActionCard key={action.to} action={action} index={i} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;