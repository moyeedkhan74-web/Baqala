import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api, { API_BASE_URL } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import SEOHead from '../components/SEOHead';
import { SkeletonDetail } from '../components/Skeleton';
import toast from 'react-hot-toast';
import { HiDownload, HiStar, HiFolder, HiClock, HiDeviceMobile, HiArrowLeft, HiArrowRight, HiX } from 'react-icons/hi';

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
  const [downloadProgress, setDownloadProgress] = useState(0);
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
    setDownloadProgress(0);
    try {
      toast.loading('Preparing your file...', { id: 'download-progress' });

      // Fetch the file through our backend proxy as a blob.
      const proxyPath = `/apps/${id}/proxy-download`;
      const res = await api.get(proxyPath, {
        responseType: 'blob',
        timeout: 120000,
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setDownloadProgress(percentCompleted);
        }
      });

      // Create a local blob URL
      const blob = new Blob([res.data], { 
        type: res.headers['content-type'] || 'application/octet-stream' 
      });
      const blobUrl = window.URL.createObjectURL(blob);

      // Trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      
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
      setDownloadProgress(0);
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
          className="bg-white dark:bg-dark-900 p-6 md:p-12 rounded-[2rem] border border-slate-200 dark:border-white/10 relative overflow-hidden mb-8 md:mb-12 shadow-xl"
        >
          <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center">
            <div className="flex items-center gap-6 w-full md:w-auto">
              <motion.button 
                whileHover={{ scale: 1.05, rotate: -2 }} 
                onClick={() => setLightboxIndex(-2)}
                className="w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 flex-shrink-0 relative cursor-zoom-in"
                aria-label={`View full size icon of ${app.title}`}
              >
                <img 
                  src={getImageUrl(app.icon)} 
                  alt={`${app.title} app icon`}
                  fetchpriority="high"
                  loading="eager"
                  width="192"
                  height="192"
                  decoding="async"
                  className="w-full h-full object-cover rounded-2xl md:rounded-[2rem] border-2 border-white/20 shadow-glass relative z-10" 
                  onError={(e) => { 
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.title)}&background=random&size=256`; 
                  }}
                />
              </motion.button>
              
              <div className="flex-1 md:hidden min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-1 truncate">{app.title}</h1>
                <Link to={`/developer/${app.developer?._id || app.developer}`} className="text-sm text-accent-violet dark:text-accent-neon font-bold block mb-2">{app.developerName || app.developer?.name}</Link>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <HiStar className="text-yellow-400 w-4 h-4" /> {app.averageRating?.toFixed(1) || '0.0'}
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 className="hidden md:block text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight leading-tight">{app.title}</h1>
              {app.tagline && <p className="text-sm md:text-lg text-slate-600 dark:text-gray-300 font-bold mb-3">{app.tagline}</p>}
              <Link to={`/developer/${app.developer?._id || app.developer}`} className="hidden md:flex items-center gap-3 mb-6 group">
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
              
              <div className="flex flex-wrap gap-x-6 gap-y-4 mb-8 text-xs md:text-sm font-semibold">
                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-300">
                  <HiStar className="text-yellow-400 w-5 h-5 hidden md:block" /> 
                  <span className="text-slate-800 dark:text-white md:text-lg">{app.averageRating?.toFixed(1) || '0.0'}</span> 
                  <span className="text-slate-400 dark:text-gray-500">({app.reviewCount || 0})</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-300">
                  <HiFolder className="w-5 h-5 text-accent-violet" /> {app.category}
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-300">
                  <HiDownload className="w-5 h-5 text-accent-emerald" /> {(app.totalDownloads / 1000).toFixed(1)}k+
                </div>
              </div>

              {/* Download Button - Integrated into card for all devices */}
              <div className="mt-8">
                <button 
                  onClick={handleDownload} disabled={downloading}
                  className="btn-primary w-full md:w-auto text-lg px-12 py-4 animate-pulse-slow disabled:opacity-90 relative overflow-hidden group shadow-glow-violet"
                >
                  {downloading && (
                    <motion.div 
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: downloadProgress / 100 }}
                      style={{ transformOrigin: 'left', willChange: 'transform' }}
                      className="absolute inset-0 bg-white/20 z-0 h-full"
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {downloading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Installing {downloadProgress}%
                      </>
                    ) : (
                      <>Install Now</>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </motion.article>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Screenshots Gallery - Moved higher for mobile */}
            {app.screenshots?.length > 0 && (
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-6">Gallery</h2>
                <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar snap-x">
                  {app.screenshots.map((s, i) => (
                    <motion.button 
                      whileHover={{ scale: 1.02 }} 
                      key={i}
                      onClick={() => setLightboxIndex(i)}
                      className="flex-shrink-0"
                    >
                      <img 
                        src={getImageUrl(s)} 
                        alt={`Screenshot ${i + 1} of ${app.title}`}
                        width="250"
                        height="500"
                        loading="lazy"
                        decoding="async"
                        className="h-72 md:h-96 w-auto object-cover rounded-2xl border border-slate-200 dark:border-white/10 shadow-glass snap-center cursor-zoom-in" 
                      />
                    </motion.button>
                  ))}
                </div>
              </motion.section>
            )}


            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <Link 
                to={`/app/${app._id}/about`}
                className="bg-white dark:bg-dark-900 p-8 rounded-[2rem] flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-white/5 transition-all border border-slate-200 dark:border-white/10 shadow-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">About this app</h2>
                    <HiArrowRight className="w-6 h-6 text-accent-violet group-hover:translate-x-2 transition-transform" />
                  </div>
                  <p className="text-slate-600 dark:text-gray-300 leading-relaxed line-clamp-3 font-medium">
                    {app.description}
                  </p>
                </div>
              </Link>
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
                              <img 
                                src={fb.user.avatar} 
                                alt={`${fb.user.name}'s avatar`} 
                                width="56"
                                height="56"
                                loading="lazy"
                                className="w-full h-full object-cover" 
                              />
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
                                      <img 
                                        src={rep.user.avatar} 
                                        alt={`${rep.user.name}'s avatar`} 
                                        width="40"
                                        height="40"
                                        loading="lazy"
                                        className="w-full h-full object-cover" 
                                      />
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
                      <img 
                        src={app.developer.avatar} 
                        alt={`${app.developer.name}'s developer avatar`} 
                        width="80"
                        height="80"
                        loading="lazy"
                        className="w-full h-full object-cover" 
                      />
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
                <div className="mt-5 w-full space-y-4">
                  {app.developer?.specialization && (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-2">Specialization</span>
                      <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-accent-violet/10 to-accent-emerald/10 border border-accent-violet/30 dark:border-accent-neon/30 shadow-glass-colorful">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                           {app.developer.specialization}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {app.developer?.tagline && (
                    <div className="relative py-2 px-4 italic text-center">
                      <span className="absolute top-0 left-0 text-3xl font-serif text-accent-violet/20 leading-none">“</span>
                      <p className="text-sm font-semibold text-slate-600 dark:text-gray-300 leading-relaxed px-4">
                        {app.developer.tagline}
                      </p>
                      <span className="absolute bottom-0 right-0 text-3xl font-serif text-accent-violet/20 leading-none translate-y-2">”</span>
                    </div>
                  )}
                </div>


                <span className="inline-block border-2 border-accent-violet text-accent-violet rounded px-3 py-1 uppercase tracking-[0.2em] text-[11px] font-black mt-4 shadow-[0_0_15px_rgba(139,92,246,0.3)] bg-accent-violet/5">
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
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 touch-none"
            onClick={() => { setLightboxIndex(-1); setZoomScale(1); }}
            id="lightbox-modal"
            onTouchStart={(e) => {
              const touch = e.touches[0];
              const swipeStart = touch.clientX;
              const handleTouchEnd = (ev) => {
                const swipeEnd = ev.changedTouches[0].clientX;
                const diff = swipeStart - swipeEnd;
                if (Math.abs(diff) > 50) {
                  if (diff > 0 && lightboxIndex < (app.screenshots?.length - 1)) setLightboxIndex(p => p + 1);
                  if (diff < 0 && lightboxIndex > 0) setLightboxIndex(p => p - 1);
                }
                document.removeEventListener('touchend', handleTouchEnd);
              };
              document.addEventListener('touchend', handleTouchEnd);
            }}
          >
            <motion.button 
              className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 z-[1100] w-[44px] h-[44px] flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(-1); }}
            >
              <HiX className="w-8 h-8" />
            </motion.button>
            <div className="absolute inset-y-0 left-0 hidden md:flex items-center px-6">
               {isScreenshot && lightboxIndex > 0 && (
                 <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev - 1); }} className="bg-white/10 p-4 rounded-full text-white"><HiArrowLeft className="w-8 h-8" /></button>
               )}
            </div>
            <div className="absolute inset-y-0 right-0 hidden md:flex items-center px-6">
               {isScreenshot && lightboxIndex < (app?.screenshots?.length || 0) - 1 && (
                 <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev + 1); }} className="bg-white/10 p-4 rounded-full text-white"><HiArrowRight className="w-8 h-8" /></button>
               )}
            </div>
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="relative max-w-full max-h-full flex flex-col items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={lightboxSrc} alt=""
                className="max-w-[95vw] max-h-[85vh] md:max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              />
              {/* Dot Indicators */}
              {isScreenshot && (
                <div className="absolute bottom-[-40px] flex gap-2">
                  {app.screenshots.map((_, i) => (
                    <div key={i} className={`h-2 rounded-full transition-all ${lightboxIndex === i ? 'w-6 bg-accent-violet' : 'w-2 bg-white/30'}`} />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppDetail;
