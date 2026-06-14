import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { 
  Menu, 
  Search, 
  Bell, 
  Command
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const AdminLayout = ({ children, title = 'Dashboard' }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans overflow-x-hidden">
      <AdminSidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />
      
      <main className={cn(
        "flex-1 flex flex-col transition-all duration-300 w-full",
        collapsed ? "md:pl-20" : "md:pl-64"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 h-20 shrink-0">
          <div className="h-full px-4 sm:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <button 
                onClick={() => setMobileOpen(true)}
                className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-600 dark:text-slate-400 md:hidden hover:bg-slate-200 transition-all font-black text-xs uppercase"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="hidden sm:flex items-center gap-3 bg-slate-100 dark:bg-white/5 px-4 py-2.5 rounded-2xl border border-transparent focus-within:border-accent-violet/30 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all w-full max-w-md group">
                <Search className="w-4 h-4 text-slate-400 group-focus-within:text-accent-violet" />
                <input 
                  type="text" 
                  placeholder="Search settings or apps..." 
                  className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 dark:text-slate-300 w-full placeholder:text-slate-400"
                />
                <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg bg-slate-200 dark:bg-white/10 text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-300 dark:border-white/10">
                  <Command className="w-2.5 h-2.5" />
                  K
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-accent-violet hover:bg-accent-violet/5 transition-all group">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-slate-950 rounded-full group-hover:scale-110 transition-transform"></span>
              </button>
              
              <div className="w-px h-8 bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block"></div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black dark:text-white leading-none uppercase tracking-widest">{user?.name}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-[0.2em]">{user?.role}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-accent-violet flex items-center justify-center text-white font-black border border-white/20 shadow-lg shadow-accent-violet/20">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <section className="p-4 sm:p-8 pb-12 animate-in fade-in duration-500 min-h-[calc(100vh-80px)]">
          {children}
        </section>
      </main>
    </div>
  );
};

export default AdminLayout;
