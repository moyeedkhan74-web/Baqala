import { useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
const AppCard = lazy(() => import('../components/AppCard'));
import SEOHead from '../components/SEOHead';
import { motion, AnimatePresence } from 'framer-motion';
import { HiSearch, HiXCircle } from 'react-icons/hi';
const SkeletonCard = lazy(() => import('../components/Skeleton').then(m => ({ default: m.SkeletonCard })));

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setApps([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/apps?search=${encodeURIComponent(query.trim())}`);
        setApps(data.apps || []);
      } catch (err) {
        setError('Failed to fetch search results. Please try again.');
        console.error('Search results error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <SEOHead 
        title={`Search results for "${query}" | Baqala`}
        description={`Displaying all apps matching ${query} on Baqala App Store.`}
      />

      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-accent-violet/10 dark:bg-white/5 flex items-center justify-center text-accent-violet">
            <HiSearch className="w-6 h-6" />
          </span>
          Results for <span className="gradient-text italic">"{query}"</span>
        </h1>
        <p className="mt-2 text-slate-500 dark:text-gray-400 font-medium">
          Found {apps.length} matching apps
        </p>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <Suspense fallback={<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"><div className="h-64 bg-white/5 animate-pulse rounded-2xl" /></div>}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[...Array(8)].map((_, i) => (
                <div key={i} className="glass-panel h-[360px] animate-pulse rounded-3xl bg-dark-100/50 dark:bg-white/5" />
              ))}
            </motion.div>
          </Suspense>
        ) : apps.length > 0 ? (
          <Suspense fallback={<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"><div className="h-64 bg-white/5 animate-pulse rounded-2xl" /></div>}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {apps.map((app, index) => (
                <AppCard key={app._id} app={app} index={index} />
              ))}
            </motion.div>
          </Suspense>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center py-20"
          >
            <div className="w-24 h-24 bg-dark-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
               <HiXCircle className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No apps found</h2>
            <p className="text-slate-500 dark:text-gray-400 mb-8">
              We couldn't find any apps matching your search. Try different keywords or check out our top categories.
            </p>
            <a href="/" className="btn-primary py-3 px-8">Back to Home</a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchResults;
