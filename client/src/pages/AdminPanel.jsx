import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { HiUsers, HiCollection, HiDownload, HiStar, HiCheck, HiX, HiBan, HiShieldCheck } from 'react-icons/hi';

const AdminPanel = () => {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [pendingApps, setPendingApps] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'stats') {
        const { data } = await api.get('/admin/stats');
        setStats(data);
      } else if (tab === 'pending') {
        const { data } = await api.get('/admin/apps/pending');
        setPendingApps(data?.apps || []);
      } else if (tab === 'users') {
        const { data } = await api.get('/admin/users');
        setUsers(data?.users || []);
      }
    } catch (e) { toast.error('System access denied'); }
    finally { setLoading(false); }
  };

  const handleAppStatus = async (id, status, reason = '') => {
    try {
      await api.put(`/admin/apps/${id}/status`, { status, rejectionReason: reason });
      setPendingApps(pendingApps.filter(a => a._id !== id));
      toast.success(`Project ${status} network wide`);
    } catch (e) { toast.error('Override failed'); }
  };

  const handleBan = async (id) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/ban`);
      setUsers(users.map(u => u._id === id ? data.user : u));
      toast.success(data.message);
    } catch (e) { toast.error('Access override failed'); }
  };

  const tabs = [
    { id: 'stats', label: 'Network Nexus', icon: HiCollection },
    { id: 'pending', label: 'Moderation Queue', icon: HiShieldCheck },
    { id: 'users', label: 'Identities', icon: HiUsers },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Central <span className="text-rose-400">Command</span></h1>
        <p className="text-gray-400 mb-10 text-lg">Platform moderation, identity management, and network telemetry</p>

        {/* Floating Glass Tabs */}
        <div className="flex flex-wrap gap-2 mb-10 p-2 glass-panel rounded-2xl w-max">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                tab === t.id ? 'bg-gradient-to-r from-rose-600 to-rose-400 text-white shadow-[0_0_15px_rgba(251,113,133,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
              <t.icon className="w-5 h-5" /> {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin shadow-glow-violet" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            
            {tab === 'stats' && stats && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label:'Total Identities', val:stats?.stats?.totalUsers ?? 0, icon:HiUsers, color:'from-blue-600 to-cyan-400' },
                    { label:'Architects', val:stats?.stats?.totalDevelopers ?? 0, icon:HiUsers, color:'from-violet-600 to-purple-400' },
                    { label:'Active Projects', val:stats?.stats?.totalApps ?? 0, icon:HiCollection, color:'from-emerald-600 to-teal-400' },
                    { label:'Queue Length', val:stats?.stats?.pendingApps ?? 0, icon:HiShieldCheck, color:'from-rose-600 to-orange-400' },
                  ].map((s,i) => (
                    <div key={i} className="glass-panel p-6 rounded-[2rem] relative overflow-hidden group">
                      <div className={`absolute -right-10 -bottom-10 w-32 h-32 bg-gradient-to-tl ${s.color} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`} />
                      <div className="flex items-center gap-5 relative z-10">
                        <div className={`w-14 h-14 bg-gradient-to-br ${s.color} rounded-2xl flex items-center justify-center shadow-glass p-0.5`}>
                          <div className="w-full h-full bg-dark-900 rounded-[14px] flex items-center justify-center">
                            <s.icon className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm font-semibold">{s.label}</p>
                          <p className="text-3xl font-extrabold text-white tracking-tight">{s.val}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'pending' && (
              <div className="space-y-4">
                {pendingApps.length === 0 ? (
                  <div className="glass-panel p-20 text-center rounded-[2rem]">
                    <HiShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-50" />
                    <h3 className="text-2xl font-bold text-white mb-2">Network Secure</h3>
                    <p className="text-gray-400 text-lg">No unidentified projects in the moderation queue.</p>
                  </div>
                ) : pendingApps.map(app => (
                  <div key={app._id} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center gap-6 border-l-4 border-l-rose-500 bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <img src={app.icon} className="w-16 h-16 rounded-xl object-cover shadow-glass border border-white/10" />
                      <div>
                        <p className="text-xl font-bold text-white">{app.title}</p>
                        <p className="text-sm font-medium text-gray-400 mt-1">{app.developer?.name} <span className="text-white/20 mx-2">|</span> {app.category} <span className="text-white/20 mx-2">|</span> v{app.version}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleAppStatus(app._id, 'approved')} className="btn-success px-5 py-2.5 !shadow-none hover:shadow-glow-emerald">
                        <HiCheck className="w-5 h-5 inline mr-1" /> Approve
                      </button>
                      <button onClick={() => {
                        const reason = prompt('Specify rejection cause:');
                        if (reason !== null) handleAppStatus(app._id, 'rejected', reason);
                      }} className="btn-danger px-5 py-2.5 !border border-rose-500/50 hover:shadow-glow-violet">
                        <HiX className="w-5 h-5 inline mr-1" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'users' && (
              <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="p-5 font-semibold text-gray-400 text-sm uppercase tracking-wider">Identity</th>
                        <th className="p-5 font-semibold text-gray-400 text-sm uppercase tracking-wider">Clearance (Role)</th>
                        <th className="p-5 font-semibold text-gray-400 text-sm uppercase tracking-wider">Time Origin</th>
                        <th className="p-5 font-semibold text-gray-400 text-sm uppercase tracking-wider">Network Status</th>
                        <th className="p-5 font-semibold text-gray-400 text-sm uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map(u => (
                        <tr key={u._id} className="hover:bg-white/5 transition-colors">
                          <td className="p-5">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-glass ${u.role === 'admin' ? 'bg-gradient-to-br from-rose-500 to-orange-500' : 'bg-gradient-to-br from-accent-violet to-accent-emerald'}`}>
                                {u.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-white font-bold">{u.name}</p>
                                <p className="text-gray-500 text-xs font-medium">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-5"><span className={u.role === 'admin' ? 'badge-danger' : u.role === 'developer' ? 'badge-primary' : 'badge'}>{u.role}</span></td>
                          <td className="p-5 text-gray-400 font-medium text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="p-5">
                            <span className={u.isBanned ? 'badge flex items-center w-max bg-red-500/20 text-red-400 border border-red-500/30' : 'badge flex items-center w-max bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}>
                              {u.isBanned ? <HiBan className="mr-1"/> : <HiCheck className="mr-1"/>}
                              {u.isBanned ? 'Banned' : 'Active'}
                            </span>
                          </td>
                          <td className="p-5 text-right">
                            {u.role !== 'admin' && (
                              <button onClick={() => handleBan(u._id)}
                                className={`text-sm font-bold px-4 py-2 rounded-xl transition-all border ${
                                  u.isBanned ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-glow-emerald hover:text-emerald-300'
                                  : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20 hover:text-red-400'}`}>
                                {u.isBanned ? 'Restore Access' : 'Revoke Access'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
