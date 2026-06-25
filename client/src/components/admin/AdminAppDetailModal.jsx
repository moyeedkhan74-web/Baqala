import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Calendar, 
  Download, 
  Shield, 
  User, 
  Tag, 
  Globe,
  Star as StarIcon,
  Package,
  ImageIcon,
  Trash2,
  RefreshCw,
  Check,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../utils/cn';
import api, { API_BASE_URL } from '../../api/axios';
import toast from 'react-hot-toast';
import AiAnalysisCard from './AiAnalysisCard';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('/')) {
    const host = API_BASE_URL.replace(/\/api$/, '');
    return `${host}${url}`;
  }
  return url;
};

const AdminAppDetailModal = ({ app, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [activeScreenshotIndex, setActiveScreenshotIndex] = useState(null);
  if (!app) return null;

  const nextScreenshot = (e) => {
    e.stopPropagation();
    if (activeScreenshotIndex !== null && app.screenshots) {
      setActiveScreenshotIndex((activeScreenshotIndex + 1) % app.screenshots.length);
    }
  };

  const prevScreenshot = (e) => {
    e.stopPropagation();
    if (activeScreenshotIndex !== null && app.screenshots) {
      setActiveScreenshotIndex((activeScreenshotIndex - 1 + app.screenshots.length) % app.screenshots.length);
    }
  };

  const handleBannerUpdate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('banner', file);

    setLoading(true);
    const toastId = toast.loading('Uploading promotional banner...');
    try {
      const { data } = await api.post(`/admin/apps/${app._id}/banner`, formData);
      toast.success('Promotional banner updated by Admin!', { id: toastId });
      if (onUpdate) onUpdate(app._id, data.app);
    } catch (err) {
      toast.error('Banner upload failed: ' + (err.response?.data?.message || err.message), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const removeBanner = async () => {
    if (!window.confirm('Wipe this promotional banner?')) return;
    setLoading(true);
    const toastId = toast.loading('Removing banner...');
    try {
      const { data } = await api.delete(`/admin/apps/${app._id}/banner`);
      toast.success('Banner removed', { id: toastId });
      if (onUpdate) onUpdate(app._id, data.app);
    } catch (err) {
      toast.error('Failed to remove banner', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        {/* Header Section */}
        <div className="relative h-48 sm:h-64 bg-slate-100 dark:bg-white/5 overflow-hidden shrink-0">
          <img 
            src={getImageUrl(app.banner) || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop'} 
            className="w-full h-full object-cover opacity-50 dark:opacity-20"
            alt="App Banner"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 to-transparent" />
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-xl text-slate-500 dark:text-white transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end gap-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-white dark:bg-slate-800 p-4 shadow-2xl border border-slate-200 dark:border-white/10 shrink-0">
              <img src={getImageUrl(app.icon)} alt={app.title} className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 mb-2">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{app.title}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="px-3 py-1 bg-accent-violet rounded-full text-[10px] font-black uppercase text-white tracking-widest shadow-lg shadow-accent-violet/20">
                  {Array.isArray(app.category) ? app.category.join(' • ') : app.category}
                </span>
                {app.isFeatured && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 rounded-full text-[10px] font-black uppercase text-white tracking-widest shadow-lg shadow-amber-500/20">
                    <StarIcon className="w-3 h-3 fill-current" />
                    Featured
                  </span>
                )}
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                  app.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  app.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  'bg-rose-500/10 text-rose-500 border-rose-500/20'
                )}>
                  {app.status}
                </span>
                {app.aiModeration?.approvalScore != null ? (
                  <div className="flex flex-col items-center gap-1.5 px-3 py-1 rounded-full border bg-accent-violet/[0.03] border-accent-violet/20">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent-violet">AI Rating</span>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className={cn("w-3 h-3", i < Math.round(app.aiModeration.approvalScore / 20) ? "fill-current" : "opacity-20")} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded-full border bg-slate-500/10 text-slate-400 border-slate-500/20 text-[10px] font-black uppercase tracking-widest">
                    AI Scans Pending
                  </div>
                )}
                {app.aiModeration?.approvalScore != null && (
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5",
                    app.aiModeration.approvalScore >= 85 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                    app.aiModeration.approvalScore >= 60 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                    "bg-rose-500/10 text-rose-500 border-rose-500/20"
                  )}>
                    <Shield className="w-3 h-3" />
                    AI Score: {app.aiModeration.approvalScore}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-10 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">Description</h3>
                <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed whitespace-pre-wrap">
                  {app.description || 'No description provided.'}
                </p>
              </div>

              {(app.aiModeration?.appSummary || app.aiModeration?.shortDescription) && (
                <div className="p-6 rounded-[2rem] bg-indigo-500/[0.03] border border-indigo-500/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                      <Shield className="w-4 h-4" /> AI Guard Summary
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-bold leading-relaxed italic">
                    "{app.aiModeration.appSummary || app.aiModeration.shortDescription}"
                  </p>
                  
                  {/* AI Metadata Sync - Short Description */}
                  {app.aiModeration.shortDescription && (
                    <div className="pt-4 border-t border-indigo-500/10">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">AI Suggested Hook</span>
                          <p className="text-xs font-bold text-slate-500 mt-1">{app.aiModeration.shortDescription}</p>
                        </div>
                        <button 
                          onClick={async () => {
                            const tid = toast.loading('Syncing AI hook...');
                            try {
                              const { data } = await api.patch(`/admin/apps/${app._id}/status`, { 
                                shortDescription: app.aiModeration.shortDescription 
                              });
                              toast.success('Short description updated!', { id: tid });
                              onUpdate(app._id, data.app);
                            } catch (e) {
                              toast.error('Failed to sync description', { id: tid });
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-indigo-500/20"
                        >
                          <Zap className="w-3 h-3 fill-current" /> Apply Hook
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {app.screenshots && app.screenshots.length > 0 && (
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    Visual Evidence
                    <span className="text-[10px] text-slate-400">({app.screenshots.length} Screens)</span>
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    {app.screenshots.map((ss, idx) => (
                      <div 
                        key={idx} 
                        className="w-64 h-40 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group/ss relative"
                        onClick={() => setActiveScreenshotIndex(idx)}
                      >
                        <img src={getImageUrl(ss)} className="w-full h-full object-cover" alt={`Screenshot ${idx + 1}`} />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/ss:opacity-100 transition-opacity flex items-center justify-center">
                           <span className="text-white text-[10px] font-black uppercase tracking-tighter bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">Enlarge View</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5">
                   <div className="flex items-center gap-3 text-slate-400 mb-2">
                      <Download className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Growth</span>
                   </div>
                   <p className="text-2xl font-black text-slate-900 dark:text-white">{(app.totalDownloads || 0).toLocaleString()}</p>
                   <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Total Installs</p>
                </div>
                <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5">
                   <div className="flex items-center gap-3 text-slate-400 mb-2">
                      <Globe className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Presence</span>
                   </div>
                   <p className="text-2xl font-black text-slate-900 dark:text-white capitalize">{app.type || 'Web App'}</p>
                   <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Manifest Type</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-8 rounded-[2.5rem] bg-slate-950 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-violet/20 to-transparent pointer-events-none" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 relative z-10">Developer Ownership</h3>
                <div className="flex items-center gap-4 relative z-10 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-black text-white border border-white/10 uppercase">
                    {typeof app.developer === 'object' && app.developer?.name ? app.developer.name.charAt(0) : 'D'}
                  </div>
                  <div>
                    <p className="font-black text-sm">{typeof app.developer === 'object' && app.developer?.name ? app.developer.name : 'Unknown Dev'}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{app.developer?._id ? `ID: ${app.developer._id.substring(0,8)}...` : 'No ID'}</p>
                  </div>
                </div>
                <a 
                  href={app.developer?._id ? `/developer/${app.developer._id}` : '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-slate-950 font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all relative z-10"
                >
                  <User className="w-4 h-4" />
                  View Portfolio
                </a>
              </div>

              <div className="p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Metadata Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                       <Calendar className="w-4 h-4" />
                       Published
                    </div>
                    <span className="text-xs font-black dark:text-white">{new Date(app.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                       <Shield className="w-4 h-4" />
                       Safety
                    </div>
                    <span className={cn(
                      "text-xs font-black",
                      app.isFlagged ? "text-rose-500" : "text-emerald-500"
                    )}>
                      {app.isFlagged ? '🚩 Flagged' : '✅ Verified'}
                    </span>
                  </div>
                   <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                       <Package className="w-4 h-4" />
                       Version
                    </div>
                    <span className="text-xs font-black dark:text-white">v1.2.0</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-4">
                  <a 
                    href={app.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-accent-violet/10 text-accent-violet font-black text-xs uppercase tracking-widest border border-accent-violet/20 hover:bg-accent-violet hover:text-white transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Live App
                  </a>
                </div>
              </div>

              {/* Promotional Banner Curation */}
              <div className="p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <ImageIcon className="w-16 h-16" />
                </div>
                
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 relative z-10">Banner Curation</h3>
                
                {app.banner ? (
                  <div className="space-y-4 relative z-10">
                    <div className="aspect-[21/9] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm relative group">
                      <img src={getImageUrl(app.banner)} className="w-full h-full object-cover" alt="Banner Preview" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={removeBanner} className="p-3 bg-white/20 text-white rounded-full hover:bg-rose-500 transition-all transform hover:scale-110">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <label className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-accent-violet transition-all cursor-pointer border border-slate-200 dark:border-white/5 disabled:opacity-50">
                      <ImageIcon className="w-3.5 h-3.5" /> Replace Banner
                      <input type="file" className="hidden" onChange={handleBannerUpdate} accept="image/*" disabled={loading} />
                    </label>
                  </div>
                ) : (
                  <label className="w-full h-32 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all group disabled:opacity-50 relative z-10">
                    <ImageIcon className="w-8 h-8 text-slate-300 group-hover:text-accent-violet transition-all" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Upload Hero Banner</span>
                    <input type="file" className="hidden" onChange={handleBannerUpdate} accept="image/*" disabled={loading} />
                  </label>
                )}
                
                <p className="text-[9px] font-bold text-slate-400 text-center leading-tight">
                  High-res banners are essential for the home page slider. 1200x500px recommended.
                </p>
              </div>

              {/* AI Analysis Card */}
              <AiAnalysisCard 
                app={app} 
                onUpdate={(newAi) => onUpdate && onUpdate(app._id, { ...app, aiModeration: newAi })} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Screenshots Lightbox */}
      {activeScreenshotIndex !== null && app.screenshots && (
        <div 
          className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300"
          onClick={() => setActiveScreenshotIndex(null)}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between p-6 sm:p-10 relative z-10">
             <div>
                <h4 className="text-white font-black text-xl tracking-tight leading-none">{app.title}</h4>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                   <Package className="w-3 h-3" />
                   Screenshot {activeScreenshotIndex + 1} of {app.screenshots.length}
                </p>
             </div>
             <button 
                onClick={() => setActiveScreenshotIndex(null)}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border border-white/10"
             >
                <X className="w-6 h-6" />
             </button>
          </div>

          {/* Main Viewer */}
          <div className="flex-1 relative flex items-center justify-center p-4 sm:p-12 overflow-hidden">
             {/* Left Arrow */}
             <button 
                onClick={prevScreenshot}
                className="absolute left-4 sm:left-10 w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-white/5 hover:bg-accent-violet hover:text-white text-white flex items-center justify-center transition-all border border-white/5 backdrop-blur-xl group z-20"
             >
                <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
             </button>

             <div className="relative w-full h-full flex items-center justify-center">
                <img 
                  key={activeScreenshotIndex}
                  src={getImageUrl(app.screenshots[activeScreenshotIndex])} 
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl sm:rounded-[2rem] animate-in zoom-in-95 duration-500"
                  alt={`Screenshot ${activeScreenshotIndex + 1}`} 
                  onClick={(e) => e.stopPropagation()}
                />
             </div>

             {/* Right Arrow */}
             <button 
                onClick={nextScreenshot}
                className="absolute right-4 sm:right-10 w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-white/5 hover:bg-accent-violet hover:text-white text-white flex items-center justify-center transition-all border border-white/5 backdrop-blur-xl group z-20"
             >
                <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
             </button>
          </div>

          {/* Thumbnail Progress Bar */}
          <div className="p-10 flex justify-center gap-3 relative z-10 overflow-x-auto no-scrollbar">
             {app.screenshots.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setActiveScreenshotIndex(idx); }}
                  className={cn(
                    "h-1.5 transition-all duration-500 rounded-full",
                    activeScreenshotIndex === idx ? "w-12 bg-accent-violet" : "w-3 bg-white/10 hover:bg-white/20"
                  )}
                />
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppDetailModal;
