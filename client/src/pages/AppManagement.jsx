import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Star, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  ArrowUpDown,
  RefreshCw,
  AlertTriangle,
  Shield,
  AlertCircle,
  Clock,
  ShieldCheck,
  Sparkles,
  BookOpen,
  StickyNote,
  X
} from 'lucide-react';
import api from '../api/axios';
import { cn } from '../utils/cn.js';
import toast from 'react-hot-toast';
import IssueWarningModal from '../components/admin/IssueWarningModal';
import AdminAppDetailModal from '../components/admin/AdminAppDetailModal';

const AppManagement = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [warningTarget, setWarningTarget] = useState(null);
  const [isProcessingWarning, setIsProcessingWarning] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [isScanningId, setIsScanningId] = useState(null);
  const [sortByAiScore, setSortByAiScore] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);

  const fetchApps = async () => {
    try {
      const { data } = await api.get('/admin/apps');
      setApps(data.apps);
    } catch (error) {
      console.error('Failed to fetch apps:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // For relative paths, prepend the API base URL
    const baseUrl = api.defaults.baseURL.replace(/\/api$/, '');
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const updateStatus = async (id, status, rejectionReason = '') => {
    const loadingToast = toast.loading(`Marking app as ${status}...`);
    try {
      await api.patch(`/admin/apps/${id}/status`, { status, rejectionReason });
      setApps(apps.map(app => app._id === id ? { ...app, status, rejectionReason } : app));
      toast.success(`App successfully ${status}`, { id: loadingToast });
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status', { id: loadingToast });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    const loadingToast = toast.loading('Permanently removing application...');
    
    try {
      await api.delete(`/admin/apps/${deleteTarget._id}`);
      setApps(apps.filter(app => app._id !== deleteTarget._id));
      toast.success('Application removed perfectly', { id: loadingToast });
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete app:', error);
      toast.error('Failed to remove application', { id: loadingToast });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleWarningConfirm = async ({ reportId, warningMessage }) => {
    setIsProcessingWarning(true);
    const loadingToast = toast.loading('Issuing warning to developer...');
    try {
      // Use the generic app warn endpoint
      await api.post(`/admin/apps/${warningTarget._id}/warn`, { warningMessage });
      toast.success('Warning issued successfully', { id: loadingToast });
      setWarningTarget(null);
    } catch (error) {
      console.error('Failed to issue warning:', error);
      toast.error('Failed to issue warning', { id: loadingToast });
    } finally {
      setIsProcessingWarning(false);
    }
  };

  const handleScan = async (id) => {
    setIsScanningId(id);
    try {
      await api.post(`/admin/apps/${id}/scan`);
      toast.success('Scan initiated. Refreshing soon.');
      setTimeout(fetchApps, 3000);
    } catch (error) {
      console.error('Manual scan failed:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate scan');
    } finally {
      setIsScanningId(null);
    }
  };

  const handleAiAnalyze = async (appId) => {
    setAnalyzingId(appId);
    try {
      const { data } = await api.post(`/admin/apps/${appId}/reanalyze`);
      setApps(prev => prev.map(a => a._id === appId ? (data.app || a) : a));
      toast.success('AI analysis complete ✅');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'AI analysis failed';
      toast.error(errMsg);
      setApps(prev => prev.map(a => {
        if (a._id === appId) {
          return { ...a, aiModeration: { ...(a.aiModeration || {}), analysisError: errMsg } };
        }
        return a;
      }));
    } finally {
      setAnalyzingId(null);
    }
  };
  
  const tabs = [
    { id: 'all', label: 'All Apps' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];

  const filteredApps = apps.filter(app => {
    const matchesTab = activeTab === 'all' || app.status === activeTab;
    const devName = typeof app.developer === 'object' && app.developer?.name ? app.developer.name : '';
    const matchesSearch = app.title.toLowerCase().includes(search.toLowerCase()) || 
                          devName.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  }).sort((a, b) => {
    if (!sortByAiScore) return 0;
    const sa = a.aiModeration?.approvalScore ?? Infinity;
    const sb = b.aiModeration?.approvalScore ?? Infinity;
    return sa - sb; // ascending: lowest (riskiest) first
  });

  const getStatusStyles = (status) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'rejected': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <AdminLayout title="Application Management">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-accent-violet rounded-full shadow-lg shadow-accent-violet/20" />
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Application Fleet</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1.5 tracking-widest">Global inventory management</p>
          </div>
        </div>

        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-accent-violet text-white shadow-lg shadow-accent-violet/20" 
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-accent-violet transition-colors" />
            <input 
              type="text" 
              placeholder="Filter by name or dev..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm outline-none focus:border-accent-violet/30 transition-all w-full md:w-80 shadow-sm"
            />
          </div>
          <button onClick={fetchApps} className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-white/5 text-slate-500 hover:text-accent-violet transition-all shadow-sm">
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="w-12 h-12 border-4 border-accent-violet border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">App Name</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Developer</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Security (VT)</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-accent-violet transition-colors group" onClick={() => setSortByAiScore(!sortByAiScore)}>
                      <div className="flex items-center gap-2">
                        AI INSIGHTS 🛡️
                        <ArrowUpDown className={cn("w-3 h-3 transition-colors", sortByAiScore ? "text-accent-violet" : "text-slate-300 group-hover:text-slate-400")} />
                      </div>
                    </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredApps.map((app) => (
                  <tr key={app._id} className={cn(
                    "group transition-all duration-200 border-l-2",
                    app.isFeatured 
                      ? "bg-accent-violet/[0.02] border-accent-violet" 
                      : "hover:bg-slate-50 dark:hover:bg-white/[0.01] border-transparent"
                  )}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm group-hover:scale-105 transition-transform shrink-0">
                          <img src={getImageUrl(app.icon)} alt={app.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/3344/3344153.png'; }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 dark:text-white truncate max-w-[150px] leading-tight">{app.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-accent-violet uppercase tracking-widest">{app.platform}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold dark:text-slate-300 truncate max-w-[120px]">
                        {typeof app.developer === 'object' && app.developer?.name ? app.developer.name : 'Unknown'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {app.vtResult ? (
                        <div className="flex flex-col gap-1">
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider w-fit",
                            app.vtResult === 'clean' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            app.vtResult === 'suspicious' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                            "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          )}>
                            {app.vtResult === 'clean' ? 'Scanned / Safe' : app.vtResult}
                          </div>
                          <p className="text-[10px] font-bold text-slate-500">
                             {app.vtMaliciousCount} / {app.vtTotalEngines || 72} engines
                          </p>
                          {app.vtReportUrl && (
                            <a 
                              href={app.vtReportUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[9px] font-black text-accent-violet hover:underline flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Report
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-400 italic">Scanned</span>
                      )}
                    </td>
                    {/* AI Insights Column */}
                    <td className="px-6 py-4 max-w-[200px]">
                      {(() => {
                        const score = app.aiModeration?.approvalScore;
                        const summary = app.aiModeration?.appSummary || app.aiModeration?.shortDescription;
                        const isPending = analyzingId === app._id || (app.aiModeration?.riskLevel === 'pending' && app.status === 'pending');
                        
                        if (score == null) {
                          return (
                            <div className="flex flex-col gap-2">
                              {app.aiModeration?.analysisError && (
                                <p className="text-[9px] font-bold text-rose-500 leading-tight italic break-all mb-1 border-b border-rose-500/20 pb-1">
                                  {app.aiModeration.analysisError}
                                </p>
                              )}
                              <button 
                                onClick={() => handleAiAnalyze(app._id)}
                                disabled={isPending}
                                className={cn(
                                  "flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all w-full",
                                  isPending 
                                    ? "bg-slate-100 text-slate-400 border-slate-200" 
                                    : "bg-accent-violet/10 text-accent-violet border-accent-violet/30 hover:bg-accent-violet hover:text-white shadow-lg shadow-accent-violet/10"
                                )}
                              >
                                <RefreshCw className={cn("w-3.5 h-3.5", isPending && "animate-spin")} />
                                {isPending ? 'Analyzing...' : 'Scan Now'}
                              </button>
                            </div>
                          );
                        }
                        
                        const dotColor = score >= 85 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : score >= 40 ? 'text-orange-500' : 'text-rose-500';
                        const stars = Math.round(score / 20);
                        
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center text-amber-500">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={cn("w-3.5 h-3.5", i < stars ? "fill-current" : "opacity-20")} />
                                ))}
                              </div>
                              <span className={cn("text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5", dotColor)}>
                                {score}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight italic">
                              "{summary || 'No description generated'}"
                            </p>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className={cn(
                          "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider",
                          getStatusStyles(app.status)
                        )}>
                          <div className="w-1.5 h-1.5 rounded-full bg-current" />
                          {app.status.replace('_', ' ')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          disabled={togglingId === app._id}
                          onClick={async () => {
                            setTogglingId(app._id);
                            try {
                              const { data } = await api.patch(`/admin/apps/${app._id}/featured`);
                              setApps(prev => prev.map(a => a._id === app._id ? { ...a, isFeatured: data.isFeatured } : a));
                              toast.success(data.message);
                            } catch (error) {
                              toast.error('Failed to toggle featured status');
                            } finally {
                              setTogglingId(null);
                            }
                          }}
                          title={app.isFeatured ? "Remove from Featured" : "Mark as Featured"}
                          className={cn(
                            "p-2.5 rounded-xl transition-all",
                            togglingId === app._id && "opacity-50 scale-90",
                            app.isFeatured ? "text-amber-500 hover:bg-amber-500/10" : "text-slate-400 hover:text-amber-500 hover:bg-amber-500/10"
                          )}
                        >
                          <Star className={cn("w-5 h-5", app.isFeatured && "fill-current", togglingId === app._id && "animate-spin")} />
                        </button>
                        <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>
                        
                        {(app.status !== 'approved' && app.status !== 'auto_rejected') && (
                          <button onClick={() => updateStatus(app._id, 'approved')} title="Approve" className="p-2.5 rounded-xl text-emerald-500 hover:bg-emerald-500/10 transition-colors">
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        )}
                        {(app.status !== 'rejected' && app.status !== 'auto_rejected') && (
                          <button onClick={() => {
                            const reason = prompt("Enter rejection reason for the developer:");
                            if (reason) updateStatus(app._id, 'rejected', reason);
                          }} title="Reject" className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors">
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                        
                        <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>
                        <button 
                          disabled={isScanningId === app._id}
                          onClick={() => handleScan(app._id)}
                          title="Trigger Security Scan" 
                          className={cn(
                            "p-2.5 rounded-xl transition-all",
                            isScanningId === app._id ? "text-accent-violet animate-pulse" : "text-slate-400 hover:text-accent-violet hover:bg-accent-violet/10"
                          )}
                        >
                          <Shield className={cn("w-5 h-5", isScanningId === app._id && "animate-spin")} />
                        </button>
                        <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>
                        <button onClick={() => setDetailTarget(app)} className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                          <Eye className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>
                        <button 
                          onClick={() => setWarningTarget(app)}
                          title="Issue Warning"
                          className="p-2.5 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                        >
                          <AlertCircle className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>
                        <button 
                          onClick={() => setDeleteTarget(app)}
                          title="Delete App" 
                          className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-8 py-20 text-center text-slate-500 font-bold">
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => !isDeleting && setDeleteTarget(null)}
          />
          
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header Gradient */}
            <div className="h-2 bg-gradient-to-r from-rose-500 via-rose-600 to-rose-500" />
            
            <div className="p-8 sm:p-10">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
                  <AlertTriangle className="w-10 h-10 text-rose-500" />
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                  Permanent Removal
                </h3>
                
                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed mb-8">
                  You are about to delete <span className="text-slate-900 dark:text-white">"{deleteTarget.title}"</span>. 
                  This action will permanently remove all binaries from B2 storage and metadata from MongoDB. This cannot be undone.
                </p>

                <div className="w-full space-y-3">
                  <button
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className={cn(
                      "w-full py-4 rounded-2xl bg-rose-500 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3",
                      isDeleting && "opacity-50 pointer-events-none"
                    )}
                  >
                    {isDeleting ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                    {isDeleting ? 'Removing...' : 'Confirm Permanent Delete'}
                  </button>
                  
                  <button
                    disabled={isDeleting}
                    onClick={() => setDeleteTarget(null)}
                    className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-black text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
                
                <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Compliance: Action follows Privacy Policy & T&C rules
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Warning Modal */}
      <IssueWarningModal 
        report={warningTarget ? { _id: warningTarget._id, app: warningTarget, customReason: 'Direct Administrative Review' } : null}
        onClose={() => setWarningTarget(null)}
        onConfirm={handleWarningConfirm}
        isProcessing={isProcessingWarning}
      />

      {/* App Detail Modal with AI Analysis */}
      {detailTarget && (
        <AdminAppDetailModal 
          app={detailTarget} 
          onClose={() => setDetailTarget(null)} 
          onUpdate={(appId, updatedApp) => {
            setApps(prev => prev.map(a => a._id === appId ? updatedApp : a));
            setDetailTarget(prev => prev && prev._id === appId ? updatedApp : prev);
          }}
        />
      )}

      {notebookTarget && (
        <AiNotebookModal 
          app={notebookTarget} 
          onClose={() => setNotebookTarget(null)} 
        />
      )}
    </AdminLayout>
  );
};

/* ── AI Notebook Modal ───────────────────────────────── */
const AiNotebookModal = ({ app, onClose }) => {
  if (!app) return null;
  const ai = app.aiModeration || {};
  const ratings = ai.ratings || {};

  const RatingBar = ({ label, value, color }) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
        <span className={`text-[10px] font-black ${color}`}>{value ?? '—'}/100</span>
      </div>
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${
          (value ?? 0) >= 80 ? 'bg-emerald-500' : (value ?? 0) >= 50 ? 'bg-amber-500' : 'bg-rose-500'
        }`} style={{ width: `${value ?? 0}%` }} />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#fdfcf0] dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-amber-200 dark:border-white/10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]" />

        <div className="p-8 md:p-10 space-y-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-amber-100 dark:bg-amber-500/10 rounded-2xl">
                 <StickyNote className="w-7 h-7 text-amber-600 dark:text-amber-400" />
               </div>
               <div>
                 <h2 className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">AI Insight Memo</h2>
                 <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mt-1">{app.title}</p>
               </div>
             </div>
             <button onClick={onClose} className="p-3 hover:bg-slate-200 dark:hover:bg-white/5 rounded-2xl transition-all">
               <X className="w-5 h-5 text-slate-400" />
             </button>
          </div>

          <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">

            {/* Verdict Banner */}
            {ai.verdict && (
              <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5 rounded-2xl border border-amber-200 dark:border-amber-500/10">
                <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-2">⚡ Verdict</p>
                <p className="text-sm font-black text-slate-800 dark:text-white leading-snug">{ai.verdict}</p>
              </div>
            )}

            {/* Category Ratings */}
            {(ratings.security != null || ratings.privacy != null) && (
              <div className="p-5 bg-white/50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Category Ratings</p>
                <RatingBar label="Security" value={ratings.security} color="text-emerald-500" />
                <RatingBar label="Privacy" value={ratings.privacy} color="text-blue-500" />
                <RatingBar label="Content" value={ratings.content} color="text-violet-500" />
                <RatingBar label="Quality" value={ratings.quality} color="text-amber-500" />
              </div>
            )}

            {/* Executive Summary */}
            <div className="relative p-6 bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-amber-100 dark:border-white/5 shadow-sm">
              <div className="absolute -left-1 top-5 bottom-5 w-1 bg-amber-400 rounded-full" />
              <h3 className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-3">Executive Summary</h3>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic">
                "{ai.appSummary || 'Analysis processed.'}"
              </p>
            </div>

            {/* Audience + Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ai.targetAudience && (
                <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10">
                  <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-wider mb-2">Target Audience</h4>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-200 leading-relaxed">{ai.targetAudience}</p>
                </div>
              )}
              {ai.keyFeatures?.length > 0 && (
                <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
                  <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-wider mb-2">Key Features</h4>
                  <ul className="space-y-1.5">
                    {ai.keyFeatures.slice(0, 6).map((f, i) => (
                      <li key={i} className="text-[11px] font-bold text-slate-600 dark:text-slate-200 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0 mt-1" /> <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Security Audit */}
            {ai.permissionAnalysis && (
              <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10">
                <h4 className="text-[10px] font-black uppercase text-rose-500 tracking-wider mb-2">🔒 Permission Audit</h4>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-200 leading-relaxed">
                  {ai.permissionAnalysis}
                </p>
              </div>
            )}

            {/* Admin Note */}
            {ai.adminNote && (
              <div className="p-5 rounded-2xl bg-sky-50/50 dark:bg-sky-500/5 border border-sky-100 dark:border-sky-500/10">
                <h4 className="text-[10px] font-black uppercase text-sky-500 tracking-wider mb-2">📋 Reviewer Notes</h4>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-200 leading-relaxed">{ai.adminNote}</p>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="pt-4 border-t border-amber-100 dark:border-white/5">
            <button 
              onClick={onClose}
              className="w-full py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.01] active:scale-95 transition-all"
            >
              Close Memo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppManagement;
