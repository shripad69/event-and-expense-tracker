import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineArrowLeft,
  HiOutlinePhotograph,
  HiOutlineUpload,
  HiOutlineCash,
  HiOutlineDocumentText,
  HiOutlineX,
  HiOutlineCheck,
} from 'react-icons/hi';

// ------------------------------
// Reusable Components
// ------------------------------

const FormInput = ({ label, icon: Icon, error, ...props }) => (
  <div>
    <label className="label-text flex items-center gap-1.5 mb-1.5">
      {Icon && <Icon size={14} className="text-accent-400" />}
      {label}
    </label>
    <input
      {...props}
      className={`input-glass text-sm w-full transition-all duration-200 ${
        error ? 'border-red-500/50 focus:ring-red-500/30' : 'focus:ring-2 focus:ring-accent-500/30'
      }`}
    />
    {error && (
      <motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-red-400 text-xs mt-1.5 flex items-center gap-1"
      >
        <HiOutlineX size={12} /> {error}
      </motion.p>
    )}
  </div>
);

const FormTextarea = ({ label, icon: Icon, error, ...props }) => (
  <div>
    <label className="label-text flex items-center gap-1.5 mb-1.5">
      {Icon && <Icon size={14} className="text-accent-400" />}
      {label}
    </label>
    <textarea
      {...props}
      className={`input-glass text-sm w-full min-h-[90px] resize-none transition-all duration-200 ${
        error ? 'border-red-500/50 focus:ring-red-500/30' : 'focus:ring-2 focus:ring-accent-500/30'
      }`}
    />
    {error && (
      <motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-red-400 text-xs mt-1.5 flex items-center gap-1"
      >
        <HiOutlineX size={12} /> {error}
      </motion.p>
    )}
  </div>
);

const ImageUpload = ({ preview, onImageChange, onClear, error }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageChange(file);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) onImageChange(file);
  };

  return (
    <div>
      <label className="label-text flex items-center gap-1.5 mb-1.5">
        <HiOutlinePhotograph size={14} className="text-accent-400" />
        Receipt Image
      </label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden ${
          isDragging
            ? 'border-accent-400 bg-accent-500/10'
            : preview
            ? 'border-accent-400/30 bg-accent-500/5'
            : 'border-white/8 hover:border-accent-400/30 bg-white/[0.02] hover:bg-white/[0.04]'
        } ${error ? 'border-red-500/50' : ''}`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label="Upload receipt image"
        />
        {preview ? (
          <div className="relative h-40 w-full">
            <img src={preview} alt="Receipt preview" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors border border-white/20"
              aria-label="Remove image"
            >
              <HiOutlineX size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-center mb-3 group-hover:bg-white/[0.08] transition-colors">
              <HiOutlineUpload size={22} className="text-gray-400 group-hover:text-accent-400 transition-colors" />
            </div>
            <p className="text-sm font-medium text-gray-300 mb-1">
              {isDragging ? 'Drop your receipt here' : 'Click or drag to upload'}
            </p>
            <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
          </div>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-xs mt-1.5 flex items-center gap-1"
        >
          <HiOutlineX size={12} /> {error}
        </motion.p>
      )}
    </div>
  );
};

// ------------------------------
// Main Component
// ------------------------------

const AddExpense = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', description: '', amount: '', upiId: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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
  }, [eventId, navigate]);

  const validateField = (name, value) => {
    switch (name) {
      case 'title':
        return value.trim() ? '' : 'Title is required';
      case 'amount':
        if (!value) return 'Amount is required';
        if (isNaN(value) || Number(value) <= 0) return 'Amount must be greater than 0';
        return '';
      case 'upiId':
        if (value && !value.includes('@')) return 'Please enter a valid UPI ID';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (touched[name]) {
      setErrors({ ...errors, [name]: validateField(name, value) });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    setErrors({ ...errors, [name]: validateField(name, value) });
  };

  const handleImageChange = (file) => {
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setErrors({ ...errors, image: '' });
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    if (preview) URL.revokeObjectURL(preview);
  };

  const validateForm = () => {
    const newErrors = {
      title: validateField('title', formData.title),
      amount: validateField('amount', formData.amount),
      upiId: validateField('upiId', formData.upiId),
    };
    setErrors(newErrors);
    setTouched({ title: true, amount: true, upiId: true });
    return !Object.values(newErrors).some((err) => err);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

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
      toast.success('Expense submitted successfully!');
      navigate(`/events/${eventId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container max-w-2xl mx-auto">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-xs font-semibold mb-8 transition-colors uppercase tracking-wider group"
      >
        <HiOutlineArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        Back
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="page-title mb-2 flex items-center gap-3">
          <div className="bg-accent-500/10 p-2 rounded-xl border border-accent-500/20">
            <HiOutlineCash className="text-accent-400 w-5 h-5" />
          </div>
          Add Expense
        </h1>
        {event && (
          <p className="text-sm text-gray-400 font-medium">
            For event:{' '}
            <span className="text-accent-300 font-semibold bg-accent-500/10 px-2 py-0.5 rounded-md">
              {event.title}
            </span>
          </p>
        )}
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="glass-card p-6 sm:p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="Expense Title"
            icon={HiOutlineDocumentText}
            name="title"
            value={formData.title}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g., Catering, Equipment Rental"
            error={errors.title}
            required
            autoFocus
          />

          <FormTextarea
            label="Description"
            icon={HiOutlineDocumentText}
            name="description"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Brief description (optional)"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormInput
              label="Amount (₹)"
              icon={HiOutlineCash}
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="0.00"
              error={errors.amount}
              required
              min="1"
              step="0.01"
            />
            <FormInput
              label="UPI ID (Optional)"
              icon={HiOutlineCash}
              name="upiId"
              value={formData.upiId}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="username@bank"
              error={errors.upiId}
            />
          </div>

          <ImageUpload
            preview={preview}
            onImageChange={handleImageChange}
            onClear={clearImage}
            error={errors.image}
          />

          <div className="pt-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent-500/20"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <HiOutlineCheck size={18} />
                  Submit Expense
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddExpense;