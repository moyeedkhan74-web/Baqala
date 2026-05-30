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
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [zoomScale, setZoomScale] = useState(1);

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

  const [feedbacks, setFeedbacks] = useState([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyComment, setReplyComment] = useState('');

  const loadFeedback = async () => {
    try {
      const res = await api.get(`/feedback/${app._id}`);
      const data = res.data.feedback || [];
      // Organize replies under parent feedback
      const map = {};
      data.forEach(fb => {
        fb.replies = [];
        map[fb._id] = fb;
      });
      const topLevel = [];
      data.forEach(fb => {
        if (fb.parent) {
          if (map[fb.parent]) map[fb.parent].replies.push(fb);
        } else {
          topLevel.push(fb);
        }
      });
      setFeedbacks(topLevel);
    } catch (err) {
      console.error('Failed to load feedback', err);
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!newRating || !newComment.trim()) return toast.error('Rating and comment required');
    setSubmittingFeedback(true);
    try {
      await api.post(`/feedback/${app._id}`, { rating: newRating, comment: newComment });
      toast.success('Feedback submitted');
      setNewRating(0);
      setNewComment('');
      loadFeedback();
    } catch (err) {
      toast.error('Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const reactFeedback = async (feedbackId, type) => {
    try {
      await api.post(`/feedback/${feedbackId}/react`, { type });
      loadFeedback();
    } catch (err) {
      console.error('Reaction error', err);
    }
  };

  const toggleReply = (fbId) => {
    setReplyingTo(replyingTo === fbId ? null : fbId);
    setReplyComment('');
  };

  const submitReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyComment.trim()) return;
    try {
      await api.post(`/feedback/${app._id}`, { rating: 0, comment: replyComment, parentId });
      toast.success('Reply posted');
      setReplyingTo(null);
      setReplyComment('');
      loadFeedback();
    } catch (err) {
      console.error('Reply error', err);
      toast.error('Failed to post reply');
    }
  };

  // Load feedback after app data is loaded
  useEffect(() => {
    if (app) loadFeedback();
  }, [app]);

  const loadData = async () => {
    try {
      const res = await api.get(`/apps/${id}`);
      setApp(res.data.app);
    } catch (error) { 
      toast.error('Failed to load application data'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      toast.loading('Preparing your file...', { id: 'download-progress' });

      // Fetch the file through our backend proxy as a blob.
      // This is the most reliable cross-origin silent download method.
      const proxyPath = `/apps/${id}/proxy-download`;
      const res = await api.get(proxyPath, {
        responseType: 'blob',
        timeout: 120000 // 2 minutes for large files
      });

      // Create a local blob URL
      const blob = new Blob([res.data], { 
        type: res.headers['content-type'] || 'application/octet-stream' 
      });
      const blobUrl = window.URL.createObjectURL(blob);

      // Trigger download from the same-origin blob URL
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Determine filename: check headers first, then app metadata
      let filename = app.fileName || `${app.title}-download`;
      const disposition = res.headers['content-disposition'];
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }
      
      link.setAttribute('download', filename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success('Download started!', { id: 'download-progress' });
      setApp(prev => ({ ...prev, totalDownloads: (prev.totalDownloads || 0) + 1 }));
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Download sequence interrupted. Please check your network.', { id: 'download-progress' });
    } finally {
      setDownloading(false);
    }
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
            
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight leading-tight">{app.title}</h1>
              {app.tagline && <p className="text-lg text-slate-600 dark:text-gray-300 font-bold mb-3">{app.tagline}</p>}
              <Link to={`/developer/${app.developer?._id || app.developer}`} className="flex items-center gap-3 mb-6 group">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-slate-100 flex items-center justify-center">
                   {app.developer?.avatar ? (
                     <img src={app.developer.avatar} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <span className="text-xs font-bold text-accent-violet">{(app.developer?.name || app.developerName || 'D').charAt(0)}</span>
                   )}
                </div>
                <span className="text-xl text-accent-violet dark:text-accent-neon font-medium group-hover:underline transition-all">
                  {app.developer?.name || app.developerName}
                </span>
              </Link>
              
              <div className="flex flex-wrap gap-6 mb-8 text-sm font-semibold">
                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-300" aria-label={`Rating: ${app.averageRating?.toFixed(1) || '0.0'} stars from ${app.reviewCount || 0} reviews`}>
                  <HiStar className="text-yellow-400 w-5 h-5" aria-hidden="true" /> 
                  <span className="text-slate-800 dark:text-white text-lg">{app.averageRating?.toFixed(1) || '0.0'}</span> 
                  <span className="text-slate-400 dark:text-gray-500">({app.reviewCount || 0})</span>
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

            {/* Ratings & Feedback */}
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} id="reviews-section">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  Ratings & Reviews <span className="text-sm font-normal text-slate-400">({app.reviewCount || 0})</span>
                </h2>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-2xl">
                  <HiStar className="text-yellow-400 w-5 h-5" />
                  <span className="text-lg font-bold dark:text-white">{app.averageRating?.toFixed(1) || '0.0'}</span>
                </div>
              </div>
              
              {user ? (
                <form onSubmit={submitFeedback} className="glass-panel p-8 rounded-[2rem] mb-12 border border-accent-violet/30 bg-gradient-to-br from-white to-white dark:from-dark-800 dark:to-dark-900 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                     <HiStar className="w-32 h-32 text-accent-violet" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Write a review</h3>
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Rate your experience</label>
                    <StarRating rating={newRating} onRate={setNewRating} interactive size="lg" />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider">Your feedback</label>
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Describe your experience with this app..."
                      className="input-field min-h-[120px] text-lg py-4"
                      required
                    />
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button type="submit" disabled={submittingFeedback} className="btn-primary py-3 px-10 text-lg shadow-lg shadow-accent-violet/25">
                      {submittingFeedback ? 'Posting...' : 'Post Review'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="glass-panel p-8 rounded-[2rem] mb-12 text-center border-dashed border-2 border-slate-200 dark:border-white/10">
                  <p className="text-lg text-slate-600 dark:text-gray-400 mb-6">Please sign in to share your thoughts and rate this app.</p>
                  <Link to="/login" className="btn-secondary px-8 py-3">Sign In to Review</Link>
                </div>
              )}

              {/* Feedback List */}
              <div className="space-y-8">
                {feedbacks.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 italic">
                    No reviews yet. Be the first to rate this app!
                  </div>
                ) : (
                  feedbacks.map(fb => (
                    <motion.div 
                      key={fb._id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-panel p-6 sm:p-8 rounded-[2.5rem] relative group border-white/40 dark:border-white/10"
                    >
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* User Profile */}
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white dark:border-white/10 bg-slate-100 flex items-center justify-center shadow-lg">
                            {fb.user?.avatar ? (
                              <img src={fb.user.avatar} alt={fb.user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl font-bold text-accent-violet">{(fb.user?.name || 'U').charAt(0)}</span>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            <div>
                              <h4 className="font-extrabold text-lg text-slate-900 dark:text-white leading-tight">{fb.user?.name}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                <StarRating rating={fb.rating} size="sm" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                  {new Date(fb.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => reactFeedback(fb._id, 'like')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-sm font-bold ${
                                  fb.likedBy?.includes(user?._id) 
                                    ? 'bg-accent-violet text-white shadow-lg shadow-accent-violet/25' 
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-accent-violet/10 hover:text-accent-violet'
                                }`}
                              >
                                👍 <span>{fb.likes || 0}</span>
                              </button>
                              <button 
                                onClick={() => reactFeedback(fb._id, 'dislike')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-sm font-bold ${
                                  fb.dislikedBy?.includes(user?._id) 
                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25' 
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-rose-500/10 hover:text-rose-500'
                                }`}
                              >
                                👎 <span>{fb.dislikes || 0}</span>
                              </button>
                            </div>
                          </div>

                          <p className="text-slate-600 dark:text-gray-300 leading-relaxed mb-6 font-medium">
                            {fb.comment}
                          </p>

                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => toggleReply(fb._id)}
                              className="text-sm font-bold text-accent-violet dark:text-accent-neon hover:underline flex items-center gap-2"
                            >
                              {fb.replies?.length > 0 ? `Show Replies (${fb.replies.length})` : 'Reply to review'}
                            </button>
                          </div>

                          {/* Replies Thread */}
                          {fb.replies && fb.replies.length > 0 && (
                            <div className="mt-8 space-y-6 pt-6 border-t border-slate-100 dark:border-white/5">
                              {fb.replies.map(rep => (
                                <div key={rep._id} className="flex gap-4">
                                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/50 bg-slate-50 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                                    {rep.user?.avatar ? (
                                      <img src={rep.user.avatar} alt={rep.user.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-sm font-bold text-accent-violet">{(rep.user?.name || 'U').charAt(0)}</span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-sm text-slate-900 dark:text-white">{rep.user?.name}</span>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                        {new Date(rep.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed">{rep.comment}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reply Form */}
                          {replyingTo === fb._id && (
                            <form onSubmit={e => submitReply(e, fb._id)} className="mt-6 flex gap-3">
                              <input
                                value={replyComment}
                                onChange={e => setReplyComment(e.target.value)}
                                placeholder="Publicly reply to this review..."
                                className="flex-1 bg-slate-100 dark:bg-white/5 border-none outline-none rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-accent-violet/50 transition-all"
                                required
                              />
                              <button type="submit" className="btn-primary py-2 px-6 text-sm">Post Reply</button>
                            </form>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.section>
          </div>

          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="space-y-6">
            
            {/* Developer Card */}
            <div className="glass-panel overflow-hidden rounded-3xl border border-white/20">
              <div className="bg-gradient-to-br from-accent-violet/20 to-accent-emerald/20 p-6 flex flex-col items-center text-center">
                <Link to={`/developer/${app.developer?._id || app.developer}`} className="group relative mb-4">
                  <div className="absolute -inset-1 bg-gradient-to-r from-accent-violet to-accent-emerald rounded-full blur opacity-25 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white bg-white dark:bg-dark-800">
                    {app.developer?.avatar ? (
                      <img src={app.developer.avatar} alt={app.developer.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-accent-violet text-3xl font-bold">
                        {(app.developer?.name || app.developerName || 'D').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </Link>
                <Link 
                  to={`/developer/${app.developer?._id || app.developer}`}
                  className="text-xl font-bold text-slate-900 dark:text-white hover:text-accent-violet dark:hover:text-accent-neon transition-colors"
                >
                  {app.developer?.name || app.developerName}
                </Link>
                {app.developer?.specialization && (
                  <p className="text-sm text-slate-600 dark:text-gray-400 mt-1 font-medium">{app.developer.specialization}</p>
                )}
                {app.developer?.tagline && (
                  <span className="text-[11px] font-bold text-accent-violet dark:text-accent-neon uppercase tracking-wider mt-1 block">
                    {app.developer.tagline}
                  </span>
                )}
                <span className="inline-block border-2 border-accent-violet text-accent-violet rounded px-3 py-1 uppercase tracking-[0.2em] text-[11px] font-black mt-3 shadow-[0_0_15px_rgba(139,92,246,0.3)] bg-accent-violet/5">
                  Publisher
                </span>
              </div>
              
              <div className="p-6">
                <Link 
                  to={`/developer/${app.developer?._id || app.developer}`}
                  className="w-full btn-secondary py-2 text-sm flex items-center justify-center gap-2"
                >
                   View Full Profile
                </Link>
              </div>
            </div>

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
