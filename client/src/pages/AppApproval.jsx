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
          const updated = data.app || { ...a, aiModeration: data.aiModeration };
          // If the notebook is open for this app, update it too
          setNotebookTarget(nb => nb?._id === appId ? updated : nb);
          return updated;
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
          onReanalyze={handleAiAnalyze}
          isAnalyzing={analyzingId === notebookTarget._id}
        />
      )}
    </AdminLayout>
  );
};

const AiNotebookModal = ({ app, onClose, onReanalyze, isAnalyzing }) => {
  if (!app) return null;
  const ai = app.aiModeration || {};
  const ratings = ai.ratings || {};
  
  // Legacy Fallbacks for older scans
  const displayOverall = ratings.overall || ai.approvalScore || 0;
  const isLegacy = !ratings.overall && ai.approvalScore;
  const displayDecision = ai.decision || (ai.recommendation ? ai.recommendation.toUpperCase() : null);
  const displayVerdict = ai.verdict || ai.appSummary || "Scan Complete (Legacy Format)";

  const ratingReasons = ai.ratingReasons || {};
  const flags = ai.flags || {};
  const legal = ai.legalAnalysis || {};

  const RatingBar = ({ label, value, reason, color }) => {
    const hasValue = typeof value === 'number';
    const safeValue = hasValue ? value : 0;
    return (
      <div className="space-y-1.5 group relative">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
          <span className={`text-[10px] font-black ${color}`}>{hasValue ? `${safeValue}/100` : 'N/A'}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${
            !hasValue ? 'bg-slate-300 dark:bg-slate-600' :
            safeValue >= 80 ? 'bg-emerald-500' : safeValue >= 50 ? 'bg-amber-500' : 'bg-rose-500'
          }`} style={{ width: `${hasValue ? safeValue : 0}%` }} />
        </div>
        {reason && (
          <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-1.5 leading-tight flex items-start gap-1 p-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
            <span className="text-accent-violet">●</span>
            {reason}
          </p>
        )}
      </div>
    );
  };

  const AuditSection = ({ title, icon: Icon, data, itemKey, riskKey, reasonKey, colorClass }) => {
    if (!data || data.length === 0) {
      return (
        <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
          <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-2">
            <Icon className="w-3.5 h-3.5" /> {title}
          </h4>
          <p className="text-[10px] font-bold text-slate-400">N/A</p>
        </div>
      );
    }
    return (
      <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-4 flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" /> {title}
        </h4>
        <div className="space-y-4">
          {data.map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className={cn(
                "w-1 h-8 rounded-full shrink-0",
                item[riskKey] === 'CRITICAL' || item[riskKey] === 'HIGH' ? "bg-rose-500" : item[riskKey] === 'MEDIUM' ? "bg-amber-500" : "bg-emerald-500"
              )} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black text-slate-900 dark:text-white truncate">{item[itemKey]}</span>
                  <span className={cn(
                    "text-[8px] font-black px-1.5 rounded",
                    (item[riskKey] === 'CRITICAL' || item[riskKey] === 'HIGH') ? "text-rose-500 bg-rose-50 dark:bg-rose-500/10" : 
                    item[riskKey] === 'MEDIUM' ? "text-amber-500 bg-amber-50 dark:bg-amber-500/10" : 
                    "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                  )}>{item[riskKey]}</span>
                </div>
                <p className="text-[11px] font-bold text-slate-500 leading-tight">{item[reasonKey]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-[#fdfcf0] dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-amber-200 dark:border-white/10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]" />

        <div className="p-8 md:p-10 space-y-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-amber-100 dark:bg-amber-500/10 rounded-2xl">
                 <Shield className="w-7 h-7 text-amber-600 dark:text-amber-400" />
               </div>
               <div>
                 <h2 className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">Full Spectrum Security Ledger</h2>
                 <div className="flex items-center gap-2 mt-1">
                   <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">{app.title}</p>
                   <span className="px-2 py-0.5 rounded-full bg-accent-violet/10 border border-accent-violet/20 text-[8px] font-black uppercase text-accent-violet flex items-center gap-1">
                     <Shield className="w-2 h-2" /> Tier: {app.tier || 'low'}
                   </span>
                 </div>
               </div>
             </div>
             <button onClick={onClose} className="p-3 hover:bg-slate-200 dark:hover:bg-white/5 rounded-2xl transition-all">
               <X className="w-5 h-5 text-slate-400" />
             </button>
          </div>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">

            {/* Decision & Overall Score */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={cn(
                "md:col-span-3 p-5 rounded-2xl border-2",
                displayDecision === 'APPROVE' ? "bg-emerald-50/50 border-emerald-200/50 dark:bg-emerald-500/5" :
                displayDecision === 'REJECT' ? "bg-rose-50/50 border-rose-200/50 dark:bg-rose-500/5" :
                "bg-amber-50/50 border-amber-200/50 dark:bg-amber-500/5"
              )}>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">⚡ Final Decision</p>
                <p className="text-sm font-black text-slate-800 dark:text-white leading-snug">{displayVerdict}</p>
              </div>
              <div className="bg-slate-900 dark:bg-white rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xl">
                 <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1">Overall Score</p>
                 <span className={cn(
                   "text-3xl font-black",
                   (displayOverall || 0) >= 80 ? "text-emerald-400" : (displayOverall || 0) >= 50 ? "text-amber-400" : "text-rose-400"
                 )}>{displayOverall}</span>
                 <p className="text-[8px] font-bold text-slate-500 uppercase mt-1 tracking-tighter">{displayDecision || 'PENDING'}</p>
              </div>
            </div>

            {/* Comprehensive Rating Matrix */}
            <div className="p-6 bg-white/50 dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-white/5 relative">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Risk & Performance Matrix</p>
                {isLegacy && (
                   <button 
                     onClick={() => onReanalyze(app._id)}
                     disabled={isAnalyzing}
                     className="px-4 py-1.5 bg-amber-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                   >
                     {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                     {isAnalyzing ? 'Recalculating...' : 'Generate Deep Audit Matrix'}
                   </button>
                )}
              </div>
              
              {isLegacy && (
                <div className="mb-6 p-4 bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10 rounded-xl flex items-center gap-4">
                   <div className="p-2 bg-amber-100 dark:bg-amber-500/10 rounded-lg shrink-0">
                     <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                   </div>
                   <div className="min-w-0">
                     <h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase leading-none">Legacy Report Format</h4>
                     <p className="text-[9px] font-bold text-slate-500 mt-1 leading-tight">This app was scanned with an older engine. Detailed metrics are currently unavailable. Generate a Deep Audit to populate the matrix below.</p>
                   </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <RatingBar label="Security" value={ratings.security} reason={ratingReasons.security} color="text-emerald-500" />
                <RatingBar label="Privacy" value={ratings.privacy} reason={ratingReasons.privacy} color="text-blue-500" />
                <RatingBar label="Content" value={ratings.content} reason={ratingReasons.content} color="text-violet-500" />
                <RatingBar label="Legal" value={ratings.legal} reason={ratingReasons.legal} color="text-rose-500" />
                <RatingBar label="Performance" value={ratings.performance} reason={ratingReasons.performance} color="text-sky-500" />
                <RatingBar label="Transparency" value={ratings.transparency} reason={ratingReasons.transparency} color="text-amber-500" />
                <RatingBar label="Data Handling" value={ratings.dataHandling} reason={ratingReasons.dataHandling} color="text-indigo-500" />
              </div>
            </div>

            {/* Legal & Compliance Benchmarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10">
                 <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-wider mb-3">⚖️ Legal Compliance</h4>
                 <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">GDPR Ready</span>
                     <span className={cn(
                       "text-[10px] font-black px-2 py-0.5 rounded", 
                       legal.gdprCompliant === true ? "bg-emerald-500/10 text-emerald-500" : 
                       legal.gdprCompliant === false ? "bg-rose-500/10 text-rose-500" :
                       "bg-slate-500/10 text-slate-500"
                     )}>
                       {legal.gdprCompliant === true ? 'YES' : legal.gdprCompliant === false ? 'NO' : 'N/A'}
                     </span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">COPPA (Kids)</span>
                     <span className={cn(
                       "text-[10px] font-black px-2 py-0.5 rounded", 
                       legal.coppaCompliant === true ? "bg-emerald-500/10 text-emerald-500" : 
                       legal.coppaCompliant === false ? "bg-rose-500/10 text-rose-500" :
                       "bg-slate-500/10 text-slate-500"
                     )}>
                       {legal.coppaCompliant === true ? 'YES' : legal.coppaCompliant === false ? 'NO' : 'N/A'}
                     </span>
                   </div>
                 </div>
              </div>
              
              <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10">
                 <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-wider mb-2">⚠️ Policy Violations</h4>
                 {legal.playPolicyViolations?.length > 0 ? (
                   <ul className="space-y-1">
                     {legal.playPolicyViolations.map((v, i) => (
                       <li key={i} className="text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                         <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" /> {v}
                       </li>
                     ))}
                   </ul>
                 ) : (
                   <p className="text-[10px] font-bold text-slate-400">{isLegacy ? 'N/A' : 'No major policy flags detected.'}</p>
                 )}
              </div>
            </div>

            {/* Smart Flags */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(flags).map(([key, val]) => val && (
                <span key={key} className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border",
                  key.includes('Violation') || key.includes('Indicators') || key.includes('Risk') || key.includes('Exfiltration')
                    ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                )}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              ))}
            </div>

            {/* Technical Audits Accordion/Stack */}
            <div className="space-y-4">
              <AuditSection 
                title="🔒 Permission Audit" 
                icon={Shield} 
                data={ai.permissionAudit} 
                itemKey="permission" 
                riskKey="risk" 
                reasonKey="reason" 
              />
              <AuditSection 
                title="🌐 Network & URL Audit" 
                icon={FileSearch} 
                data={ai.networkAudit} 
                itemKey="url" 
                riskKey="risk" 
                reasonKey="reason" 
              />
              <AuditSection 
                title="🔤 String & Keyword Audit" 
                icon={StickyNote} 
                data={ai.stringAudit} 
                itemKey="string" 
                riskKey="risk" 
                reasonKey="reason" 
              />
              <AuditSection 
                title="⚙️ Background Service Audit" 
                icon={Clock} 
                data={ai.serviceAudit} 
                itemKey="service" 
                riskKey="risk" 
                reasonKey="reason" 
              />
            </div>

            {/* Executive Summary */}
            <div className="relative p-6 bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-amber-100 dark:border-white/5 shadow-inner">
               <div className="absolute -left-1 top-5 bottom-5 w-1 bg-amber-400 rounded-full" />
               <h3 className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-3">Executive Summary</h3>
               <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic">
                 "{ai.summary || ai.appSummary || "No summary available."}"
               </p>
            </div>

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
