import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiMenu, HiX, HiLogout, HiUpload, HiViewGrid, HiShieldCheck, HiMoon, HiSun, HiSearch, HiCog } from 'react-icons/hi';
import api from '../api/axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const profileRef = useRef(null);
  const drawerRef = useRef(null);

  // Close profile on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (drawerRef.current && !drawerRef.current.contains(event.target) && menuOpen) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchResults = async () => {
      const trimmed = searchQuery.trim();
      if (trimmed.length < 1) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const { data } = await api.get(`/apps/search?q=${encodeURIComponent(trimmed)}`);
        setSearchResults(data.apps || []);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(fetchResults, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
    setMenuOpen(false);
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchFocused(false);
      setMenuOpen(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <a 
        href="#main-content" 
        className="fixed top-[-100px] left-4 z-[1000] bg-accent-violet text-white px-4 py-2 rounded-lg transition-all focus:top-4 outline-none ring-2 ring-accent-neon"
      >
        Skip to content
      </a>
      
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
            <img src="/logo.png" alt="Baqala Logo" className="h-14 sm:h-16 w-auto object-contain transition-transform duration-500 group-hover:scale-[1.1] drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]" />
          </Link>

          {/* Desktop Search (Hidden < 1024px) */}
          <div className="hidden min-[1024px]:block flex-1 max-w-md mx-6 relative">
            <form onSubmit={handleGlobalSearch} className="relative group/search">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiSearch className="h-4 w-4 text-gray-400 group-focus-within/search:text-accent-violet transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search Baqala..."
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 text-sm bg-dark-100/50 dark:bg-dark-900/50 border border-dark-200/50 dark:border-white/10 rounded-full text-dark-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-violet/50 focus:border-accent-violet/50 transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-accent-violet transition-colors"
                >
                  <HiX className="h-4 w-4" />
                </button>
              )}
            </form>

            <AnimatePresence>
              {searchFocused && searchQuery.trim().length >= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 glass-panel p-2 z-[60] shadow-2xl overflow-hidden origin-top"
                >
                  {searching ? (
                    <div className="p-4 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                       <div className="w-4 h-4 border-2 border-accent-violet border-t-transparent rounded-full animate-spin" />
                       Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.slice(0, 5).map((app) => (
                        <Link
                          key={app._id}
                          to={`/app/${app._id}`}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-white/5 transition-colors group"
                        >
                          <img src={app.icon || '/logo.png'} className="w-10 h-10 rounded-lg object-cover" alt="" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate dark:text-white">{app.title}</p>
                            <p className="text-[10px] text-slate-500 truncate">{app.developerName}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500">No results found</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Nav Links (Hidden < 900px) */}
          <div className="hidden min-[900px]:flex items-center gap-1 bg-dark-100/50 dark:bg-white/5 p-1 rounded-full border border-dark-200/50 dark:border-white/10 backdrop-blur-md">
            <Link to="/" className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${isActive('/') ? 'bg-white dark:bg-white/10 text-accent-violet dark:text-white shadow-sm' : 'text-dark-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'}`}>
              Explore
            </Link>
            {user && (
              <>
                <Link to="/developer" className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${isActive('/developer') ? 'bg-white dark:bg-white/10 text-accent-violet dark:text-white shadow-sm' : 'text-dark-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'}`}>
                  <HiViewGrid /> Dashboard
                </Link>
                <Link to="/upload" className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${isActive('/upload') ? 'bg-white dark:bg-white/10 text-accent-neon shadow-sm' : 'text-dark-500 dark:text-gray-400 hover:text-accent-neon hover:bg-accent-neon/10'}`}>
                  <HiUpload /> Upload
                </Link>
              </>
            )}
            {user && user.role === 'admin' && (
              <Link to="/admin" className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${isActive('/admin') ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300' : 'text-dark-500 dark:text-gray-400 hover:text-rose-500'}`}>
                <HiShieldCheck /> Admin
              </Link>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Search Trigger */}
            <button onClick={() => setMenuOpen(true)} className="min-[1024px]:hidden p-2.5 rounded-full bg-white/50 dark:bg-white/5 border border-dark-200/50 dark:border-white/10" aria-label="Open search">
              <HiSearch className="w-5 h-5 dark:text-gray-300" />
            </button>

            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="hidden min-[900px]:flex p-2.5 rounded-full bg-white/50 dark:bg-white/5 border border-dark-200/50 dark:border-white/10" aria-label="Toggle theme">
              {isDark ? <HiSun className="w-5 h-5 text-yellow-400" /> : <HiMoon className="w-5 h-5 text-accent-violet" />}
            </button>

            {/* Auth */}
            <div ref={profileRef} className="hidden min-[900px]:flex items-center gap-4 relative">
              {user ? (
                <>
                  <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full border border-dark-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:border-dark-300 transition-all">
                    <div className="w-8 h-8 rounded-full bg-accent-violet flex items-center justify-center text-white font-bold text-xs">{user.name?.charAt(0).toUpperCase()}</div>
                    <span className="text-sm font-semibold dark:text-gray-200 max-w-[100px] truncate">{user.name}</span>
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-3 w-[300px] glass-panel p-4 z-[70] shadow-2xl origin-top-right border-white/20 dark:bg-dark-900/95"
                      >
                        <div className="flex items-center gap-4 p-3 border-b border-white/10 mb-3 bg-white/5 rounded-2xl">
                          <div className="w-12 h-12 rounded-xl bg-accent-violet flex items-center justify-center text-white font-black text-xl shadow-lg ring-2 ring-white/10">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black dark:text-white truncate">{user.name}</p>
                            <p className="text-[10px] font-bold text-slate-500 truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Link to="/developer" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-xs font-bold dark:text-gray-200 transition-colors"><HiViewGrid className="text-accent-violet" /> Developer Dashboard</Link>
                          <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-xs font-bold dark:text-gray-200 transition-colors"><HiCog className="text-slate-400" /> Account Settings</Link>
                          <div className="h-px bg-white/5 my-2" />
                          <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-500/10 text-xs font-bold text-rose-500 w-full transition-colors"><HiLogout /> Sign Out Information</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <Link to="/login" className="btn-primary text-sm">Sign In</Link>
              )}
            </div>

            {/* Hamburger (Mobile) */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="min-[900px]:hidden p-2.5 rounded-xl bg-white/50 dark:bg-white/5 border border-dark-200/50 dark:border-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center">
              {menuOpen ? <HiX className="w-6 h-6 dark:text-white" /> : <HiMenu className="w-6 h-6 dark:text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Side Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm min-[900px]:hidden"
            />
            
            {/* The "Box" (Drawer) */}
            <motion.div
              ref={drawerRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-[60] w-[280px] sm:w-[320px] h-full bg-white dark:bg-dark-900 min-[900px]:hidden flex flex-col shadow-2xl border-l border-white/10"
            >
              <div className="flex items-center justify-between h-20 px-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                 <img src="/logo.png" className="h-10" alt="Logo" />
                 <button onClick={() => setMenuOpen(false)} className="p-2 text-slate-500 hover:text-accent-violet transition-colors"><HiX className="w-6 h-6" /></button>
              </div>
              
              <div className="flex-1 px-6 py-8 flex flex-col gap-6 overflow-y-auto">
                {/* User Profile - Compact for side drawer */}
                {user && (
                  <div className="p-5 rounded-2xl bg-accent-violet/5 border border-accent-violet/10 mb-2">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-accent-violet flex items-center justify-center text-white text-xl font-black">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black dark:text-white truncate">{user.name}</p>
                        <p className="text-[10px] font-bold text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link to="/settings" onClick={() => setMenuOpen(false)} className="block w-full text-center py-2 text-[10px] font-black uppercase tracking-widest text-accent-violet border border-accent-violet/20 rounded-lg hover:bg-accent-violet hover:text-white transition-all">
                      Manage Account
                    </Link>
                  </div>
                )}

                {/* Mobile Search */}
                <form onSubmit={handleGlobalSearch} className="relative group">
                  <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-accent-violet transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm dark:text-white outline-none focus:ring-2 focus:ring-accent-violet/50 transition-all font-bold" 
                  />
                </form>

                <div className="space-y-4">
                  <Link to="/" onClick={() => setMenuOpen(false)} className={`text-sm font-bold flex items-center gap-3 p-3 rounded-xl transition-all ${isActive('/') ? 'bg-accent-violet/10 text-accent-violet' : 'dark:text-gray-300 hover:bg-white/5'}`}>
                    Explore Applications
                  </Link>
                  {user && (
                    <>
                      <Link to="/developer" onClick={() => setMenuOpen(false)} className={`text-sm font-bold flex items-center gap-3 p-3 rounded-xl transition-all ${isActive('/developer') ? 'bg-accent-violet/10 text-accent-violet' : 'dark:text-gray-300 hover:bg-white/5'}`}>
                        <HiViewGrid className="w-5 h-5" /> Dashboard
                      </Link>
                      <Link to="/upload" onClick={() => setMenuOpen(false)} className={`text-sm font-bold flex items-center gap-3 p-3 rounded-xl transition-all ${isActive('/upload') ? 'bg-accent-neon/10 text-accent-neon' : 'dark:text-gray-300 hover:bg-white/5'}`}>
                        <HiUpload className="w-5 h-5" /> Upload
                      </Link>
                    </>
                  )}
                  {user && user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className={`text-sm font-bold flex items-center gap-3 p-3 rounded-xl transition-all ${isActive('/admin') ? 'bg-rose-500/10 text-rose-500' : 'dark:text-gray-300 hover:bg-white/5'}`}>
                      <HiShieldCheck className="w-5 h-5" /> Admin Portal
                    </Link>
                  )}
                </div>
                
                <div className="h-px bg-slate-100 dark:bg-white/5 mb-2" />
                
                <Link to="/settings" onClick={() => setMenuOpen(false)} className="text-sm font-bold flex items-center gap-3 dark:text-gray-400 p-3 hover:text-accent-violet transition-colors"><HiCog /> App Settings</Link>
                
                <button onClick={toggleTheme} className="flex items-center justify-between w-full p-3 text-sm font-bold dark:text-gray-400 hover:text-accent-violet transition-colors">
                  Theme View <span>{isDark ? <HiSun className="text-yellow-400" /> : <HiMoon className="text-accent-violet" />}</span>
                </button>

                <div className="mt-auto pb-8">
                  {user ? (
                    <button onClick={handleLogout} className="btn-primary w-full py-3 text-sm font-black shadow-glow-violet">Sign Out</button>
                  ) : (
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-primary w-full py-3 text-sm font-black text-center shadow-glow-violet">Sign In</Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
    </>
  );
};

export default Navbar;
