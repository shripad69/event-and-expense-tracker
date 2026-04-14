import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineAcademicCap } from 'react-icons/hi';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    role: 'member',
  });
  const [loading, setLoading] = useState(false);
  const [collegeSuggestions, setCollegeSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCollegeChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, college: value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(formData);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-neon-cyan/15 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-accent-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan to-accent-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-glow-blue">
            ET
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 text-sm mt-1">Join EventTracker today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-text">Full Name</label>
            <div className="relative">
              <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input name="name" value={formData.name} onChange={handleChange} className="input-glass pl-10" placeholder="John Doe" required />
            </div>
          </div>

          <div>
            <label className="label-text">Email</label>
            <div className="relative">
              <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input name="email" type="email" value={formData.email} onChange={handleChange} className="input-glass pl-10" placeholder="you@example.com" required />
            </div>
          </div>

          <div>
            <label className="label-text">Password</label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input name="password" type="password" value={formData.password} onChange={handleChange} className="input-glass pl-10" placeholder="Min 6 characters" required minLength={6} />
            </div>
          </div>

          <div ref={dropdownRef} className="relative">
            <label className="label-text">College</label>
            <div className="relative">
              <HiOutlineAcademicCap className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                name="college"
                value={formData.college}
                onChange={handleCollegeChange}
                onFocus={() => collegeSuggestions.length > 0 && setShowSuggestions(true)}
                className="input-glass pl-10"
                placeholder="Start typing your college…"
                autoComplete="off"
                required
              />
            </div>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute z-20 w-full mt-1 glass-card p-1 max-h-40 overflow-y-auto"
              >
                {collegeSuggestions.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectCollege(c)}
                    className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          <div>
            <label className="label-text">Role</label>
            <select name="role" value={formData.role} onChange={handleChange} className="input-glass">
              <option value="member" className="bg-dark-800">Member</option>
              <option value="manager" className="bg-dark-800">Revenue Manager</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-400 hover:text-accent-300 font-medium transition-colors">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
