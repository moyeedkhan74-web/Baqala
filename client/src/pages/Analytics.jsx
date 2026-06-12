import React, { useState } from 'react';
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
  Cpu
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

const Analytics = () => {
  const downloadData = [
    { date: '2026-06-01', count: 1200 },
    { date: '2026-06-03', count: 2100 },
    { date: '2026-06-05', count: 1800 },
    { date: '2026-06-07', count: 2800 },
    { date: '2026-06-09', count: 3200 },
    { date: '2026-06-11', count: 4500 },
    { date: '2026-06-12', count: 4100 },
  ];

  const topApps = [
    { name: 'PhotoEdit Pro', downloads: 12400 },
    { name: 'Zombie Rush', downloads: 9800 },
    { name: 'CryptoPulse', downloads: 8200 },
    { name: 'TaskMaster', downloads: 5600 },
    { name: 'WeatherGo', downloads: 4100 },
  ];

  const deviceData = [
    { name: 'Android 14', value: 45, color: '#8b5cf6' },
    { name: 'Android 13', value: 30, color: '#3b82f6' },
    { name: 'Android 12', value: 15, color: '#10b981' },
    { name: 'Others', value: 10, color: '#64748b' },
  ];

  return (
    <AdminLayout title="Platform Analytics">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Main Growth Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Growth Overview</h2>
              <p className="text-sm text-slate-500 font-bold">Total downloads tracked daily</p>
            </div>
            <div className="flex gap-2">
               <button className="px-4 py-2 bg-accent-violet text-white rounded-xl text-xs font-bold">Daily</button>
               <button className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-xl text-xs font-bold">Monthly</button>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={downloadData}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={4} fill="url(#colorGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Apps Bar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
           <h2 className="text-xl font-black text-slate-900 dark:text-white mb-8">Top Performer Apps</h2>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topApps} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} width={100} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="downloads" fill="#8b5cf6" radius={[0, 10, 10, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
           <h2 className="text-xl font-black text-slate-900 dark:text-white mb-8">Device Ecosystem</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
             <div className="h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie data={deviceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                     {deviceData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="space-y-4">
                {deviceData.map(item => (
                  <div key={item.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-bold text-slate-500">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{item.value}%</span>
                  </div>
                ))}
             </div>
           </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           <div className="bg-emerald-500 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-500/20">
              <Globe className="w-10 h-10 mb-4 opacity-50" />
              <p className="text-emerald-100 font-black uppercase text-[10px] tracking-widest">Active Regions</p>
              <h3 className="text-3xl font-black mt-1">14 Countries</h3>
           </div>
           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
              <Cpu className="w-10 h-10 mb-4 text-accent-violet" />
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Server Load</p>
              <h3 className="text-3xl font-black mt-1 text-emerald-500">Normal</h3>
           </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default Analytics;
