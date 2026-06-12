import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { 
  Search, 
  UserPlus, 
  Shield, 
  Ban, 
  MoreHorizontal, 
  Mail, 
  Calendar,
  Filter,
  UserCheck,
  Trash2
} from 'lucide-react';
import api from '../api/axios';
import { cn } from '../utils/cn.js';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([
    { _id: '1', name: 'Moyeed Khan', email: 'officialbaqala@gmail.com', role: 'admin', joinDate: '2026-05-01', appCount: 0, status: 'active' },
    { _id: '2', name: 'Alice Dev', email: 'alice@dev.com', role: 'developer', joinDate: '2026-05-15', appCount: 4, status: 'active' },
    { _id: '3', name: 'Bob Smith', email: 'bob@user.com', role: 'user', joinDate: '2026-06-01', appCount: 0, status: 'banned', banReason: 'Spam reviews' },
    { _id: '4', name: 'Charlie Tools', email: 'charlie@tools.io', role: 'developer', joinDate: '2026-06-10', appCount: 2, status: 'active' },
  ]);

  const tabs = [
    { id: 'all', label: 'All Users' },
    { id: 'admin', label: 'Admins' },
    { id: 'developer', label: 'Developers' },
    { id: 'user', label: 'Users' },
  ];

  const filteredUsers = users.filter(u => {
    const matchesTab = activeTab === 'all' || u.role === activeTab;
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getRoleStyles = (role) => {
    switch (role) {
      case 'admin': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'developer': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'user': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <AdminLayout title="User Moderation">
      {/* Filters */}
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
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm outline-none focus:border-accent-violet/30 transition-all w-full md:w-80 shadow-sm"
            />
          </div>
          <button className="bg-accent-violet p-3 rounded-2xl text-white shadow-lg shadow-accent-violet/20 hover:scale-105 transition-transform">
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid View for User Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUsers.map((u) => (
          <div key={u._id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            {u.status === 'banned' && (
              <div className="absolute top-0 left-0 right-0 py-1 bg-rose-500 text-white text-[10px] font-black uppercase text-center tracking-widest">
                Banned User
              </div>
            )}
            
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xl font-bold text-slate-400 group-hover:bg-accent-violet group-hover:text-white transition-all border border-slate-200 dark:border-white/10">
                  {u.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight truncate max-w-[150px]">{u.name}</h3>
                  <div className={cn(
                    "inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider",
                    getRoleStyles(u.role)
                  )}>
                    <Shield className="w-3 h-3" />
                    {u.role}
                  </div>
                </div>
              </div>
              <button className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-slate-500">
                <Mail className="w-4 h-4" />
                <span className="text-xs font-bold truncate">{u.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold">Joined {u.joinDate}</span>
              </div>
              {u.role === 'developer' && (
                <div className="flex items-center gap-3 text-slate-500">
                  <div className="w-4 h-4 flex items-center justify-center font-bold text-[10px] bg-slate-100 dark:bg-white/10 rounded">A</div>
                  <span className="text-xs font-bold">{u.appCount} Apps Published</span>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-accent-violet/10 hover:text-accent-violet text-slate-500 font-bold text-xs transition-all">
                <UserCheck className="w-4 h-4" />
                View Profile
              </button>
              {u.status === 'banned' ? (
                <button className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold text-xs hover:bg-emerald-500 hover:text-white transition-all">
                  Unban User
                </button>
              ) : (
                <button className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500/10 text-rose-500 font-bold text-xs hover:bg-rose-500 hover:text-white transition-all">
                  <Ban className="w-4 h-4" />
                  Ban User
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
