import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

/* ── colour helpers ─────────────────────────────── */
const scoreColor = (s) => s >= 85 ? '#10b981' : s >= 60 ? '#f59e0b' : s >= 40 ? '#f97316' : '#ef4444';
const riskBadge = (r) => ({ low: '🟢 Low', medium: '🟡 Medium', high: '🔴 High', critical: '🚨 Critical' })[r] || r;
const recStyles = { approve: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', review: 'bg-amber-500/10 text-amber-500 border-amber-500/20', reject: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };

/* ── circular gauge (CSS-only) ──────────────────── */
const ScoreGauge = ({ score }) => {
  const color = scoreColor(score);
  const circ = 2 * Math.PI * 54; // r=54
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" className="text-slate-200 dark:text-white/10" strokeWidth="10" />
        <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color }}>{score}</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
      </div>
    </div>
  );
};

/* ── main card ──────────────────────────────────── */
const AiAnalysisCard = ({ app, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const ai = app.aiModeration || {};

  const handleReanalyze = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/admin/apps/${app._id}/reanalyze`);
      toast.success('AI re-analysis complete');
      if (onUpdate) onUpdate(data.aiModeration);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Re-analysis failed');
    } finally {
      setLoading(false);
    }
  };

  /* ── pending state ── */
  if (ai.riskLevel === 'pending' || (!ai.riskLevel && !ai.analysisError)) {
    return (
      <div className="p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">AI Analysis</h3>
        <div className="flex flex-col items-center py-8 gap-4">
          <div className="w-10 h-10 border-4 border-accent-violet border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-500">AI analysis in progress…</p>
          <button onClick={handleReanalyze} disabled={loading}
            className="mt-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest hover:bg-accent-violet/10 hover:text-accent-violet transition-all flex items-center gap-2 border border-slate-200 dark:border-white/5">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Re-analyze
          </button>
        </div>
      </div>
    );
  }

  /* ── error state ── */
  if (ai.analysisError) {
    return (
      <div className="p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">AI Analysis</h3>
        <div className="flex flex-col items-center py-6 gap-3">
          <p className="text-sm font-bold text-slate-400">AI analysis unavailable</p>
          <p className="text-xs text-slate-400 text-center max-w-xs">{ai.analysisError}</p>
          <button onClick={handleReanalyze} disabled={loading}
            className="mt-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest hover:bg-accent-violet/10 hover:text-accent-violet transition-all flex items-center gap-2 border border-slate-200 dark:border-white/5">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Re-analyze
          </button>
        </div>
      </div>
    );
  }

  /* ── full result ── */
  return (
    <div className="p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 space-y-6">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">AI Analysis</h3>

      {/* Score gauge */}
      {ai.approvalScore != null && (
        <div className="text-center">
          <ScoreGauge score={ai.approvalScore} />
          {ai.recommendation && (
            <span className={cn("mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider", recStyles[ai.recommendation] || 'bg-slate-100 text-slate-500 border-slate-200')}>
              {ai.recommendation === 'approve' ? '✅ Approve' : ai.recommendation === 'review' ? '⚠️ Review' : '❌ Reject'}
            </span>
          )}
        </div>
      )}

      {/* Risk */}
      {ai.riskLevel && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 font-bold">Risk Level</span>
          <span className="font-black">{riskBadge(ai.riskLevel)}</span>
        </div>
      )}

      {/* Admin Note — visually prominent */}
      {ai.adminNote && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Admin Note</p>
          <p className="text-sm font-bold text-amber-800 dark:text-amber-200 leading-relaxed">{ai.adminNote}</p>
        </div>
      )}

      {/* What this app is */}
      {ai.appSummary && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">What this app is</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-bold leading-relaxed">{ai.appSummary}</p>
        </div>
      )}

      {/* Permission assessment */}
      {ai.permissionAnalysis && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Permission Assessment</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-bold leading-relaxed">{ai.permissionAnalysis}</p>
        </div>
      )}

      {/* Content flags */}
      {ai.contentFlags && ai.contentFlags.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Content Flags</p>
          <div className="flex flex-wrap gap-2">
            {ai.contentFlags.map((f, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-black uppercase tracking-wider">{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Suspicious signals */}
      {ai.suspiciousSignals && ai.suspiciousSignals.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Suspicious Signals</p>
          <div className="flex flex-wrap gap-2">
            {ai.suspiciousSignals.map((s, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[10px] font-black uppercase tracking-wider">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Re-analyze */}
      <button onClick={handleReanalyze} disabled={loading}
        className="w-full mt-2 px-5 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest hover:bg-accent-violet/10 hover:text-accent-violet transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-white/5">
        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> {loading ? 'Analyzing…' : 'Re-analyze'}
      </button>

      {ai.analysedAt && (
        <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest">Last analysed: {new Date(ai.analysedAt).toLocaleString()}</p>
      )}
    </div>
  );
};

export default AiAnalysisCard;
