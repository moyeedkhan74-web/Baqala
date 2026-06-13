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
  RefreshCw
} from 'lucide-react';
import api from '../api/axios';
import { cn } from '../utils/cn.js';
import toast from 'react-hot-toast';

const AppManagement = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

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

  useEffect(() => {
    fetchApps();
  }, []);

  const updateStatus = async (id, status) => {
    const loadingToast = toast.loading(`Marking app as ${status}...`);
    try {
      await api.patch(`/admin/apps/${id}/status`, { status });
      setApps(apps.map(app => app._id === id ? { ...app, status } : app));
      toast.success(`App successfully ${status}`, { id: loadingToast });
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status', { id: loadingToast });
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
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
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="w-12 h-12 border-4 border-accent-violet border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/2 border-b border-slate-200 dark:border-white/5">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">App Name</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Developer</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Downloads</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredApps.map((app) => (
                  <tr key={app._id} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm group-hover:scale-105 transition-transform shrink-0">
                          <img src={app.icon} alt={app.title} className="w-8 h-8 object-contain" onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/3344/3344153.png'; }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 dark:text-white truncate max-w-[150px]">{app.title}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold dark:text-slate-300 truncate max-w-[120px]">
                        {typeof app.developer === 'object' && app.developer?.name ? app.developer.name : 'Unknown'}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">
                        {Array.isArray(app.category) ? app.category[0] : (app.category || 'App')}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className={cn(
                          "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider",
                          getStatusStyles(app.status)
                        )}>
                          <div className="w-1.5 h-1.5 rounded-full bg-current" />
                          {app.status}
                        </div>
                        {app.isFeatured && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider w-fit">
                            <Star className="w-3 h-3 fill-current" />
                            Featured
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-black dark:text-white">{(app.totalDownloads || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-5">
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
                        {app.status !== 'approved' && (
                          <button onClick={() => updateStatus(app._id, 'approved')} title="Approve" className="p-2.5 rounded-xl text-emerald-500 hover:bg-emerald-500/10 transition-colors">
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        )}
                        {app.status !== 'rejected' && (
                          <button onClick={() => updateStatus(app._id, 'rejected')} title="Reject" className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors">
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                        <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>
                        <a href={`/app/${app._id}`} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                          <Eye className="w-5 h-5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-8 py-20 text-center text-slate-500 font-bold">
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AppManagement;
