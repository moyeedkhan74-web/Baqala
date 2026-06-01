import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AppCard from '../components/AppCard';
import HeroCarousel from '../components/HeroCarousel';
import SEOHead from '../components/SEOHead';
import { SkeletonCard } from '../components/Skeleton';
import { HiSearch, HiX, HiAdjustments, HiTrendingUp, HiCollection } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Home = () => {
  const [apps, setApps] = useState([]);
  const [featuredApps, setFeaturedApps] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const querySearch = searchParams.get('search');
    if (querySearch !== null && querySearch !== search) setSearch(querySearch);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { fetchData(); }, [debouncedSearch, category, sort]);

  const { user } = useAuth();
  
  const fetchData = async () => {
    try {
      const fetchPromises = [
        api.get('/apps', { params: { search: debouncedSearch, category, sort } }),
        api.get('/apps/categories'),
        api.get('/apps', { params: { featured: 'true', limit: 5 } })
      ];
      if (user) fetchPromises.push(api.get('/apps/my'));

      const results = await Promise.all(fetchPromises);
      setApps(results[0].data.apps);
      setCategories(results[1].data.categories || []);
      setFeaturedApps(results[2].data.apps || []);
      if (user && results[3]) setMyApps(results[3].data.apps);
    } catch {
      toast.error('Failed to load apps');
    } finally {
      setLoading(false);
    }
  };

  const standardApps = apps?.length > 0 ? apps.slice(1) : [];

  return (
    <div className="min-h-screen pb-24">
      <SEOHead 
        title="Discover the Best Apps"
        description="Baqala is your premium app store for discovering and downloading high-quality Android apps, games, and productivity tools."
      />
      <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex-1">
            <h1 className="heading-hero">
              Discover <span className="gradient-text">Extraordinary</span> Apps
            </h1>
            <p className="text-slate-500 dark:text-gray-400 text-lg max-w-2xl">
              Immerse yourself in the next generation of digital tools, games, and productivity software.
            </p>
          </div>
        </div>

        {/* Featured Carousel */}
        {!search && !category && sort === '-createdAt' && featuredApps?.length > 0 && (
          <HeroCarousel apps={featuredApps} />
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-6 mb-10">
          <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 w-full md:w-auto hide-scrollbar gap-2">
            <button
              onClick={() => setCategory('')}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                !category
                  ? 'bg-accent-violet text-white shadow-[0_4px_14px_-4px_rgba(139,92,246,0.5)]'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  category === cat
                    ? 'bg-gradient-to-r from-accent-violet to-accent-neon text-white shadow-[0_4px_14px_-4px_rgba(139,92,246,0.5)]'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <HiAdjustments className="w-5 h-5 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent border-none text-slate-700 dark:text-white font-medium text-sm focus:ring-0 cursor-pointer hover:text-accent-violet dark:hover:text-accent-neon transition-colors appearance-none pr-4"
            >
              <option value="-createdAt" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">Newest Arrivals</option>
              <option value="-averageRating" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">Top Rated</option>
              <option value="-totalDownloads" className="bg-white dark:bg-dark-900 text-slate-900 dark:text-white">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-10" aria-label="Loading apps">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : apps?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="py-32 flex flex-col items-center justify-center text-center glass-panel rounded-3xl"
          >
            <div className="w-20 h-20 bg-slate-100 dark:bg-dark-800 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 mb-6">
              <HiSearch className="w-10 h-10 text-slate-400 dark:text-gray-500" aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No apps found</h3>
            <p className="text-slate-500 dark:text-gray-400 max-w-md">We couldn't find any apps matching your filters. Try adjusting your search.</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-16">
              <div role="main" id="main-content">
                {myApps?.length > 0 && !search && !category && (
                  <section className="mb-12" aria-label="Your Uploaded Projects">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <HiCollection className="w-6 h-6 text-accent-violet" aria-hidden="true" />
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Uploaded Projects</h2>
                      </div>
                      <Link to="/developer" className="text-accent-violet dark:text-accent-neon text-sm hover:underline font-medium">Manage All</Link>
                    </div>
                    <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
                      {myApps.map((app) => (
                        <motion.div key={app._id} className="min-w-[280px]">
                          <AppCard app={app} />
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                <section aria-label="App Discovery Grid">
                  {(!search && !category && sort === '-createdAt') && (
                    <div className="flex items-center gap-2 mb-6">
                      <HiTrendingUp className="w-6 h-6 text-accent-emerald" aria-hidden="true" />
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Trending Now</h2>
                    </div>
                  )}

                  <div className="app-grid">
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
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Home;
