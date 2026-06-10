import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
const AppCard = lazy(() => import('../components/AppCard'));
import SEOHead from '../components/SEOHead';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCollection, HiChevronLeft } from 'react-icons/hi';
const SkeletonCard = lazy(() => import('../components/Skeleton').then(m => ({ default: m.SkeletonCard })));

const CategoryPage = () => {
  const { name } = useParams();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCategoryApps = async () => {
      // Small delay on loading to avoid flicker if API is fast, 
      // but here we want to BE fast.
      setLoading(true);
      try {
        const { data } = await api.get(`/apps?category=${name}`);
        if (isMounted) setApps(data.apps || []);
      } catch (err) {
        console.error('Failed to fetch category apps:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCategoryApps();
    return () => { isMounted = false; };
  }, [name]);

  const categoryTitle = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <SEOHead 
        title={`Best Free ${categoryTitle} Apps — Baqala App Store`}
        description={`Explore and download the top ${categoryTitle} apps on Baqala. Secure, verified, and free to download.`}
      />

      <div className="mb-12">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-accent-violet transition-colors mb-6 text-sm font-bold group">
          <HiChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Explore
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white flex items-center gap-4">
              <HiCollection className="text-accent-violet opacity-30" />
              {categoryTitle} <span className="gradient-text italic">Apps</span>
            </h1>
            <p className="mt-4 text-lg text-slate-500 dark:text-gray-400 max-w-xl">
              Browsing the latest and most popular digital tools in the {categoryTitle} category.
            </p>
          </div>
          <p className="text-slate-400 font-bold bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-xl text-sm">
            {apps.length} Verified Apps
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <Suspense fallback={<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"><div className="h-64 bg-white/5 animate-pulse rounded-2xl" /></div>}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
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
            className="text-center py-24 glass-panel rounded-3xl"
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No apps in this category yet</h2>
            <p className="text-slate-500 dark:text-gray-400 mb-8">
              Want to contribute? Be the first to upload a {categoryTitle} app!
            </p>
            <Link to="/upload" className="btn-primary py-3 px-8">Upload Now</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryPage;
