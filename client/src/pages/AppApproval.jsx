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
  FileSearch
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
      console.log('[DEBUG] AI Update Response:', data);
      
      // Force a fresh object to guarantee React re-render
      setApps(prev => {
        const newApps = prev.map(a => 
          a._id === appId 
            ? { ...a, aiModeration: { ...data.aiModeration, analysedAt: new Date() } } 
            : a
        );
        console.log('[DEBUG] New state for scanned app:', newApps.find(a => a._id === appId));
        return newApps;
      });
      
      toast.success('AI analysis complete');
    } catch (err) {
      console.error('[AI_REANALYZE_ERROR]:', err);
      toast.error('AI analysis failed');
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
                <div className="border-t border-slate-100 dark:border-white/5 p-5 bg-slate-50/50 dark:bg-white/[0.01]">
                  {score != null ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Score & Stars */}
                      <div className="md:col-span-2 flex flex-col items-center justify-center gap-1">
                        <span className={cn("text-3xl font-black", scoreColor)}>{score}</span>
                        <div className="flex items-center text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn("w-4 h-4", i < stars ? "fill-current" : "opacity-20")} />
                          ))}
                        </div>
                        <span className="text-[9px] font-black uppercase text-slate-400 mt-1">AI Score</span>
                      </div>

                      {/* Summary */}
                      <div className="md:col-span-7">
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-bold leading-relaxed italic">
                          "{app.aiModeration?.appSummary || app.aiModeration?.shortDescription || 'No description generated by AI'}"
                        </p>
                        {app.aiModeration?.adminNote && (
                          <p className="text-xs text-slate-500 mt-2 font-bold">
                            <span className="text-accent-violet">💡 Admin Note:</span> {app.aiModeration.adminNote}
                          </p>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="md:col-span-3 flex flex-col gap-2 items-end">
                        <span className="text-xs font-black">{riskBadge}</span>
                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", recBadge.color)}>
                          {recBadge.text}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-slate-400">
                        <FileSearch className="w-5 h-5" />
                        <span className="text-sm font-bold">AI analysis not yet available</span>
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
    </AdminLayout>
  );
};

export default AppApproval;
