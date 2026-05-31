import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import AppCard from '../components/AppCard';
import SEOHead from '../components/SEOHead';
import { motion } from 'framer-motion';
import { HiDownload, HiViewGrid, HiCalendar, HiUserCircle, HiGlobeAlt } from 'react-icons/hi';
import { SkeletonCard } from '../components/Skeleton';

const DeveloperProfile = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/${id}/profile`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-12 animate-pulse">
          <div className="w-32 h-32 rounded-3xl bg-slate-200 dark:bg-white/10" />
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="h-10 w-48 bg-slate-200 dark:bg-white/10 rounded-xl mx-auto md:mx-0" />
            <div className="h-4 w-full max-w-md bg-slate-200 dark:bg-white/10 rounded-lg mx-auto md:mx-0" />
            <div className="flex gap-4 justify-center md:justify-start">
              <div className="h-12 w-24 bg-slate-200 dark:bg-white/10 rounded-xl" />
              <div className="h-12 w-24 bg-slate-200 dark:bg-white/10 rounded-xl" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{error || 'Developer not found'}</h2>
        <Link to="/" className="btn-primary">Back to Explore</Link>
      </div>
    );
  }

  const { developer, stats, apps } = data;

  return (
    <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <SEOHead 
        title={`Apps by ${developer.name} — Baqala`}
        description={`Explore the collection of high-quality Android apps and games developed by ${developer.name} on Baqala App Store.`}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-16"
      >
        {/* Avatar */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent-violet to-accent-neon rounded-[32px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-[28px] overflow-hidden border border-white/20 bg-white dark:bg-dark-800 shadow-glass">
            {developer.avatar ? (
              <img src={developer.avatar} alt={developer.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-accent-violet to-accent-magenta flex items-center justify-center text-white text-5xl font-bold">
                {(developer?.name || 'Developer').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-2">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {developer?.name || 'Unknown Developer'}
            </h1>
            <span className="badge-neon uppercase tracking-widest text-[10px] px-3 py-1">
              Verified Developer
            </span>
          </div>

          {(developer?.tagline || developer?.specialization) && (
            <div className="mb-8 space-y-3">
              {developer?.specialization && (
                <div className="flex items-center gap-3 text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
                  <span className="w-1 h-8 bg-gradient-to-b from-accent-violet to-accent-neon rounded-full" />
                  {developer.specialization}
                </div>
              )}
              {developer?.tagline && (
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
                  <p className="text-xs md:text-sm font-black text-accent-violet dark:text-accent-neon uppercase tracking-[0.2em]">
                    {developer.tagline}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-accent-violet dark:text-accent-neon mb-4">About the Developer</h2>
            <p className="text-lg text-slate-600 dark:text-gray-400 max-w-2xl mb-8 leading-relaxed font-medium">
              {developer?.bio || `Independent software engineer contributing high-quality digital experiences to the Baqala community since ${developer?.joinDate ? new Date(developer.joinDate).getFullYear() : '2024'}.`}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="flex flex-wrap justify-center md:justify-start gap-4 sm:gap-6">
            <div className="glass-panel px-6 py-4 flex flex-col items-center md:items-start min-w-[140px]">
              <span className="text-2xl font-black text-accent-violet dark:text-accent-neon flex items-center gap-2">
                <HiViewGrid className="w-5 h-5 opacity-50" /> {stats?.totalApps || 0}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Apps Uploaded</span>
            </div>
            
            <div className="glass-panel px-6 py-4 flex flex-col items-center md:items-start min-w-[140px]">
              <span className="text-2xl font-black text-accent-emerald flex items-center gap-2">
                <HiDownload className="w-5 h-5 opacity-50" /> {stats?.totalDownloads >= 1000 ? `${(stats.totalDownloads / 1000).toFixed(1)}k+` : (stats?.totalDownloads || 0)}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Total Reach</span>
            </div>

            <div className="glass-panel px-6 py-4 flex flex-col items-center md:items-start min-w-[140px]">
              <span className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 pt-1">
                <HiCalendar className="w-5 h-5 opacity-50" /> {developer?.joinDate ? new Date(developer.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2024'}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Member Since</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Apps Section */}
      <div>
        <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-white/10 pb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <HiGlobeAlt className="text-accent-violet" />
            Software <span className="gradient-text italic">Portfolio</span>
          </h2>
          <span className="text-sm font-bold text-slate-400">{apps.length} Releases</span>
        </div>

        {apps && apps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {apps.map((app, index) => (
              <AppCard key={app._id} app={app} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
            <p className="text-slate-500 font-medium italic">This developer hasn't published any apps publicly yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperProfile;
