import React, { useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  HardDrive, 
  Bell, 
  Palette,
  Check,
  AlertTriangle,
  Server
} from 'lucide-react';
import { cn } from '../utils/cn.js';

const PlatformSettings = () => {
  const [saveLoading, setSaveLoading] = useState(false);

  return (
    <AdminLayout title="Platform Config">
      <div className="max-w-4xl space-y-8">
        
        {/* Storage Config */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black dark:text-white leading-tight">Storage & Uploads</h2>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">Configure asset limits</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Max APK Size (MB)</label>
              <input type="number" defaultValue={500} className="w-full bg-slate-50 dark:bg-white/5 border border-transparent focus:border-accent-violet/30 rounded-2xl p-4 text-sm font-bold outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Max Screenshot Image Size (MB)</label>
              <input type="number" defaultValue={5} className="w-full bg-slate-50 dark:bg-white/5 border border-transparent focus:border-accent-violet/30 rounded-2xl p-4 text-sm font-bold outline-none" />
            </div>
          </div>
        </div>

        {/* Global Announcement */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black dark:text-white leading-tight">Platform Announcement</h2>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">Display a global banner for all users</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
              <div>
                <p className="text-sm font-black dark:text-white">Enable Banner</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Show on every page</p>
              </div>
              <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 rounded-full relative cursor-pointer">
                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            <textarea 
              placeholder="e.g. Baqala 2.0 is coming soon! Stay tuned."
              className="w-full bg-slate-50 dark:bg-white/5 border border-transparent focus:border-accent-violet/30 rounded-2xl p-4 text-sm font-bold outline-none min-h-[100px]"
            />
          </div>
        </div>

        {/* Dangerous Zone */}
        <div className="bg-rose-500/5 rounded-[2.5rem] border-2 border-dashed border-rose-500/20 p-8">
          <div className="flex items-center gap-4 mb-8 text-rose-500">
            <AlertTriangle className="w-8 h-8" />
            <div>
              <h2 className="text-lg font-black leading-tight">Maintenance Mode</h2>
              <p className="text-xs font-bold uppercase mt-1">Completely disable the public platform</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <p className="text-xs text-rose-500/70 font-bold max-w-md">
              Warning: Enabling maintenance mode will block all users and developers from accessing Baqala until disabled. Admin portal remains active.
            </p>
            <button className="px-8 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all">
              Initialize Lockdown
            </button>
          </div>
        </div>

        {/* Save Footer */}
        <div className="flex justify-end gap-4 p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl">
           <button className="px-8 py-4 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
             Discard
           </button>
           <button className="px-12 py-4 bg-accent-violet text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-accent-violet/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
             <Check className="w-5 h-5" />
             Apply Changes
           </button>
        </div>

      </div>
    </AdminLayout>
  );
};

export default PlatformSettings;
