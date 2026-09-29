import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiPlus, HiCollection, HiDownload, HiStar, HiTrash, HiCog, HiChartBar,
  HiShieldExclamation, HiExclamationCircle, HiCheckCircle, HiRefresh,
  HiClipboardList, HiServer, HiFilter, HiTrendingUp, HiLightningBolt,
  HiArrowUp, HiArrowDown, HiTemplate
} from 'react-icons/hi';
import { supabase } from '../supabase';
import CustomSelect from '../components/CustomSelect';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// ─── Severity badge styling ───────────────────────────────────────────────────
const severityStyle = {
  critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  high:     'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const logTypeStyle = {
  runtime_crash:      { color: 'text-rose-400',    icon: HiExclamationCircle },
  deployment_error:   { color: 'text-orange-400',  icon: HiServer },
  security_warning:   { color: 'text-yellow-400',  icon: HiShieldExclamation },
  validation_failure: { color: 'text-sky-400',     icon: HiClipboardList },
};

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'];

// ─── Crash Log Detail Drawer ──────────────────────────────────────────────────
const CrashDrawer = ({ log, onClose }) => {
  if (!log) return null;
  const TypeIcon = logTypeStyle[log.logType]?.icon || HiExclamationCircle;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="relative w-full max-w-2xl bg-dark-900 rounded-[2rem] p-8 border border-white/10 shadow-2xl max-h-[85vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors text-2xl leading-none">&times;</button>

          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <TypeIcon className={`w-6 h-6 ${logTypeStyle[log.logType]?.color}`} />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${logTypeStyle[log.logType]?.color}`}>
                {log.logType?.replace(/_/g, ' ')}
              </p>
              <h3 className="text-xl font-bold text-white">{log.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-2">Severity</p>
              <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${severityStyle[log.aiDiagnostic?.severity] || severityStyle.medium}`}>
                {log.aiDiagnostic?.severity || 'medium'}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-2">Device</p>
              <p className="text-xs text-white font-bold">{log.deviceInfo?.deviceModel}</p>
              <p className="text-[10px] text-gray-500">{log.deviceInfo?.osVersion} · v{log.deviceInfo?.appVersion}</p>
            </div>
          </div>

          {log.aiDiagnostic?.summary && (
            <div className="p-5 rounded-2xl bg-accent-violet/10 border border-accent-violet/20 mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-accent-violet mb-2 flex items-center gap-1.5">
                <HiShieldExclamation className="w-3.5 h-3.5" /> AI Diagnostic Summary
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">{log.aiDiagnostic.summary}</p>
            </div>
          )}

          {log.aiDiagnostic?.suggestedFix && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-1.5">
                <HiCheckCircle className="w-3.5 h-3.5" /> Suggested Fix
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">{log.aiDiagnostic.suggestedFix}</p>
            </div>
          )}

          {log.errorStack && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Stack Trace</p>
              <pre className="text-xs text-gray-400 bg-black/40 p-4 rounded-xl overflow-x-auto border border-white/5 leading-relaxed whitespace-pre-wrap">
                {log.errorStack}
              </pre>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Changelog Modal ─────────────────────────────────────────────────────────
const ChangelogModal = ({ release, onClose }) => {
  if (!release) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="relative w-full max-w-2xl bg-dark-900 rounded-[2rem] p-8 border border-white/10 shadow-2xl max-h-[85vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors text-2xl leading-none">&times;</button>
          <h3 className="text-2xl font-bold text-white mb-1">Release Notes</h3>
          <p className="text-sm text-gray-400 mb-6">{release.name} · {release.version} · {release.channel}</p>
          <div className="space-y-3">
            {release.changelog?.map((entry, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="mt-0.5 w-2 h-2 rounded-full bg-accent-neon shrink-0" />
                <p className="text-sm text-gray-300 leading-relaxed">{entry}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Skeleton Loader ─────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="glass-panel p-6 rounded-3xl animate-pulse">
    <div className="h-4 bg-white/5 rounded w-1/3 mb-4" />
    <div className="h-8 bg-white/5 rounded w-2/3" />
  </div>
);

const SkeletonChart = () => (
  <div className="glass-panel rounded-3xl p-6 animate-pulse">
    <div className="h-6 bg-white/5 rounded w-1/4 mb-6" />
    <div className="h-64 bg-white/5 rounded" />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const DeveloperDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('projects');
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Diagnostics tab state
  const [crashLogs, setCrashLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filterAppId, setFilterAppId] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  // Analytics & Growth tab state
  const [analyticsAppFilter, setAnalyticsAppFilter] = useState('all');
  const [analyticsPeriod, setAnalyticsPeriod] = useState(7);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    overview: null,
    timeseries: [],
    deviceBreakdown: [],
    categoryBreakdown: []
  });

  // Release Management tab state
  const [releases, setReleases] = useState([]);
  const [releasesLoading, setReleasesLoading] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [rolloutValue, setRolloutValue] = useState({});

  // ── Load apps ──────────────────────────────────────────────────────────────
  const loadApps = async () => {
    try {
      const { data } = await api.get('/apps/my');
      setApps(data?.apps || []);
    } catch { toast.error('Failed to load your portfolio'); }
    finally { setLoading(false); }
  };

  // ── Load crash logs ────────────────────────────────────────────────────────
  const loadCrashLogs = async () => {
    setLogsLoading(true);
    try {
      const { data } = await api.get('/crash-logs');
      setCrashLogs(data?.logs || []);
    } catch (err) {
      if (err.response?.status !== 404) toast.error('Failed to load crash logs');
      setCrashLogs([]);
    } finally { setLogsLoading(false); }
  };

  // ── Load analytics data ────────────────────────────────────────────────────
  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const appParam = analyticsAppFilter === 'all' ? '' : `&appId=${analyticsAppFilter}`;
      const { data } = await api.get(`/developer/analytics?days=${analyticsPeriod}${appParam}`);
      setAnalyticsData({
        overview: data?.overview || null,
        timeseries: data?.timeseries || [],
        deviceBreakdown: data?.deviceBreakdown || [],
        categoryBreakdown: data?.categoryBreakdown || []
      });
    } catch {
      setAnalyticsData({
        overview: null,
        timeseries: [],
        deviceBreakdown: [],
        categoryBreakdown: []
      });
    } finally { setAnalyticsLoading(false); }
  };

  // ── Load releases ──────────────────────────────────────────────────────────
  const loadReleases = async () => {
    setReleasesLoading(true);
    try {
      const { data } = await api.get('/developer/releases');
      setReleases(data?.releases || []);
    } catch {
      setReleases([]);
    } finally { setReleasesLoading(false); }
  };

  // ── Release actions ─────────────────────────────────────────────────────────
  const handleRolloutChange = async (releaseId, value) => {
    setRolloutValue(prev => ({ ...prev, [releaseId]: value }));
    try {
      await api.post(`/developer/releases/${releaseId}/rollout`, { percentage: value });
      toast.success(`Rollout updated to ${value}%`);
    } catch {
      toast.error('Failed to update rollout');
    }
  };

  const handlePromoteRelease = async (releaseId, channel) => {
    try {
      await api.post(`/developer/releases/${releaseId}/promote`, { targetChannel: channel });
      toast.success(`Promoted to ${channel}`);
      loadReleases();
    } catch {
      toast.error('Failed to promote release');
    }
  };

  useEffect(() => {
    if (!user) return;
    loadApps();

    const channelName = `developer_dashboard_${user._id}`;
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'app_update' }, () => loadApps())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  useEffect(() => {
    if (activeTab === 'diagnostics' && crashLogs.length === 0) loadCrashLogs();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'analytics') loadAnalytics();
  }, [activeTab, analyticsAppFilter, analyticsPeriod]);

  useEffect(() => {
    if (activeTab === 'releases') loadReleases();
  }, [activeTab]);

  // ── Delete app ─────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Erase this creation from the network?')) return;
    try {
      await api.delete(`/apps/${id}`);
      setApps(apps.filter(app => app._id !== id));
      toast.success('Creation erased successfully');
    } catch (error) {
      if (error.response?.status === 404) {
        setApps(apps.filter(app => app._id !== id));
        toast.success('App was already removed by an administrator. Syncing your dashboard.');
      } else {
        toast.error('Erasure failed');
      }
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalDownloads = apps.reduce((sum, app) => sum + (app.totalDownloads || 0), 0);
  const avgRating = apps.length > 0
    ? (apps.reduce((sum, app) => sum + (app.averageRating || 0), 0) / apps.length).toFixed(1)
    : '0.0';

  // ── Filtered crash logs ────────────────────────────────────────────────────
  const filteredLogs = crashLogs.filter(log => {
    const appMatch = filterAppId === 'all' || log.app?._id === filterAppId || log.app === filterAppId;
    const sevMatch = filterSeverity === 'all' || log.aiDiagnostic?.severity === filterSeverity;
    return appMatch && sevMatch;
  });

  const criticalCount = crashLogs.filter(l => l.aiDiagnostic?.severity === 'critical').length;

  const conversionRate = analyticsData.overview
    ? ((analyticsData.overview.downloads / (analyticsData.overview.impressions || 1)) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 relative z-10">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
              Architect <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-gray-300 text-lg">Manage your digital portfolio and monitor telemetry.</p>
          </div>
          <Link to="/upload" className="btn-primary shadow-glow-violet flex items-center gap-2">
            <HiPlus className="w-5 h-5" /> Deploy New App
          </Link>
        </div>

        {/* Telemetry Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 relative z-10">
          {[
            { label: 'Active Projects',  value: apps.length,      icon: HiCollection,       color: 'from-accent-violet to-accent-neon' },
            { label: 'Total Downloads',  value: totalDownloads,   icon: HiDownload,          color: 'from-accent-emerald to-teal-400' },
            { label: 'Network Rating',   value: avgRating,        icon: HiStar,              color: 'from-yellow-400 to-orange-500' },
            { label: 'Crash Alerts',     value: criticalCount,    icon: HiShieldExclamation, color: 'from-rose-500 to-red-400' },
          ].map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
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
                  <p className="text-gray-300 text-sm font-semibold">{stat.label}</p>
                  <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tab Bar */}
        <div className="flex gap-3 p-1.5 glass-panel rounded-2xl mb-8 w-fit relative z-10 flex-wrap">
          {[
            { id: 'projects',    label: 'Project Matrix',  icon: HiChartBar },
            { id: 'analytics',   label: 'Analytics & Growth', icon: HiTrendingUp },
            { id: 'releases',    label: 'Release Management', icon: HiTemplate },
            { id: 'diagnostics', label: 'App Health',      icon: HiShieldExclamation },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-accent-violet to-accent-neon text-white shadow-glow-violet'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ── PROJECT MATRIX TAB ──────────────────────────────────────────── */}
        {activeTab === 'projects' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel rounded-3xl overflow-hidden border-white/10 relative z-10">
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
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <HiCollection className="w-12 h-12 opacity-30" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No projects deployed</h3>
                  <p className="max-w-xs mx-auto mb-8 text-sm">Your digital archive is currently empty.</p>
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
                      <tr key={app._id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="p-6">
                          <Link to={`/app/${app._id}`} className="flex items-center gap-5">
                            <div className="relative">
                              <div className="absolute -inset-1 bg-gradient-to-r from-accent-violet to-accent-neon rounded-2xl opacity-20 group-hover:opacity-40 blur transition-opacity" />
                              <img
                                src={app.icon}
                                className="w-14 h-14 rounded-xl object-cover relative z-10 border border-white/10 shadow-2xl"
                                width="56" height="56" loading="lazy" decoding="async"
                                onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.title)}&background=random&size=128`; }}
                              />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-white group-hover:text-accent-neon transition-colors leading-tight">{app.title}</p>
                              <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">
                                {Array.isArray(app.category) ? app.category[0] : app.category}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="p-6 text-center">
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            app.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]' :
                            app.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse" />
                            {app.status}
                          </span>
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex flex-col items-center">
                            <p className="text-lg font-bold text-white">{(app.totalDownloads || 0).toLocaleString()}</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Transfers</p>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1.5">
                              <HiStar className="text-yellow-400 w-4 h-4" />
                              <span className="text-lg font-bold text-white">{(app.averageRating || 0).toFixed(1)}</span>
                            </div>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Rating Index</p>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-3 translate-x-2 group-hover:translate-x-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <button
                              onClick={() => navigate(`/edit/${app._id}`)}
                              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-all"
                            >
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
        )}

        {/* ── ANALYTICS & GROWTH TAB ─────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 relative z-10">
            <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/10">
              <div className="flex items-center gap-3">
                <HiFilter className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-400 font-bold uppercase tracking-widest">Filters</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <CustomSelect
                  value={analyticsAppFilter}
                  onChange={val => setAnalyticsAppFilter(val)}
                  options={[{ value: 'all', label: 'All Apps' }, ...apps.map(a => ({ value: a._id, label: a.title }))]}
                  placeholder="All Apps"
                />
                <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                  {[7, 30, 90].map(period => (
                    <button
                      key={period}
                      onClick={() => setAnalyticsPeriod(period)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        analyticsPeriod === period
                          ? 'bg-gradient-to-r from-accent-violet to-accent-neon text-white shadow-glow-violet'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {period}D
                    </button>
                  ))}
                </div>
                <button
                  onClick={loadAnalytics}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-all"
                >
                  <HiRefresh className="w-4 h-4" /> Refresh
                </button>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                <div className="lg:col-span-2"><SkeletonChart /></div>
                <div className="lg:col-span-2"><SkeletonChart /></div>
              </div>
            ) : !analyticsData.overview ? (
              <div className="p-24 text-center glass-panel rounded-3xl flex flex-col items-center border border-white/10">
                <HiTrendingUp className="w-16 h-16 text-gray-600 mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">No analytics data</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  We couldn't retrieve analytics for the selected filters. Try a different timeframe or app.
                </p>
              </div>
            ) : (
              <>
                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      label: 'Conversion Rate',
                      value: `${conversionRate}%`,
                      sub: `${analyticsData.overview.impressions?.toLocaleString() || 0} impressions`,
                      icon: HiTrendingUp,
                      color: 'from-accent-violet to-accent-neon',
                      trend: '+2.4%'
                    },
                    {
                      label: 'Bandwidth Consumed',
                      value: `${(analyticsData.overview.bandwidthGB || 0).toFixed(1)} GB`,
                      sub: 'APK delivery this period',
                      icon: HiDownload,
                      color: 'from-accent-emerald to-teal-400',
                      trend: '-5.1%'
                    },
                    {
                      label: 'Active Installs',
                      value: (analyticsData.overview.activeInstalls || 0).toLocaleString(),
                      sub: `${analyticsData.overview.dailyDownloads || 0} daily downloads`,
                      icon: HiLightningBolt,
                      color: 'from-yellow-400 to-orange-500',
                      trend: '+12%'
                    },
                    {
                      label: 'Avg Rating',
                      value: (analyticsData.overview.avgRating || 0).toFixed(1),
                      sub: `Sentiment: ${analyticsData.overview.sentimentScore || 'N/A'}/100`,
                      icon: HiStar,
                      color: 'from-pink-500 to-rose-400',
                      trend: '+0.2'
                    },
                  ].map((stat, i) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      key={i} className="glass-panel p-6 rounded-3xl relative overflow-hidden group"
                    >
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${stat.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} p-0.5 shadow-glass`}>
                          <div className="w-full h-full bg-dark-900 rounded-xl flex items-center justify-center">
                            <stat.icon className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <span className={`flex items-center gap-1 text-xs font-bold ${stat.trend?.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {stat.trend?.startsWith('+') ? <HiArrowUp className="w-3 h-3" /> : <HiArrowDown className="w-3 h-3" />}
                          {stat.trend}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm font-semibold mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mt-2">{stat.sub}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-panel rounded-3xl p-6 border border-white/10"
                  >
                    <h3 className="text-lg font-bold text-white mb-6">Downloads & Impressions</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData.timeseries}>
                          <defs>
                            <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} />
                          <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                          />
                          <Area type="monotone" dataKey="impressions" stroke="#3b82f6" fillOpacity={1} fill="url(#colorImpressions)" strokeWidth={2} />
                          <Area type="monotone" dataKey="downloads" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorDownloads)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-panel rounded-3xl p-6 border border-white/10"
                  >
                    <h3 className="text-lg font-bold text-white mb-6">Device & OS Breakdown</h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.deviceBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {analyticsData.deviceBreakdown.map((entry, index) => (
                              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                      {analyticsData.deviceBreakdown.map((entry, index) => (
                        <span key={index} className="flex items-center gap-2 text-xs text-gray-300">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                          {entry.name}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Category Breakdown */}
                {analyticsData.categoryBreakdown?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-panel rounded-3xl p-6 border border-white/10"
                  >
                    <h3 className="text-lg font-bold text-white mb-6">Downloads by Category</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.categoryBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} />
                          <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                          />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {analyticsData.categoryBreakdown.map((entry, index) => (
                              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ── RELEASE MANAGEMENT TAB ─────────────────────────────────────── */}
        {activeTab === 'releases' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 relative z-10">
            {releasesLoading ? (
              <div className="p-20 text-center flex flex-col items-center glass-panel rounded-3xl">
                <div className="w-12 h-12 border-4 border-accent-violet border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-400 font-medium">Loading release channels...</p>
              </div>
            ) : releases.length === 0 ? (
              <div className="p-24 text-center glass-panel rounded-3xl flex flex-col items-center border border-white/10">
                <HiTemplate className="w-16 h-16 text-gray-600 mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">No active releases</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  Once you publish builds, release channels will appear here for phased rollouts.
                </p>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HiTemplate className="w-6 h-6 text-accent-neon" />
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">Release Channels</h2>
                  </div>
                  <span className="text-xs font-mono text-gray-500 uppercase">Phased Rollout Control</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-gray-400 text-[10px] uppercase tracking-[0.2em]">
                        <th className="p-6 font-bold">App</th>
                        <th className="p-6 font-bold text-center">Channel</th>
                        <th className="p-6 font-bold text-center">Version</th>
                        <th className="p-6 font-bold text-center">Rollout</th>
                        <th className="p-6 font-bold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {releases.map((release, i) => (
                        <tr key={release._id || i} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-accent-violet to-accent-neon rounded-xl opacity-20 blur transition-opacity" />
                                <img
                                  src={release.appIcon}
                                  className="w-10 h-10 rounded-lg object-cover relative z-10 border border-white/10"
                                  width="40" height="40" loading="lazy"
                                  onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(release.appName)}&background=random&size=64`; }}
                                />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">{release.appName}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{release.buildNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-6 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              release.channel === 'stable' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              release.channel === 'beta' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                              'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            }`}>
                              {release.channel}
                            </span>
                          </td>
                          <td className="p-6 text-center">
                            <p className="text-sm font-mono text-white">{release.version}</p>
                          </td>
                          <td className="p-6 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={rolloutValue[release._id] ?? release.rolloutPercentage ?? 0}
                                onChange={(e) => handleRolloutChange(release._id, parseInt(e.target.value))}
                                className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-neon"
                              />
                              <span className="text-[10px] font-bold text-gray-400">{rolloutValue[release._id] ?? release.rolloutPercentage ?? 0}%</span>
                            </div>
                          </td>
                          <td className="p-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setSelectedRelease(release)}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold rounded-lg border border-white/10 transition-all"
                              >
                                Notes
                              </button>
                              {release.channel !== 'stable' && (
                                <button
                                  onClick={() => handlePromoteRelease(release._id, release.channel === 'alpha' ? 'beta' : 'stable')}
                                  className="px-3 py-1.5 bg-gradient-to-r from-accent-violet to-accent-neon text-white text-[10px] font-bold rounded-lg shadow-glow-violet transition-all"
                                >
                                  Promote
                                </button>
                              )}
                            </div>
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

        {/* ── DIAGNOSTICS TAB ─────────────────────────────────────────────── */}
        {activeTab === 'diagnostics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 relative z-10">

            {/* Controls */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/10">
              <div className="flex items-center gap-3">
                <HiFilter className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-400 font-bold uppercase tracking-widest">Filters</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <CustomSelect
                  value={filterAppId}
                  onChange={val => setFilterAppId(val)}
                  options={[{ value: 'all', label: 'All Apps' }, ...apps.map(a => ({ value: a._id, label: a.title }))]}
                  placeholder="All Apps"
                />
                <CustomSelect
                  value={filterSeverity}
                  onChange={val => setFilterSeverity(val)}
                  options={[
                    { value: 'all', label: 'All Severities' },
                    { value: 'critical', label: 'Critical' },
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' },
                  ]}
                  placeholder="All Severities"
                />
                <button
                  onClick={loadCrashLogs}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-all"
                >
                  <HiRefresh className="w-4 h-4" /> Refresh
                </button>
              </div>
            </div>

            {/* Logs list */}
            {logsLoading ? (
              <div className="p-20 text-center flex flex-col items-center glass-panel rounded-3xl">
                <div className="w-12 h-12 border-4 border-accent-violet border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-400 font-medium">Fetching diagnostic telemetry...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-24 text-center glass-panel rounded-3xl flex flex-col items-center border border-white/10">
                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                  <HiCheckCircle className="w-12 h-12 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">All Systems Nominal</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  No crash logs found{filterAppId !== 'all' || filterSeverity !== 'all' ? ' matching your filters' : ''} in the last 30 days.
                  Your apps are running smoothly!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log, i) => {
                  const TypeIcon = logTypeStyle[log.logType]?.icon || HiExclamationCircle;
                  return (
                    <motion.button
                      key={log._id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedLog(log)}
                      className="w-full text-left glass-panel p-5 rounded-2xl border border-white/10 hover:border-accent-violet/40 transition-all hover:bg-white/[0.03] group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0 mt-0.5">
                          <TypeIcon className={`w-5 h-5 ${logTypeStyle[log.logType]?.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-white font-bold text-sm group-hover:text-accent-neon transition-colors truncate">{log.title}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${severityStyle[log.aiDiagnostic?.severity] || severityStyle.medium}`}>
                              {log.aiDiagnostic?.severity || 'medium'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                            <span className="font-mono">{log.logType?.replace(/_/g, ' ')}</span>
                            {log.app?.title && <span className="font-semibold text-slate-300">{log.app.title}</span>}
                            <span>v{log.deviceInfo?.appVersion}</span>
                            <span>{log.deviceInfo?.deviceModel}</span>
                            <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                          </div>
                          {log.aiDiagnostic?.summary && (
                            <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">{log.aiDiagnostic.summary}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-600 font-bold shrink-0 group-hover:text-accent-violet transition-colors">View &rarr;</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Info banner about retention */}
            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-start gap-3">
              <HiShieldExclamation className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-sky-400 uppercase tracking-widest mb-1">Free Plan · 30-Day Log Retention</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Crash logs are automatically cleared after 30 days. Upgrade to a Pro plan for 90-day retention
                  and deep AI stack trace analysis (coming soon).
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Crash Log Drawer */}
      {selectedLog && <CrashDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />}
      {/* Changelog Modal */}
      {selectedRelease && <ChangelogModal release={selectedRelease} onClose={() => setSelectedRelease(null)} />}
    </div>
  );
};

export default DeveloperDashboard;
