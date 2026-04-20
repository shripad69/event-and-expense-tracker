import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineHome,
  HiOutlineCalendar,
  HiOutlineCash,
  HiOutlineUserGroup,
  HiOutlineClipboardList,
  HiOutlineX,
  HiOutlineOfficeBuilding,
  HiOutlineLibrary,
} from 'react-icons/hi';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/', icon: HiOutlineHome, label: 'Dashboard' },
    { to: '/calendar', icon: HiOutlineCalendar, label: 'Calendar' },
    { to: '/clubs', icon: HiOutlineOfficeBuilding, label: 'Clubs' },
    { to: '/my-expenses', icon: HiOutlineCash, label: 'My Expenses' },
    { to: '/join-requests', icon: HiOutlineUserGroup, label: 'Requests' },
  ];

  if (user?.role === 'manager') {
    links.push({ to: '/manager', icon: HiOutlineClipboardList, label: 'Manager' });
  }

  // Helper to determine if link is active
  const isActivePath = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-[#050510]/60 z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-auto h-[100dvh] w-[260px] flex flex-col transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] bg-[#0B0F19]/95 backdrop-blur-3xl border-r border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.2)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-5 md:hidden border-b border-white/5 mb-2">
          <span className="text-sm font-bold text-white tracking-wide">Menu</span>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <HiOutlineX size={18} />
          </button>
        </div>

        {/* Section Title */}
        <div className="hidden md:block px-6 pt-6 pb-2">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            Main Menu
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5 px-3 flex-1 overflow-y-auto custom-scrollbar mt-2 md:mt-0">
          {links.map((link, i) => {
            const active = isActivePath(link.to);

            return (
              <motion.div
                key={link.to}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
                className="relative"
              >
                {/* Magic Animated Active Indicator */}
                {active && (
                  <motion.div
                    layoutId="active-sidebar-tab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-accent-400 rounded-r-full shadow-[0_0_12px_rgba(139,92,246,0.6)] z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <NavLink 
                  to={link.to} 
                  onClick={onClose}
                  className={`relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden ${
                    active
                      ? 'text-white bg-gradient-to-r from-accent-500/10 to-transparent border border-accent-500/10'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <link.icon 
                    size={20} 
                    className={`flex-shrink-0 transition-all duration-300 ${
                      active 
                        ? 'text-accent-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]' 
                        : 'group-hover:text-gray-300 group-hover:translate-x-0.5'
                    }`} 
                  />
                  <span className="truncate tracking-wide">{link.label}</span>
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        {/* Bottom College/Context Widget */}
        <div className="p-4 mt-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.04] to-black/20 border border-white/5 p-4 group hover:border-white/10 transition-colors">
            {/* Soft decorative glow behind the widget */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent-500/10 rounded-full blur-2xl group-hover:bg-accent-500/20 transition-all" />
            
            <div className="relative z-10 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white/[0.05] border border-white/5 text-gray-400 mt-0.5">
                <HiOutlineLibrary size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">
                  Organization
                </p>
                <p className="text-sm font-semibold text-gray-200 truncate group-hover:text-white transition-colors">
                  {user?.college || 'Not Assigned'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;