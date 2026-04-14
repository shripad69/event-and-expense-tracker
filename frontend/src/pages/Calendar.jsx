import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCalendar,
  HiOutlinePlus,
  HiOutlineX,
} from 'react-icons/hi';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EVENT_DOT_COLORS = [
  'bg-accent-400', 'bg-neon-purple', 'bg-neon-cyan', 'bg-neon-pink', 'bg-neon-green',
];

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        setEvents(res.data);
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => { setCurrentDate(new Date()); setSelectedDate(null); };

  const getEventsForDate = (day) => {
    return events.filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year;
    });
  };

  const today = new Date();
  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Build calendar grid
  const calendarDays = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true });
  }
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false });
  }

  // Count events this month
  const monthEventCount = events.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  }).length;

  if (loading) return (
    <div className="page-container">
      <SkeletonLoader type="stat" />
      <div className="mt-8"><SkeletonLoader count={3} /></div>
    </div>
  );

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 flex-wrap gap-4"
      >
        <div>
          <h1 className="page-title mb-1">
            <HiOutlineCalendar className="inline text-accent-400 mr-2" /> Calendar
          </h1>
          <p className="text-sm text-gray-500">
            {monthEventCount} event{monthEventCount !== 1 ? 's' : ''} this month
          </p>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 glass-card p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white">
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={goToToday}
                className="text-[11px] font-semibold px-3 py-1 rounded-lg bg-accent-500/12 text-accent-300 border border-accent-500/20 hover:bg-accent-500/20 transition-all"
              >
                Today
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-2 rounded-xl bg-white/[0.04] border border-white/6 text-gray-400 hover:text-white hover:bg-white/8 transition-all">
                <HiOutlineChevronLeft size={16} />
              </button>
              <button onClick={nextMonth} className="p-2 rounded-xl bg-white/[0.04] border border-white/6 text-gray-400 hover:text-white hover:bg-white/8 transition-all">
                <HiOutlineChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, i) => {
              const dayEvents = cell.isCurrentMonth ? getEventsForDate(cell.day) : [];
              const hasEvents = dayEvents.length > 0;
              const isSelected = selectedDate === cell.day && cell.isCurrentMonth;
              const isTodayCell = cell.isCurrentMonth && isToday(cell.day);

              return (
                <motion.button
                  key={i}
                  whileHover={cell.isCurrentMonth ? { scale: 1.05 } : {}}
                  whileTap={cell.isCurrentMonth ? { scale: 0.95 } : {}}
                  onClick={() => cell.isCurrentMonth && setSelectedDate(cell.day === selectedDate ? null : cell.day)}
                  className={`calendar-cell
                    ${!cell.isCurrentMonth ? 'text-gray-700/50 cursor-default !bg-transparent' : 'text-gray-300'}
                    ${isSelected ? 'calendar-selected text-white font-bold' : ''}
                    ${isTodayCell && !isSelected ? 'calendar-today text-accent-300 font-bold' : ''}
                  `}
                >
                  <span className="text-[13px]">{cell.day}</span>
                  {hasEvents && (
                    <div className="flex gap-0.5 mt-0.5 absolute bottom-1.5">
                      {dayEvents.slice(0, 3).map((_, idx) => (
                        <div
                          key={idx}
                          className={`calendar-dot ${EVENT_DOT_COLORS[idx % EVENT_DOT_COLORS.length]}`}
                        />
                      ))}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Side Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate || 'empty'}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-80 xl:w-96"
          >
            <div className="glass-card p-6 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {selectedDate
                    ? `${MONTHS[month]} ${selectedDate}`
                    : 'Events'}
                </h3>
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <HiOutlineX size={14} />
                  </button>
                )}
              </div>

              {selectedDate ? (
                selectedEvents.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedEvents.map((event, i) => (
                      <motion.div
                        key={event._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Link
                          to={`/events/${event._id}`}
                          className="block p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-accent-500/20 transition-all duration-200 group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-accent-400 mt-1.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-white group-hover:text-accent-300 transition-colors">
                                {event.title}
                              </h4>
                              {event.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                              )}
                              <span className="inline-block text-[10px] font-medium text-gray-400 bg-white/5 px-2 py-0.5 rounded mt-2">
                                {event.club?.name}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state py-12">
                    <div className="empty-state-icon">
                      <HiOutlineCalendar size={24} className="text-accent-400" />
                    </div>
                    <p className="empty-state-title text-sm">No events</p>
                    <p className="empty-state-text text-xs">No events scheduled for this day</p>
                  </div>
                )
              ) : (
                <div className="empty-state py-12">
                  <div className="empty-state-icon">
                    <HiOutlineCalendar size={24} className="text-gray-500" />
                  </div>
                  <p className="empty-state-title text-sm">Select a date</p>
                  <p className="empty-state-text text-xs">Click any date to view its events</p>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Calendar;
