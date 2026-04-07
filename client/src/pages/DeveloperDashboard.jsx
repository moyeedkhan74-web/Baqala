import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiPlus, HiCollection, HiDownload, HiStar, HiTrash, HiCog, HiChartBar } from 'react-icons/hi';

const DeveloperDashboard = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadApps(); }, []);

  const loadApps = async () => {
    try {
      const { data } = await api.get('/apps/my');
      setApps(data.apps);
    } catch (error) { toast.error('Failed to load your portfolio'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Erase this creation from the network?')) return;
    try {
      await api.delete(`/apps/${id}`);
      setApps(apps.filter(app => app._id !== id));
      toast.success('Creation erased successfully');
    } catch (error) { toast.error('Erasure failed'); }
  };

  const totalDownloads = apps.reduce((sum, app) => sum + app.totalDownloads, 0);
  const avgRating = apps.length > 0 ? (apps.reduce((sum, app) => sum + app.averageRating, 0) / apps.length).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 relative z-10">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
              Architect <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-gray-400 text-lg">Manage your digital portfolio and monitor telemetry.</p>
          </div>
          <Link to="/upload" className="btn-primary shadow-glow-violet flex items-center gap-2">
            <HiPlus className="w-5 h-5" /> Deploy New App
          </Link>
        </div>

        {/* Telemetry Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10">
          {[
            { label: 'Active Projects', value: apps.length, icon: HiCollection, color: 'from-accent-violet to-accent-neon' },
            { label: 'Total Downloads', value: totalDownloads, icon: HiDownload, color: 'from-accent-emerald to-teal-400' },
            { label: 'Network Rating', value: avgRating, icon: HiStar, color: 'from-yellow-400 to-orange-500' }
          ].map((stat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              key={i} className="glass-panel p-6 rounded-3xl relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${stat.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} p-0.5 shadow-glass`}>
                  <div className="w-full h-full bg-dark-900 rounded-2xl flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-semibold">{stat.label}</p>
                  <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Portfolio Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-panel rounded-3xl overflow-hidden border-white/10 relative z-10">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HiChartBar className="w-6 h-6 text-accent-neon" />
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">Project Matrix</h2>
            </div>
            {apps.length > 0 && (
              <span className="text-xs font-mono text-gray-500 uppercase">Synchronized with Global Network</span>
            )}
          </div>
          
          <div className="overflow-x-auto overflow-y-hidden">
            {loading ? (
              <div className="p-20 text-center flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-accent-neon border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-400 font-medium">Retrieving digital assets...</p>
              </div>
            ) : apps.length === 0 ? (
              <div className="p-24 text-center text-gray-400 flex flex-col items-center">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <HiCollection className="w-12 h-12 opacity-30" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No projects deployed</h3>
                <p className="max-w-xs mx-auto mb-8 text-sm">Your digital archive is currently empty. Start by deploying your first creation to the network.</p>
                <Link to="/upload" className="btn-primary flex items-center gap-2">
                  <HiPlus className="w-5 h-5" /> Initialize First Project
                </Link>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-gray-400 text-[10px] uppercase tracking-[0.2em]">
                    <th className="p-6 font-bold">Identity</th>
                    <th className="p-6 font-bold text-center">Cloud Status</th>
                    <th className="p-6 font-bold text-center">Telemetry</th>
                    <th className="p-6 font-bold text-center">Consensus</th>
                    <th className="p-6 font-bold text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {apps.map((app) => (
                    <tr key={app._id} className="group hover:bg-white/[0.02] transition-colors relative">
                      <td className="p-6">
                        <Link to={`/app/${app._id}`} className="flex items-center gap-5">
                          <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-accent-violet to-accent-neon rounded-2xl opacity-20 group-hover:opacity-40 blur transition-opacity" />
                            <img 
                              src={app.icon} 
                              className="w-14 h-14 rounded-xl object-cover relative z-10 border border-white/10 shadow-2xl" 
                              onError={(e) => { e.target.src = 'https://uuoczotaitlitzgijltx.supabase.co/storage/v1/object/public/Baqala/icons/default_app_icon.png'; }}
                            />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-white group-hover:text-accent-neon transition-colors leading-tight">{app.title}</p>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">{app.category}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="p-6 text-center">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          app.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]' : 
                          app.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse" />
                          {app.status}
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <div className="flex flex-col items-center">
                          <p className="text-lg font-bold text-white">{app.totalDownloads.toLocaleString()}</p>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Transfers</p>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1.5">
                            <HiStar className="text-yellow-400 w-4 h-4 shadow-glow-yellow" />
                            <span className="text-lg font-bold text-white">{app.averageRating.toFixed(1)}</span>
                          </div>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Rating Index</p>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-3 translate-x-2 group-hover:translate-x-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-all">
                            <HiCog className="w-4 h-4" /> Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(app._id)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl border border-rose-500/20 transition-all duration-300"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DeveloperDashboard;
