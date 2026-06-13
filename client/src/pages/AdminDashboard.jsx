import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { 
  TrendingUp, 
  Users, 
  Download, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  ExternalLink,
  Package as LucidePackage,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import api from '../api/axios';

const KPICard = ({ title, value, change, isPositive, icon: Icon, color }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-4 rounded-2xl ${color} shadow-lg transition-transform group-hover:scale-110`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        {change}%
      </div>
    </div>
    <h3 className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">{title}</h3>
    <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{value}</p>
  </div>
);

// Helper for time formatting without external deps
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalApps: '0',
    totalUsers: '0',
    pendingReports: '0',
    totalDownloads: '0'
  });

  const [changes, setChanges] = useState({
    apps: '0',
    users: '0',
    downloads: '0',
    reports: '0'
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const { data } = await api.get(`/admin/stats?days=${period}`);
      setStats({
        totalApps: data.stats.totalApps.toString(),
        totalUsers: data.stats.totalUsers.toString(),
        pendingReports: data.stats.pendingReports.toString(),
        totalDownloads: data.stats.totalDownloads > 1000 
          ? (data.stats.totalDownloads / 1000).toFixed(1) + 'k' 
          : data.stats.totalDownloads.toString()
      });
      setChanges(data.changes || { apps: '0', users: '0', downloads: '0', reports: '0' });
      setRecentActivity(data.activity);
      setChartData(data.chartData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch + auto-poll every 30 seconds
  useEffect(() => {
    fetchStats(true);
    const interval = setInterval(() => fetchStats(false), 30000);
    return () => clearInterval(interval);
  }, [period]);

  if (loading) {
    return (
      <AdminLayout title="Loading Stats...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-accent-violet border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Platform Overview">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Apps" 
          value={stats.totalApps} 
          change={changes.apps} 
          isPositive={parseFloat(changes.apps) >= 0} 
          icon={LucidePackage} 
          color="bg-accent-violet" 
        />
        <KPICard 
          title="Total Users" 
          value={stats.totalUsers} 
          change={changes.users} 
          isPositive={parseFloat(changes.users) >= 0} 
          icon={Users} 
          color="bg-blue-500" 
        />
        <KPICard 
          title="Pending Reports" 
          value={stats.pendingReports} 
          change={changes.reports} 
          isPositive={parseFloat(changes.reports) <= 5} // Lower reports is better, but here we show change
          icon={AlertCircle} 
          color="bg-amber-500" 
        />
        <KPICard 
          title="Total Downloads" 
          value={stats.totalDownloads} 
          change={changes.downloads} 
          isPositive={parseFloat(changes.downloads) >= 0} 
          icon={Download} 
          color="bg-emerald-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Downloads Activity</h2>
              <p className="text-sm text-slate-500 font-bold flex items-center gap-2">
                Platform performance trend
                {lastUpdated && (
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full ml-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Update
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              )}
              <select 
                value={period}
                onChange={(e) => setPeriod(parseInt(e.target.value))}
                className="bg-slate-100 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: 'none', 
                    borderRadius: '16px',
                    color: '#fff',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ color: '#8b5cf6', fontWeight: 700 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="downloads" 
                  stroke="#8b5cf6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorDownloads)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Recent Activity</h2>
            <button className="text-accent-violet p-2 hover:bg-accent-violet/10 rounded-xl transition-colors">
              <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex gap-4 group">
                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                  item.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                  item.type === 'error' ? 'bg-rose-500/10 text-rose-500' :
                  item.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-blue-500/10 text-blue-500'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black dark:text-white">
                    {item.action}: <span className="text-accent-violet">{item.target}</span>
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                    by {item.admin} • {timeAgo(item.time)}
                  </p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="text-center py-10">
                <p className="text-sm text-slate-500 font-bold">No recent activity</p>
              </div>
            )}
          </div>

          <button className="w-full mt-8 py-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 text-slate-400 font-bold hover:border-accent-violet hover:text-accent-violet transition-all text-sm">
            View Audit Log
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
