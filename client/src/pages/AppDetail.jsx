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

  // Reporting State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportData, setReportData] = useState({ category: 'other', reason: '' });

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

    if (!triggerElement) {
      setTriggerElement(document.activeElement);
    }

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
      const proxyPath = `/apps/${id}/proxy-download`;
      const res = await api.get(proxyPath, {
        responseType: 'blob',
        timeout: 120000,
        onDownloadProgress: (pe) => setDownloadProgress(Math.round((pe.loaded * 100) / pe.total))
      });
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      let filename = app.fileName || `${app.title}-download`;
      const disposition = res.headers['content-disposition'];
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Download started!', { id: 'download-progress' });
      setApp(prev => ({ ...prev, totalDownloads: (prev.totalDownloads || 0) + 1 }));
    } catch (err) {
      toast.error('Download failed', { id: 'download-progress' });
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please sign in to report');
    setReporting(true);
    try {
      await api.post('/reports', { 
        appId: app._id, 
        category: reportData.category, 
        customReason: reportData.reason 
      });
      toast.success('Report submitted successfully');
      setReportModalOpen(false);
      setReportData({ category: 'other', reason: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setReporting(false);
    }
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
                aria-label="Close modal"
              >
                <HiX className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Report App</h2>
              <p className="text-sm text-slate-500 font-bold mb-6 italic">Help us keep Baqala safe.</p>
              
              <form onSubmit={handleReport} className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Category</label>
                  <select 
                    value={reportData.category}
                    onChange={e => setReportData({...reportData, category: e.target.value})}
                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-accent-violet/50"
                  >
                    <option value="malware_virus">Malware or Virus</option>
                    <option value="scam_fake">Scam or Fake App</option>
                    <option value="inappropriate_content">Inappropriate Content</option>
                    <option value="copyright_violation">Copyright Violation</option>
                    <option value="misleading_description">Misleading Description</option>
                    <option value="spam">Spam / Low Quality</option>
                    <option value="other">Other Issue</option>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.article 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-900 p-6 md:p-12 rounded-[2rem] border border-slate-200 dark:border-white/10 relative overflow-hidden mb-8 md:mb-12 shadow-xl"
        >
          <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center">
            <div className="flex items-center gap-6 w-full md:w-auto">
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                onClick={() => setLightboxIndex(-2)}
                className="w-24 h-24 md:w-48 md:h-48 flex-shrink-0 relative cursor-zoom-in"
              >
                <img 
                  src={getImageUrl(app.icon)} 
                  alt={app.title}
                  className="w-full h-full object-cover rounded-2xl md:rounded-[2rem] border-2 border-white/20 shadow-glass" 
                />
              </motion.button>
              <div className="flex-1 md:hidden">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1 truncate">{app.title}</h1>
                <Link to={`/developer/${app.developer?._id || app.developer}`} className="text-sm text-accent-violet font-bold block">{app.developerName}</Link>
              </div>
            </div>
            
            <div className="flex-1">
              <h1 className="hidden md:block text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">{app.title}</h1>
              <p className="text-lg text-slate-600 dark:text-gray-300 font-bold mb-3">{app.tagline}</p>
              <Link to={`/developer/${app.developer?._id || app.developer}`} className="hidden md:flex items-center gap-3 mb-6">
                <span className="text-xl text-accent-violet dark:text-accent-neon font-medium">{app.developerName}</span>
              </Link>
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-lg">
                  <HiStar className="text-yellow-400" /> <span className="font-bold dark:text-white">{app.averageRating?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-lg">
                  <HiDownload className="text-accent-emerald" /> <span className="font-bold dark:text-white">{(app.totalDownloads / 1000).toFixed(1)}k+</span>
                </div>
              </div>
              <button 
                onClick={handleDownload} disabled={downloading}
                className="btn-primary w-full md:w-auto text-lg px-12 py-4 relative overflow-hidden group"
              >
                {downloading && (
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: downloadProgress / 100 }}
                    style={{ transformOrigin: 'left' }}
                    className="absolute inset-0 bg-white/20 z-0 h-full"
                  />
                )}
                <span className="relative z-10">{downloading ? `Installing ${downloadProgress}%` : 'Install Now'}</span>
              </button>
            </div>
          </div>
        </motion.article>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            {app.screenshots?.length > 0 && (
              <section>
                <h2 className="text-xl md:text-2xl font-black dark:text-white mb-6">Gallery</h2>
                <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar snap-x">
                  {app.screenshots.map((s, i) => (
                    <button key={i} onClick={() => setLightboxIndex(i)} className="flex-shrink-0">
                      <img 
                        src={getImageUrl(s)} 
                        alt={`Screenshot ${i + 1}`}
                        className="h-72 md:h-96 w-auto object-cover rounded-2xl border dark:border-white/10 shadow-glass snap-center" 
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* About */}
            <section>
              <Link to={`/app/${app._id}/about`} className="glass-panel p-8 rounded-[2rem] block group border shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold dark:text-white">About this app</h2>
                  <HiArrowRight className="w-6 h-6 text-accent-violet group-hover:translate-x-2 transition-transform" />
                </div>
                <p className="text-slate-600 dark:text-gray-300 leading-relaxed line-clamp-3">{app.description}</p>
              </Link>
            </section>

            {/* Reviews */}
            <section id="reviews-section">
              <h2 className="text-2xl font-bold dark:text-white mb-8">Ratings & Reviews</h2>
              {user ? (
                <form onSubmit={submitFeedback} className="glass-panel p-8 rounded-[2rem] mb-12 border border-accent-violet/30 bg-white dark:bg-dark-900">
                  <h3 className="text-xl font-bold dark:text-white mb-6">Write a review</h3>
                  <div className="mb-6">
                    <StarRating rating={newRating} onRate={setNewRating} interactive size="lg" />
                  </div>
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Describe your experience..."
                    className="input-field min-h-[120px] mb-4"
                    required
                  />
                  <div className="flex justify-end">
                    <button type="submit" disabled={submittingFeedback} className="btn-primary px-10">
                      {submittingFeedback ? 'Posting...' : 'Post Review'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="glass-panel p-8 rounded-[2rem] mb-12 text-center border-dashed border-2">
                  <Link to="/login" className="btn-secondary px-8 py-3">Sign In to Review</Link>
                </div>
              )}
              {/* Feedback List (Placeholder for brevity) */}
              <div className="space-y-6">
                {feedbacks.map(fb => (
                  <div key={fb._id} className="glass-panel p-6 rounded-[2.5rem]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold dark:text-white">{fb.user?.name}</span>
                      <StarRating rating={fb.rating} size="sm" />
                    </div>
                    <p className="text-slate-600 dark:text-gray-300">{fb.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="glass-panel overflow-hidden rounded-3xl border">
              <div className="bg-gradient-to-br from-accent-violet/10 to-accent-emerald/10 p-6 flex flex-col items-center">
                <Link to={`/developer/${app.developer?._id || app.developer}`} className="mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 bg-white flex items-center justify-center">
                    {app.developer?.avatar ? <img src={app.developer.avatar} alt="" /> : <span className="text-3xl font-bold text-accent-violet">{(app.developerName || 'D').charAt(0)}</span>}
                  </div>
                </Link>
                <Link to={`/developer/${app.developer?._id || app.developer}`} className="text-xl font-bold dark:text-white">{app.developerName}</Link>
                <span className="inline-block border-2 border-accent-violet text-accent-violet rounded px-3 py-1 uppercase tracking-widest text-[11px] font-black mt-4">Publisher</span>
              </div>
              <div className="p-6 space-y-3">
                <Link to={`/developer/${app.developer?._id || app.developer}`} className="w-full btn-secondary py-2 text-sm flex items-center justify-center">View Profile</Link>
                <button onClick={() => setReportModalOpen(true)} className="w-full py-2 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest">Report this App</button>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-3xl">
              <h3 className="text-lg font-bold dark:text-white mb-4">Information</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between text-slate-500">Version <span className="text-slate-900 dark:text-white font-medium">{app.version || '1.0.0'}</span></li>
                <li className="flex justify-between text-slate-500">Updated <span className="text-slate-900 dark:text-white font-medium">{new Date(app.updatedAt).toLocaleDateString()}</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && lightboxSrc && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95"
            onClick={() => { setLightboxIndex(-1); setZoomScale(1); }}
            id="lightbox-modal"
          >
            <button className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full hover:bg-white/20"><HiX className="w-8 h-8" /></button>
            <div className="relative p-4" onClick={e => e.stopPropagation()}>
              <img src={lightboxSrc} alt="" className="max-w-[95vw] max-h-[85vh] object-contain rounded-2xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppDetail;
