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
  RefreshCw
} from 'lucide-react';
import api from '../api/axios';
import { cn } from '../utils/cn.js';
import toast from 'react-hot-toast';
import BanUserModal from '../components/admin/BanUserModal';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [banTarget, setBanTarget] = useState(null);
  const [isProcessingBan, setIsProcessingBan] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBanConfirm = async ({ userId, durationDays, reason }) => {
    setIsProcessingBan(true);
    const loadingToast = toast.loading('Applying restrictions...');
    
    try {
      const { data } = await api.post(`/admin/users/${userId}/ban`, { durationDays, reason });
      setUsers(users.map(u => u._id === userId ? { ...u, isBanned: true, banUntil: data.user.banUntil } : u));
      toast.success('User restrictions applied', { id: loadingToast });
      setBanTarget(null);
    } catch (error) {
      console.error('Failed to restrict user:', error);
      toast.error('Failed to apply restrictions', { id: loadingToast });
    } finally {
      setIsProcessingBan(false);
    }
  };

  const handleUnban = async (userId) => {
    const loadingToast = toast.loading('Removing restrictions...');
    try {
      await api.post(`/admin/users/${userId}/unban`);
      setUsers(users.map(u => u._id === userId ? { ...u, isBanned: false, banUntil: null } : u));
      toast.success('Restrictions removed successfully', { id: loadingToast });
    } catch (error) {
      console.error('Failed to unban user:', error);
      toast.error('Failed to remove restrictions', { id: loadingToast });
    }
  };
  
  const handleToggleVerify = async (userId) => {
    const loadingToast = toast.loading('Updating verification status...');
    try {
      const { data } = await api.patch(`/admin/users/${userId}/verify`);
      setUsers(users.map(u => u._id === userId ? { ...u, isVerified: data.isVerified } : u));
      toast.success(data.message, { id: loadingToast });
    } catch (error) {
      console.error('Failed to toggle verification:', error);
      toast.error('Failed to update verification', { id: loadingToast });
    }
  };

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
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-accent-violet transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm outline-none focus:border-accent-violet/30 transition-all w-full md:w-80 shadow-sm"
            />
          </div>
          <button onClick={fetchUsers} className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-white/5 text-slate-500 hover:text-accent-violet transition-all shadow-sm">
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-accent-violet border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUsers.map((u) => (
            <div key={u._id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              {u.isBanned && (
                <div className="absolute top-0 left-0 right-0 py-1 bg-rose-500 text-white text-[10px] font-black uppercase text-center tracking-widest">
                  Banned User
                </div>
              )}
              
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                     <img src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`} alt={u.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight truncate">{u.name}</h3>
                    <div className={cn(
                      "inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider",
                      getRoleStyles(u.role)
                    )}>
                      <Shield className="w-3 h-3" />
                      {u.role}
                    </div>
                    {u.isVerified && (
                      <div className="inline-flex items-center gap-1 mt-1 ml-2 px-2 py-0.5 rounded-lg bg-accent-violet/10 text-accent-violet border border-accent-violet/20 text-[9px] font-black uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-slate-500">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold truncate">{u.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
                {u.role === 'developer' && u.appCount !== undefined && (
                  <div className="flex items-center gap-3 text-slate-500">
                    <div className="w-4 h-4 flex items-center justify-center font-bold text-[10px] bg-slate-100 dark:bg-white/10 rounded shrink-0">A</div>
                    <span className="text-xs font-bold">{u.appCount} Apps Published</span>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 gap-3">
                <a href={u.role === 'developer' ? `/developer/${u._id}` : '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-accent-violet/10 hover:text-accent-violet text-slate-500 font-bold text-xs transition-all">
                  <UserCheck className="w-4 h-4" />
                  Profile
                </a>
                {u.role === 'developer' && (
                  <button 
                    onClick={() => handleToggleVerify(u._id)} 
                    className={cn(
                      "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition-all",
                      u.isVerified 
                        ? "bg-accent-violet/10 text-accent-violet hover:bg-accent-violet hover:text-white" 
                        : "bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-accent-violet/10 hover:text-accent-violet"
                    )}
                  >
                    <UserCheck className="w-4 h-4" />
                    {u.isVerified ? 'Unverify' : 'Verify Dev'}
                  </button>
                )}
                {u.isBanned ? (
                  <button onClick={() => handleUnban(u._id)} className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold text-xs hover:bg-emerald-500 hover:text-white transition-all col-span-2">
                    Unban User
                  </button>
                ) : (
                  <button onClick={() => setBanTarget(u)} className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500/10 text-rose-500 font-bold text-xs hover:bg-rose-500 hover:text-white transition-all col-span-2">
                    <Ban className="w-4 h-4" />
                    Ban User
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-500 font-bold">
              No users found.
            </div>
          )}
        </div>
      )}

      {/* Advanced Ban Modal */}
      <BanUserModal 
        user={banTarget}
        onClose={() => setBanTarget(null)}
        onConfirm={handleBanConfirm}
        isBanning={isProcessingBan}
      />
    </AdminLayout>
  );
};

export default UserManagement;
