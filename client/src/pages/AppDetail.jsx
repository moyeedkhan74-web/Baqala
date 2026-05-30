import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api, { API_BASE_URL } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import SEOHead from '../components/SEOHead';
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
  const [triggerElement, setTriggerElement] = useState(null);

  const lightboxOpen = lightboxIndex !== -1;
  const isScreenshot = lightboxIndex >= 0;
  const lightboxSrc = lightboxIndex === -2 
    ? getImageUrl(app?.icon) 
    : (isScreenshot && app?.screenshots?.[lightboxIndex]) 
      ? getImageUrl(app.screenshots[lightboxIndex]) 
      : null;

  useEffect(() => { loadData(); }, [id]);

  useEffect(() => {
    if (!lightboxOpen) {
      if (triggerElement) {
        triggerElement.focus();
        setTriggerElement(null);
      }
      return;
    }

    // Capture the element that opened the lightbox to restore focus later
    if (!triggerElement) {
      setTriggerElement(document.activeElement);
    }

    const elements = document.querySelectorAll('#lightbox-modal button, #lightbox-modal img');
    const focusableElements = document.querySelectorAll('#lightbox-modal button');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handler = (e) => {
      if (e.key === 'Escape') { 
        setLightboxIndex(-1); 
        setZoomScale(1); 
      }
      
      if (isScreenshot) {
        if (e.key === 'ArrowRight' && lightboxIndex < (app?.screenshots?.length || 0) - 1) {
          setLightboxIndex(prev => prev + 1); 
          setZoomScale(1);
        }
        if (e.key === 'ArrowLeft' && lightboxIndex > 0) {
          setLightboxIndex(prev => prev - 1); 
          setZoomScale(1);
        }
      }

      if (e.key === 'Tab') {
        if (e.shiftKey) { 
          if (document.activeElement === firstElement) { 
            lastElement.focus(); 
            e.preventDefault(); 
          } 
        } else { 
          if (document.activeElement === lastElement) { 
            firstElement.focus(); 
            e.preventDefault(); 
          } 
        }
      }
    };

    // Set initial focus
    setTimeout(() => firstElement?.focus(), 50);
    
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
      // Point to our OWN backend proxy endpoint (same-origin).
      // Same-origin = browser honours the `download` attribute = file saves directly.
      // The backend streams the file through with Content-Disposition: attachment,
      // so the B2 signed URL is never visible anywhere to the user.
      const proxyUrl = `${API_BASE_URL}/apps/${id}/proxy-download`;

      const link = document.createElement('a');
      link.href = proxyUrl;
      link.setAttribute('download', app.fileName || `${app.title}-download`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Your download has started!');
      // Optimistically update UI counter (backend also increments)
      setApp(prev => ({ ...prev, totalDownloads: (prev.totalDownloads || 0) + 1 }));
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Download failed. Please try again.');
    } finally {
      // Keep spinner going a moment so user knows something happened
      setTimeout(() => setDownloading(false), 2000);
    }
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
      <SEOHead 
        title={app.title}
        description={app.tagline || app.description?.substring(0, 160)}
        image={getImageUrl(app.icon)}
        url={`https://baqala-lovat.vercel.app/apps/${app._id}`}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" role="main" id="main-content">
        
        {/* Hero Section */}
        <motion.article 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="glass-panel p-8 md:p-12 rounded-[2rem] relative overflow-hidden mb-12"
        >
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
            <motion.button 
              whileHover={{ scale: 1.05, rotate: -2 }} 
              onClick={() => setLightboxIndex(-2)}
              className="w-32 h-32 md:w-48 md:h-48 flex-shrink-0 relative cursor-zoom-in"
              aria-label={`View full size icon of ${app.title}`}
            >
              <img 
                src={getImageUrl(app.icon)} 
                alt={`${app.title} app icon`}
                className="w-full h-full object-cover rounded-[2rem] border-2 border-white/20 shadow-glass relative z-10" 
                onError={(e) => { 
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.title)}&background=random&size=256`; 
                }}
              />
            </motion.button>
            
            <div className="flex-1">
              <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">{app.title}</h1>
              {app.tagline && <p className="text-lg text-slate-600 dark:text-gray-300 font-bold mb-3">{app.tagline}</p>}
              <p className="text-xl text-accent-violet dark:text-accent-neon font-medium mb-6">{app.developerName || app.developer?.name}</p>
              
              <div className="flex flex-wrap gap-6 mb-8 text-sm font-semibold">
                <div className="flex items-center gap-2" aria-label={`Rating: ${app.averageRating?.toFixed(1) || '0.0'} stars`}>
                  <HiStar className="text-yellow-400 w-5 h-5" aria-hidden="true" /> 
                  <span className="text-slate-800 dark:text-white text-lg">{app.averageRating?.toFixed(1) || '0.0'}</span> 
                  <span className="text-slate-400 dark:text-gray-500">({app.ratings?.length || 0})</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-300" aria-label={`Category: ${app.category}`}>
                  <HiFolder className="w-5 h-5 text-accent-violet" aria-hidden="true" /> {app.category}
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-300" aria-label={`${((app.totalDownloads || 0) / 1000).toFixed(1)}k plus downloads`}>
                  <HiDownload className="w-5 h-5 text-accent-emerald" aria-hidden="true" /> {(app.totalDownloads / 1000).toFixed(1)}k+
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-300" aria-label={`Platform: ${app.platform || 'Cross-Platform'}`}>
                  <HiDeviceMobile className="w-5 h-5 text-rose-400" aria-hidden="true" /> {app.platform || 'Cross-Platform'}
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={handleDownload} disabled={downloading}
                  className="btn-primary w-full md:w-auto text-lg px-8 py-4 animate-pulse-slow disabled:opacity-70 disabled:cursor-not-allowed"
                  aria-label={downloading ? 'Preparing download, please wait...' : `Install ${app.title} now`}
                >
                  {downloading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Downloading...
                    </span>
                  ) : (
                    <><HiDownload className="inline mr-2 w-6 h-6" aria-hidden="true" /> Install Now</>
                  )}
                </button>

                {user?.role === 'admin' && (
                  <button 
                    onClick={toggleFeatured}
                    aria-label={app.isFeatured ? `Remove ${app.title} from featured apps` : `Mark ${app.title} as a featured app`}
                    className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold transition-all border ${app.isFeatured ? 'bg-amber-100/50 border-amber-500 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500' : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-white/5 dark:border-white/10 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10'}`}
                  >
                    {app.isFeatured ? '★ Featured' : '☆ Feature App'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.article>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Screenshots Gallery */}
            {app.screenshots?.length > 0 && (
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">Visuals</h2>
                <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar snap-x">
                  {app.screenshots.map((s, i) => (
                    <motion.button 
                      whileHover={{ scale: 1.02 }} 
                      key={i}
                      aria-label={`View full size screenshot ${i + 1} of ${app.title}`}
                      onClick={() => setLightboxIndex(i)}
                      className="flex-shrink-0"
                    >
                      <img 
                        src={getImageUrl(s)} 
                        alt={`${app.title} screenshot ${i + 1}`}
                        className="h-64 md:h-80 w-auto object-cover rounded-2xl border border-slate-200 dark:border-white/10 shadow-glass snap-center cursor-zoom-in" 
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/600x400?text=Image+Lost'; }}
                      />
                    </motion.button>
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
              aria-label="Close image gallery"
            >
              &times;
            </motion.button>
            <div className="absolute inset-y-0 left-0 flex items-center px-4">
               {isScreenshot && lightboxIndex > 0 && (
                 <button 
                  className="bg-white/10 hover:bg-white/20 p-4 rounded-full text-white backdrop-blur-md"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev - 1); }}
                  aria-label="Previous screenshot"
                 >
                   <HiArrowLeft className="w-8 h-8" />
                 </button>
               )}
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center px-4">
               {isScreenshot && lightboxIndex < (app?.screenshots?.length || 0) - 1 && (
                 <button 
                  className="bg-white/10 hover:bg-white/20 p-4 rounded-full text-white backdrop-blur-md"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev + 1); }}
                  aria-label="Next screenshot"
                 >
                   <HiArrowRight className="w-8 h-8" />
                 </button>
               )}
            </div>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-full max-h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={lightboxSrc} alt={isScreenshot ? `${app.title} screenshot ${lightboxIndex + 1} expanded` : `${app.title} icon expanded`}
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
