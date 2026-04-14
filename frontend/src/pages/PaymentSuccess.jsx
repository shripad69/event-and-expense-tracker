import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing | success | error

  useEffect(() => {
    const verify = async () => {
      const expenseId = searchParams.get('expenseId');
      const sessionId = searchParams.get('session_id');
      if (!expenseId) {
        setStatus('error');
        return;
      }
      try {
        await api.post('/payments/verify', {
          expenseId,
          paymentId: sessionId || `stripe_${Date.now()}`,
        });
        setStatus('success');
        toast.success('Payment completed!');
        setTimeout(() => navigate('/manager'), 2500);
      } catch {
        setStatus('error');
        toast.error('Payment verification failed');
        setTimeout(() => navigate('/manager'), 3000);
      }
    };
    verify();
  }, []);

  return (
    <div className="page-container flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card p-10 text-center max-w-md w-full"
      >
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-accent-500 border-r-neon-purple animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white">Verifying Payment…</h2>
            <p className="text-gray-400 text-sm mt-2">Please wait while we confirm your payment</p>
          </>
        )}
        {status === 'success' && (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
              <HiOutlineCheckCircle size={64} className="text-neon-green mx-auto mb-4" />
            </motion.div>
            <h2 className="text-xl font-bold text-white">Payment Successful!</h2>
            <p className="text-gray-400 text-sm mt-2">Redirecting to Manager Panel…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <HiOutlineXCircle size={64} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white">Payment Failed</h2>
            <p className="text-gray-400 text-sm mt-2">Redirecting back…</p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
