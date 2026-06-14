import React, { useState } from 'react';
import { AlertTriangle, Clock, CalendarDays, X, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const PREDEFINED_OPTIONS = [
  { id: '1week', label: '1 Week', days: 7, icon: Clock },
  { id: '1month', label: '1 Month', days: 30, icon: CalendarDays },
  { id: 'custom', label: 'Custom', days: 'custom', icon: CalendarDays },
  { id: 'permanent', label: 'Permanent', days: 'Permanent', icon: InfinityIcon },
];

const BanUserModal = ({ user, onClose, onConfirm, isBanning }) => {
  const [reason, setReason] = useState('');
  const [selectedOption, setSelectedOption] = useState('1week');
  const [customDays, setCustomDays] = useState('');
  
  if (!user) return null;

  const handleConfirm = () => {
    let finalDuration = 7;
    const option = PREDEFINED_OPTIONS.find(o => o.id === selectedOption);
    
    if (selectedOption === 'custom') {
      finalDuration = parseInt(customDays);
      if (!finalDuration || finalDuration <= 0) {
        return; // basic validation
      }
    } else {
      finalDuration = option.days;
    }

    onConfirm({
      userId: user._id || user.id, // Handles both direct User objects and hydrated Reports
      durationDays: finalDuration,
      reason: reason.trim() || 'Violation of community guidelines.'
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => !isBanning && onClose()}
      />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="h-2 bg-gradient-to-r from-rose-500 via-rose-600 to-rose-500" />
        
        <button 
          onClick={onClose}
          disabled={isBanning}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 sm:p-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 border border-rose-500/20">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              Restrict Account
            </h3>
            <p className="text-slate-500 font-bold text-sm">
              Applying restrictions to <span className="text-slate-900 dark:text-white">{user.name}</span>'s account.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-3 ml-2 tracking-widest">
                Violation Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Repeated violation of privacy policy..."
                className="w-full h-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold resize-none focus:outline-none focus:border-rose-500/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-3 ml-2 tracking-widest">
                Restriction Duration
              </label>
              <div className="grid grid-cols-2 gap-3">
                {PREDEFINED_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOption(opt.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-bold transition-all",
                      selectedOption === opt.id 
                        ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20" 
                        : "bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                    )}
                  >
                    <opt.icon className="w-4 h-4 shrink-0" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedOption === 'custom' && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-black uppercase text-slate-500 mb-3 ml-2 tracking-widest">
                  Custom Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="Enter number of days..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-rose-500/50 transition-colors"
                />
              </div>
            )}

            <button
              disabled={isBanning || (selectedOption === 'custom' && (!customDays || customDays <= 0))}
              onClick={handleConfirm}
              className={cn(
                "w-full py-4 mt-4 rounded-2xl bg-rose-500 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3",
                (isBanning || (selectedOption === 'custom' && (!customDays || customDays <= 0))) && "opacity-50 pointer-events-none"
              )}
            >
              {isBanning ? 'Applying...' : 'Apply Restriction'}
            </button>
          </div>
          
          <p className="mt-6 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            An automated email will be sent notifying the user.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BanUserModal;
