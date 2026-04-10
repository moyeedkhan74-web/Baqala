import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiMenu, HiX, HiLogout, HiUpload, HiViewGrid, HiShieldCheck, HiOutlineSparkles, HiMoon, HiSun, HiSearch } from 'react-icons/hi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
    setMenuOpen(false);
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/50 dark:bg-background-dark/80 backdrop-blur-2xl border-b border-dark-200/50 dark:border-white/5 shadow-glass transition-colors duration-500"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <img src="/logo.png" alt="Baqala Logo" className="h-8 sm:h-10 w-auto object-contain transition-transform duration-500 group-hover:scale-105 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]" />
          </Link>

          {/* Global Search Bar (Desktop) */}
          <div className="hidden lg:block flex-1 max-w-md mx-6">
            <form onSubmit={handleGlobalSearch} className="relative group/search">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiSearch className="h-4 w-4 text-gray-400 group-focus-within/search:text-accent-violet transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search Baqala..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-dark-100/50 dark:bg-dark-900/50 border border-dark-200/50 dark:border-white/10 rounded-full text-dark-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-violet/50 focus:border-accent-violet/50 transition-all shadow-sm"
              />
            </form>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 bg-dark-100/50 dark:bg-white/5 p-1 rounded-full border border-dark-200/50 dark:border-white/10 backdrop-blur-md shrink-0">
            <Link to="/" className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${isActive('/') ? 'bg-white dark:bg-white/10 text-accent-violet dark:text-white shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-glass cursor-default' : 'text-dark-500 dark:text-gray-400 hover:text-dark-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'}`}>
              Explore
            </Link>
            {user && (
              <>
                <Link to="/developer" className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${isActive('/developer') ? 'bg-white dark:bg-white/10 text-accent-violet dark:text-white shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-glass cursor-default' : 'text-dark-500 dark:text-gray-400 hover:text-dark-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'}`}>
                  <HiViewGrid className="w-4 h-4" /> Dashboard
                </Link>
                <Link to="/upload" className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${isActive('/upload') ? 'bg-white dark:bg-white/10 text-accent-neon shadow-[0_0_20px_-5px_rgba(34,211,238,0.2)] cursor-default' : 'text-dark-500 dark:text-gray-400 hover:text-accent-neon hover:bg-accent-neon/10'}`}>
                  <HiUpload className="w-4 h-4" /> Upload
                </Link>
              </>
            )}
            {user && user.role === 'admin' && (
              <Link to="/admin" className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${isActive('/admin') ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-glass cursor-default' : 'text-dark-500 dark:text-gray-400 hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/10'}`}>
                <HiShieldCheck className="w-4 h-4" /> Admin
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* Theme Toggle */}
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              onClick={toggleTheme} 
              className="p-2 rounded-full border border-dark-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors shadow-sm"
            >
              {isDark ? <HiSun className="w-5 h-5 text-yellow-400" /> : <HiMoon className="w-5 h-5 text-accent-violet" />}
            </motion.button>

            {user ? (
              <div className="relative">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full border border-dark-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-dark-300 dark:hover:border-white/20 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-emerald to-accent-neon flex items-center justify-center text-background-dark font-bold text-sm shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)]">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-dark-800 dark:text-gray-200">{user.name}</span>
                </motion.button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-56 glass-panel p-2 z-50 origin-top-right"
                    >
                      <div className="p-3 border-b border-dark-200/50 dark:border-white/10 mb-2">
                        <p className="text-xs text-dark-500 dark:text-gray-400 truncate">{user.email}</p>
                        <span className="badge-neon mt-2 scale-90 origin-left">{user.role}</span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/10 rounded-xl flex items-center gap-2 transition-colors"
                      >
                        <HiLogout className="w-4 h-4" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-dark-600 dark:text-gray-300 hover:text-dark-900 dark:hover:text-white transition-colors px-2">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)]">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-dark-600 dark:text-gray-300 hover:text-dark-900 dark:hover:text-white rounded-xl bg-white/50 dark:bg-white/5 border border-dark-200/50 dark:border-white/10"
          >
            {menuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-3xl border-b border-dark-200/50 dark:border-white/10"
          >
            <div className="px-4 py-6 flex flex-col gap-2">
              <div className="flex justify-between items-center px-2 mb-2">
                <span className="text-dark-600 dark:text-gray-400 font-medium text-sm text-center align-middle h-full pt-1.5">Theme Preference</span>
                <button onClick={toggleTheme} className="p-2 rounded-xl bg-white/50 dark:bg-white/5 border border-dark-200 dark:border-white/10 shadow-sm">
                  {isDark ? <HiSun className="w-5 h-5 text-yellow-500" /> : <HiMoon className="w-5 h-5 text-accent-violet" />}
                </button>
              </div>
              <Link to="/" onClick={() => setMenuOpen(false)} className="p-3 bg-white/50 dark:bg-white/5 rounded-xl text-dark-800 dark:text-gray-300 font-medium">Explore</Link>
              {user && (
                <>
                  <Link to="/developer" onClick={() => setMenuOpen(false)} className="p-3 bg-white/50 dark:bg-white/5 rounded-xl text-dark-800 dark:text-gray-300 font-medium flex items-center gap-2"><HiViewGrid /> Dashboard</Link>
                  <Link to="/upload" onClick={() => setMenuOpen(false)} className="p-3 bg-cyan-100 dark:bg-accent-neon/10 text-cyan-600 dark:text-accent-neon rounded-xl font-medium flex items-center gap-2 border border-cyan-200 dark:border-accent-neon/20"><HiUpload /> Upload App</Link>
                </>
              )}
              {user && user.role === 'admin' && (
                <Link to="/admin" onClick={() => setMenuOpen(false)} className="p-3 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl font-medium flex items-center gap-2 border border-rose-200 dark:border-rose-500/20"><HiShieldCheck /> Admin Panel</Link>
              )}
              
              <div className="h-px bg-dark-200/50 dark:bg-white/10 my-2" />
              
              {user ? (
                <button onClick={handleLogout} className="p-3 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl font-medium flex items-center justify-center gap-2 text-left w-full">
                  <HiLogout /> Sign Out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-center text-sm py-3">Sign In</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary text-center text-sm py-3">Get Started</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
