import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { 
  AlertCircle, 
  Flag, 
  MoreVertical, 
  MessageSquare, 
  Trash2, 
  User, 
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Ban,
  Calendar,
  Tag
} from 'lucide-react';
import api from '../api/axios';
import { cn } from '../utils/cn.js';
import toast from 'react-hot-toast';
import BanUserModal from '../components/admin/BanUserModal';
import IssueWarningModal from '../components/admin/IssueWarningModal';

const ModerationQueue = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banTarget, setBanTarget] = useState(null);
  const [isProcessingBan, setIsProcessingBan] = useState(false);
  const [warningTarget, setWarningTarget] = useState(null);
  const [isProcessingWarning, setIsProcessingWarning] = useState(false);

  const fetchReports = async () => {
    try {
      const { data } = await api.get('/admin/reports');
      // Only show pending reports in the queue
      setReports(data.reports.filter(r => r.status === 'pending'));
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDismiss = async (id) => {
    const loadingToast = toast.loading('Dismissing report...');
    try {
      await api.patch(`/admin/reports/${id}/dismiss`);
      setReports(reports.filter(r => r._id !== id));
      toast.success('Report successfully dismissed', { id: loadingToast });
    } catch (error) {
      console.error('Failed to dismiss report:', error);
      toast.error('Failed to dismiss report', { id: loadingToast });
    }
  };

  const handleRemoveApp = async (appId, reportId) => {
    if (!appId) return;
    
    // Using native confirm intentionally so it blocks immediately, 
    // although a custom modal would be better for production
    if (!window.confirm("Are you SURE you want to delete this app? This action cannot be undone.")) return;

    const loadingToast = toast.loading('Deleting application...');
    try {
      await api.delete(`/admin/apps/${appId}`);
      // Also dismiss the report locally so it vanishes from the queue
      await api.patch(`/admin/reports/${reportId}/dismiss`).catch(console.error);
      setReports(reports.filter(r => r._id !== reportId));
      toast.success('App permanently deleted from platform', { id: loadingToast });
    } catch (error) {
      console.error('Failed to delete app:', error);
      toast.error('Failed to remote app', { id: loadingToast });
    }
  };

  const handleBanConfirm = async ({ userId, durationDays, reason }) => {
    setIsProcessingBan(true);
    const reportId = banTarget?.reportId;
    const loadingToast = toast.loading('Applying restrictions to developer...');
    try {
      await api.post(`/admin/users/${userId}/ban`, { durationDays, reason });
      
      // If triggered from a report, dismiss that report too
      if (reportId) {
        await api.patch(`/admin/reports/${reportId}/dismiss`).catch(console.error);
        setReports(reports.filter(r => r._id !== reportId));
      }

      toast.success('Developer restrictions applied successfully', { id: loadingToast });
      setBanTarget(null);
    } catch (error) {
      console.error('Failed to restrict developer:', error);
      toast.error('Failed to apply restrictions', { id: loadingToast });
    } finally {
      setIsProcessingBan(false);
    }
  };

  const handleWarningConfirm = async ({ reportId, warningMessage }) => {
    setIsProcessingWarning(true);
    const loadingToast = toast.loading('Issuing warning...');
    try {
      await api.post(`/admin/reports/${reportId}/warn`, { warningMessage });
      // Remove or update the report in the list since it's now resolved locally
      setReports(reports.filter(r => r._id !== reportId));
      toast.success('Warning issued and report resolved.', { id: loadingToast });
      setWarningTarget(null);
    } catch (error) {
      console.error('Failed to issue warning:', error);
      toast.error('Failed to issue warning.', { id: loadingToast });
    } finally {
      setIsProcessingWarning(false);
    }
  };

  const getSeverityStyles = (category) => {
    switch (category) {
      case 'malware_virus':
      case 'scam_fake':
        return 'bg-rose-500 text-white shadow-rose-500/20';
      case 'inappropriate_content':
      case 'harassment':
      case 'copyright_violation':
        return 'bg-amber-500 text-white shadow-amber-500/20';
      default:
        return 'bg-blue-500 text-white shadow-blue-500/20';
    }
  };

  const getCategoryLabel = (category) => {
    const map = {
      malware_virus: 'Malware / Virus',
      scam_fake: 'Scam or Fake App',
      inappropriate_content: 'Inappropriate Content',
      harassment: 'Harassment',
      copyright_violation: 'Copyright Violation',
      misleading_description: 'Misleading Description',
      spam: 'Spamming',
      other: 'Other Violation'
    };
    return map[category] || category.replace(/_/g, ' ');
  };

  return (
    <AdminLayout title="Moderation Queue">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Active Reports</h2>
            <p className="text-sm text-slate-500 font-bold">Review and process flagged applications</p>
          </div>
        </div>
        <button onClick={fetchReports} className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-white/5 text-slate-500 hover:text-accent-violet transition-all shadow-sm">
          <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-accent-violet border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reports.map((report) => {
            const targetName = report.app ? report.app.title : (report.developer ? report.developer.name : 'Unknown Target');
            const targetType = report.app ? 'App' : 'Developer';
            
            return (
              <div key={report._id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 group hover:shadow-2xl transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 dark:bg-white/2 rounded-full blur-3xl opacity-20 pointer-events-none" />
                
                <div className="flex-1 space-y-4 relative z-10">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm",
                      getSeverityStyles(report.category)
                    )}>
                      {getCategoryLabel(report.category)}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">ID: #{report._id.substring(0, 8)}</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-slate-50 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10">
                      <Tag className="w-3 h-3" />
                      {targetType}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:text-accent-violet transition-colors">
                      {targetName}
                    </h3>
                    <div className="mt-3 p-4 bg-slate-50 dark:bg-white/2 rounded-2xl border border-slate-100 dark:border-white/5">
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-bold leading-relaxed">
                        <span className="text-accent-violet/60 uppercase text-[10px] block mb-1 tracking-widest">Reporter Reasoning</span>
                        {report.customReason || 'No descriptive details provided by reporter.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6 pt-2">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      By {report.reportedBy?.name || 'Anon'}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-row items-center gap-3 shrink-0 relative z-10">
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleDismiss(report._id)} 
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/5 group/btn"
                    >
                      <CheckCircle2 className="w-4 h-4 group-hover/btn:text-emerald-500 transition-colors" />
                      Ignore
                    </button>
                    {(report.developer || report.app) && (
                      <button 
                        onClick={() => setWarningTarget(report)} 
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-amber-500/10 text-amber-500 font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all border border-amber-500/20 shadow-sm"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Warn
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    {report.developer && (
                      <button 
                        onClick={() => setBanTarget({ user: report.developer, reportId: report._id })} 
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-rose-500/10 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
                      >
                        <Ban className="w-4 h-4" />
                        Restrict
                      </button>
                    )}
                    {report.app && (
                      <button 
                        onClick={() => handleRemoveApp(report.app._id, report._id)} 
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest shadow-[0_10px_20px_-5px_rgba(225,29,72,0.4)] hover:scale-105 active:scale-95 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete App
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {reports.length === 0 && (
            <div className="py-20 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
              <p className="text-slate-500 font-bold text-center">Inbox zero! No active reports to review.</p>
            </div>
          )}
        </div>
      )}

      {/* Advanced Ban Modal */}
      <BanUserModal 
        user={banTarget?.user || banTarget}
        onClose={() => setBanTarget(null)}
        onConfirm={handleBanConfirm}
        isBanning={isProcessingBan}
      />

      {/* Issue Warning Modal */}
      <IssueWarningModal 
        report={warningTarget}
        onClose={() => setWarningTarget(null)}
        onConfirm={handleWarningConfirm}
        isProcessing={isProcessingWarning}
      />
    </AdminLayout>
  );
};

export default ModerationQueue;

