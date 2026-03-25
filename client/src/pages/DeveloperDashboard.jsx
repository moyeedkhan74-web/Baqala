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
      const { data } = await api.get('/apps/me');
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
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <HiChartBar className="w-6 h-6 text-accent-neon" />
            <h2 className="text-xl font-bold text-white">Project Matrix</h2>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading telemetry...</div>
            ) : apps.length === 0 ? (
              <div className="p-16 text-center text-gray-400 flex flex-col items-center">
                <HiCollection className="w-12 h-12 mb-4 opacity-50" />
                <p>Your portfolio is currently empty.</p>
                <Link to="/upload" className="text-accent-neon mt-2 hover:underline">Deploy your first project</Link>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">Application</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Downloads</th>
                    <th className="p-4 font-semibold">Rating</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {apps.map((app) => (
                    <tr key={app._id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4">
                        <Link to={`/app/${app._id}`} className="flex items-center gap-4">
                          <img src={app.icon} className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-glass" />
                          <div>
                            <p className="font-bold text-white group-hover:text-accent-neon transition-colors">{app.title}</p>
                            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">{app.category}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="p-4">
                        <span className={app.status === 'approved' ? 'badge-success' : app.status === 'rejected' ? 'badge-danger' : 'badge-warning'}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 text-white font-medium">{app.totalDownloads}</td>
                      <td className="p-4 flex items-center gap-1.5 pt-7">
                        <HiStar className="text-yellow-500" /> <span className="text-white font-medium">{app.averageRating.toFixed(1)}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"><HiCog className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(app._id)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"><HiTrash className="w-4 h-4" /></button>
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
