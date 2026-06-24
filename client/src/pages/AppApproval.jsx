import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { 
  CheckCircle2, 
  XCircle, 
  Star, 
  RefreshCw, 
  Shield,
  Eye,
  Loader2,
  AlertCircle,
  Clock,
  FileSearch,
  Sparkles,
  BookOpen,
  StickyNote,
  X
} from 'lucide-react';
import api from '../api/axios';
import { cn } from '../utils/cn.js';
import toast from 'react-hot-toast';
import AdminAppDetailModal from '../components/admin/AdminAppDetailModal';

const AppApproval = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [notebookTarget, setNotebookTarget] = useState(null);

  const fetchApps = async () => {
    try {
      const { data } = await api.get('/admin/apps');
      setApps(data.apps.filter(a => a.status === 'pending' || a.status === 'pending_review' || a.status === 'pending_scan'));
    } catch (error) {
      console.error('Failed to fetch apps:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, []);

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = api.defaults.baseURL.replace(/\/api$/, '');
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const updateStatus = async (id, status, rejectionReason = '') => {
    const loadingToast = toast.loading(`Marking app as ${status}...`);
    try {
      await api.patch(`/admin/apps/${id}/status`, { status, rejectionReason });
      setApps(prev => prev.filter(app => app._id !== id));
      toast.success(`App ${status}!`, { id: loadingToast });
    } catch (error) {
      toast.error('Failed to update status', { id: loadingToast });
    }
  };

  const handleAiAnalyze = async (appId) => {
    setAnalyzingId(appId);
    try {
      const { data } = await api.post(`/admin/apps/${appId}/reanalyze`);
      
      setApps(prev => prev.map(a => {
        if (a._id === appId) {
          return data.app || { ...a, aiModeration: data.aiModeration };
        }
        return a;
      }));
      
      toast.success('AI analysis complete ✅');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'AI analysis failed';
      console.error('[AI_ANALYZE]', errMsg);
      toast.error('AI scan could not complete. Hover the icon for details.');
      
      // Update local state to show the error in UI (tooltip only)
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

  return (
    <AdminLayout title="App Approval Queue">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{apps.length}</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Awaiting Review</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {apps.filter(a => a.aiModeration?.approvalScore != null).length}
            </p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AI Scanned</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {apps.filter(a => (a.aiModeration?.approvalScore ?? 100) < 40).length}
            </p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">High Risk</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-amber-500 rounded-full" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Pending Applications</h2>
        </div>
        <button onClick={() => { setLoading(true); fetchApps(); }} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 text-sm font-bold text-slate-500 hover:text-accent-violet transition-colors">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-accent-violet animate-spin" />
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-16 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">All Clear!</h3>
          <p className="text-slate-500 font-bold">No pending applications to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map(app => {
            const score = app.aiModeration?.approvalScore;
            const summary = app.aiModeration?.appSummary;
            const risk = app.aiModeration?.riskLevel;
            const recommendation = app.aiModeration?.recommendation;
            const stars = score != null ? Math.round(score / 20) : 0;
            const isPending = analyzingId === app._id;
            
            const scoreColor = score >= 85 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : score >= 40 ? 'text-orange-500' : 'text-rose-500';
            const riskBadge = risk === 'low' ? '🟢 Low' : risk === 'medium' ? '🟡 Medium' : risk === 'high' ? '🔴 High' : risk === 'critical' ? '🚨 Critical' : '⏳ Pending';
            const recBadge = recommendation === 'approve' ? { text: 'Approve', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' }
                           : recommendation === 'review' ? { text: 'Review', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' }
                           : recommendation === 'reject' ? { text: 'Reject', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' }
                           : { text: 'N/A', color: 'bg-slate-100 text-slate-400 border-slate-200' };

            return (
              <div key={app._id} className={cn(
                "bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden transition-all hover:shadow-lg",
                score != null && score < 40 ? "border-rose-500/30" : "border-slate-200 dark:border-white/5"
              )}>
                {/* Top Bar */}
                <div className="flex items-center gap-4 p-5">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 overflow-hidden shrink-0">
                    <img src={getImageUrl(app.icon)} alt={app.title} className="w-full h-full object-cover" 
                      onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/3344/3344153.png'; }} />
                  </div>
                  
                  {/* Title & Developer */}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-lg text-slate-900 dark:text-white truncate">{app.title}</p>
                    <p className="text-xs font-bold text-slate-500">
                      by {typeof app.developer === 'object' ? app.developer?.name : 'Unknown'}
                      <span className="mx-2 text-slate-300">•</span>
                      {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setDetailTarget(app)} className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title="View Full Details">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button onClick={() => updateStatus(app._id, 'approved')} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => {
                      const reason = prompt("Rejection reason:");
                      if (reason) updateStatus(app._id, 'rejected', reason);
                    }} className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/10 text-rose-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>

                {/* AI Analysis Section */}
                <div className="border-t border-slate-100 dark:border-white/5 p-5 bg-gradient-to-r from-slate-50/50 to-white/50 dark:from-white/[0.01] dark:to-transparent">
                  {score != null ? (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute -inset-1 bg-accent-violet/20 rounded-full blur animate-pulse" />
                          <div className="relative p-2.5 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-accent-violet/20">
                            <Sparkles className="w-5 h-5 text-accent-violet animate-pulse" />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">AI Report Ready</span>
                            <span className={cn(
                              "text-[10px] font-black uppercase px-2 py-0.5 rounded-md border",
                              score >= 85 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/10" :
                              score >= 60 ? "bg-amber-500/10 text-amber-500 border-amber-500/10" :
                              "bg-rose-500/10 text-rose-500 border-rose-500/10"
                            )}>
                              {score}/100
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Automated Scan Complete</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => setNotebookTarget(app)}
                           className="flex items-center gap-2 px-6 py-2.5 bg-accent-violet text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent-violet/20"
                         >
                           <BookOpen className="w-4 h-4" />
                           Read AI Report
                         </button>
                         <button 
                           onClick={() => handleAiAnalyze(app._id)}
                           className="p-2.5 text-slate-400 hover:text-accent-violet transition-colors"
                           title="Refresh Analysis"
                         >
                           <RefreshCw className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 dark:bg-white/5 rounded-full text-slate-400">
                          <FileSearch className="w-5 h-5" />
                        </div>
                        <div className="max-w-[150px]">
                          {app.aiModeration?.analysisError ? (
                            <div className="flex items-center gap-2 text-rose-500 group relative cursor-help">
                              <AlertCircle className="w-5 h-5 shrink-0" />
                              <span className="text-sm font-bold truncate">API Quota Busy...</span>
                              <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-900 text-[10px] text-white rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-white/10 font-bold leading-relaxed">
                                {app.aiModeration.analysisError}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-slate-400">No AI data available</span>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAiAnalyze(app._id)}
                        disabled={isPending}
                        className={cn(
                          "flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                          isPending 
                            ? "bg-slate-100 text-slate-400" 
                            : "bg-accent-violet/10 text-accent-violet border border-accent-violet/20 hover:bg-accent-violet hover:text-white shadow-lg shadow-accent-violet/10"
                        )}
                      >
                        <RefreshCw className={cn("w-4 h-4", isPending && "animate-spin")} />
                        {isPending ? 'Scanning...' : 'Run AI Scan'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
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

export default AppApproval;
