import React, { useState } from 'react';
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
  XCircle
} from 'lucide-react';
import { cn } from '../utils/cn';

const ModerationQueue = () => {
  const [reports, setReports] = useState([
    { id: '1', appName: 'FakeVPN', developer: 'ScamDev', reporter: 'security_bot', reason: 'Malware detected in APK', date: '2026-06-12', severity: 'high' },
    { id: '2', appName: 'Sexy Chat', developer: 'HotApps', reporter: 'user_882', reason: 'Inappropriate content', date: '2026-06-11', severity: 'medium' },
    { id: '3', appName: 'AdsPlus', developer: 'AdCo', reporter: 'system_audit', reason: 'Excessive permissions requested', date: '2026-06-10', severity: 'low' },
  ]);

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'high': return 'bg-rose-500 text-white shadow-rose-500/20';
      case 'medium': return 'bg-amber-500 text-white shadow-amber-500/20';
      case 'low': return 'bg-blue-500 text-white shadow-blue-500/20';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <AdminLayout title="Moderation Queue">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Active Reports</h2>
          <p className="text-sm text-slate-500 font-bold">Review and process flagged applications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 group hover:shadow-xl transition-all">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg",
                  getSeverityStyles(report.severity)
                )}>
                  {report.severity} Severity
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ref: #{report.id}</span>
              </div>
              
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-accent-violet transition-colors">
                  {report.appName} <span className="text-slate-400 font-bold ml-1">by {report.developer}</span>
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 font-bold leading-relaxed">
                  <span className="text-slate-400">Report Reason:</span> {report.reason}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <User className="w-4 h-4" />
                  Reporter: {report.reporter}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <AlertCircle className="w-4 h-4" />
                  Date: {report.date}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button title="Dismiss Report" className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
                <CheckCircle2 className="w-5 h-5" />
                Dismiss
              </button>
              <button title="Warn Developer" className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-amber-500/10 text-amber-500 font-black text-xs uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all">
                <Flag className="w-5 h-5" />
                Warn
              </button>
              <button title="Remove App" className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-rose-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:scale-105 transition-transform">
                <Trash2 className="w-5 h-5" />
                Remove
              </button>
            </div>
          </div>
        ))}

        {reports.length === 0 && (
          <div className="py-20 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
            <p className="text-slate-500 font-bold text-center">Inbox zero! No active reports to review.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ModerationQueue;
