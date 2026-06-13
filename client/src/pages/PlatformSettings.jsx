import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  HardDrive, 
  Bell, 
  Palette,
  Check,
  AlertTriangle,
  Server,
  Loader2,
  Save
} from 'lucide-react';
import { cn } from '../utils/cn.js';
import api from '../api/axios';
import toast from 'react-hot-toast';

const PlatformSettings = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/config');
      setConfig(data.config);
    } catch (error) {
      console.error('Failed to fetch platform config:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  const handleUpdate = async (updates) => {
    // Optimistic update
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleNestedUpdate = (parent, updates) => {
    setConfig(prev => ({
      ...prev,
      [parent]: { ...prev[parent], ...updates }
    }));
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await api.patch('/config', config);
      toast.success('Platform configuration saved!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Platform Config">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-accent-violet animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Platform Config">
      <div className="max-w-4xl space-y-8 pb-32">
        
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
              <input 
                type="number" 
                value={config.maxApkSize} 
                onChange={(e) => handleUpdate({ maxApkSize: parseInt(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-white/5 border border-transparent focus:border-accent-violet/30 rounded-2xl p-4 text-sm font-bold outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Max Image Size (MB)</label>
              <input 
                type="number" 
                value={config.maxImageSize} 
                onChange={(e) => handleUpdate({ maxImageSize: parseInt(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-white/5 border border-transparent focus:border-accent-violet/30 rounded-2xl p-4 text-sm font-bold outline-none" 
              />
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
              <div 
                onClick={() => handleNestedUpdate('announcement', { enabled: !config.announcement.enabled })}
                className={cn(
                  "w-12 h-6 rounded-full relative cursor-pointer transition-colors",
                  config.announcement.enabled ? "bg-accent-violet" : "bg-slate-300 dark:bg-slate-700"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  config.announcement.enabled ? "left-7" : "left-1"
                )} />
              </div>
            </div>
            <textarea 
              value={config.announcement.text}
              onChange={(e) => handleNestedUpdate('announcement', { text: e.target.value })}
              placeholder="e.g. Baqala 2.0 is coming soon! Stay tuned."
              className="w-full bg-slate-50 dark:bg-white/5 border border-transparent focus:border-accent-violet/30 rounded-2xl p-4 text-sm font-bold outline-none min-h-[100px] resize-none"
            />
            <div className="flex gap-2">
              {['info', 'warning', 'critical'].map(level => (
                <button
                  key={level}
                  onClick={() => handleNestedUpdate('announcement', { level })}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                    config.announcement.level === level
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-transparent text-slate-500 border-slate-200 dark:border-white/10"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section Visibility Controls */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black dark:text-white leading-tight">Homepage Layout</h2>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">Show/hide homepage sections</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'trending', name: 'Trending Section', desc: 'Apps sorted by downloads' },
              { id: 'newReleases', name: 'New Releases', desc: 'Recently published apps' },
              { id: 'categoryBrowsing', name: 'Category Scroller', desc: 'Genre-based exploration' },
              { id: 'featuredCarousel', name: 'Hero Carousel', desc: 'Main promotional slider' },
            ].map(section => (
              <div key={section.id} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-between border border-transparent hover:border-accent-violet/20 transition-all">
                <div>
                  <h3 className="text-sm font-black dark:text-white">{section.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{section.desc}</p>
                </div>
                <div 
                  onClick={() => handleNestedUpdate('sections', { [section.id]: !config.sections[section.id] })}
                  className={cn(
                    "w-10 h-5 rounded-full relative cursor-pointer transition-colors",
                    config.sections[section.id] ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                    config.sections[section.id] ? "left-6" : "left-1"
                  )} />
                </div>
              </div>
            ))}
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
            <div className="space-y-4 flex-1">
              <p className="text-xs text-rose-500/70 font-bold max-w-md italic">
                Warning: Enabling maintenance mode will block all users and developers from accessing Baqala until disabled. Admin portal remains active.
              </p>
              <textarea 
                value={config.maintenanceMessage}
                onChange={(e) => handleUpdate({ maintenanceMessage: e.target.value })}
                placeholder="Maintenance message shown to users..."
                className="w-full bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 text-xs font-bold text-rose-700 dark:text-rose-400 outline-none focus:border-rose-500/50 min-h-[60px]"
              />
            </div>
            <button 
              onClick={() => handleUpdate({ isMaintenanceMode: !config.isMaintenanceMode })}
              className={cn(
                "px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95",
                config.isMaintenanceMode 
                  ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                  : "bg-rose-500 text-white shadow-rose-500/20"
              )}
            >
              {config.isMaintenanceMode ? 'Disable Lockdown' : 'Initialize Lockdown'}
            </button>
          </div>
        </div>

        {/* Floating Save Bar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl flex items-center justify-between">
            <div className="px-4">
              <p className="text-xs font-black dark:text-white uppercase tracking-widest">Unsaved Changes</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Update platform configuration</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={fetchConfig}
                className="px-6 py-3 rounded-xl text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                Reset
              </button>
              <button 
                onClick={saveConfig}
                disabled={saving}
                className="px-8 py-3 bg-accent-violet text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-accent-violet/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default PlatformSettings;
