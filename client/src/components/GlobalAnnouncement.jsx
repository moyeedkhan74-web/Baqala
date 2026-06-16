import { Bell, AlertTriangle, Info, PartyPopper } from 'lucide-react';
import { cn } from '../utils/cn.js';

const GlobalAnnouncement = ({ config }) => {
  if (!config?.announcement?.enabled || !config?.announcement?.text) return null;

  const getStyles = () => {
    switch (config.announcement.level) {
      case 'critical':
        return 'bg-rose-600 text-white border-rose-500 shadow-rose-900/20';
      case 'warning':
        return 'bg-amber-500 text-white border-amber-400 shadow-amber-900/20';
      case 'celebratory':
        return 'bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 text-white border-transparent shadow-xl shadow-pink-500/20';
      default:
        return 'bg-accent-violet text-white border-accent-violet/50 shadow-accent-violet/20';
    }
  };

  const getIcon = () => {
    switch (config.announcement.level) {
      case 'critical': return <AlertTriangle className="w-4 h-4 shrink-0" />;
      case 'warning': return <Bell className="w-4 h-4 shrink-0" />;
      case 'celebratory': return <PartyPopper className="w-4 h-4 shrink-0 animate-bounce" />;
      default: return <Info className="w-4 h-4 shrink-0" />;
    }
  };

  return (
    <div className={cn(
      "relative z-[100] w-full py-3 px-4 border-b flex items-center justify-center gap-3 transition-all overflow-hidden",
      getStyles()
    )}>
      {config.announcement.level === 'celebratory' && (
        <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
      )}
      {config.announcement.level === 'celebratory' && (
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-[shine_3s_infinite]" />
      )}
      <div className="flex items-center gap-3 max-w-7xl mx-auto relative z-10">
        {getIcon()}
        <p className="text-sm font-black tracking-tight leading-none pt-0.5">
          {config.announcement.text}
        </p>
      </div>
    </div>
  );
};

export default GlobalAnnouncement;
