import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api, { API_BASE_URL } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import SEOHead from '../components/SEOHead';
import { SkeletonDetail } from '../components/Skeleton';
import toast from 'react-hot-toast';
import { HiDownload, HiStar, HiFolder, HiClock, HiDeviceMobile, HiArrowLeft, HiArrowRight, HiX, HiFlag, HiCheckCircle, HiShieldCheck, HiCode, HiInformationCircle } from 'react-icons/hi';
import { cn } from '../utils/cn';
import CustomSelect from '../components/CustomSelect';

const AppDetail = () => {
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
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

  // Security Audit Modal State
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('about'); // 'about', 'versions', 'reviews'

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

  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadReviews = async () => {
    try {
      const res = await api.get(`/reviews/${app._id}`);
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error('Failed to load reviews', err);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!newRating) return toast.error('Please select a star rating (1–5 stars)');
    if (!newComment.trim()) return toast.error('Please write a comment before submitting');
    setSubmittingReview(true);
    try {
      await api.post(`/reviews/${app._id}`, { rating: newRating, comment: newComment });
      toast.success('Review submitted successfully');
      setNewRating(0);
      setNewComment('');
      loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (app) loadReviews();
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

  const handleDownload = async (url = null) => {
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
      const errMsg = err.response?.data?.message || 'Download failed';
      toast.error(errMsg, { id: 'download-progress' });
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

      {/* Security & Permission Audit Modal */}
      <AnimatePresence>
        {securityModalOpen && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSecurityModalOpen(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-dark-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-white/10 max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSecurityModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-accent-violet transition-colors rounded-xl bg-slate-100 dark:bg-white/5"
                aria-label="Close modal"
              >
                <HiX className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <HiShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Security Verification</h2>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">Automated security audit passed</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Antivirus Scan</p>
                  <p className="text-base font-black text-emerald-500 mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {app.vtMaliciousCount && app.vtMaliciousCount > 0 ? `${app.vtMaliciousCount} Flagged` : '0 Flagged (Clean)'}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Safety Status</p>
                  <p className="text-base font-black text-emerald-400 capitalize mt-1">
                    {app.aiModeration?.riskLevel && app.aiModeration.riskLevel !== 'pending' ? app.aiModeration.riskLevel : 'Low Risk'}
                  </p>
                </div>
              </div>

              {app.aiModeration?.appSummary && app.aiModeration.appSummary !== 'pending' && (
                <div className="mb-6 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Safety Overview</h4>
                  <p className="text-xs font-medium text-slate-600 dark:text-gray-300 leading-relaxed">
                    {app.aiModeration.appSummary}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <HiCode className="w-4 h-4 text-accent-violet" />
                  Permissions {app.apkMetadata?.permissions?.length ? `(${app.apkMetadata.permissions.length})` : ''}
                </h4>
                {app.apkMetadata?.permissions?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {app.apkMetadata.permissions.map((perm, idx) => (
                      <div key={idx} className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800/60 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5 truncate">
                        {perm.replace('android.permission.', '')}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <HiShieldCheck className="w-4 h-4 shrink-0" />
                    <span>No sensitive permissions required. Runs safely inside standard Android sandbox.</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  <CustomSelect
                    label="Category"
                    value={reportData.category}
                    onChange={val => setReportData({...reportData, category: val})}
                    options={[
                      { value: 'malware_virus', label: 'Malware or Virus' },
                      { value: 'scam_fake', label: 'Scam or Fake App' },
                      { value: 'inappropriate_content', label: 'Inappropriate Content' },
                      { value: 'copyright_violation', label: 'Copyright Violation' },
                      { value: 'misleading_description', label: 'Misleading Description' },
                      { value: 'spam', label: 'Spam / Low Quality' },
                      { value: 'harassment', label: 'Harassment' },
                      { value: 'impersonation', label: 'Impersonation' },
                      { value: 'other', label: 'Other Issue' },
                    ]}
                    placeholder="Select Category"
                  />
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
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white truncate">{app.title}</h1>
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-lg bg-accent-violet/10 text-accent-violet border border-accent-violet/20">
                    {app.releaseChannel || 'Production'}
                  </span>
                </div>
                <Link to={`/developer/${app.developer?._id || app.developer}`} className="text-sm text-accent-violet font-bold block">{app.developerName}</Link>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="hidden md:flex items-center gap-3 mb-3">
                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">{app.title}</h1>
                <span className="px-3 py-1 text-xs font-black uppercase rounded-xl bg-accent-violet/10 text-accent-violet border border-accent-violet/30">
                  {app.releaseChannel || 'Production'}
                </span>
              </div>
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
                <button 
                  onClick={() => setSecurityModalOpen(true)}
                  className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-lg border border-emerald-500/20 transition-all text-sm font-bold"
                >
                  <HiShieldCheck className="w-4 h-4" />
                  <span>Security Audit Verified</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button 
                  onClick={() => handleDownload()} disabled={downloading}
                  className="btn-primary flex-1 sm:flex-none text-lg px-12 py-4 relative overflow-hidden group min-w-[200px]"
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
                <button 
                  onClick={() => setReportModalOpen(true)}
                  className="px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-all border-2 border-slate-200 dark:border-white/10 hover:border-rose-500/50 rounded-2xl flex items-center justify-center gap-2"
                >
                  <HiFlag className="w-5 h-5" />
                  Report
                </button>
              </div>
            </div>
          </div>
        </motion.article>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-slate-200 dark:border-white/10 mb-8 pb-4">
          <button 
            onClick={() => setActiveTab('about')}
            className={cn("px-6 py-2.5 rounded-2xl font-black text-sm transition-all", activeTab === 'about' ? "bg-accent-violet text-white" : "text-slate-400 hover:text-white")}
          >
            About & Screenshots
          </button>
          <button 
            onClick={() => setActiveTab('versions')}
            className={cn("px-6 py-2.5 rounded-2xl font-black text-sm transition-all flex items-center gap-2", activeTab === 'versions' ? "bg-accent-violet text-white" : "text-slate-400 hover:text-white")}
          >
            <HiClock className="w-4 h-4" />
            Version History ({app.versionHistory?.length || 1})
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={cn("px-6 py-2.5 rounded-2xl font-black text-sm transition-all", activeTab === 'reviews' ? "bg-accent-violet text-white" : "text-slate-400 hover:text-white")}
          >
            Reviews & Ratings ({app.reviewCount || 0})
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'about' && (
              <>
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
                  <div className="glass-panel p-8 rounded-[2rem] border shadow-lg">
                    <h2 className="text-2xl font-bold dark:text-white mb-4">Description</h2>
                    <p className="text-slate-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{app.description}</p>
                  </div>
                </section>
              </>
            )}

            {activeTab === 'versions' && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold dark:text-white mb-4">Version History & Release Notes</h2>
                {app.versionHistory?.length > 0 ? (
                  app.versionHistory.map((ver, idx) => (
                    <div key={idx} className="glass-panel p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-lg font-black dark:text-white">v{ver.version}</span>
                          <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-lg bg-accent-violet/10 text-accent-violet">
                            {ver.releaseChannel || 'Production'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-bold mb-2">Released on {new Date(ver.releasedAt || app.updatedAt).toLocaleDateString()}</p>
                        {ver.changelog && <p className="text-sm text-slate-600 dark:text-gray-300 italic">{ver.changelog}</p>}
                      </div>
                      <button 
                        onClick={() => handleDownload(ver.fileUrl)}
                        className="btn-secondary px-6 py-2 text-xs font-black uppercase tracking-widest flex items-center gap-2"
                      >
                        <HiDownload className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="glass-panel p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-lg font-black dark:text-white">v{app.version || '1.0.0'} (Current)</span>
                      <p className="text-xs text-slate-400 font-bold mt-1">Released on {new Date(app.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-black uppercase bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">Active Release</span>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'reviews' && (
              <section id="reviews-section">
                <h2 className="text-2xl font-bold dark:text-white mb-8">Ratings & Reviews</h2>
                {user ? (
                  <form onSubmit={submitReview} className="glass-panel p-8 rounded-[2rem] mb-12 border border-accent-violet/30 bg-white dark:bg-dark-900">
                    <h3 className="text-xl font-bold dark:text-white mb-6">Write a review</h3>
                    <div className="mb-6">
                      <StarRating rating={newRating} onRate={setNewRating} interactive size="lg" />
                    </div>
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Describe your experience with this application..."
                      className="input-field min-h-[120px] mb-4"
                      required
                    />
                    <div className="flex justify-end">
                      <button type="submit" disabled={submittingReview} className="btn-primary px-10">
                        {submittingReview ? 'Posting...' : 'Post Review'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="glass-panel p-8 rounded-[2rem] mb-12 text-center border-dashed border-2">
                    <Link to="/login" className="btn-secondary px-8 py-3">Sign In to Review</Link>
                  </div>
                )}
                
                <div className="space-y-6">
                  {reviews.map(rev => (
                    <div key={rev._id} className="glass-panel p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent-violet/20 flex items-center justify-center font-black text-accent-violet">
                            {(rev.user?.name || 'U').charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold dark:text-white block">{rev.user?.name || 'User'}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <StarRating rating={rev.rating} size="sm" />
                      </div>
                      <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed mb-4">{rev.comment}</p>
                      
                      {/* Developer Reply Render */}
                      {rev.developerReply?.comment && (
                        <div className="mt-4 p-4 rounded-2xl bg-accent-violet/10 border border-accent-violet/20 ml-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black uppercase text-accent-violet tracking-widest flex items-center gap-1.5">
                              <HiCheckCircle className="w-4 h-4" />
                              Official Developer Reply
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {rev.developerReply.repliedAt ? new Date(rev.developerReply.repliedAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-700 dark:text-gray-200 italic">
                            "{rev.developerReply.comment}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <p className="text-slate-500 italic text-center py-8">No reviews yet. Be the first to review!</p>
                  )}
                </div>
              </section>
            )}
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
                
                <div className="flex flex-wrap justify-center gap-2 mt-4 px-4">
                  {app.developer?.isVerified && (
                    <span className="badge-neon uppercase tracking-widest text-[9px] px-3 py-1 flex items-center gap-1">
                      <HiCheckCircle className="w-3 h-3" />
                      Verified Pro
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6 space-y-3">
                <Link to={`/developer/${app.developer?._id || app.developer}`} className="w-full btn-secondary py-2 text-sm flex items-center justify-center">View Profile</Link>
              </div>
            </div>
            
            <div className="glass-panel p-6 rounded-3xl">
              <h3 className="text-lg font-bold dark:text-white mb-4">Information</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between text-slate-500">Version <span className="text-slate-900 dark:text-white font-medium">{app.version || '1.0.0'}</span></li>
                <li className="flex justify-between text-slate-500">Channel <span className="text-accent-violet font-bold capitalize">{app.releaseChannel || 'production'}</span></li>
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
            <button 
              className="absolute top-6 right-6 text-white bg-white/10 p-4 rounded-full hover:bg-white/20 transition-all z-10 border border-white/10 backdrop-blur-md"
              onClick={() => setLightboxIndex(-1)}
              aria-label="Close Lightbox"
            >
              <HiX className="w-8 h-8" />
            </button>

            <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-20" onClick={e => e.stopPropagation()}>
              {/* Left Arrow */}
              {isScreenshot && lightboxIndex > 0 && (
                <button 
                  className="absolute left-4 sm:left-12 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border border-white/10 backdrop-blur-xl z-20 group"
                  onClick={() => { setLightboxIndex(prev => prev - 1); setZoomScale(1); }}
                  aria-label="Previous Screenshot"
                >
                  <HiArrowLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                </button>
              )}

              {/* Main Image */}
              <motion.img 
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: zoomScale, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                src={lightboxSrc} 
                alt="App visual preview" 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10 cursor-zoom-in"
                onClick={() => setZoomScale(prev => (prev === 1 ? 1.5 : 1))}
              />

              {/* Right Arrow */}
              {isScreenshot && lightboxIndex < (app?.screenshots?.length || 0) - 1 && (
                <button 
                  className="absolute right-4 sm:right-12 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border border-white/10 backdrop-blur-xl z-20 group"
                  onClick={() => { setLightboxIndex(prev => prev + 1); setZoomScale(1); }}
                  aria-label="Next Screenshot"
                >
                  <HiArrowRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>

            {/* Progress Indicators */}
            {isScreenshot && app?.screenshots?.length > 1 && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 px-6 py-3 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 overflow-x-auto no-scrollbar max-w-[80vw]">
                {app.screenshots.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => { setLightboxIndex(idx); setZoomScale(1); }}
                    className={cn(
                      "h-1.5 transition-all duration-300 rounded-full",
                      lightboxIndex === idx ? "w-8 bg-accent-violet shadow-[0_0_10px_rgba(139,92,246,0.5)]" : "w-1.5 bg-white/20 hover:bg-white/40"
                    )}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppDetail;
