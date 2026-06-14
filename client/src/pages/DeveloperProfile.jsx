import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import AppCard from '../components/AppCard';
import SEOHead from '../components/SEOHead';
import { motion, AnimatePresence } from 'framer-motion';
import { HiDownload, HiViewGrid, HiCalendar, HiUserCircle, HiGlobeAlt, HiX, HiFlag, HiCheckCircle } from 'react-icons/hi';
import { SkeletonCard } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DeveloperProfile = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportData, setReportData] = useState({ category: 'other', reason: '' });

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

  const handleReport = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please sign in to report');
    setReporting(true);
    try {
      await api.post('/reports', { 
        developerId: id, 
        category: reportData.category, 
        customReason: reportData.reason 
      });
      toast.success('Developer report submitted');
      setReportModalOpen(false);
      setReportData({ category: 'other', reason: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setReporting(false);
    }
  };

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
        description={`Explore the collection of apps developed by ${developer.name} on Baqala.`}
      />

      {/* Report Modal */}
      <AnimatePresence>
        {reportModalOpen && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setReportModalOpen(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-dark-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setReportModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-accent-violet transition-colors"
              >
                <HiX className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Report Developer</h2>
              <p className="text-sm text-slate-500 font-bold mb-6 italic">Help us moderate the community.</p>
              
              <form onSubmit={handleReport} className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Category</label>
                  <select 
                    value={reportData.category}
                    onChange={e => setReportData({...reportData, category: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-accent-violet/50"
                  >
                    <option value="scam_fake" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Scam or Fake Apps</option>
                    <option value="inappropriate_content" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Inappropriate Content</option>
                    <option value="copyright_violation" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Copyright Violations</option>
                    <option value="misleading_description" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Misleading Description</option>
                    <option value="spam" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Spamming Activities</option>
                    <option value="harassment" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Harassment</option>
                    <option value="impersonation" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Impersonation</option>
                    <option value="other" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Other Issue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Reason</label>
                  <textarea 
                    value={reportData.reason}
                    onChange={e => setReportData({...reportData, reason: e.target.value})}
                    placeholder="Provide details..."
                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-accent-violet/50 h-32 resize-none"
                    maxLength={500}
                  />
                </div>
                <button type="submit" disabled={reporting} className="w-full btn-primary py-4 font-black tracking-widest disabled:opacity-50">
                  {reporting ? 'Submitting...' : 'Submit Report'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                {(developer?.name || 'D').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-2">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {developer?.name || 'Unknown'}
            </h1>
            <div className="flex gap-2">
              {developer.email === 'moyeedkhan74@gmail.com' && (
                <span className="badge-neon !bg-accent-sun/10 !text-accent-sun !border-accent-sun/20 uppercase tracking-widest text-[10px] px-3 py-1">Developer</span>
              )}
              {developer.isVerified && (
                <span className="badge-neon uppercase tracking-widest text-[10px] px-3 py-1 flex items-center gap-1">
                  <HiCheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
              <button 
                onClick={() => setReportModalOpen(true)}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors border border-slate-200 dark:border-white/10 px-3 py-1 rounded-full flex items-center gap-1"
              >
                <HiFlag className="w-3 h-3" />
                Report
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-6">
            <div className="flex flex-col">
              <span className="text-2xl font-black text-accent-violet">{stats?.totalApps || 0}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Apps</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-accent-emerald">{stats?.totalDownloads || 0}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Downloads</span>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5">
            <p className="text-base text-slate-600 dark:text-gray-400 max-w-2xl leading-relaxed">
              {developer?.bio || 'Professional developer contributing to the Baqala ecosystem.'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Apps Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Software Portfolio</h2>
        {apps && apps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {apps.map((app, index) => (
              <AppCard key={app._id} app={app} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-3xl">
            <p className="text-slate-500 italic">No public apps released yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperProfile;
