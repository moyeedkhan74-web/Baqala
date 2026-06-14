import React, { useState } from 'react';
import { AlertTriangle, MessageSquareWarning, X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const IssueWarningModal = ({ report, onClose, onConfirm, isProcessing }) => {
  const [warningMessage, setWarningMessage] = useState('');
  
  if (!report) return null;

  const targetName = report.app ? report.app.title : (report.developer ? report.developer.name : 'Target');

  const handleConfirm = () => {
    if (!warningMessage.trim()) return;
    onConfirm({
      reportId: report._id,
      warningMessage: warningMessage.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => !isProcessing && onClose()}
      />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
        
        <button 
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 sm:p-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4 border border-amber-500/20">
              <MessageSquareWarning className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              Issue Official Warning
            </h3>
            <p className="text-slate-500 font-bold text-sm">
              Send a formal warning to the developer of <strong className="text-slate-900 dark:text-white">{targetName}</strong>. 
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl">
              <p className="text-xs font-bold text-slate-500 mb-1 tracking-widest uppercase">Report Context:</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 italic">" {report.customReason || report.category} "</p>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-3 ml-2 tracking-widest">
                Warning Message to Developer
              </label>
              <textarea
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                placeholder="e.g. Your application uses misleading assets. Please correct this within 48 hours or face account restriction."
                className="w-full h-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold resize-none focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>

            <button
              disabled={isProcessing || !warningMessage.trim()}
              onClick={handleConfirm}
              className={cn(
                "w-full py-4 mt-4 rounded-2xl bg-amber-500 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3",
                (isProcessing || !warningMessage.trim()) && "opacity-50 pointer-events-none"
              )}
            >
              {isProcessing ? 'Sending Warning...' : 'Send Warning & Resolve'}
            </button>
          </div>
          
          <p className="mt-6 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Resolves report & notifies reporter
          </p>
        </div>
      </div>
    </div>
  );
};

export default IssueWarningModal;
