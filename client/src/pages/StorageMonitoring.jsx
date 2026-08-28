import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Database, HardDrive, Zap, ScrollText, Server, RefreshCw,
  Trash2, CheckCircle2, AlertTriangle, Circle, Cloud, Image
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api, { API_BASE_URL } from '../api/axios';

const COLORS = {
  database: '#8b5cf6',
  binaries: '#3b82f6',
  media: '#ec4899',
  tempCache: '#f59e0b',
  logs: '#10b981'
};

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return 'N/A';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
}

function formatNumber(n) {
  if (n === null || n === undefined || isNaN(n)) return 'N/A';
  return n.toLocaleString();
}

function usageColor(pct) {
  if (pct === null || pct === undefined) return '#8b5cf6';
  if (pct > 85) return '#ef4444';
  if (pct >= 70) return '#f59e0b';
  return '#10b981';
}

function useCountUp(value, duration = 600) {
  const [display, setDisplay] = useState(typeof value === 'number' ? value : 0);
  const fromRef = useRef(typeof value === 'number' ? value : 0);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = typeof value === 'number' ? value : 0;
    if (from === to) return;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return display;
}

function AnimatedBytes({ bytes }) {
  const display = useCountUp(bytes);
  const rounded = Math.max(0, Math.round(display));
  return <>{formatBytes(rounded)}</>;
}

function Gauge({ percentage }) {
  const pct = percentage === null || percentage === undefined ? 0 : Math.min(percentage, 100);
  const color = usageColor(percentage);
  return (
    <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${color} ${pct}%, rgba(255,255,255,0.06) 0)`,
          mask: 'radial-gradient(closest-side, transparent 70%, black 72%)',
          WebkitMask: 'radial-gradient(closest-side, transparent 70%, black 72%)'
        }}
      />
      <div className="relative text-center">
        <div className="text-4xl font-black text-white">
          {percentage === null || percentage === undefined ? '—' : `${pct.toFixed(1)}%`}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Used</div>
      </div>
    </div>
  );
}

function ProgressBar({ segments, color, showLabel }) {
  // segments: [{ value, color }]; total computed
  const total = segments.reduce((s, x) => s + (x.value || 0), 0);
  return (
    <div className="w-full">
      <div className="h-2 rounded-full bg-white/10 overflow-hidden flex">
        {segments.map((seg, i) => {
          const pct = total > 0 ? ((seg.value || 0) / total) * 100 : 0;
          return (
            <div
              key={i}
              className="h-full origin-left"
              style={{ width: `${pct}%`, background: seg.color || color }}
            />
          );
        })}
      </div>
      {showLabel !== false && total > 0 && (
        <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
          {segments.map((seg, i) => {
            const pct = total > 0 ? ((seg.value || 0) / total) * 100 : 0;
            return <span key={i}>{seg.name}: {pct.toFixed(1)}%</span>;
          })}
        </div>
      )}
    </div>
  );
}

function BreakdownCard({ icon: Icon, title, accent, children, progress, footer }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors flex flex-col"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10">
          <Icon className="w-5 h-5" style={{ color: COLORS[accent] || '#fff' }} />
        </div>
        <div>
          <h3 className="font-bold text-white text-sm">{title}</h3>
          {accent && <span className="text-[10px] uppercase tracking-widest text-slate-400">{accent}</span>}
        </div>
      </div>
      <div className="text-2xl font-black text-white mb-3">{children}</div>
      {progress}
      {footer && <div className="mt-auto pt-3 border-t border-white/5 text-[10px] text-slate-500">{footer}</div>}
    </motion.div>
  );
}

export default function StorageMonitoring() {
  const [metrics, setMetrics] = useState(null);
  const [connected, setConnected] = useState(false);
  const [mode, setMode] = useState('connecting');
  const [purging, setPurging] = useState(false);
  const [toast, setToast] = useState(null);
  const esRef = useRef(null);
  const pollRef = useRef(null);
  const usingPollingRef = useRef(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 5000);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const startPolling = () => {
      if (usingPollingRef.current) return;
      usingPollingRef.current = true;
      setMode('polling');
      pollRef.current = setInterval(async () => {
        try {
          const { data } = await api.get('/admin/monitoring/storage');
          setMetrics(data);
          setConnected(true);
        } catch (_) {
          setConnected(false);
        }
      }, 4000);
      api.get('/admin/monitoring/storage')
        .then(({ data }) => { setMetrics(data); setConnected(true); })
        .catch(() => setConnected(false));
    };

    const connectSSE = () => {
      const url = `${API_BASE_URL}/admin/monitoring/storage/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      esRef.current = es;
      setMode('sse');

      es.onmessage = (e) => {
        try {
          setMetrics(JSON.parse(e.data));
          setConnected(true);
        } catch (_) {}
      };

      es.onerror = () => {
        es.close();
        setConnected(false);
        if (!usingPollingRef.current) startPolling();
      };
    };

    connectSSE();

    return () => {
      if (esRef.current) esRef.current.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handlePurge = async () => {
    setPurging(true);
    try {
      const { data } = await api.post('/admin/monitoring/clear-cache');
      if (data?.success) {
        showToast(`Successfully freed ${formatBytes(data.freedBytes)} of temporary cache space!`, 'success');
        const m = await api.get('/admin/monitoring/storage').catch(() => null);
        if (m?.data) setMetrics(m.data);
      } else {
        showToast('Cache purge did not complete.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to purge cache.', 'error');
    } finally {
      setPurging(false);
    }
  };

  const b = metrics?.breakdown;
  const disk = metrics?.systemDisk;
  const usedPct = disk ? disk.usedPercentage : null;

  const footprint = (b?.database?.sizeBytes || 0) + (b?.binaries?.sizeBytes || 0) + (b?.tempCache?.totalBytes || 0);

  const pieData = [
    { name: 'MongoDB', value: b?.database?.sizeBytes || 0, color: COLORS.database },
    { name: 'B2 Binaries', value: b?.binaries?.sizeBytes || 0, color: COLORS.binaries },
    { name: 'Temp Cache', value: b?.tempCache?.totalBytes || 0, color: COLORS.tempCache },
    { name: 'Logs', value: ((b?.logs?.emailLogsCount || 0) + (b?.logs?.notificationsCount || 0)) * 600, color: COLORS.logs }
  ].filter(d => d.value > 0);

  const allocationData = [
    { name: 'MongoDB', value: (b?.database?.sizeBytes || 0), color: COLORS.database },
    { name: 'B2 Binaries', value: (b?.binaries?.sizeBytes || 0), color: COLORS.binaries },
    { name: 'Media', value: (b?.media?.iconsCount + b?.media?.screenshotsCount + b?.media?.avatarsCount) * 50000, color: COLORS.media },
    { name: 'Temp Cache', value: (b?.tempCache?.totalBytes || 0), color: COLORS.tempCache }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 p-6 md:p-10">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="text-sm font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            System Storage &amp; Health Monitoring
          </h1>
          <p className="text-slate-400 text-sm mt-1">Live overview of every storage layer powering Baqala.</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
              connected
                ? mode === 'sse'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-slate-500/10 border-slate-500/30 text-slate-400'
            }`}
          >
            <Circle className={`w-2.5 h-2.5 ${connected ? 'animate-pulse fill-current' : ''}`} />
            {connected ? `LIVE TELEMETRY (${mode.toUpperCase()})` : 'Connecting…'}
          </span>
          {metrics && (
            <span className="text-xs text-slate-500">Updated {new Date(metrics.timestamp).toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {!metrics ? (
        <div className="flex items-center justify-center h-64 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Loading storage metrics…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <HardDrive className="w-4 h-4" /> Host Disk
            </h2>
            <Gauge percentage={usedPct} />
            <div className="mt-6 pt-4 border-t border-white/10 text-center space-y-1">
              <div className="text-xs text-slate-400">Total Capacity</div>
              <div className="text-lg font-black text-white"><AnimatedBytes bytes={disk?.totalBytes} /></div>
              <div className="text-xs text-slate-500 flex justify-between px-4">
                <span>Used: <AnimatedBytes bytes={disk?.usedBytes} /></span>
                <span>Free: <AnimatedBytes bytes={disk?.freeBytes} /></span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <BreakdownCard icon={Database} title="MongoDB Atlas" accent="database"
              progress={
                <ProgressBar
                  segments={[
                    { name: 'Data', value: b?.database?.dataSizeBytes || 0, color: COLORS.database },
                    { name: 'Index', value: b?.database?.indexSizeBytes || 0, color: '#a78bfa' }
                  ]}
                  color={COLORS.database}
                />
              }
              footer={`${formatNumber(b?.database?.documentsCount)} docs · ${formatNumber(b?.database?.collectionsCount)} collections`}
            >
              <AnimatedBytes bytes={b?.database?.sizeBytes} />
              <ProgressBar
                segments={[
                  { name: 'Data', value: b?.database?.dataSizeBytes || 0, color: COLORS.database },
                  { name: 'Index', value: b?.database?.indexSizeBytes || 0, color: '#a78bfa' }
                ]}
                color={COLORS.database}
                showLabel={false}
              />
            </BreakdownCard>

            <BreakdownCard icon={Cloud} title="Backblaze B2 Binaries" accent="binaries"
              progress={
                <ProgressBar
                  segments={[
                    { name: 'B2 Binaries', value: b?.binaries?.sizeBytes || 0, color: COLORS.binaries },
                    { name: 'Other / Free', value: Math.max(0, (footprint || 1) - (b?.binaries?.sizeBytes || 0)), color: 'rgba(255,255,255,0.08)' }
                  ]}
                  color={COLORS.binaries}
                />
              }
              footer={`Avg file: ${formatBytes(b?.binaries?.avgFileSizeBytes)}`}
            >
              <AnimatedBytes bytes={b?.binaries?.sizeBytes} />
              <div className="text-xs text-slate-400 space-y-1 mt-1">
                <div>Installers: {formatNumber(b?.binaries?.totalInstallers)}</div>
                <div>Avg file size: {formatBytes(b?.binaries?.avgFileSizeBytes)}</div>
              </div>
            </BreakdownCard>

            <BreakdownCard icon={Image} title="Public Media" accent="media"
              progress={
                <ProgressBar
                  segments={[
                    { name: 'Media Assets', value: (b?.media?.iconsCount + b?.media?.screenshotsCount + b?.media?.avatarsCount) * 50000, color: COLORS.media }
                  ]}
                  color={COLORS.media}
                />
              }
              footer="Icons · screenshots · avatars"
            >
              <div className="text-2xl font-black text-white mb-3">
                {formatNumber(b?.media?.iconsCount + b?.media?.screenshotsCount + b?.media?.avatarsCount)} items
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <div>App icons: {formatNumber(b?.media?.iconsCount)}</div>
                <div>Screenshots: {formatNumber(b?.media?.screenshotsCount)}</div>
                <div>Developer avatars: {formatNumber(b?.media?.avatarsCount)}</div>
              </div>
            </BreakdownCard>

            <BreakdownCard icon={Zap} title="Temporary Cache" accent="tempCache"
              progress={
                <ProgressBar
                  segments={[
                    { name: 'Cache', value: b?.tempCache?.totalBytes || 0, color: COLORS.tempCache },
                    { name: 'Other / Free', value: Math.max(0, (footprint || 1) - (b?.tempCache?.totalBytes || 0)), color: 'rgba(255,255,255,0.08)' }
                  ]}
                  color={COLORS.tempCache}
                />
              }
            >
              <AnimatedBytes bytes={b?.tempCache?.totalBytes} />
              <div className="text-xs text-slate-400 space-y-1 mt-1">
                <div>Local temp dir: {formatBytes(b?.tempCache?.tempDirSizeBytes)}</div>
                <div>Orphan B2 chunks: {formatBytes(b?.tempCache?.orphanChunksSizeBytes)}</div>
                <div>Queue tasks pending: {formatNumber(b?.tempCache?.queueTasksPending)}</div>
              </div>
              <button
                onClick={handlePurge}
                disabled={purging}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-black text-sm transition-colors"
                title="Safely removes temporary chunk files, Express buffer caches, and log queues."
              >
                {purging ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Reclaiming disk &amp; memory buffers…</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Purge Minute Cache</>
                )}
              </button>
            </BreakdownCard>

            <div className="md:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Storage Allocation Breakdown (%)</h2>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-full md:w-64 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                        {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} stroke="transparent" />)}
                      </Pie>
                      <RTooltip formatter={(value) => formatBytes(value)} contentStyle={{ background: '#0b0b0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 w-full space-y-3">
                  {allocationData.map((item) => {
                    const pct = footprint > 0 ? ((item.value / footprint) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-300">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            {item.name}
                          </span>
                          <span>{formatBytes(item.value)} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
