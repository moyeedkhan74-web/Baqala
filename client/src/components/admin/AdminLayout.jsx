import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = ({ children, title = 'Dashboard' }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans">
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      
      <main className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'pl-20' : 'pl-64'}`}>
        {/* Top Header */}
        <header className="h-20 bg-white dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-xl">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h1>
          </div>

          <div className="flex items-center gap-6">
            {/* Search */}
            <div className="hidden md:flex relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-accent-violet transition-colors" />
              <input 
                type="text" 
                placeholder="Search analytics..." 
                className="bg-slate-100 dark:bg-white/5 border border-transparent focus:border-accent-violet/30 rounded-xl py-2 pl-10 pr-4 text-sm outline-none transition-all w-64"
              />
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              </button>
              
              <div className="h-8 w-px bg-slate-200 dark:bg-white/10"></div>

              <div className="flex items-center gap-3 pl-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black dark:text-white leading-none">{user?.name}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">{user?.role}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-500 font-bold border border-slate-300 dark:border-white/10">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <section className="p-8 pb-12 animate-in fade-in duration-500">
          {children}
        </section>
      </main>
    </div>
  );
};

export default AdminLayout;
