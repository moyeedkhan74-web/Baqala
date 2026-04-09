import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import AppCard from '../components/AppCard';
import HeroCarousel from '../components/HeroCarousel';
import { HiSearch, HiX, HiAdjustments, HiFire, HiTrendingUp, HiCollection } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Home = () => {
  const [apps, setApps] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('-createdAt');
  
  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const querySearch = searchParams.get('search');
    if (querySearch !== null && querySearch !== search) {
      setSearch(querySearch);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [debouncedSearch, category, sort]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const fetchPromises = [
        api.get('/apps', { params: { search: debouncedSearch, category, sort } }),
        api.get('/apps/categories')
      ];

      if (token) {
        fetchPromises.push(api.get('/apps/my'));
      }

      const results = await Promise.all(fetchPromises);
      setApps(results[0]?.data?.apps || []);
      setCategories(results[1]?.data?.categories || []);
      if (token && results[2]) {
        setMyApps(results[2]?.data?.apps || []);
      }
    } catch (error) {
      toast.error('Failed to load experience');
    } finally {
      setLoading(false);
    }
  };

  const featuredApp = apps.length > 0 ? apps[0] : null;
  const standardApps = apps.length > 0 ? apps.slice(1) : [];

  return (
    <div className="min-h-screen pb-24 text-white">
      {/* Search Header Area */}
      <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex-1">
            <h1 className="heading-hero">
              Discover <span className="gradient-text">Extraordinary</span> Apps
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Immerse yourself in the next generation of digital tools, games, and productivity software built for the future.
            </p>
          </div>
          
          <div className="w-full md:w-96 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <HiSearch className="h-5 w-5 text-gray-400 group-focus-within:text-accent-neon transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search the future..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-4 glass-panel rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-neon/50 focus:border-accent-neon/50 transition-all border-white/5 shadow-glass text-lg"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-white text-gray-400 transition-colors">
                <HiX className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Carousel Banners - Only show when no active search/category filter */}
        {!search && !category && sort === '-createdAt' && apps.length > 0 && (
          <HeroCarousel apps={apps} />
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6 mb-10">
          <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 w-full md:w-auto hide-scrollbar gap-2">
            <button
              onClick={() => setCategory('')}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${!category ? 'bg-white text-dark-900 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'glass-panel text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${category === cat ? 'bg-gradient-to-r from-accent-violet to-accent-neon text-white shadow-glow-violet border-none' : 'glass-panel text-gray-400 hover:text-white hover:bg-white/10'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <HiAdjustments className="w-5 h-5 text-gray-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent border-none text-white font-medium text-sm focus:ring-0 cursor-pointer hover:text-accent-neon transition-colors appearance-none pr-4"
            >
              <option value="-createdAt" className="bg-dark-900">Newest Arrivals</option>
              <option value="-averageRating" className="bg-dark-900">Top Rated</option>
              <option value="-totalDownloads" className="bg-dark-900">Most Popular</option>
            </select>
          </div>
        </div>
        
        {/* Main Content Area */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-10">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="glass-panel p-5 rounded-2xl h-40 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : apps.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="py-32 flex flex-col items-center justify-center text-center glass-panel rounded-3xl"
          >
            <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center border border-white/10 mb-6 shadow-glow-violet">
              <HiSearch className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No apps found</h3>
            <p className="text-gray-400 max-w-md">We couldn't find any realities matching your current filters. Try adjusting your search.</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-16"
            >
              {/* Grid Content */}
              <section>
                {myApps.length > 0 && !search && !category && (
                  <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <HiCollection className="w-6 h-6 text-accent-neon" />
                        <h2 className="text-2xl font-bold text-white">Your Uploaded Projects</h2>
                      </div>
                      <Link to="/developer" className="text-accent-neon text-sm hover:underline font-medium">Manage All</Link>
                    </div>
                    <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
                      {myApps.map((app) => (
                        <motion.div key={app._id} className="min-w-[280px]">
                          <AppCard app={app} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {(!search && !category && sort === '-createdAt') && (
                  <div className="flex items-center gap-2 mb-6">
                    <HiTrendingUp className="w-6 h-6 text-accent-emerald" />
                    <h2 className="text-2xl font-bold text-white">Trending Now</h2>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {((!search && !category && sort === '-createdAt') ? standardApps : apps).map((app, index) => (
                    <motion.div
                      key={app._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <AppCard app={app} />
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Home;
