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
  expense_approved: 'text-emerald-400 bg-emerald-400/10',
  expense_rejected: 'text-red-400 bg-red-400/10',
  payment_completed: 'text-blue-400 bg-blue-400/10',
};

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications() || {};
  const [showNotifs, setShowNotifs] = useState(false);
  const panelRef = useRef(null);

  // Close notifications on outside click
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
    <nav className="sticky top-0 z-50 w-full bg-[#0B0F19]/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between transition-all">
      {/* Left Section: Mobile Menu & Logo */}
      <div className="flex items-center gap-4 sm:gap-6">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <HiOutlineMenuAlt3 size={24} />
        </button>
        
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-neon-purple flex items-center justify-center text-white font-bold text-sm shadow-[0_0_15px_rgba(139,92,246,0.3)] group-hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] group-hover:scale-105 transition-all duration-300">
            ET
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white via-gray-100 to-accent-200 bg-clip-text text-transparent hidden sm:block tracking-wide">
            EventTracker
          </span>
        </Link>
      </div>

      {/* Right Section: Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* Actions Group */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div ref={panelRef} className="relative">
            <button
              onClick={handleBellClick}
              className={`relative p-2.5 rounded-xl border transition-all duration-300 ${
                showNotifs 
                  ? 'bg-accent-500/10 border-accent-500/30 text-accent-400' 
                  : 'bg-white/[0.03] border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.08]'
              }`}
              title="Notifications"
            >
              <HiOutlineBell size={20} />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-[10px] font-bold text-white flex items-center justify-center px-1 shadow-lg shadow-red-500/30 border border-[#0B0F19]"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 top-[calc(100%+0.75rem)] w-[320px] sm:w-[380px] bg-[#121827]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[100]"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
                    <h3 className="text-sm font-semibold text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllAsRead?.()}
                        className="flex items-center gap-1.5 text-xs font-medium text-accent-400 hover:text-accent-300 transition-colors bg-accent-500/10 hover:bg-accent-500/20 px-2.5 py-1 rounded-md"
                      >
                        <HiOutlineCheck size={14} />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                    {(!notifications || notifications.length === 0) ? (
                      <div className="px-6 py-12 text-center flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                          <HiOutlineBell size={24} className="text-gray-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-300">All caught up!</p>
                        <p className="text-xs text-gray-500 mt-1">No new notifications to show.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {notifications.slice(0, 20).map((notif) => {
                          const Icon = notifIcon[notif.type] || HiOutlineBell;
                          const colorClasses = notifColor[notif.type] || 'text-gray-400 bg-gray-400/10';
                          return (
                            <button
                              key={notif._id}
                              onClick={() => !notif.read && markAsRead?.(notif._id)}
                              className={`w-full text-left px-5 py-4 flex items-start gap-4 transition-all duration-200 hover:bg-white/[0.04] ${
                                notif.read ? 'opacity-60' : 'bg-white/[0.02]'
                              }`}
                            >
                              <div className={`p-2 rounded-lg flex-shrink-0 ${colorClasses}`}>
                                <Icon size={18} />
                              </div>
                              <div className="flex-1 min-w-0 pt-0.5">
                                <p className={`text-sm leading-snug ${notif.read ? 'text-gray-400' : 'text-gray-200 font-medium'}`}>
                                  {notif.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-2">
                                  {timeAgo(notif.createdAt)}
                                  {!notif.read && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent-400 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                                  )}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Optional Footer for view all */}
                  {notifications?.length > 0 && (
                    <div className="p-3 border-t border-white/10 bg-white/[0.02] text-center">
                      <Link to="/notifications" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">
                        View all notifications
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500/20 transition-all duration-300"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <HiOutlineSun size={20} /> : <HiOutlineMoon size={20} />}
          </button>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-white/10 mx-1"></div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-4 pl-1">
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-600 to-neon-purple p-[2px]">
              <div className="w-full h-full rounded-full bg-[#0B0F19] flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-200 font-semibold text-sm leading-tight">{user?.name}</span>
              <span className="text-accent-400/80 text-[11px] font-medium uppercase tracking-wider">{user?.role}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300 group"
            title="Logout"
          >
            <HiOutlineLogout size={20} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;