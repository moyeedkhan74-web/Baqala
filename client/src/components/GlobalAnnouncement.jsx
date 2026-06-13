import React from 'react';
import { Bell, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../utils/cn.js';

const GlobalAnnouncement = ({ config }) => {
  if (!config?.announcement?.enabled || !config?.announcement?.text) return null;

  const getStyles = () => {
    switch (config.announcement.level) {
      case 'critical':
        return 'bg-rose-600 text-white border-rose-500 shadow-rose-900/20';
      case 'warning':
        return 'bg-amber-500 text-white border-amber-400 shadow-amber-900/20';
      default:
        return 'bg-accent-violet text-white border-accent-violet/50 shadow-accent-violet/20';
    }
  };

  const getIcon = () => {
    switch (config.announcement.level) {
      case 'critical': return <AlertTriangle className="w-4 h-4 shrink-0" />;
      case 'warning': return <Bell className="w-4 h-4 shrink-0" />;
      default: return <Info className="w-4 h-4 shrink-0" />;
    }
  };

  return (
    <div className={cn(
      "relative z-[100] w-full py-3 px-4 border-b flex items-center justify-center gap-3 transition-all",
      getStyles()
    )}>
      <div className="flex items-center gap-3 max-w-7xl mx-auto">
        {getIcon()}
        <p className="text-sm font-black tracking-tight leading-none pt-0.5">
          {config.announcement.text}
        </p>
      </div>
    </div>
  );
};

export default GlobalAnnouncement;
