import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import EventDetails from './pages/EventDetails';
import AddExpense from './pages/AddExpense';
import ManagerPanel from './pages/ManagerPanel';
import JoinRequests from './pages/JoinRequests';
import Clubs from './pages/Clubs';
import MyExpenses from './pages/MyExpenses';
import PaymentSuccess from './pages/PaymentSuccess';

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

const App = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><PageTransition><Calendar /></PageTransition></ProtectedRoute>} />
              <Route path="/events/:id" element={<ProtectedRoute><PageTransition><EventDetails /></PageTransition></ProtectedRoute>} />
              <Route path="/add-expense/:eventId" element={<ProtectedRoute><PageTransition><AddExpense /></PageTransition></ProtectedRoute>} />
              <Route path="/clubs" element={<ProtectedRoute><PageTransition><Clubs /></PageTransition></ProtectedRoute>} />
              <Route path="/my-expenses" element={<ProtectedRoute><PageTransition><MyExpenses /></PageTransition></ProtectedRoute>} />
              <Route path="/join-requests" element={<ProtectedRoute><PageTransition><JoinRequests /></PageTransition></ProtectedRoute>} />
              <Route path="/manager" element={<ProtectedRoute><PageTransition><ManagerPanel /></PageTransition></ProtectedRoute>} />
              <Route path="/payment-success" element={<ProtectedRoute><PageTransition><PaymentSuccess /></PageTransition></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;