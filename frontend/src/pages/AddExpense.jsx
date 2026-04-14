import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { HiOutlineArrowLeft, HiOutlinePhotograph, HiOutlineUpload } from 'react-icons/hi';

const AddExpense = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', description: '', amount: '', upiId: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${eventId}`);
        setEvent(res.data);
      } catch {
        toast.error('Event not found');
        navigate('/');
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('amount', formData.amount);
      data.append('upiId', formData.upiId);
      data.append('eventId', eventId);
      if (image) data.append('image', image);

      await api.post('/expenses', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Expense submitted!');
      navigate(`/events/${eventId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-xs font-semibold mb-6 transition-colors uppercase tracking-wider"
      >
        <HiOutlineArrowLeft size={14} /> Back
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title mb-1">Add Expense</h1>
        {event && (
          <p className="text-sm text-gray-500 mb-8">
            For <span className="text-accent-300 font-medium">{event.title}</span>
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 md:p-8 max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label-text">Title</label>
            <input name="title" value={formData.title} onChange={handleChange} className="input-glass text-sm" placeholder="Expense title" required />
          </div>

          <div>
            <label className="label-text">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="input-glass min-h-[90px] resize-none text-sm" placeholder="Brief description" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Amount (₹)</label>
              <input name="amount" type="number" value={formData.amount} onChange={handleChange} className="input-glass text-sm" placeholder="0.00" required min="1" />
            </div>
            <div>
              <label className="label-text">UPI ID</label>
              <input name="upiId" value={formData.upiId} onChange={handleChange} className="input-glass text-sm" placeholder="user@upi" />
            </div>
          </div>

          <div>
            <label className="label-text">Receipt Image</label>
            <label className={`flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
              preview
                ? 'border-accent-400/30 bg-accent-500/5'
                : 'border-white/8 hover:border-accent-400/30 bg-white/[0.02] hover:bg-white/[0.04]'
            }`}>
              {preview ? (
                <img src={preview} alt="Preview" className="h-full w-full object-cover rounded-xl" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
                    <HiOutlineUpload size={20} />
                  </div>
                  <span className="text-xs font-medium">Click to upload receipt</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Expense'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddExpense;
