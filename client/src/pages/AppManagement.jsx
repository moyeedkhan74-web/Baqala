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
  ArrowUpDown
} from 'lucide-react';
import api from '../api/axios';
import { cn } from '../utils/cn.js';

const AppManagement = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [apps, setApps] = useState([
    { _id: '1', title: 'PhotoEdit Pro', developerName: 'Alice Dev', category: 'Photography', status: 'pending', downloads: 1200, createdAt: '2026-06-10', icon: 'https://cdn-icons-png.flaticon.com/512/3344/3344153.png' },
    { _id: '2', title: 'CryptoPulse', developerName: 'Bob Markets', category: 'Finance', status: 'approved', downloads: 45000, createdAt: '2026-06-08', icon: 'https://cdn-icons-png.flaticon.com/512/3344/3344153.png' },
    { _id: '3', title: 'Zombie Rush', developerName: 'GameStudio X', category: 'Games', status: 'rejected', downloads: 0, createdAt: '2026-06-05', icon: 'https://cdn-icons-png.flaticon.com/512/3344/3344153.png' },
    { _id: '4', title: 'TaskMaster', developerName: 'Charlie Tools', category: 'Productivity', status: 'pending', downloads: 150, createdAt: '2026-06-12', icon: 'https://cdn-icons-png.flaticon.com/512/3344/3344153.png' },
  ]);

  const tabs = [
    { id: 'all', label: 'All Apps' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];

  const filteredApps = apps.filter(app => {
    const matchesTab = activeTab === 'all' || app.status === activeTab;
    const matchesSearch = app.title.toLowerCase().includes(search.toLowerCase()) || 
                          app.developerName.toLowerCase().includes(search.toLowerCase());
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
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-accent-violet transition-colors" />
            <input 
              type="text" 
              placeholder="Filter by name or dev..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm outline-none focus:border-accent-violet/30 transition-all w-full md:w-80 shadow-sm"
            />
          </div>
          <button className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-white/5 text-slate-500 hover:text-accent-violet transition-all shadow-sm">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/2 border-b border-slate-200 dark:border-white/5">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">App Name</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Developer</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  Status <ArrowUpDown className="w-3 h-3" />
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Downloads</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredApps.map((app) => (
                <tr key={app._id} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                        <img src={app.icon} alt={app.title} className="w-8 h-8 object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 dark:text-white truncate">{app.title}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Submitted {app.createdAt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-bold dark:text-slate-300">{app.developerName}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">
                      {app.category}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider",
                      getStatusStyles(app.status)
                    )}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      {app.status}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-black dark:text-white">{app.downloads.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button title="Approve" className="p-2.5 rounded-xl text-emerald-500 hover:bg-emerald-500/10 transition-colors">
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button title="Reject" className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors">
                        <XCircle className="w-5 h-5" />
                      </button>
                      <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>
                      <button className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="px-8 py-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
          <p className="text-sm text-slate-500 font-bold">Showing <span className="text-slate-900 dark:text-white">1 - {filteredApps.length}</span> of {apps.length} apps</p>
          <div className="flex items-center gap-2">
            <button className="p-3 rounded-2xl border border-slate-200 dark:border-white/5 text-slate-400 hover:text-accent-violet disabled:opacity-50 transition-all shadow-sm" disabled>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="p-3 rounded-2xl border border-slate-200 dark:border-white/5 text-slate-400 hover:text-accent-violet transition-all shadow-sm">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AppManagement;
