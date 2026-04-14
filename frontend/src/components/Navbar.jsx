import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineLogout,
  HiOutlineMenuAlt3,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineCash,
  HiOutlineCheck,
} from 'react-icons/hi';

const notifIcon = {
  expense_approved: HiOutlineCheckCircle,
  expense_rejected: HiOutlineXCircle,
  payment_completed: HiOutlineCash,
};

const notifColor = {
  expense_approved: 'text-emerald-400',
  expense_rejected: 'text-red-400',
  payment_completed: 'text-blue-400',
};

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications() || {};
  const [showNotifs, setShowNotifs] = useState(false);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBellClick = () => {
    if (!showNotifs) refresh?.();
    setShowNotifs((prev) => !prev);
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <nav className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="md:hidden text-gray-300 hover:text-white transition-colors"
        >
          <HiOutlineMenuAlt3 size={24} />
        </button>
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-neon-purple flex items-center justify-center text-white font-bold text-sm shadow-glow-purple group-hover:scale-110 transition-transform">
            ET
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-white to-accent-200 bg-clip-text text-transparent hidden sm:inline">
            EventTracker
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div ref={panelRef} className="relative">
          <button
            onClick={handleBellClick}
            className="relative p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-accent-400 hover:bg-accent-500/10 hover:border-accent-500/20 transition-all duration-300"
            title="Notifications"
          >
            <HiOutlineBell size={18} />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-[10px] font-bold text-white flex items-center justify-center px-1"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </button>

          {/* Notification Dropdown */}
          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-card p-0 overflow-hidden z-[100] notif-panel"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <h3 className="text-sm font-bold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead?.()}
                      className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 transition-colors"
                    >
                      <HiOutlineCheck size={14} />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                  {(!notifications || notifications.length === 0) ? (
                    <div className="p-6 text-center">
                      <HiOutlineBell size={32} className="text-gray-700 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.slice(0, 20).map((notif) => {
                      const Icon = notifIcon[notif.type] || HiOutlineBell;
                      const color = notifColor[notif.type] || 'text-gray-400';
                      return (
                        <button
                          key={notif._id}
                          onClick={() => !notif.read && markAsRead?.(notif._id)}
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${
                            notif.read ? 'opacity-60' : ''
                          }`}
                        >
                          <div className={`mt-0.5 ${color}`}>
                            <Icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200 leading-snug">{notif.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{timeAgo(notif.createdAt)}</p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-accent-400 mt-2 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500/20 transition-all duration-300"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
        </button>

        {/* User Info */}
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-neon-purple flex items-center justify-center text-white font-semibold text-xs">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-white font-medium text-sm">{user?.name}</span>
            <span className="text-gray-400 text-xs capitalize">{user?.role}</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300"
          title="Logout"
        >
          <HiOutlineLogout size={18} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
