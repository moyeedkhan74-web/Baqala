import React from 'react';
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
  Package
} from 'lucide-react';
import { cn } from '../../utils/cn';

const AdminAppDetailModal = ({ app, onClose }) => {
  if (!app) return null;

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
            src={app.banner || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop'} 
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
              <img src={app.icon} alt={app.title} className="w-full h-full object-contain" />
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

              {app.screenshots && app.screenshots.length > 0 && (
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    Visual Evidence
                    <span className="text-[10px] text-slate-400">({app.screenshots.length} Screens)</span>
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    {app.screenshots.map((ss, idx) => (
                      <div key={idx} className="w-64 h-40 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 shadow-sm hover:shadow-md transition-shadow">
                        <img src={ss} className="w-full h-full object-cover" alt={`Screenshot ${idx + 1}`} />
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAppDetailModal;
