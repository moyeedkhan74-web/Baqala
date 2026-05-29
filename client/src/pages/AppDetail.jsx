import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api, { API_BASE_URL } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import { SkeletonDetail } from '../components/Skeleton';
import toast from 'react-hot-toast';
import { HiDownload, HiStar, HiFolder, HiClock, HiDeviceMobile, HiArrowLeft, HiArrowRight } from 'react-icons/hi';

const AppDetail = () => {
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/api/assets/')) {
      const path = url.replace('/api/assets/', '');
      return `https://cdn.baqala.com/file/baqalaaa/${path}`;
    }
    if (url.startsWith('/')) {
      const host = API_BASE_URL.replace(/\/api$/, '');
      return `${host}${url}`;
    }
    return url;
  };

  const { id } = useParams();
  const { user } = useAuth();
  const [app, setApp] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [zoomScale, setZoomScale] = useState(1);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const lightboxOpen = lightboxIndex !== -1;
  const isScreenshot = lightboxIndex >= 0;
  const lightboxSrc = lightboxIndex === -2 
    ? getImageUrl(app?.icon) 
    : (isScreenshot && app?.screenshots?.[lightboxIndex]) 
      ? getImageUrl(app.screenshots[lightboxIndex]) 
      : null;

  useEffect(() => { loadData(); }, [id]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const elements = document.querySelectorAll('#lightbox-modal button, #lightbox-modal img');
    const firstElement = elements[0];
    const lastElement = elements[elements.length - 1];
    const handler = (e) => {
      if (e.key === 'Escape') { setLightboxIndex(-1); setZoomScale(1); }
      if (isScreenshot && e.key === 'ArrowRight' && lightboxIndex < (app?.screenshots?.length || 0) - 1) {
        setLightboxIndex(prev => prev + 1); setZoomScale(1);
      }
      if (isScreenshot && e.key === 'ArrowLeft' && lightboxIndex > 0) {
        setLightboxIndex(prev => prev - 1); setZoomScale(1);
      }
      if (e.key === 'Tab') {
        if (e.shiftKey) { if (document.activeElement === firstElement) { lastElement.focus(); e.preventDefault(); } }
        else { if (document.activeElement === lastElement) { firstElement.focus(); e.preventDefault(); } }
      }
    };
    firstElement?.focus();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, lightboxIndex, isScreenshot, app]);

  const loadData = async () => {
    try {
      const [appRes, revRes] = await Promise.all([
        api.get(`/apps/${id}`),
        api.get(`/reviews/${id}`)
      ]);
      setApp(appRes.data.app);
      setReviews(revRes.data.reviews);
    } catch (error) { toast.error('Failed to load application data'); }
    finally { setLoading(false); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.post(`/downloads/${id}`);
      const downloadUrl = res.data.downloadUrl;
      try {
        const fileRes = await fetch(downloadUrl);
        const blob = await fileRes.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', app.fileName || `${app.title}-download`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      toast.success('Downloading...');
      setApp(prev => ({ ...prev, totalDownloads: prev.totalDownloads + 1 }));
    } catch { toast.error('Download sequence failed'); }
    finally { setDownloading(false); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!userRating) return toast.error('Please assign a rating');
    setSubmittingReview(true);
    try {
      await api.post(`/reviews/${id}`, { rating: userRating, comment: userComment });
      toast.success('Review posted!');
      setUserRating(0); setUserComment('');
      loadData();
    } catch (e) { toast.error(e.response?.data?.message || 'Review transmission failed'); }
    finally { setSubmittingReview(false); }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.success('Review removed');
      loadData();
    } catch { toast.error('Deletion failed'); }
  };

  const toggleFeatured = async () => {
    try {
      setLoading(true);
      await api.put(`/admin/apps/${id}/toggle-featured`);
      toast.success(app.isFeatured ? 'Removed from featured' : 'Marked as featured');
      loadData();
    } catch { toast.error('Failed to update featured status'); }
    finally { setLoading(false); }
  };

  if (loading) return <SkeletonDetail />;
  if (!app) return <div className="text-center py-32 text-2xl font-bold dark:text-white">App Not Found</div>;

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="glass-panel p-8 md:p-12 rounded-[2rem] relative overflow-hidden mb-12"
        >
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: -2 }} 
              onClick={() => setLightboxIndex(-2)}
              className="w-32 h-32 md:w-48 md:h-48 flex-shrink-0 relative cursor-zoom-in"
            >
              <img 
                src={getImageUrl(app.icon)} 
                alt={`${app.title} icon`}
                className="w-full h-full object-cover rounded-[2rem] border-2 border-white/20 shadow-glass relative z-10" 
                onError={(e) => { 
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.title)}&background=random&size=256`; 
                }}
              />
            </motion.div>
            
            <div className="flex-1">
              <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">{app.title}</h1>
              {app.tagline && <p className="text-lg text-slate-600 dark:text-gray-300 font-bold mb-3">{app.tagline}</p>}
              <p className="text-xl text-accent-violet dark:text-accent-neon font-medium mb-6">{app.developerName || app.developer?.name}</p>
              
              <div className="flex flex-wrap gap-6 mb-8 text-sm font-semibold">
                <div className="flex items-center gap-2"><HiStar className="text-yellow-400 w-5 h-5"/> <span className="text-slate-800 dark:text-white text-lg">{app.averageRating?.toFixed(1) || '0.0'}</span> <span className="text-slate-400 dark:text-gray-500">({app.ratings?.length || 0})</span></div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-300"><HiFolder className="w-5 h-5 text-accent-violet"/> {app.category}</div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-300"><HiDownload className="w-5 h-5 text-accent-emerald"/> {(app.totalDownloads / 1000).toFixed(1)}k+</div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-300"><HiDeviceMobile className="w-5 h-5 text-rose-400"/> {app.platform || 'Cross-Platform'}</div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={handleDownload} disabled={downloading}
                  className="btn-primary w-full md:w-auto text-lg px-8 py-4 animate-pulse-slow"
                >
                  {downloading ? 'Initializing...' : <><HiDownload className="inline mr-2 w-6 h-6"/> Install Now</>}
                </button>

                {user?.role === 'admin' && (
                  <button 
                    onClick={toggleFeatured}
                    className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold transition-all border ${app.isFeatured ? 'bg-amber-100/50 border-amber-500 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500' : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-white/5 dark:border-white/10 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10'}`}
                  >
                    {app.isFeatured ? '★ Featured' : '☆ Feature App'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Screenshots Gallery */}
            {app.screenshots?.length > 0 && (
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">Visuals</h2>
                <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar snap-x">
                  {app.screenshots.map((s, i) => (
                    <motion.img 
                      whileHover={{ scale: 1.02 }} 
                      key={i} src={getImageUrl(s)} 
                      alt={`${app.title} screenshot ${i + 1}`}
                      onClick={() => setLightboxIndex(i)}
                      className="h-64 md:h-80 w-auto object-cover rounded-2xl border border-slate-200 dark:border-white/10 shadow-glass snap-center cursor-zoom-in" 
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/600x400?text=Image+Lost'; }}
                    />
                  ))}
                </div>
              </motion.section>
            )}

            {/* Description */}
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-panel p-8 rounded-3xl">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">About this app</h2>
              <div className="text-slate-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {app.description}
              </div>
            </motion.section>

            {/* Reviews System */}
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">User Reviews [{reviews?.filter(r => r.user?.name).length}]</h2>
              
              {user && user._id !== app.developer?._id && user._id !== app.developer?.toString() ? (
                <form onSubmit={submitReview} className="glass-panel p-6 rounded-3xl mb-8 border border-accent-violet/30 relative overflow-hidden">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Share your feedback</h3>
                  <div className="mb-4"><StarRating rating={userRating} setRating={setUserRating} interactive /></div>
                  <textarea
                    value={userComment} onChange={e => setUserComment(e.target.value)}
                    placeholder="Share your experience..." required
                    className="input-field min-h-[100px] mb-4"
                  />
                  <button type="submit" disabled={submittingReview} className="btn-primary py-2 px-6">Submit</button>
                </form>
              ) : !user ? (
                <div className="glass-panel p-6 rounded-3xl mb-8 flex items-center justify-between">
                  <p className="text-slate-600 dark:text-gray-300">Sign in to leave a review.</p>
                  <Link to="/login" className="btn-secondary py-2 px-6">Sign In</Link>
                </div>
              ) : null}

              <div className="space-y-4">
                {reviews.filter(r => r.user && r.user.name).length === 0 && (
                  <div className="glass-panel p-8 rounded-3xl text-center text-slate-500">
                    No reviews yet. Be the first to share your experience!
                  </div>
                )}
                {reviews.filter(r => r.user && r.user.name).map((r, i) => (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={r._id} className="glass-panel p-6 rounded-2xl relative group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-violet to-accent-emerald flex items-center justify-center font-bold text-white">
                          {r.user?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white leading-tight">{r.user?.name}</p>
                          <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <StarRating rating={r.rating} size="sm" />
                    </div>
                    <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed">{r.comment}</p>
                    
                    {(user?.role === 'admin' || user?._id === r.user?._id) && (
                      <button 
                        onClick={() => deleteReview(r._id)} 
                        className="absolute top-4 right-4 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold"
                      >
                        Delete
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </div>

          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Information</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex justify-between"><span className="text-slate-500">Version</span> <span className="text-slate-900 dark:text-white font-medium">{app.version || '1.0.0'}</span></li>
                <li className="flex justify-between"><span className="text-slate-500">Updated</span> <span className="text-slate-900 dark:text-white font-medium">{new Date(app.updatedAt).toLocaleDateString()}</span></li>
                <li className="flex justify-between"><span className="text-slate-500">Size</span> <span className="text-slate-900 dark:text-white font-medium">{app.fileSize ? (app.fileSize / (1024*1024)).toFixed(1) + ' MB' : 'Varies'}</span></li>
                <li className="flex justify-between"><span className="text-slate-500">Rated</span> <span className="text-slate-900 dark:text-white font-medium border border-slate-300 dark:border-white/20 px-2 py-0.5 rounded text-xs">{app.contentRating || 'Everyone'}</span></li>
              </ul>
            </div>
          </motion.div>
        </div>
        
      </div>

      <AnimatePresence>
        {lightboxOpen && lightboxSrc && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl"
            onClick={() => { setLightboxIndex(-1); setZoomScale(1); }}
            id="lightbox-modal"
          >
            <motion.button 
              className="absolute top-8 right-8 text-white/40 hover:text-white text-5xl font-thin z-[110]"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(-1); setZoomScale(1); }}
            >
              &times;
            </motion.button>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-full max-h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={lightboxSrc} alt="Enlarged"
                className="max-w-[90vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl transition-transform duration-500"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppDetail;
