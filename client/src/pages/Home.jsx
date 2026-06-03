import { useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
const AppCard = lazy(() => import('../components/AppCard'));
const HeroCarousel = lazy(() => import('../components/HeroCarousel'));
import SEOHead from '../components/SEOHead';
const SkeletonCard = lazy(() => import('../components/Skeleton').then(m => ({ default: m.SkeletonCard })));
import { HiSearch, HiX, HiAdjustments, HiTrendingUp, HiCollection } from 'react-icons/hi';

const Home = () => {
  const [apps, setApps] = useState([]);
  const [featuredApps, setFeaturedApps] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
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
      const { default: toast } = await import('react-hot-toast');
      toast.error('Failed to load apps');
    } finally {
      setLoading(false);
    }
  };

  const isFiltered = !!(search || category || sort !== 'newest');

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
            <p className="text-slate-600 dark:text-gray-300 text-lg max-w-2xl">
              Immerse yourself in the next generation of digital tools, games, and productivity software.
            </p>
          </div>
        </div>

        {/* Featured Carousel */}
        {!search && !category && sort === '-createdAt' && featuredApps?.length > 0 && (
          <Suspense fallback={<div className="w-full h-[400px] md:h-[500px] bg-slate-100 dark:bg-white/5 animate-pulse rounded-[2.5rem] mb-12" />}>
            <HeroCarousel apps={featuredApps} />
          </Suspense>
        )}

        {/* Filters and Sorting */}
        <div className="space-y-6 mb-10 border-b border-slate-200 dark:border-white/10 pb-8">
          {/* Category Scroller */}
          <div className="category-filters">
            <button
              onClick={() => setCategory('')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                !category
                  ? 'bg-accent-violet text-white shadow-glow-violet'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              All Explore
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  category === cat
                    ? 'bg-accent-violet text-white shadow-glow-violet'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Selector - On its own line */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div className="flex items-center gap-2">
                <HiTrendingUp className="w-5 h-5 text-accent-violet" />
                <span className="text-sm font-bold border-l border-slate-200 dark:border-white/10 pl-3 ml-1 text-slate-500 dark:text-gray-400 uppercase tracking-widest">
                  {sort === 'newest' ? 'Newest Arrivals' : sort === 'rating' ? 'Top Rated' : 'Most Popular'}
                </span>
             </div>
             
             <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10">
                <HiAdjustments className="w-4 h-4 text-slate-400" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="bg-transparent border-none text-slate-700 dark:text-white font-bold text-xs focus:ring-0 cursor-pointer appearance-none outline-none"
                >
                  <option value="newest" className="bg-white dark:bg-dark-900">Newest Arrivals</option>
                  <option value="rating" className="bg-white dark:bg-dark-900">Top Rated</option>
                  <option value="downloads" className="bg-white dark:bg-dark-900">Most Popular</option>
                </select>
             </div>
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
            className="flex flex-col items-center justify-center text-center rounded-3xl"
            style={{ padding: 'clamp(2rem, 8vw, 6rem)' }}
          >
            <div className="w-20 h-20 bg-slate-100 dark:bg-dark-800 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 mb-6">
              <HiSearch className="w-10 h-10 text-slate-400 dark:text-gray-500" aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No apps found</h3>
            <p className="text-slate-500 dark:text-gray-400 max-w-md">We couldn't find any apps matching your filters. Try adjusting your search.</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              {/* Your Uploaded Projects */}
              {myApps?.length > 0 && !search && !category && (
                <section className="mb-4" aria-label="Your Uploaded Projects">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <HiCollection className="w-6 h-6 text-accent-violet" aria-hidden="true" />
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Projects</h2>
                    </div>
                    <Link to="/developer" className="text-accent-violet text-sm hover:underline font-bold">Manage All</Link>
                  </div>
                  <div className="app-grid">
                    {myApps.map((app) => (
                      <motion.div key={app._id}><AppCard app={app} /></motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Filtered Results - Simple flat grid */}
              {isFiltered ? (
                <section aria-label="Filtered Results">
                  <div className="flex items-center gap-2 mb-6">
                    <HiTrendingUp className="w-6 h-6 text-accent-violet" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {search ? `Results for "${search}"` : category ? category : 'All Apps'}
                    </h2>
                    <span className="text-sm text-slate-400 ml-2">({apps.length} apps)</span>
                  </div>
                  <div className="app-grid">
                    {apps.slice(0, 12).map((app) => (
                      <motion.div 
                        key={app._id} 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.4 }}
                      >
                        <AppCard app={app} />
                      </motion.div>
                    ))}
                  </div>
                </section>
              ) : (
                // Unfiltered: Group by category like Play Store
                <div className="space-y-14">
                  {/* All apps - show them grouped by available categories */}
                  {(() => {
                    const grouped = {};
                    apps.forEach(app => {
                      const cat = app.category || 'Other';
                      if (!grouped[cat]) grouped[cat] = [];
                      grouped[cat].push(app);
                    });
                    const catEntries = Object.entries(grouped);
                    if (catEntries.length === 0) return (
                      <div className="py-12 text-center text-slate-500">No apps available yet.</div>
                    );
                    return catEntries.map(([cat, catApps]) => (
                      <section key={cat} aria-label={cat}>
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-xl font-black text-slate-900 dark:text-white">{cat}</h2>
                          <button
                            onClick={() => setCategory(cat)}
                            className="text-accent-violet text-sm font-bold hover:underline"
                          >
                            See all →
                          </button>
                        </div>
                        <div className="app-grid">
                          {catApps.slice(0, 8).map((app) => (
                            <motion.div 
                              key={app._id} 
                              initial={{ opacity: 0, y: 20 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              transition={{ duration: 0.4 }}
                            >
                              <AppCard app={app} />
                            </motion.div>
                          ))}
                        </div>
                      </section>
                    ));
                  })()}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Home;
