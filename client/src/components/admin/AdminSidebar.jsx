import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Star, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Bell
} from 'lucide-react';
import { cn } from '../../utils/cn';

const AdminSidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Apps', path: '/admin/apps', icon: Package },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Moderation', path: '/admin/reviews', icon: MessageSquare },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Featured', path: '/admin/featured', icon: Star },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden animate-in fade-in duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen bg-slate-950 text-slate-300 transition-all duration-300 z-[60] flex flex-col border-r border-white/10 shadow-2xl",
          collapsed ? "w-20" : "w-64",
          "md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className="h-20 flex items-center px-6 gap-3 border-b border-white/5 bg-black/20 shrink-0">
          <div className="w-10 h-10 bg-accent-violet rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-accent-violet/20">
            <Package className="text-white w-6 h-6" />
          </div>
          {(!collapsed || mobileOpen) && (
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              BAQALA<span className="text-accent-violet">.</span>
            </span>
          )}
          
          {/* Mobile Close Button */}
          <button 
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-2 text-slate-500 hover:text-white md:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative",
                  active 
                    ? "bg-accent-violet text-white shadow-lg shadow-accent-violet/20" 
                    : "hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("w-5 h-5", active ? "text-white" : "text-slate-400 group-hover:text-white")} />
                {(!collapsed || mobileOpen) && <span className="font-bold text-sm">{item.name}</span>}
                {active && !collapsed && !mobileOpen && (
                  <div className="absolute right-3">
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-black/10 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors group"
          >
            <LogOut className="w-5 h-5" />
            {(!collapsed || mobileOpen) && <span className="font-bold text-sm">Sign Out</span>}
          </button>
        </div>

        {/* Collapse Toggle (Desktop) */}
        {!mobileOpen && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-24 w-6 h-6 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:border-accent-violet transition-all hidden md:flex z-10"
          >
            <ChevronRight className={cn("w-3 h-3 transition-transform", collapsed ? "" : "rotate-180")} />
          </button>
        )}
      </aside>
    </>
  );
};

export default AdminSidebar;
