import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineAcademicCap,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

// ------------------------------
// Reusable Components
// ------------------------------

const FormInput = ({
  label,
  type,
  name, // Added name prop here
  icon: Icon,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  autoComplete,
  error,
  showPasswordToggle,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = showPasswordToggle && showPassword ? 'text' : type;

  return (
    <div>
      <label className="label-text flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon size={14} className="text-accent-400" />}
        {label}
      </label>
      <div className="relative">
        <Icon
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
            isFocused || value ? 'text-accent-400' : 'text-gray-500'
          }`}
          size={18}
        />
        <input
          type={inputType}
          name={name} // Added name attribute here
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={() => setIsFocused(true)}
          onBlurCapture={() => setIsFocused(false)}
          className={`input-glass pl-11 pr-10 text-sm w-full transition-all duration-200 ${
            error
              ? 'border-red-500/50 focus:ring-red-500/30'
              : 'focus:ring-2 focus:ring-accent-500/30'
          }`}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
        />
        {showPasswordToggle && value && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-xs mt-1.5 flex items-center gap-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

const CollegeAutocomplete = ({
  value,
  onChange,
  onBlur,
  suggestions,
  showSuggestions,
  onSelect,
  onFocus,
  error,
  dropdownRef,
}) => (
  <div ref={dropdownRef} className="relative">
    <label className="label-text flex items-center gap-1.5 mb-1.5">
      <HiOutlineAcademicCap size={14} className="text-accent-400" />
      College
    </label>
    <div className="relative">
      <HiOutlineAcademicCap
        className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
          value ? 'text-accent-400' : 'text-gray-500'
        }`}
        size={18}
      />
      <input
        name="college"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        className={`input-glass pl-11 pr-4 text-sm w-full ${
          error ? 'border-red-500/50 focus:ring-red-500/30' : 'focus:ring-2 focus:ring-accent-500/30'
        }`}
        placeholder="Start typing your college…"
        autoComplete="off"
        required
      />
    </div>
    <AnimatePresence>
      {showSuggestions && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="absolute z-20 w-full mt-1 glass-card p-1 max-h-48 overflow-y-auto scrollbar-thin"
        >
          {suggestions.map((college, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(college)}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors focus:outline-none focus:bg-white/10"
            >
              {college}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
    {error && (
      <motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-red-400 text-xs mt-1.5 flex items-center gap-1"
      >
        {error}
      </motion.p>
    )}
  </div>
);

// ------------------------------
// Main Signup Component
// ------------------------------

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    role: 'member',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [collegeSuggestions, setCollegeSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleCollegeChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, college: value });
    if (errors.college) setErrors({ ...errors, college: '' });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) {
      setCollegeSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/colleges?q=${encodeURIComponent(value)}`);
        setCollegeSuggestions(res.data);
        setShowSuggestions(res.data.length > 0);
      } catch {
        setCollegeSuggestions([]);
      }
    }, 300);
  };

  const selectCollege = (college) => {
    setFormData({ ...formData, college });
    setShowSuggestions(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Enter a valid email';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    if (!formData.college.trim()) newErrors.college = 'College is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signup(formData);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.25, scale: 1 }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute top-1/4 -left-20 w-80 h-80 bg-neon-cyan/20 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.25, scale: 1 }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', delay: 0.75 }}
          className="absolute bottom-1/4 -right-20 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Signup Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-card p-8 sm:p-10 w-full max-w-md relative backdrop-blur-xl shadow-2xl"
      >
        {/* Logo & Header */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan to-accent-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-5 shadow-glow-blue">
            Ex
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
            Create Account
          </h1>
          <p className="text-gray-400 text-sm font-medium">Join Expensify today</p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <FormInput
              label="Full Name"
              type="text"
              name="name" // Ensures mapping to formData.name
              icon={HiOutlineUser}
              value={formData.name}
              onChange={handleChange}
              onBlur={() => {}}
              placeholder="John Doe"
              required
              autoComplete="name"
              error={errors.name}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <FormInput
              label="Email"
              type="email"
              name="email" // Ensures mapping to formData.email
              icon={HiOutlineMail}
              value={formData.email}
              onChange={handleChange}
              onBlur={() => {}}
              placeholder="you@example.com"
              required
              autoComplete="email"
              error={errors.email}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
          >
            <FormInput
              label="Password"
              type="password"
              name="password" // Ensures mapping to formData.password
              icon={HiOutlineLockClosed}
              value={formData.password}
              onChange={handleChange}
              onBlur={() => {}}
              placeholder="Min 6 characters"
              required
              autoComplete="new-password"
              showPasswordToggle
              error={errors.password}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <CollegeAutocomplete
              value={formData.college}
              onChange={handleCollegeChange}
              onBlur={() => {}}
              suggestions={collegeSuggestions}
              showSuggestions={showSuggestions}
              onSelect={selectCollege}
              onFocus={() => collegeSuggestions.length > 0 && setShowSuggestions(true)}
              error={errors.college}
              dropdownRef={dropdownRef}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.3 }}
          >
            <label className="label-text flex items-center gap-1.5 mb-1.5">
              <HiOutlineCheckCircle size={14} className="text-accent-400" />
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input-glass text-sm w-full"
            >
              <option value="member">Member</option>
              <option value="manager">Revenue Manager</option>
            </select>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <button
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
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </motion.div>
        </form>

        {/* Sign In Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.3 }}
          className="text-center text-gray-400 text-sm mt-7"
        >
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-accent-400 hover:text-accent-300 font-semibold transition-colors hover:underline underline-offset-4"
          >
            Sign In
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Signup;