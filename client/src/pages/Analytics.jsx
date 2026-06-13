import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { 
  TrendingUp, 
  Users, 
  Download, 
  ArrowUpRight, 
  BarChart3, 
  PieChart as PieChartIcon,
  Calendar,
  Globe,
  Smartphone,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Cell,
  Pie
} from 'recharts';
import api from '../api/axios';

const Analytics = () => {
  const [data, setData] = useState({
    topApps: [],
    downloadTrend: [],
    categoryDistribution: [],
    recentUsers: [],
    summary: { totalApps: 0, totalUsers: 0, totalDownloads: 0, pendingReports: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [period, setPeriod] = useState(7);

  const fetchAnalytics = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await api.get(`/admin/analytics?days=${period}`);
      setData(res.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(true);
    const interval = setInterval(() => fetchAnalytics(false), 30000);
    return () => clearInterval(interval);
  }, [period]);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'];

  if (loading && !lastUpdated) {
    return (
      <AdminLayout title="Platform Analytics">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-accent-violet border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  // Map category distribution to chart format
  const topCategories = data.categoryDistribution.slice(0, 5);
  const otherCategoriesCount = data.categoryDistribution.slice(5).reduce((sum, item) => sum + item.value, 0);
  const pieData = [
    ...topCategories,
    ...(otherCategoriesCount > 0 ? [{ name: 'Other', value: otherCategoriesCount }] : [])
  ].map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <AdminLayout title="Platform Analytics">
      {/* Real-time Indicator Header */}
      <div className="flex justify-end items-center mb-6 gap-4">
        {lastUpdated && (
          <>
             <span className="flex items-center gap-2 text-xs font-bold bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Updates Enabled
             </span>
             <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-3 py-1.5 rounded-full shadow-sm">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
             </span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Main Growth Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Growth Overview</h2>
              <p className="text-sm text-slate-500 font-bold">Total downloads tracked</p>
            </div>
            <select 
              value={period}
              onChange={(e) => setPeriod(parseInt(e.target.value))}
              className="bg-slate-100 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer"
            >
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 14 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.downloadTrend}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="downloads" name="Downloads" stroke="#8b5cf6" strokeWidth={4} fill="url(#colorGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Apps Bar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
           <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Top Performer Apps</h2>
           <p className="text-sm text-slate-500 font-bold mb-8">Highest lifetime downloads</p>
           <div className="h-[300px] w-full">
            {data.topApps.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topApps} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="title" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} width={120} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }} 
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }} 
                    formatter={(value, name) => [value, 'Total Downloads']}
                  />
                  <Bar dataKey="totalDownloads" fill="#8b5cf6" radius={[0, 10, 10, 0]} barSize={24}>
                    {data.topApps.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-slate-500 font-bold text-sm">No app data available</div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
           <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Category Ecosystem</h2>
           <p className="text-sm text-slate-500 font-bold mb-8">Distribution of all apps</p>
           <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
             <div className="h-[200px]">
               {pieData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                       {pieData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Pie>
                     <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }} />
                   </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex items-center justify-center text-slate-500 font-bold text-sm">No categories found</div>
               )}
             </div>
             <div className="space-y-4">
                {pieData.map(item => (
                  <div key={item.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-bold text-slate-500 truncate max-w-[120px]">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
             </div>
           </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           <div className="bg-emerald-500 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
              <Users className="w-10 h-10 mb-4 opacity-75" />
              <p className="text-emerald-100 font-black uppercase text-[10px] tracking-widest">Total Community</p>
              <h3 className="text-4xl font-black mt-1">{data.summary.totalUsers}</h3>
           </div>
           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group border border-slate-800">
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-accent-violet/20 rounded-full blur-3xl group-hover:bg-accent-violet/30 transition-all"></div>
              <LucidePackage className="w-10 h-10 mb-4 text-accent-violet" />
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Total Apps Published</p>
              <h3 className="text-4xl font-black mt-1 text-white">{data.summary.totalApps}</h3>
           </div>
        </div>

      </div>
    </AdminLayout>
  );
};

// Fix the missing import icon in this snippet relative context
import { Package as LucidePackage } from 'lucide-react';

export default Analytics;
