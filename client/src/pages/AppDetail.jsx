import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import toast from 'react-hot-toast';
import { HiDownload, HiStar, HiFolder, HiClock, HiDeviceMobile } from 'react-icons/hi';

const AppDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [app, setApp] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [appRes, revRes] = await Promise.all([
        api.get(`/apps/${id}`),
        api.get(`/reviews/${id}`)
      ]);
      setApp(appRes.data);
      setReviews(revRes.data.reviews);
    } catch (error) { toast.error('Failed to load application data'); }
    finally { setLoading(false); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.post(`/downloads/${id}`, {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', app.filePath.split('/').pop() || `${app.title}-download`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Initialize teleportation sequence (Downloading...)');
      setApp(prev => ({ ...prev, totalDownloads: prev.totalDownloads + 1 }));
    } catch (e) { toast.error('Download sequence failed'); }
    finally { setDownloading(false); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!userRating) return toast.error('Please assign a stellar rating');
    setSubmittingReview(true);
    try {
      await api.post(`/reviews/${id}`, { rating: userRating, comment: userComment });
      toast.success('Telemetry received! Review posted.');
      setUserRating(0); setUserComment('');
      loadData();
    } catch (e) { toast.error(e.response?.data?.message || 'Review transmission failed'); }
    finally { setSubmittingReview(false); }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Erase this transmission?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.success('Transmission erased');
      loadData();
    } catch (e) { toast.error('Deletion failed'); }
  };

  if (loading) return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-5xl mx-auto flex flex-col gap-8">
      <div className="h-64 glass-panel rounded-3xl animate-pulse" />
      <div className="h-40 glass-panel rounded-3xl animate-pulse" />
    </div>
  );
  if (!app) return <div className="text-center text-white py-32 text-2xl font-bold">Signal Lost: App Not Found</div>;

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="glass-panel p-8 md:p-12 rounded-[2rem] relative overflow-hidden mb-12"
        >
          <div className="absolute inset-0 bg-hero-glow opacity-20 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
            <motion.div whileHover={{ scale: 1.05, rotate: -2 }} className="w-32 h-32 md:w-48 md:h-48 flex-shrink-0 relative">
              <div className="absolute inset-0 bg-accent-neon blur-2xl opacity-50 rounded-full" />
              <img src={app.icon} className="w-full h-full object-cover rounded-[2rem] border-2 border-white/20 shadow-glass relative z-10" />
            </motion.div>
            
            <div className="flex-1">
              <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-3 tracking-tight">{app.title}</h1>
              <p className="text-xl text-accent-neon font-medium mb-6">{app.developer?.name}</p>
              
              <div className="flex flex-wrap gap-6 mb-8 text-sm font-semibold">
                <div className="flex items-center gap-2"><HiStar className="text-yellow-400 w-5 h-5"/> <span className="text-white text-lg">{app.averageRating?.toFixed(1) || '0.0'}</span> <span className="text-gray-500">({app.ratings?.length || 0})</span></div>
                <div className="flex items-center gap-2 text-gray-300"><HiFolder className="w-5 h-5 text-accent-violet"/> {app.category}</div>
                <div className="flex items-center gap-2 text-gray-300"><HiDownload className="w-5 h-5 text-accent-emerald"/> {(app.totalDownloads / 1000).toFixed(1)}k+</div>
                <div className="flex items-center gap-2 text-gray-300"><HiDeviceMobile className="w-5 h-5 text-rose-400"/> {app.platform || 'Cross-Platform'}</div>
              </div>

              <button 
                onClick={handleDownload} disabled={downloading}
                className="btn-primary w-full md:w-auto text-lg px-8 py-4 shadow-glow-violet disabled:shadow-none animate-pulse-slow"
              >
                {downloading ? 'Initializing...' : <><HiDownload className="inline mr-2 w-6 h-6"/> Install Experience</>}
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Screenshots Gallery */}
            {app.screenshots?.length > 0 && (
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">Visuals <span className="w-2 h-2 rounded-full bg-accent-neon animate-pulse" /></h2>
                <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar snap-x">
                  {app.screenshots.map((s, i) => (
                    <motion.img 
                      whileHover={{ scale: 1.02 }} 
                      key={i} src={s} 
                      className="h-64 md:h-80 w-auto object-cover rounded-2xl border border-white/10 shadow-glass snap-center" 
                    />
                  ))}
                </div>
              </motion.section>
            )}

            {/* Description */}
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-panel p-8 rounded-3xl">
              <h2 className="text-2xl font-bold text-white mb-4">About this experience</h2>
              <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
                {app.description}
              </div>
            </motion.section>

            {/* Reviews System */}
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <h2 className="text-2xl font-bold text-white mb-6">User Telemetry [{reviews.length}]</h2>
              
              {user ? (
                <form onSubmit={submitReview} className="glass-panel p-6 rounded-3xl mb-8 border border-accent-violet/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent-violet/10 blur-3xl pointer-events-none" />
                  <h3 className="text-lg font-semibold text-white mb-4">Transmit your feedback</h3>
                  <div className="mb-4"><StarRating rating={userRating} setRating={setUserRating} interactive /></div>
                  <textarea
                    value={userComment} onChange={e => setUserComment(e.target.value)}
                    placeholder="Describe your experience in the matrix..." required
                    className="input-field min-h-[100px] mb-4 bg-dark-900/50"
                  />
                  <button type="submit" disabled={submittingReview} className="btn-primary py-2 px-6">Transmit</button>
                </form>
              ) : (
                <div className="glass-panel p-6 rounded-3xl mb-8 flex items-center justify-between bg-white/5">
                  <p className="text-gray-300">Authenticate to transmit feedback.</p>
                  <Link to="/login" className="btn-secondary py-2 px-6">Sign In</Link>
                </div>
              )}

              <div className="space-y-4">
                {reviews.map((r, i) => (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={r._id} className="glass-panel p-6 rounded-2xl relative group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-violet to-accent-emerald flex items-center justify-center font-bold text-white shadow-glow-violet">
                          {r.user?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white leading-tight">{r.user?.name}</p>
                          <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <StarRating rating={r.rating} size="sm" />
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{r.comment}</p>
                    
                    {(user?.role === 'admin' || user?._id === r.user?._id) && (
                      <button onClick={() => deleteReview(r._id)} className="absolute top-4 right-4 text-gray-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold">
                        Delete
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </div>

          {/* Sidebar (Right) */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl">
              <h3 className="text-lg font-bold text-white mb-4">Metadata</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex justify-between"><span className="text-gray-500">Version</span> <span className="text-white font-medium">{app.version || '1.0.0'}</span></li>
                <li className="flex justify-between"><span className="text-gray-500">Updated</span> <span className="text-white font-medium">{new Date(app.updatedAt).toLocaleDateString()}</span></li>
                <li className="flex justify-between"><span className="text-gray-500">Size</span> <span className="text-white font-medium">{app.size ? (app.size / (1024*1024)).toFixed(1) + ' MB' : 'Varies'}</span></li>
                <li className="flex justify-between"><span className="text-gray-500">Rated</span> <span className="text-white font-medium border border-white/20 px-2 py-0.5 rounded text-xs">{app.contentRating || 'Everyone'}</span></li>
              </ul>
            </div>
          </motion.div>
        </div>
        
      </div>
    </div>
  );
};

export default AppDetail;
