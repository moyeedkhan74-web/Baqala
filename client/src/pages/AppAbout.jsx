import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { API_BASE_URL } from '../api/axios';
import { HiArrowLeft, HiCalendar, HiTag, HiShieldCheck } from 'react-icons/hi';
import SEOHead from '../components/SEOHead';
import { SkeletonDetail } from '../components/Skeleton';

const AppAbout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get(`/apps/${id}`);
        setApp(res.data.app);
      } catch (err) {
        console.error('Failed to load app data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) return <SkeletonDetail />;
  if (!app) return <div className="text-center py-32 text-2xl font-bold dark:text-white">App Not Found</div>;

  return (
    <div className="min-h-screen pt-24 pb-20 bg-white dark:bg-background-dark">
      <SEOHead 
        title={`About ${app.title}`}
        description={`Full details and information for ${app.title}`}
      />
      
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <header className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <HiArrowLeft className="w-6 h-6 text-slate-900 dark:text-white" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">About this app</h1>
        </header>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          {/* Main Description */}
          <section>
            <p className="text-slate-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-lg">
              {app.description}
            </p>
          </section>

          {/* Technical Specs */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">App Info</h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-violet/10 flex items-center justify-center text-accent-violet">
                   <HiTag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Version</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{app.version || '1.0.0'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-neon/10 flex items-center justify-center text-accent-neon">
                   <HiCalendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Last Updated</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{new Date(app.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-emerald/10 flex items-center justify-center text-accent-emerald">
                   <HiShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Compatibility</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">Web, Android, iOS (Responsive)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Privacy Note */}
          <section className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Data Safety</h3>
            <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">
              Safety starts with understanding how developers collect and share your data. Data privacy and security practices may vary based on your use, region, and age. The developer provided this information and may update it over time.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
};

export default AppAbout;
