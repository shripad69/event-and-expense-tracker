import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCalendar,
  HiOutlineX,
  HiOutlineSparkles,
} from 'react-icons/hi';

// Constants
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const EVENT_DOT_COLORS = [
  'bg-blue-400', 'bg-purple-400', 'bg-emerald-400', 'bg-pink-400', 'bg-amber-400',
];

// ------------------------------
// Reusable Components
// ------------------------------

// Day cell with event indicators
const DayCell = ({ day, isCurrentMonth, isToday, isSelected, hasEvents, eventCount, onClick, eventsPreview }) => (
  <motion.button
    whileHover={isCurrentMonth ? { y: -2, transition: { duration: 0.15 } } : {}}
    whileTap={isCurrentMonth ? { scale: 0.95 } : {}}
    onClick={() => isCurrentMonth && onClick(day)}
    disabled={!isCurrentMonth}
    className={`
      relative aspect-square flex flex-col items-center justify-center rounded-2xl transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-[#0B0F19]
      ${!isCurrentMonth ? 'text-gray-700/40 cursor-not-allowed bg-transparent' : 'text-gray-300 hover:bg-white/[0.06]'}
      ${isSelected ? 'bg-blue-500/20 border border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border border-transparent'}
      ${isToday && !isSelected ? 'bg-white/[0.08] text-blue-400 font-bold border-white/20' : ''}
    `}
    aria-label={`${day} ${MONTHS[new Date().getMonth()]} ${isCurrentMonth ? '' : '(not in current month)'}`}
    aria-selected={isSelected}
  >
    <span className={`text-sm ${isToday || isSelected ? 'font-bold' : 'font-medium'}`}>
      {day}
    </span>

    {/* Event dots with count badge on hover */}
    {hasEvents && (
      <div className="absolute bottom-2 flex items-center gap-0.5">
        {eventsPreview.slice(0, 3).map((_, idx) => (
          <div
            key={idx}
            className={`w-1.5 h-1.5 rounded-full ${EVENT_DOT_COLORS[idx % EVENT_DOT_COLORS.length]} shadow-sm`}
          />
        ))}
        {eventCount > 3 && (
          <span className="text-[9px] font-bold text-gray-400 ml-0.5">+{eventCount - 3}</span>
        )}
      </div>
    )}

    {/* Tooltip on hover for desktop */}
    {hasEvents && (
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block">
        <div className="bg-gray-900/90 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md shadow-xl border border-white/10 whitespace-nowrap">
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </div>
      </div>
    )}
  </motion.button>
);

// Calendar grid header (day names)
const CalendarHeader = () => (
  <div className="grid grid-cols-7 gap-2 mb-4">
    {DAYS.map((day) => (
      <div
        key={day}
        className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest pb-2 border-b border-white/10"
      >
        {day}
      </div>
    ))}
  </div>
);

// Main calendar grid
const CalendarGrid = ({ days, getEventsForDate, month, year, selectedDate, setSelectedDate, todayCheck }) => (
  <div className="grid grid-cols-7 gap-2">
    {days.map((cell, i) => {
      const dayEvents = cell.isCurrentMonth ? getEventsForDate(cell.day) : [];
      const hasEvents = dayEvents.length > 0;
      const isSelected = selectedDate === cell.day && cell.isCurrentMonth;
      const isTodayCell = cell.isCurrentMonth && todayCheck(cell.day);

      return (
        <DayCell
          key={i}
          day={cell.day}
          isCurrentMonth={cell.isCurrentMonth}
          isToday={isTodayCell}
          isSelected={isSelected}
          hasEvents={hasEvents}
          eventCount={dayEvents.length}
          eventsPreview={dayEvents}
          onClick={(day) => setSelectedDate(day === selectedDate ? null : day)}
        />
      );
    })}
  </div>
);

// Event item in side panel
const EventListItem = ({ event, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, duration: 0.3 }}
  >
    <Link
      to={`/events/${event._id}`}
      className="block p-4 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.06] transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
            EVENT_DOT_COLORS[index % EVENT_DOT_COLORS.length]
          }`}
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
            {event.title}
          </h4>
          {event.description && (
            <p className="text-sm text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          )}
          {event.club?.name && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide text-gray-300 bg-white/10 mt-3">
              {event.club.name}
            </span>
          )}
        </div>
      </div>
    </Link>
  </motion.div>
);

// Empty state for no events
const EmptyState = ({ selectedDate }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
      <HiOutlineCalendar size={32} className="text-gray-500" />
    </div>
    <p className="text-white font-medium mb-1">
      {selectedDate ? 'No events scheduled' : 'Select a date'}
    </p>
    <p className="text-sm text-gray-500 max-w-[200px]">
      {selectedDate
        ? 'Take a break! Nothing planned for this day.'
        : 'Click any highlighted date to view event details.'}
    </p>
  </div>
);

// Side panel component
const SidePanel = ({ selectedDate, month, year, events, onClose }) => {
  // If no date selected, show upcoming events preview (next 3 events)
  const upcomingEvents = useMemo(() => {
    if (selectedDate) return [];
    const now = new Date();
    return events
      .filter((e) => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
  }, [events, selectedDate]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedDate || 'overview'}
        initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full lg:w-[400px]"
      >
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl sticky top-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HiOutlineCalendar className="text-blue-400" />
              {selectedDate
                ? `${MONTHS[month]} ${selectedDate}, ${year}`
                : 'Upcoming Events'}
            </h3>
            {selectedDate && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                aria-label="Close date details"
              >
                <HiOutlineX size={18} />
              </button>
            )}
          </div>

          {/* Content */}
          {selectedDate ? (
            events.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {events.map((event, i) => (
                  <EventListItem key={event._id || i} event={event} index={i} />
                ))}
              </div>
            ) : (
              <EmptyState selectedDate />
            )
          ) : upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
                Next on your schedule
              </p>
              {upcomingEvents.map((event, i) => (
                <EventListItem key={event._id || i} event={event} index={i} />
              ))}
              <Link
                to="/calendar"
                className="block text-center text-xs text-blue-400 hover:text-blue-300 font-medium mt-4 transition-colors"
              >
                View all events →
              </Link>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ------------------------------
// Main Calendar Component
// ------------------------------

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        setEvents(res.data);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(today.getDate());
  };

  const getEventsForDate = (day) => {
    return events.filter((e) => {
      const eventDate = new Date(e.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      );
    });
  };

  const isToday = (day) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const calendarDays = useMemo(() => {
    const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);

    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isCurrentMonth: false });
    }
    return days;
  }, [year, month]);

  const monthEventCount = useMemo(() => {
    return events.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    }).length;
  }, [events, month, year]);

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <SkeletonLoader type="stat" />
        <div className="mt-8">
          <SkeletonLoader count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen text-gray-100">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center text-white mb-2">
            <div className="bg-blue-500/10 p-2 rounded-xl mr-3 border border-blue-500/20">
              <HiOutlineCalendar className="text-blue-400 w-6 h-6" />
            </div>
            Calendar
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            {monthEventCount} event{monthEventCount !== 1 ? 's' : ''} scheduled for{' '}
            {MONTHS[month]} {year}
          </p>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Main Calendar Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex-1 w-full bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl"
        >
          {/* Controls */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {MONTHS[month]}{' '}
              <span className="text-gray-400 font-medium text-xl">{year}</span>
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={goToToday}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                Today
              </button>
              <div className="flex items-center gap-1 bg-white/[0.05] rounded-xl p-1 border border-white/10">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  aria-label="Previous month"
                >
                  <HiOutlineChevronLeft size={20} />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  aria-label="Next month"
                >
                  <HiOutlineChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          <CalendarHeader />
          <CalendarGrid
            days={calendarDays}
            getEventsForDate={getEventsForDate}
            month={month}
            year={year}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            todayCheck={isToday}
          />
        </motion.div>

        {/* Side Panel */}
        <SidePanel
          selectedDate={selectedDate}
          month={month}
          year={year}
          events={selectedEvents}
          onClose={() => setSelectedDate(null)}
        />
      </div>
    </div>
  );
};

export default Calendar;