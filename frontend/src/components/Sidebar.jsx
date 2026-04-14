import { NavLink } from 'react-router-dom';
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
} from 'react-icons/hi';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

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

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
      isActive
        ? 'bg-accent-500/12 text-white border border-accent-500/20'
        : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
    }`;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-auto h-screen w-56 p-4 flex flex-col gap-1 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          background: 'rgba(5, 5, 16, 0.5)',
          borderRight: '1px solid rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between mb-4 md:hidden">
          <span className="text-sm font-bold text-white">Menu</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <HiOutlineX size={20} />
          </button>
        </div>

        <div className="hidden md:block mb-4">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3.5">Navigation</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {links.map((link, i) => (
            <motion.div
              key={link.to}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <NavLink to={link.to} className={navLinkClass} onClick={onClose}>
                <link.icon size={18} className="group-hover:scale-110 transition-transform duration-200 flex-shrink-0" />
                <span className="truncate">{link.label}</span>
              </NavLink>
            </motion.div>
          ))}
        </nav>

        <div className="mt-auto pt-3 border-t border-white/[0.04]">
          <div className="bg-white/[0.03] rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">College</p>
            <p className="text-xs font-medium text-gray-300 truncate mt-0.5">{user?.college}</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
