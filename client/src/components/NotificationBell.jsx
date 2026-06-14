import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiBell, HiCheckCircle, HiTrash, HiInformationCircle, HiExclamationCircle, HiExclamation } from 'react-icons/hi';
import api from '../api/axios';
import { cn } from '../utils/cn.js';
import toast from 'react-hot-toast';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount((data.notifications || []).filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast.error('Failed to mark read');
    }
  };

  const handleMarkAllRead = async (e) => {
    if (e) e.stopPropagation();
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed to mark all read');
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
      // Re-calculate unread
      setUnreadCount(notifications.filter(n => n._id !== id && !n.isRead).length);
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <HiCheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning': return <HiExclamation className="w-5 h-5 text-amber-500" />;
      case 'danger': return <HiExclamationCircle className="w-5 h-5 text-rose-500" />;
      default: return <HiInformationCircle className="w-5 h-5 text-accent-violet" />;
    }
  };

  const getBgColor = (type, isRead) => {
    if (isRead) return 'bg-slate-50 dark:bg-white/5';
    switch(type) {
      case 'success': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'warning': return 'bg-amber-500/10 border-amber-500/20';
      case 'danger': return 'bg-rose-500/10 border-rose-500/20';
      default: return 'bg-accent-violet/10 border-accent-violet/20';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="p-2.5 rounded-full bg-white/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 relative hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <HiBell className="w-5 h-5 text-slate-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex flex-col items-center justify-center rounded-full h-4 w-4 bg-rose-500 text-[9px] font-black text-white border border-white dark:border-dark-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
           <motion.div
             initial={{ opacity: 0, y: 10, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 10, scale: 0.95 }}
             className="absolute right-0 top-full mt-3 w-[320px] sm:w-[380px] bg-white dark:bg-dark-800 p-0 z-[70] shadow-2xl origin-top-right border border-slate-200 dark:border-white/20 rounded-[2rem] overflow-hidden flex flex-col max-h-[80vh]"
           >
              <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/5 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-black">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-[10px] font-black uppercase tracking-wider text-accent-violet hover:underline">
                    Mark All Read
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div 
                      key={n._id} 
                      className={cn(
                        "p-4 rounded-3xl border transition-all relative group",
                        getBgColor(n.type, n.isRead),
                        !n.isRead ? "border-transparent" : "border-slate-100 dark:border-white/5"
                      )}
                    >
                      <div className="flex items-start gap-4 pr-6">
                        <div className="shrink-0 mt-0.5">
                          {getIcon(n.type)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 leading-tight">{n.title}</h4>
                          <p className="text-xs font-bold text-slate-500 dark:text-gray-400 leading-relaxed mb-2 line-clamp-3">{n.message}</p>
                          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Overlays */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.isRead && (
                          <button onClick={(e) => handleMarkAsRead(n._id, e)} title="Mark as read" className="w-6 h-6 bg-white dark:bg-dark-900 rounded-full flex items-center justify-center text-accent-violet shadow-sm hover:scale-110 transition-transform">
                            <HiCheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={(e) => handleDelete(n._id, e)} title="Delete" className="w-6 h-6 bg-white dark:bg-dark-900 rounded-full flex items-center justify-center text-rose-500 shadow-sm hover:scale-110 transition-transform">
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                    <HiBell className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-bold text-sm">No notifications yet</p>
                    <p className="text-xs">We'll let you know when something arrives!</p>
                  </div>
                )}
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
